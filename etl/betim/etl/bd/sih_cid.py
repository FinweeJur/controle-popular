"""etl.bd.sih_cid — sync internacoes do SIH-SUS agregadas por CID-10.

Fonte: `basedosdados.br_ms_sih.aihs_reduzidas`. Alvo: `saude_internacoes_cid`
(id_municipio, ano, cid_codigo, capitulo, internacoes_total, obitos_total,
dias_permanencia_total, valor_total). Cron: monthly.

Mesmas convencoes do `etl.bd.sih_sim` (leia a docstring dele antes):

- `id_municipio_paciente` usa o codigo DATASUS de 6 digitos; filtrar pelo
  IBGE de 7 devolve ZERO linhas em silencio (validado ao vivo em 2026-07-20).
  `_datasus_6` trunca o digito verificador.
- A coluna de CID NAO e assumida: `_descobrir_coluna_cid` sonda
  `SELECT * ... LIMIT 1` e escolhe entre os candidatos conhecidos.
  Verificado ao vivo em 2026-08-31: a tabela divide o CID em
  `cid_principal_categoria` ("J18") e `cid_principal_subcategoria`
  ("J18.9") — nao existe `diagnostico_principal*`. Se nenhum candidato
  existir, ABORTA listando as colunas reais — a doutrina do repo e
  "valide o conteudo, nunca o status" e falhe alto em vez de gravar vazio.
- Colunas de permanencia e valor sao opcionais: entram na agregacao so se
  a sondagem as encontrou; senao gravam nulo e um aviso e impresso.

`cid_codigo` e a CATEGORIA CID-10 (3 primeiros caracteres, maiusculo):
o DATASUS grava "J189" e "O800" (sem ponto) na subcategoria e "J18" na
categoria, e o ranking por categoria e o que casa com a taxonomia de
vigilancia em `apps/web/lib/saude/cid.ts`. O join de capitulo usa o codigo
BRUTO (antes da normalizacao) porque `cid_10.subcategoria` tem linha tanto
para subcategoria quanto para a categoria nua.

Uso:
  python -m etl.bd.sih_cid --id-municipio 3106705
  python -m etl.bd.sih_cid --todos-ativos
"""
import argparse
import sys

from etl.bd.common import bd_query
from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

TABELA = "basedosdados.br_ms_sih.aihs_reduzidas"

# Candidatas a coluna de diagnostico CID-10, na ordem de preferencia.
# Verificado ao vivo em 2026-08-31: `br_ms_sih.aihs_reduzidas` NAO tem
# coluna `diagnostico_principal*` (nomes de outros clientes dos dados BD) —
# o CID vem dividido em `cid_principal_categoria` ("J18") e
# `cid_principal_subcategoria` ("J18.9"). As duas primeiras candidatas são
# as reais; as demais ficam como defesa para o caso de a fonte mudar.
COLUNAS_CID_CANDIDATAS = [
    "cid_principal_categoria",
    "cid_principal_subcategoria",
    "diagnostico_principal_cid10",
    "diagnostico_principal",
    "diag_princ",
]
COLUNA_MUNICIPIO = "id_municipio_paciente"
COLUNA_DATA = "data_internacao"
COLUNA_OBITO = "indicador_obito"
COLUNA_PERMANENCIA = "quantidade_dias_permanencia"
COLUNA_VALOR_CANDIDATAS = ["valor_aih", "valor_total", "valor_serivco_hospitalar"]


def _datasus_6(id_municipio: str) -> str:
    """Trunca o codigo IBGE de 7 digitos para o DATASUS de 6 (remove o
    digito verificador). Convencao nacional, nao especifica de Betim."""
    return id_municipio[:6]


def _descobrir_coluna_cid() -> tuple[str, set[str]]:
    """Sonda a tabela com `LIMIT 1` e devolve (coluna_de_cid, colunas_reais).

    Aborta se nenhum candidato existir — nunca adivinha o nome da coluna
    com uma query que devolveria zero linhas em silencio."""
    amostra = bd_query(f"SELECT * FROM `{TABELA}` LIMIT 1")
    if not amostra:
        raise RuntimeError(
            f"{TABELA} devolveu 0 linhas (LIMIT 1) — impossivel descobrir o schema"
        )
    colunas = set(amostra[0].keys())
    for candidata in COLUNAS_CID_CANDIDATAS:
        if candidata in colunas:
            return candidata, colunas
    raise RuntimeError(
        "Nenhuma coluna de CID-10 encontrada em "
        f"{TABELA}. Candidatas testadas: {COLUNAS_CID_CANDIDATAS}. "
        f"Colunas reais: {sorted(colunas)}"
    )


def _montar_query(id_municipio: str, cid_col: str, colunas: set[str]) -> str:
    # `cid_principal_categoria` fica nula em ~89% das linhas (medido ao vivo
    # 2026-08-31, Betim 2024: 22.016 de 24.791) e `cid_principal_subcategoria`
    # cobre o resto — as duas nunca são nulas juntas. COALESCE garante 100%
    # de cobertura; a normalização (maiúsculo, sem ponto) funde "J18.9" e
    # "J18" na mesma chave de categoria.
    companheiras = [c for c in COLUNAS_CID_CANDIDATAS if c in colunas and c != cid_col]
    if companheiras:
        expr_cid = f"COALESCE(aih.{cid_col}, aih.{companheiras[0]})"
        print(f"[etl.bd.sih_cid] usando COALESCE com {companheiras[0]} (cobertura de nulos)")
    else:
        expr_cid = f"aih.{cid_col}"

    permanencia = (
        f"SUM(aih.{COLUNA_PERMANENCIA})"
        if COLUNA_PERMANENCIA in colunas
        else "CAST(NULL AS FLOAT64)"
    )
    valor_col = next((c for c in COLUNA_VALOR_CANDIDATAS if c in colunas), None)
    valor = f"SUM(aih.{valor_col})" if valor_col else "CAST(NULL AS FLOAT64)"

    if valor_col:
        print(f"[etl.bd.sih_cid] coluna de valor encontrada: {valor_col}")
    else:
        print(
            "[etl.bd.sih_cid] AVISO: nenhuma coluna de valor encontrada "
            f"(candidatas: {COLUNA_VALOR_CANDIDATAS}); valor_total gravara nulo"
        )

    return f"""
SELECT
  EXTRACT(YEAR FROM aih.{COLUNA_DATA}) AS ano,
  SUBSTR(UPPER(REPLACE({expr_cid}, '.', '')), 1, 3) AS cid_codigo,
  COALESCE(cid.descricao_capitulo, 'Nao classificado') AS capitulo,
  COUNT(*) AS internacoes_total,
  COALESCE(SUM(aih.{COLUNA_OBITO}), 0) AS obitos_total,
  {permanencia} AS dias_permanencia_total,
  {valor} AS valor_total
FROM `{TABELA}` aih
LEFT JOIN `basedosdados.br_bd_diretorios_brasil.cid_10` cid
  ON cid.subcategoria = {expr_cid}
WHERE aih.{COLUNA_MUNICIPIO} = '{_datasus_6(id_municipio)}'
  AND {expr_cid} IS NOT NULL
GROUP BY ano, cid_codigo, capitulo
"""


def _map_linha(row: dict, id_municipio: str) -> dict:
    return {
        "id_municipio": id_municipio,
        "ano": row.get("ano"),
        "cid_codigo": row.get("cid_codigo"),
        "capitulo": row.get("capitulo"),
        "internacoes_total": row.get("internacoes_total"),
        "obitos_total": row.get("obitos_total"),
        "dias_permanencia_total": row.get("dias_permanencia_total"),
        "valor_total": row.get("valor_total"),
    }


def sync(id_municipio: str):
    client = get_supabase_client()

    cid_col, colunas = _descobrir_coluna_cid()
    print(f"[etl.bd.sih_cid] coluna de CID: {cid_col}")

    query = _montar_query(id_municipio, cid_col, colunas)
    raw = bd_query(query)
    linhas = [_map_linha(r, id_municipio) for r in raw]
    if linhas:
        client.table("saude_internacoes_cid").upsert(
            linhas, on_conflict="id_municipio,ano,cid_codigo"
        ).execute()
    print(
        f"[etl.bd.sih_cid] saude_internacoes_cid registros={len(linhas)} "
        f"(municipio {id_municipio})"
    )


def _municipios_ativos(client) -> list[str]:
    linhas = (
        client.table("municipios")
        .select("id_municipio")
        .eq("ativo", True)
        .execute()
        .data
    )
    return [r["id_municipio"] for r in linhas]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--todos-ativos",
        action="store_true",
        help="varre municipios.ativo=true e sincroniza todos",
    )
    args = parser.parse_args()
    try:
        if args.todos_ativos:
            client = get_supabase_client()
            ids = _municipios_ativos(client)
            if not ids:
                raise RuntimeError("nenhum municipio com ativo=true")
            print(f"[etl.bd.sih_cid] sincronizando {len(ids)} municipios ativos")
            for id_ in ids:
                sync(id_)
        else:
            sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.bd.sih_cid] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
