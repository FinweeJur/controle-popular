"""etl.bd.siconfi — sync SICONFI (Base dos Dados) into `despesas` and `receitas`.

Source: `br_me_siconfi.municipio_despesas_funcao`, `municipio_receitas_orcamentarias`.
Target: `despesas`, `receitas`. Cron: monthly.

Schema verified live 2026-07-20 against the real BigQuery table (project
`controle-popular`). `municipio_despesas_funcao` has NO `funcao` column --
the plan's example query was wrong. Instead, `conta` itself holds
função-level labels (confirmed via distinct sample: 'Saúde', 'Educação',
'Legislativa', 'Administração Geral', 'Assistência Social', ...) -- this
table's whole purpose is the função-level breakdown, so `conta` IS the
função. `despesas.funcao` and `despesas.conta` are both populated from the
same `conta` value below (slightly redundant, but correct and matches this
source's actual granularity; `despesas.conta_bd`/`id_conta_bd` -- BD's
internal standardized codes for the same value -- are available if a
finer key is needed later but aren't used here).

There IS a finer dimension underneath `conta`, though: confirmed live
2026-07-20 (first real Supabase write test) that multiple distinct
`id_conta_bd` rows (different órgão-executor codes, e.g. '3.10.122',
'3.15.122', ...) share the same (ano, estagio, conta) triple -- e.g.
Betim 2024 "Despesas Empenhadas" x "Administração Geral" had 11 separate
`id_conta_bd` rows, individually R$ 20k to R$ 248mi. Upserting the raw
per-`id_conta_bd` rows on a (id_municipio, ano, estagio, funcao, conta)
key hit Postgres' "ON CONFLICT DO UPDATE command cannot affect row a
second time" -- and even if it hadn't errored, keeping only one arbitrary
row per key would have silently thrown away most of the real total. Both
queries below now `GROUP BY ... SUM(valor)` in BigQuery itself, so each
(ano, estagio, conta) key really is the full total and arrives already
unique -- not a Python-side dedupe band-aid.
"""
import argparse
import sys

from etl.bd.common import bd_query
from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

ANO_MINIMO = 2015

QUERY_DESPESAS = """
SELECT ano, estagio, conta, SUM(valor) AS valor
FROM `basedosdados.br_me_siconfi.municipio_despesas_funcao`
WHERE id_municipio = '{id_municipio}' AND ano >= {ano_minimo}
GROUP BY ano, estagio, conta
"""

QUERY_RECEITAS = """
SELECT ano, estagio, conta, SUM(valor) AS valor
FROM `basedosdados.br_me_siconfi.municipio_receitas_orcamentarias`
WHERE id_municipio = '{id_municipio}' AND ano >= {ano_minimo}
GROUP BY ano, estagio, conta
"""


def _map_despesa(row: dict, id_municipio: str) -> dict:
    conta = row.get("conta")
    return {
        "id_municipio": id_municipio,
        "ano": row.get("ano"),
        "estagio": row.get("estagio"),
        "funcao": conta,
        "conta": conta,
        "valor": row.get("valor"),
        "fonte": "br_me_siconfi",
    }


def _map_receita(row: dict, id_municipio: str) -> dict:
    return {
        "id_municipio": id_municipio,
        "ano": row.get("ano"),
        "estagio": row.get("estagio"),
        "conta": row.get("conta"),
        "valor": row.get("valor"),
        "fonte": "br_me_siconfi",
    }


def sync(id_municipio: str, ano_minimo: int = ANO_MINIMO):
    client = get_supabase_client()

    despesas_raw = bd_query(QUERY_DESPESAS.format(id_municipio=id_municipio, ano_minimo=ano_minimo))
    despesas_rows = [_map_despesa(r, id_municipio) for r in despesas_raw]
    if despesas_rows:
        client.table("despesas").upsert(
            despesas_rows, on_conflict="id_municipio,ano,estagio,funcao,conta"
        ).execute()
    print(f"[etl.bd.siconfi] despesas registros={len(despesas_rows)}")

    receitas_raw = bd_query(QUERY_RECEITAS.format(id_municipio=id_municipio, ano_minimo=ano_minimo))
    receitas_rows = [_map_receita(r, id_municipio) for r in receitas_raw]
    if receitas_rows:
        client.table("receitas").upsert(
            receitas_rows, on_conflict="id_municipio,ano,estagio,conta"
        ).execute()
    print(f"[etl.bd.siconfi] receitas registros={len(receitas_rows)}")

    print(f"[etl.bd.siconfi] total={len(despesas_rows) + len(receitas_rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--ano-minimo", type=int, default=ANO_MINIMO)
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.ano_minimo)
    except RuntimeError as e:
        print(f"[etl.bd.siconfi] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
