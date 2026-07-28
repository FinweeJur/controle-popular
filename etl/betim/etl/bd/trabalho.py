"""etl.bd.trabalho — sync RAIS (avg salary) + CAGED (net job balance) into `indicadores`.

Source: `br_me_rais` (aggregate avg salary per year) [VERIFY exact table, e.g.
`br_me_rais.microdados_vinculos`], `br_me_caged` (monthly net job balance)
[VERIFY exact table, e.g. `br_me_caged.microdados_movimentacao`]. Target:
`indicadores` (nome='salario_medio'|'saldo_empregos_caged'). Cron: monthly.

CAGED is published monthly, but `indicadores` only carries an `ano_referencia`
(no month column) — this module aggregates CAGED's monthly balance into an
annual net figure per year rather than inventing a month-encoded indicator name.

# [VERIFY] all table/column names below via bd.get_table_columns() before the
# first live run (F0 gate).
"""
import argparse
import sys

from etl.bd.common import bd_query
from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

QUERY_RAIS = """
SELECT ano, AVG(valor_remuneracao_media) AS salario_medio
FROM `basedosdados.br_me_rais.microdados_vinculos`
WHERE id_municipio = '{id_municipio}'
GROUP BY ano
"""

QUERY_CAGED = """
SELECT ano, SUM(saldo_movimentacao) AS saldo_empregos_caged
FROM `basedosdados.br_me_caged.microdados_movimentacao`
WHERE id_municipio = '{id_municipio}'
GROUP BY ano
"""


def _indicador(id_municipio: str, nome: str, valor_numerico, ano_referencia, unidade: str, fonte: str) -> dict | None:
    if valor_numerico is None or ano_referencia is None:
        return None
    return {
        "id_municipio": id_municipio,
        "nome": nome,
        "valor": str(valor_numerico),
        "valor_numerico": valor_numerico,
        "ano_referencia": ano_referencia,
        "fonte": fonte,
        "unidade": unidade,
    }


def sync(id_municipio: str):
    client = get_supabase_client()

    rows: list[dict] = []
    for raw in bd_query(QUERY_RAIS.format(id_municipio=id_municipio)):
        mapped = _indicador(id_municipio, "salario_medio", raw.get("salario_medio"), raw.get("ano"), "R$", "br_me_rais")
        if mapped:
            rows.append(mapped)
    for raw in bd_query(QUERY_CAGED.format(id_municipio=id_municipio)):
        mapped = _indicador(
            id_municipio, "saldo_empregos_caged", raw.get("saldo_empregos_caged"), raw.get("ano"), "vagas", "br_me_caged"
        )
        if mapped:
            rows.append(mapped)

    if rows:
        client.table("indicadores").upsert(rows, on_conflict="id_municipio,nome,ano_referencia").execute()
    print(f"[etl.bd.trabalho] indicadores registros={len(rows)}")
    print(f"[etl.bd.trabalho] total={len(rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.bd.trabalho] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
