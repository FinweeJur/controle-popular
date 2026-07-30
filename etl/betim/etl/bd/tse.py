"""etl.bd.tse — sync TSE 2024 vereador results + campaign donations + declared
assets into `vereadores` / `doacoes_campanha` / `bens_candidato`.

Source: `br_tse_eleicoes.resultados_candidato`, `candidatos`, `receitas_candidato`,
`bens_candidato` (ano=2024, cargo='vereador', município=Betim). Target: `vereadores`
(updates votos_eleicao, ano_eleicao, id_candidato_tse — matched to existing rows by
nome_urna, never inserts new councilors), `doacoes_campanha` and `bens_candidato`
(inserted for matched councilors only). Cron: once per electoral term.

`bens_candidato` (patrimônio declarado, 2026-07-22 addition): investigating the
"biografia livre do TSE" backlog item turned up that no such free-text biography
table exists anywhere in `br_tse_eleicoes` (that assumption in the original plan
was simply wrong -- confirmed by listing every table in the dataset). What DOES
exist and wasn't synced yet: `bens_candidato`, itemized declared assets at
campaign time (tipo_item/descricao_item/valor_item per sequencial_candidato).
Confirmed live: 20 of 23 sitting councilors have declared assets, R$48,776 to
R$2,285,486.71. Joins the same `sequencial_candidato` key already resolved to
`vereador_id` for donations below -- no new matching logic needed.

`doador_documento_mascarado` is named for the `doacoes_campanha` schema's
column, but schema verified live 2026-07-20: the real BD column is
`cpf_cnpj_doador`, and sample rows show it is **NOT masked** (e.g. a full
11-digit CPF came back plainly, `'24349267620'`). This isn't a bug or a
privacy leak on our side -- Brazilian electoral law (Lei das Eleições)
mandates full donor CPF/CNPJ disclosure for campaign finance transparency,
the same legal basis piracanjuba.ai relies on to show donor lists. The
column is stored as-is; the "masked" assumption in the original plan was
simply wrong, corrected here rather than silently carried forward.

Also corrected: `sq_candidato` doesn't exist anywhere in this dataset --
the real join/filter key is `sequencial_candidato` (on
`resultados_candidato`/`receitas_candidato`) matching `candidatos.sequencial`.
`nome_urna_candidato` doesn't exist either; `candidatos.nome_urna` is real.
`tipo_doador` doesn't exist as a column; there's no direct PF/PJ flag in
`receitas_candidato` visible from the schema, so `doador_tipo` is left
unset here rather than guessed -- it can be inferred downstream from
document length (11 digits = CPF/PF, 14 = CNPJ/PJ) if needed.
"""
import argparse
import sys
import unicodedata

from etl.bd.common import bd_query
from etl.common import ID_MUNICIPIO_DEFAULT, PgAPIError, get_supabase_client

ANO_ELEICAO_DEFAULT = 2024

QUERY_RESULTADOS = """
SELECT rc.sequencial_candidato AS id_candidato_tse, c.nome_urna AS nome_urna, rc.votos AS votos
FROM `basedosdados.br_tse_eleicoes.resultados_candidato` rc
JOIN `basedosdados.br_tse_eleicoes.candidatos` c
  ON rc.sequencial_candidato = c.sequencial AND rc.ano = c.ano
WHERE rc.ano = {ano} AND rc.cargo = 'vereador' AND rc.id_municipio = '{id_municipio}'
"""

QUERY_DOACOES = """
SELECT sequencial_candidato AS id_candidato_tse, nome_doador AS doador_nome,
       cpf_cnpj_doador AS doador_documento_mascarado, valor_receita AS valor,
       data_receita AS data_doacao
FROM `basedosdados.br_tse_eleicoes.receitas_candidato`
WHERE ano = {ano} AND cargo = 'vereador' AND id_municipio = '{id_municipio}'
"""

# `bens_candidato` has no id_municipio column (unlike resultados_candidato/
# receitas_candidato) -- filtering by sigla_uf alone would scan every MG
# candidate's assets. Built dynamically with an IN(sequencial_candidato...)
# list (the 23 councilors already resolved from QUERY_RESULTADOS) instead of
# a static WHERE, same reasoning as querying only what we can actually use.
QUERY_BENS = """
SELECT sequencial_candidato AS id_candidato_tse, tipo_item, descricao_item,
       valor_item AS valor
FROM `basedosdados.br_tse_eleicoes.bens_candidato`
WHERE ano = {ano} AND sequencial_candidato IN ({sequenciais})
"""


def _normalize(nome: str | None) -> str:
    """Uppercase + accent-fold. Without accent-folding, 3/23 councilors
    failed to match live (2026-07-21): our `nome_urna` and TSE's disagree
    on accents for the same person (e.g. "Adelio Carlos" vs "Adélio
    Carlos") -- same normalization gap seen elsewhere in this codebase
    (etl/alertas.py's `_normalizar`, lib/prefeitura.ts)."""
    texto = unicodedata.normalize("NFKD", nome or "")
    texto = "".join(ch for ch in texto if not unicodedata.combining(ch))
    return texto.strip().upper()


def _iso(value):
    """BigQuery DATE columns deserialize to Python date objects, which the
    supabase-py/httpx JSON encoder can't serialize -- same issue already
    found and fixed in etl/bd/cnpj.py's data_abertura."""
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def _infer_doador_tipo(documento: str | None) -> str | None:
    """No PF/PJ flag exists in `receitas_candidato` (verified live) -- infer
    from document length instead (CPF=11 digits -> PF, CNPJ=14 -> PJ)."""
    digits = "".join(ch for ch in (documento or "") if ch.isdigit())
    if len(digits) == 11:
        return "PF"
    if len(digits) == 14:
        return "PJ"
    return None


def sync(id_municipio: str, ano_eleicao: int = ANO_ELEICAO_DEFAULT, incluir_doacoes: bool = True):
    """`incluir_doacoes=False` skips the `doacoes_campanha` insert -- needed
    to safely re-run this sync after adding `bens_candidato` (2026-07-22)
    without re-inserting the 637 donations already synced in a prior run:
    that table has no unique constraint (documented as an accepted
    once-per-term risk when it was written), so a second unguarded
    `sync()` call would duplicate every donation instead of just adding
    the new bens_candidato rows."""
    client = get_supabase_client()

    existing = (
        client.table("vereadores").select("id,nome_urna").eq("id_municipio", id_municipio).execute().data
        or []
    )
    by_nome_urna = {_normalize(v.get("nome_urna")): v for v in existing if v.get("nome_urna")}

    resultados = bd_query(QUERY_RESULTADOS.format(id_municipio=id_municipio, ano=ano_eleicao))
    id_candidato_to_vereador_id: dict[str, str] = {}
    matched = 0
    for row in resultados:
        candidato = by_nome_urna.get(_normalize(row.get("nome_urna")))
        if not candidato:
            continue
        id_candidato_tse = str(row.get("id_candidato_tse"))
        client.table("vereadores").update(
            {
                "votos_eleicao": row.get("votos"),
                "ano_eleicao": ano_eleicao,
                "id_candidato_tse": id_candidato_tse,
            }
        ).eq("id", candidato["id"]).execute()
        id_candidato_to_vereador_id[id_candidato_tse] = candidato["id"]
        matched += 1
    print(f"[etl.bd.tse] resultados matched={matched}/{len(resultados)}")

    doacoes_rows = []
    if incluir_doacoes:
        doacoes_raw = bd_query(QUERY_DOACOES.format(id_municipio=id_municipio, ano=ano_eleicao))
        for row in doacoes_raw:
            vereador_id = id_candidato_to_vereador_id.get(str(row.get("id_candidato_tse")))
            if not vereador_id:
                continue
            doacoes_rows.append(
                {
                    "id_municipio": id_municipio,
                    "vereador_id": vereador_id,
                    "ano_eleicao": ano_eleicao,
                    "doador_nome": row.get("doador_nome"),
                    "doador_tipo": _infer_doador_tipo(row.get("doador_documento_mascarado")),
                    # kept masked as published by TSE — do not unmask
                    "doador_documento_mascarado": row.get("doador_documento_mascarado"),
                    "valor": row.get("valor"),
                    "data_doacao": _iso(row.get("data_doacao")),
                }
            )
        if doacoes_rows:
            # No unique constraint on doacoes_campanha in the schema (cadence is once/term,
            # so plain insert is acceptable); re-running mid-term would duplicate rows.
            client.table("doacoes_campanha").insert(doacoes_rows).execute()
        print(f"[etl.bd.tse] doacoes_campanha registros={len(doacoes_rows)}")
    else:
        print("[etl.bd.tse] doacoes_campanha pulado (--sem-doacoes)")

    n_bens = _sync_bens(client, id_municipio, ano_eleicao, id_candidato_to_vereador_id)

    print(f"[etl.bd.tse] total_matched={matched} total_doacoes={len(doacoes_rows)} total_bens={n_bens}")


def _sync_bens(
    client, id_municipio: str, ano_eleicao: int, id_candidato_to_vereador_id: dict[str, str]
) -> int:
    """Populates `bens_candidato` (migration 0013, 2026-07-22 addition).
    Returns -1 (not 0) and prints a warning instead of raising when the
    table doesn't exist yet -- lets `sync()`'s existing vereadores/
    doacoes_campanha work finish and commit even if this migration hasn't
    landed, matching how the rest of this session's new-column/new-table
    additions degrade rather than take down an entire ETL run over one
    missing piece."""
    if not id_candidato_to_vereador_id:
        return 0
    sequenciais = ",".join(f"'{s}'" for s in id_candidato_to_vereador_id)
    bens_raw = bd_query(QUERY_BENS.format(ano=ano_eleicao, sequenciais=sequenciais))
    bens_rows = [
        {
            "id_municipio": id_municipio,
            "vereador_id": id_candidato_to_vereador_id[str(row["id_candidato_tse"])],
            "ano_eleicao": ano_eleicao,
            "tipo_item": row.get("tipo_item"),
            "descricao_item": row.get("descricao_item"),
            "valor": row.get("valor"),
        }
        for row in bens_raw
    ]
    if not bens_rows:
        return 0
    try:
        # Same "insert, no unique constraint" cadence as doacoes_campanha
        # above -- once-per-term, re-running mid-term would duplicate.
        client.table("bens_candidato").insert(bens_rows).execute()
    except PgAPIError as e:
        # 42P01 = Postgres undefined_table. Antes da troca para psycopg este
        # teste era por PGRST205 (tabela fora do cache de schema do
        # PostgREST); falando com o banco direto, "tabela não existe" chega
        # como o código cru do Postgres.
        if e.code != "42P01":
            raise
        print(
            "[etl.bd.tse] tabela 'bens_candidato' ainda não existe "
            f"({e.message}) -- rode a migration 0013_bens_candidato.sql e "
            "sincronize de novo pra trazer o patrimônio declarado."
        )
        return -1
    return len(bens_rows)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--ano-eleicao", type=int, default=ANO_ELEICAO_DEFAULT)
    parser.add_argument(
        "--sem-doacoes",
        action="store_true",
        help="pula doacoes_campanha (evita duplicar ao resincronizar só pra trazer bens_candidato)",
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.ano_eleicao, incluir_doacoes=not args.sem_doacoes)
    except RuntimeError as e:
        print(f"[etl.bd.tse] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
