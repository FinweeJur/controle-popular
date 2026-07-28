"""etl.bd.agropecuaria — sync IBGE PAM (lavouras) + PPM (rebanhos,
produção animal) into `producao_agropecuaria` (migration 0016).

Fonte: Base dos Dados (BigQuery), datasets `br_ibge_pam` (lavoura_temporaria,
lavoura_permanente) e `br_ibge_ppm` (efetivo_rebanhos, producao_origem_animal).

Confirmado ao vivo 2026-07-23 contra Betim: produção real existe (leite,
ovos, mel, hortaliças, alguns rebanhos) mesmo sendo cidade majoritariamente
urbana/industrial — pequena em volume nacional, mas real.

`producao_pecuaria` (ovinos_tosquiados/vacas_ordenhadas) foi checada e
NÃO usada: é uma tabela de contagem de operações (quantas vacas foram
ordenhadas), não de produção — `producao_origem_animal` (leite/ovos/mel
em volume e valor) é a fonte certa pra "quanto foi produzido".

`efetivo_rebanhos` para de atualizar em 2022 (confirmado: é o ano mais
recente disponível na fonte pública, não uma limitação deste ETL) —
a página precisa dizer que o efetivo de rebanho está defasado 2+ anos
em relação às lavouras/produção animal.
"""
import argparse
import sys

from etl.bd.common import bd_query
from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

QUERY_LAVOURA_TEMPORARIA = """
SELECT ano, produto, area_colhida, quantidade_produzida, valor_producao
FROM `basedosdados.br_ibge_pam.lavoura_temporaria`
WHERE id_municipio = '{id_municipio}' AND valor_producao IS NOT NULL
"""

QUERY_LAVOURA_PERMANENTE = """
SELECT ano, produto, area_colhida, quantidade_produzida, valor_producao
FROM `basedosdados.br_ibge_pam.lavoura_permanente`
WHERE id_municipio = '{id_municipio}' AND valor_producao IS NOT NULL
"""

QUERY_REBANHOS = """
SELECT ano, tipo_rebanho AS produto, quantidade
FROM `basedosdados.br_ibge_ppm.efetivo_rebanhos`
WHERE id_municipio = '{id_municipio}' AND quantidade IS NOT NULL
"""

QUERY_PRODUCAO_ANIMAL = """
SELECT ano, produto, unidade, quantidade, valor
FROM `basedosdados.br_ibge_ppm.producao_origem_animal`
WHERE id_municipio = '{id_municipio}' AND valor IS NOT NULL
"""


def sync(id_municipio: str):
    client = get_supabase_client()
    rows: list[dict] = []

    for raw in bd_query(QUERY_LAVOURA_TEMPORARIA.format(id_municipio=id_municipio)):
        rows.append(
            {
                "id_municipio": id_municipio,
                "ano": raw["ano"],
                "categoria": "lavoura_temporaria",
                "produto": raw["produto"],
                "quantidade": raw.get("quantidade_produzida"),
                "unidade": "toneladas",
                "area_colhida": raw.get("area_colhida"),
                "valor_producao_mil_reais": raw.get("valor_producao"),
                "fonte": "br_ibge_pam",
            }
        )

    for raw in bd_query(QUERY_LAVOURA_PERMANENTE.format(id_municipio=id_municipio)):
        rows.append(
            {
                "id_municipio": id_municipio,
                "ano": raw["ano"],
                "categoria": "lavoura_permanente",
                "produto": raw["produto"],
                "quantidade": raw.get("quantidade_produzida"),
                "unidade": "toneladas",
                "area_colhida": raw.get("area_colhida"),
                "valor_producao_mil_reais": raw.get("valor_producao"),
                "fonte": "br_ibge_pam",
            }
        )

    for raw in bd_query(QUERY_REBANHOS.format(id_municipio=id_municipio)):
        rows.append(
            {
                "id_municipio": id_municipio,
                "ano": raw["ano"],
                "categoria": "rebanho",
                "produto": raw["produto"],
                "quantidade": raw.get("quantidade"),
                "unidade": "cabeças",
                "area_colhida": None,
                "valor_producao_mil_reais": None,
                "fonte": "br_ibge_ppm",
            }
        )

    for raw in bd_query(QUERY_PRODUCAO_ANIMAL.format(id_municipio=id_municipio)):
        rows.append(
            {
                "id_municipio": id_municipio,
                "ano": raw["ano"],
                "categoria": "producao_animal",
                "produto": raw["produto"],
                "quantidade": raw.get("quantidade"),
                "unidade": raw.get("unidade"),
                "area_colhida": None,
                "valor_producao_mil_reais": raw.get("valor"),
                "fonte": "br_ibge_ppm",
            }
        )

    if rows:
        client.table("producao_agropecuaria").upsert(
            rows, on_conflict="id_municipio,ano,categoria,produto"
        ).execute()
    print(f"[etl.bd.agropecuaria] id_municipio={id_municipio} registros={len(rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.bd.agropecuaria] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
