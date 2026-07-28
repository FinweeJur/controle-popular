"""etl.bd.snis — sync SNIS água/esgoto (Base dos Dados) into `indicadores`.

Source: `br_mdr_snis.municipio_agua_esgoto`. Target: `indicadores`
(nome='cobertura_agua'|'cobertura_esgoto'). Cron: monthly.

Schema verified live 2026-07-20 against the real BigQuery table (project
`controle-popular`). Two corrections vs. the original plan:

1. `municipio_residuos_solidos` does NOT exist in `br_mdr_snis` -- the
   dataset only has `municipio_agua_esgoto` and `prestador_agua_esgoto`.
   There's no SNIS resíduos sólidos (garbage collection) data available via
   Base dos Dados at all. `coleta_residuos` is dropped from this module;
   `indicadores` simply won't have that row until another source is found.
2. `indice_atendimento_total_esgoto` doesn't exist either. Of the several
   esgoto-related indices in the real table (`indice_coleta_esgoto`,
   `indice_tratamento_esgoto`, `indice_atendimento_esgoto_agua`,
   `indice_atendimento_esgoto_esgoto`), `indice_coleta_esgoto` ("% da
   população com coleta de esgoto") is the closest match to "cobertura_esgoto"
   -- a coverage/access metric, not a treatment-quality one. Judgment call,
   flagged here rather than silently picked.
"""
import argparse
import sys

from etl.bd.common import bd_query
from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

QUERY_AGUA_ESGOTO = """
SELECT ano, indice_atendimento_total_agua AS cobertura_agua,
       indice_coleta_esgoto AS cobertura_esgoto
FROM `basedosdados.br_mdr_snis.municipio_agua_esgoto`
WHERE id_municipio = '{id_municipio}'
"""


def _indicador(id_municipio: str, nome: str, valor_numerico, ano_referencia, fonte: str) -> dict | None:
    if valor_numerico is None or ano_referencia is None:
        return None
    return {
        "id_municipio": id_municipio,
        "nome": nome,
        "valor": str(valor_numerico),
        "valor_numerico": valor_numerico,
        "ano_referencia": ano_referencia,
        "fonte": fonte,
        "unidade": "%",
    }


def sync(id_municipio: str):
    client = get_supabase_client()

    rows: list[dict] = []
    for raw in bd_query(QUERY_AGUA_ESGOTO.format(id_municipio=id_municipio)):
        for nome, key in (("cobertura_agua", "cobertura_agua"), ("cobertura_esgoto", "cobertura_esgoto")):
            mapped = _indicador(id_municipio, nome, raw.get(key), raw.get("ano"), "br_mdr_snis")
            if mapped:
                rows.append(mapped)

    if rows:
        client.table("indicadores").upsert(rows, on_conflict="id_municipio,nome,ano_referencia").execute()
    print(f"[etl.bd.snis] indicadores registros={len(rows)}")
    print(f"[etl.bd.snis] total={len(rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.bd.snis] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
