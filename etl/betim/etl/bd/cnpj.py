"""etl.bd.cnpj — enrich `fornecedores` / `socios` from br_me_cnpj, scoped to CNPJs seen in `contratos`.

Source: `br_me_cnpj.empresas` + `estabelecimentos` + `socios` — looked up only
for CNPJs already present in the `contratos` table (queried from Supabase
first, then matched in BD). Target: `fornecedores` (unique on cnpj), `socios`
(unique on cnpj, nome_socio). Cron: weekly.

# Schema verified live 2026-07-20 against the real BigQuery tables (project
# `controle-popular`). Corrections vs. the original guesses:
# - `estabelecimentos` already has a precomputed `cnpj` column (no need to
#   CONCAT cnpj_basico/cnpj_ordem/cnpj_dv manually) and its geo field is
#   `id_municipio` (an IBGE code), NOT a `municipio` text name -- so
#   `fornecedores.municipio_sede` ends up holding an IBGE code, not a
#   place name. Fine for later cross-referencing, just noted here since the
#   column name suggests a name.
# - `socios` has no `nome_socio`/`cpf_cnpj_socio` columns -- the real names
#   are `nome` and `documento`. `documento` can be null for some partner
#   types (e.g. foreign legal entities without a Brazilian CPF/CNPJ),
#   confirmed live via sample rows -- already handled below (a null/missing
#   `nome` is skipped, a null `documento` is stored as-is).
#
# BrasilAPI live fallback (added 2026-07-20, user-approved): BD's
# `br_me_cnpj` snapshot is refreshed periodically and can lag brand-new
# companies. Any CNPJ from `contratos` that BD doesn't return is looked up
# live against BrasilAPI's Minha Receita mirror (`GET /cnpj/v1/{cnpj}`, no
# key, live-verified against Betim's own CNPJ) so `fornecedores` doesn't
# silently miss recently-registered suppliers. `socios` is intentionally
# NOT filled from this fallback -- BrasilAPI's `qsa` shape wasn't verified
# against this project's `socios` columns, and this path is meant for the
# rare gap case, not a full replacement of the BD `socios` query.
# Confirmed live 2026-07-20: BrasilAPI's CNPJ endpoint (proxying Minha
# Receita) is rate-limited (429 after a handful of rapid requests during
# manual testing). Only expected to matter here if `faltantes` is large;
# for the normal weekly run (a handful of newly-contracted CNPJs at most)
# tenacity's per-request backoff is enough. If a whole ETL run starts
# tripping 429s, add a fixed delay between fallback requests.
"""
import argparse
import sys
import time

from etl.apis.brasilapi import (
    INTERVALO_CNPJ_PADRAO,
    consultar_cnpj,
    linha_fornecedor_brasilapi,
)
from etl.bd.common import bd_query
from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

CHUNK_SIZE = 500

# Teto do fallback ao vivo. O caminho normal deste módulo é o BigQuery
# (volume); a BrasilAPI aqui é só tapa-buraco, e o README dela PROÍBE
# crawling ("volume de consultas deve ter a natureza de uma pessoa real").
# Sem teto, um dia em que o BD viesse vazio viraria uma varredura de
# centenas de CNPJs contra uma API que não autoriza isso — e que, medido em
# 2026-08-03, devolve 429 já no segundo pedido.
MAX_FALLBACK_BRASILAPI = 50

QUERY_EMPRESAS = """
SELECT cnpj_basico, razao_social, capital_social, porte
FROM `basedosdados.br_me_cnpj.empresas`
WHERE cnpj_basico IN ({cnpj_basico_list})
"""

QUERY_ESTABELECIMENTOS = """
SELECT cnpj, cnpj_basico, nome_fantasia,
       situacao_cadastral, cnae_fiscal_principal AS cnae_principal,
       data_inicio_atividade AS data_abertura, id_municipio AS municipio_sede, sigla_uf AS uf_sede
FROM `basedosdados.br_me_cnpj.estabelecimentos`
WHERE cnpj IN ({cnpj_list})
"""

QUERY_SOCIOS = """
SELECT cnpj_basico, nome AS nome_socio, documento AS documento_mascarado, qualificacao
FROM `basedosdados.br_me_cnpj.socios`
WHERE cnpj_basico IN ({cnpj_basico_list})
"""


def _only_digits(value: str) -> str:
    return "".join(ch for ch in (value or "") if ch.isdigit())


def _chunked(items: list[str], size: int):
    for i in range(0, len(items), size):
        yield items[i : i + size]


def _cnpj_basico(cnpj: str) -> str:
    return cnpj[:8]


# Receita Federal's `situacao_cadastral` in br_me_cnpj.estabelecimentos is a
# numeric code, not the human label -- found live 2026-07-21 after
# etl.alertas' regra_7 (situacao_cadastral != "ATIVA") flagged 562/576
# contracts because it compared the raw code ("2") against the text
# "ATIVA". Codes per RFB layout: 1 Nula, 2 Ativa, 3 Suspensa, 4 Inapta,
# 8 Baixada.
_SITUACAO_CADASTRAL_LABELS = {
    "1": "NULA",
    "2": "ATIVA",
    "3": "SUSPENSA",
    "4": "INAPTA",
    "8": "BAIXADA",
}


def _situacao_cadastral_label(code) -> str | None:
    if code is None:
        return None
    return _SITUACAO_CADASTRAL_LABELS.get(str(code).strip(), str(code))


def _iso(value):
    """BigQuery DATE columns deserialize to Python date/datetime objects,
    which the supabase-py/httpx JSON encoder can't serialize -- found live
    2026-07-21 (`TypeError: Object of type date is not JSON serializable`)
    once fornecedor_cnpj started resolving real CNPJs and this path finally
    ran end-to-end for the first time."""
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


# O fetch e o mapeamento da BrasilAPI que moravam aqui foram para
# `etl/apis/brasilapi.py` (2026-08-03) e este módulo passou a importá-los.
# Não foi só arrumação: a cópia local tinha três defeitos que o módulo novo
# já corrige, e mantê-la significaria corrigir cada um duas vezes.
#   1. Retry cego — repetia em QUALQUER exceção, inclusive 404, e com
#      espera curta (2-15s). Medido em 2026-08-03, o /cnpj/v1 fica 429 por
#      ~50-90s; o novo repete só no 429 e espera 15-120s.
#   2. `porte` gravava o TEXTO da API ("DEMAIS") numa coluna onde as 487
#      linhas do BigQuery são código ('1','3','5') — dois vocabulários na
#      mesma coluna, a mesma forma do bug que deu 97,6% de falso positivo
#      em `situacao_cadastral`.
#   3. `cnae_principal`/`municipio_sede` iam como int para colunas `text`.


def sync(id_municipio: str):
    client = get_supabase_client()

    contratos_resp = (
        client.table("contratos").select("fornecedor_cnpj").eq("id_municipio", id_municipio).execute()
    )
    cnpjs = sorted(
        {
            _only_digits(r.get("fornecedor_cnpj"))
            for r in (contratos_resp.data or [])
            if r.get("fornecedor_cnpj") and len(_only_digits(r.get("fornecedor_cnpj"))) == 14
        }
    )
    if not cnpjs:
        print("[etl.bd.cnpj] nenhum CNPJ válido encontrado em contratos — nada a enriquecer")
        return
    print(f"[etl.bd.cnpj] cnpjs_distintos={len(cnpjs)}")

    total_fornecedores = 0
    total_socios = 0
    encontrados: set[str] = set()
    for chunk in _chunked(cnpjs, CHUNK_SIZE):
        basico_to_full: dict[str, list[str]] = {}
        for cnpj in chunk:
            basico_to_full.setdefault(_cnpj_basico(cnpj), []).append(cnpj)

        cnpj_basico_list_sql = ", ".join(f"'{b}'" for b in basico_to_full)
        cnpj_list_sql = ", ".join(f"'{c}'" for c in chunk)

        empresas_rows = bd_query(QUERY_EMPRESAS.format(cnpj_basico_list=cnpj_basico_list_sql))
        estab_rows = bd_query(QUERY_ESTABELECIMENTOS.format(cnpj_list=cnpj_list_sql))
        socios_rows = bd_query(QUERY_SOCIOS.format(cnpj_basico_list=cnpj_basico_list_sql))

        fornecedores_map: dict[str, dict] = {}
        for row in empresas_rows:
            basico = row.get("cnpj_basico")
            for full_cnpj in basico_to_full.get(basico, []):
                entry = fornecedores_map.setdefault(full_cnpj, {"cnpj": full_cnpj})
                entry["razao_social"] = row.get("razao_social")
                entry["capital_social"] = row.get("capital_social")
                entry["porte"] = row.get("porte")
        for row in estab_rows:
            full_cnpj = row.get("cnpj")
            if not full_cnpj:
                continue
            entry = fornecedores_map.setdefault(full_cnpj, {"cnpj": full_cnpj})
            entry["nome_fantasia"] = row.get("nome_fantasia")
            entry["situacao_cadastral"] = _situacao_cadastral_label(row.get("situacao_cadastral"))
            entry["cnae_principal"] = row.get("cnae_principal")
            entry["data_abertura"] = _iso(row.get("data_abertura"))
            entry["municipio_sede"] = row.get("municipio_sede")
            entry["uf_sede"] = row.get("uf_sede")

        fornecedores_rows = list(fornecedores_map.values())
        if fornecedores_rows:
            client.table("fornecedores").upsert(fornecedores_rows, on_conflict="cnpj").execute()
        total_fornecedores += len(fornecedores_rows)
        encontrados.update(fornecedores_map.keys())

        # Dedupe by (cnpj, nome_socio) -- same ON CONFLICT DO UPDATE
        # constraint as PNCP contratos/licitacoes. A socio can appear more
        # than once per cnpj_basico in the source (e.g. re-qualified), and
        # basico_to_full can map one cnpj_basico to several full CNPJs
        # sharing socios, both of which can repeat a key within one batch.
        # Found live 2026-07-21, first time this path ran with real data.
        socios_map: dict[tuple[str, str], dict] = {}
        for row in socios_rows:
            basico = row.get("cnpj_basico")
            nome_socio = row.get("nome_socio")
            if not nome_socio:
                continue
            for full_cnpj in basico_to_full.get(basico, []):
                socios_map[(full_cnpj, nome_socio)] = {
                    "cnpj": full_cnpj,
                    "nome_socio": nome_socio,
                    "documento_mascarado": row.get("documento_mascarado"),
                    "qualificacao": row.get("qualificacao"),
                }
        socios_out = list(socios_map.values())
        if socios_out:
            client.table("socios").upsert(socios_out, on_conflict="cnpj,nome_socio").execute()
        total_socios += len(socios_out)

        print(f"[etl.bd.cnpj] chunk cnpjs={len(chunk)} fornecedores={len(fornecedores_rows)} socios={len(socios_out)}")

    faltantes = [c for c in cnpjs if c not in encontrados]
    total_fallback = 0
    if faltantes:
        # Teto + espaçamento: a BrasilAPI não autoriza varredura, e o
        # endpoint 429 já na segunda chamada seguida. `faltantes` pode ter
        # centenas de CNPJs (171 em Betim hoje); sem o corte, este trecho
        # viraria exatamente o crawling que o README proíbe.
        a_consultar = faltantes[:MAX_FALLBACK_BRASILAPI]
        if len(faltantes) > len(a_consultar):
            print(
                f"[etl.bd.cnpj] fallback limitado a {MAX_FALLBACK_BRASILAPI} de {len(faltantes)} "
                "CNPJs (limite contratual da BrasilAPI) — para completar o resto rode "
                "`python -m etl.apis.brasilapi --id-municipio <ibge>`"
            )
        print(f"[etl.bd.cnpj] cnpjs_ausentes_no_bd={len(faltantes)} — tentando fallback ao vivo (BrasilAPI)")
        fallback_rows = []
        for i, cnpj in enumerate(a_consultar, 1):
            try:
                data = consultar_cnpj(cnpj)
            except Exception as e:
                print(f"[etl.bd.cnpj] fallback falhou para {cnpj}: {type(e).__name__}")
                continue
            finally:
                if i < len(a_consultar):
                    time.sleep(INTERVALO_CNPJ_PADRAO)
            if data:
                fallback_rows.append(linha_fornecedor_brasilapi(cnpj, data))
        if fallback_rows:
            for chunk in _chunked(fallback_rows, CHUNK_SIZE):
                client.table("fornecedores").upsert(chunk, on_conflict="cnpj").execute()
        total_fallback = len(fallback_rows)
        total_fornecedores += total_fallback
        print(f"[etl.bd.cnpj] fallback_resolvidos={total_fallback}/{len(faltantes)}")

    print(f"[etl.bd.cnpj] total_fornecedores={total_fornecedores} total_socios={total_socios} (fallback_brasilapi={total_fallback})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.bd.cnpj] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
