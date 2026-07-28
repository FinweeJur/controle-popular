"""etl.bd.balanco — sync "Caixa e Equivalentes de Caixa" into `caixa_disponivel`.

Source: `br_me_siconfi.municipio_balanco_patrimonial`. Confirmed live
2026-07-21 (pedido do usuário — "quanto a Prefeitura tem em caixa"): none
of the `municipio_despesas_funcao`/`municipio_despesas_orcamentarias`/
`municipio_receitas_orcamentarias` tables already used by
`etl.bd.siconfi` carry a cash-on-hand figure — they're all execution-stage
flow tables (Empenhadas/Liquidadas/Pagas). `municipio_balanco_patrimonial`
is a different table entirely (the balance sheet, not the budget
execution report) and has a `conta = 'Caixa e Equivalentes de Caixa'` row
per year — tested for Betim: R$1,45bi (2024), R$1,33bi (2023), full
series back to at least 2020. Target: `caixa_disponivel` (ano, valor),
new table — nothing existing stores a balance-sheet figure. Cron: monthly
(same cadence as `etl.bd.siconfi`, same source dataset).
"""
import argparse
import sys

from etl.bd.common import bd_query
from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

ANO_MINIMO = 2015
CONTA_CAIXA = "Caixa e Equivalentes de Caixa"

QUERY_CAIXA = """
SELECT ano, SUM(valor) AS valor
FROM `basedosdados.br_me_siconfi.municipio_balanco_patrimonial`
WHERE id_municipio = '{id_municipio}' AND ano >= {ano_minimo} AND conta = '{conta}'
GROUP BY ano
"""


def sync(id_municipio: str, ano_minimo: int = ANO_MINIMO):
    client = get_supabase_client()

    raw = bd_query(
        QUERY_CAIXA.format(id_municipio=id_municipio, ano_minimo=ano_minimo, conta=CONTA_CAIXA)
    )
    rows = [
        {
            "id_municipio": id_municipio,
            "ano": r.get("ano"),
            "valor": r.get("valor"),
            "fonte": "br_me_siconfi",
        }
        for r in raw
    ]
    if rows:
        client.table("caixa_disponivel").upsert(rows, on_conflict="id_municipio,ano").execute()
    print(f"[etl.bd.balanco] caixa_disponivel registros={len(rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--ano-minimo", type=int, default=ANO_MINIMO)
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.ano_minimo)
    except RuntimeError as e:
        print(f"[etl.bd.balanco] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
