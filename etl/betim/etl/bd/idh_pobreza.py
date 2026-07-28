"""etl.bd.idh_pobreza — sync IDHM e taxa de pobreza (Atlas do
Desenvolvimento Humano / PNUD, via Base dos Dados) into `indicadores`
(nome='idh'|'pobreza'). Destrava os cards "IDH" e "Taxa de pobreza" da
Home, que ficavam em "em breve" por falta de fonte confirmada.

Achado 2026-07-23: a tabela é `basedosdados.mundo_onu_adh.municipio` --
NÃO `br_pnud_adh` (não existe com esse nome) nem `br_pnud_atlas_...`.
O nome real só apareceu consultando a API GraphQL pública da Base dos
Dados (backend.basedosdados.org/graphql, campo `cloudTables.gcpDatasetId`)
depois de descobrir o slug do dataset ("adh") via busca por nome --
o `INFORMATION_SCHEMA` desse dataset também dá 403 (mesma
particularidade já vista em `etl.bd.frota`), então adivinhar o nome só
por convenção (`br_<orgao>_<assunto>`) não funcionava aqui.

LIMITAÇÃO IMPORTANTE, não escondida na UI: o Atlas do Desenvolvimento
Humano só tem dado de anos de CENSO (1991, 2000, 2010) -- o Censo 2022
ainda não teve o IDHM/indicadores derivados publicados por essa fonte
até a data desta sessão. "IDH" e "Taxa de pobreza" na Home mostram
2010 com o ano bem visível, não um número sem contexto temporal.
`prop_pobreza` é a proporção de pessoas com renda domiciliar per capita
abaixo da linha de pobreza (metodologia do próprio Atlas/PNUD), não o
critério de qualquer programa social específico (CadÚnico, etc.).
"""
import argparse
import sys

from etl.bd.common import bd_query
from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

QUERY = """
SELECT ano, idhm, prop_pobreza
FROM `basedosdados.mundo_onu_adh.municipio`
WHERE id_municipio = '{id_municipio}'
ORDER BY ano
"""


def sync(id_municipio: str) -> None:
    client = get_supabase_client()
    rows_raw = bd_query(QUERY.format(id_municipio=id_municipio))

    rows: list[dict] = []
    for r in rows_raw:
        ano = r.get("ano")
        if ano is None:
            continue
        idhm = r.get("idhm")
        pobreza = r.get("prop_pobreza")
        if idhm is not None:
            rows.append(
                {
                    "id_municipio": id_municipio,
                    "nome": "idh",
                    "valor": str(idhm),
                    "valor_numerico": idhm,
                    "ano_referencia": ano,
                    "fonte": "mundo_onu_adh (PNUD/Atlas do Desenvolvimento Humano)",
                    "unidade": None,
                }
            )
        if pobreza is not None:
            rows.append(
                {
                    "id_municipio": id_municipio,
                    "nome": "pobreza",
                    "valor": str(pobreza),
                    "valor_numerico": pobreza,
                    "ano_referencia": ano,
                    "fonte": "mundo_onu_adh (PNUD/Atlas do Desenvolvimento Humano)",
                    "unidade": "%",
                }
            )

    if rows:
        client.table("indicadores").upsert(rows, on_conflict="id_municipio,nome,ano_referencia").execute()
    print(f"[etl.bd.idh_pobreza] indicadores registros={len(rows)}")
    if rows_raw:
        ultimo = rows_raw[-1]
        print(
            f"[etl.bd.idh_pobreza] ano mais recente disponível={ultimo['ano']} "
            f"(Censo -- não atualiza fora dos anos de Censo)"
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.bd.idh_pobreza] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
