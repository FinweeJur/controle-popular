"""etl.bd.ibge — sync IBGE população + PIB (Base dos Dados) into `indicadores`.

Source: `br_ibge_populacao.municipio`, `br_ibge_pib.municipio`.
Target: `indicadores` (nome='populacao'|'pib'|'pib_per_capita'). Cron: monthly.

Schema verified live 2026-07-20 against the real BigQuery table (project
`controle-popular`): `br_ibge_pib.municipio` has no `pib_per_capita` column
at all (just `pib`, plus value-added breakdown fields). `pib` is confirmed
in plain R$ (sample: Betim 2023 = R$ 52,614,325,000 -- matches its known
real GDP, skewed high by the REGAP refinery), so `pib_per_capita` is
computed here in Python as `pib / populacao` for matching years, rather
than assumed to exist upstream.
"""
import argparse
import sys

from etl.bd.common import bd_query
from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

QUERY_POPULACAO = """
SELECT ano, populacao
FROM `basedosdados.br_ibge_populacao.municipio`
WHERE id_municipio = '{id_municipio}'
"""

QUERY_PIB = """
SELECT ano, pib
FROM `basedosdados.br_ibge_pib.municipio`
WHERE id_municipio = '{id_municipio}'
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

    populacao_raw = bd_query(QUERY_POPULACAO.format(id_municipio=id_municipio))
    populacao_by_ano = {r["ano"]: r.get("populacao") for r in populacao_raw if r.get("ano") is not None}

    rows: list[dict] = []
    for ano, populacao in populacao_by_ano.items():
        mapped = _indicador(id_municipio, "populacao", populacao, ano, "habitantes", "br_ibge_populacao")
        if mapped:
            rows.append(mapped)

    for raw in bd_query(QUERY_PIB.format(id_municipio=id_municipio)):
        ano = raw.get("ano")
        pib = raw.get("pib")
        mapped_pib = _indicador(id_municipio, "pib", pib, ano, "R$", "br_ibge_pib")
        if mapped_pib:
            rows.append(mapped_pib)

        populacao = populacao_by_ano.get(ano)
        if pib is not None and populacao:
            mapped_pib_pc = _indicador(
                id_municipio, "pib_per_capita", pib / populacao, ano, "R$", "br_ibge_pib + br_ibge_populacao"
            )
            if mapped_pib_pc:
                rows.append(mapped_pib_pc)

    if rows:
        client.table("indicadores").upsert(rows, on_conflict="id_municipio,nome,ano_referencia").execute()
    print(f"[etl.bd.ibge] indicadores registros={len(rows)}")
    print(f"[etl.bd.ibge] total={len(rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.bd.ibge] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
