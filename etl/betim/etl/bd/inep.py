"""etl.bd.inep — sync INEP IDEB + censo escolar (Base dos Dados) into `escolas` / `indicadores`.

Source: `br_inep_ideb.municipio`, `br_inep_ideb.escola`, `br_inep_censo_escolar.escola`,
`br_bd_diretorios_brasil.escola` (school identification/geo -- see below).
Municipal IDEB -> `indicadores`; per-school IDEB + matrículas -> `escolas`
(unique on id_municipio, id_inep). Cron: monthly.

Schema verified live 2026-07-20 against the real BigQuery tables (project
`controle-popular`). Several corrections vs. the original plan/guesses:

- `br_inep_ideb.{municipio,escola}` have NO `ideb_anos_iniciais`/
  `ideb_anos_finais` columns. They're long-format: one row per
  (ano, rede, ensino, anos_escolares) with a single `ideb` value column.
  `anos_escolares` takes values like `'iniciais (1-5)'`, `'finais (6-9)'`,
  `'todos (1-4)'` (médio). Municipal-level IDEB filters to `rede='publica'`
  (a real pre-aggregated network value at that level) + `ensino='fundamental'`.
  School-level IDEB has NO `'publica'` pseudo-network row (confirmed live --
  each individual school is municipal/estadual/federal, never "publica"),
  so the per-school query only filters `ensino='fundamental'` and keeps
  whichever real rede each school belongs to.
- `br_inep_censo_escolar.escola` has NO name, address, or lat/lng columns
  at all -- it's a pure infrastructure/statistics table (hundreds of
  boolean/count flags: água, energia, acessibilidade, equipamentos, etc.).
  School identification (nome, endereco, latitude, longitude) lives in the
  separate `br_bd_diretorios_brasil.escola` directory table instead (a
  general dimension table reused across INEP datasets), joined here by
  `id_escola`. `quantidade_matriculas` doesn't exist either -- the closest
  single "total enrollment" figure is `quantidade_matricula_educacao_basica`.
  `etapas_ensino` (as a single field) doesn't exist -- the real table has
  ~30 separate `etapa_ensino_*` boolean flags instead; deriving a compact
  list from those is out of scope for this round, so `escolas.etapas` is
  left null here (a future pass could build it from the boolean flags).
"""
import argparse
import sys

from etl.bd.common import bd_query
from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

IDEB_REDE = "publica"
IDEB_ENSINO = "fundamental"

QUERY_IDEB_MUNICIPIO = """
SELECT ano, anos_escolares, ideb
FROM `basedosdados.br_inep_ideb.municipio`
WHERE id_municipio = '{id_municipio}' AND rede = '{rede}' AND ensino = '{ensino}'
"""

QUERY_IDEB_ESCOLA = """
SELECT ano, id_escola, rede, anos_escolares, ideb
FROM `basedosdados.br_inep_ideb.escola`
WHERE id_municipio = '{id_municipio}' AND ensino = '{ensino}'
"""

QUERY_CENSO_ESCOLA = """
SELECT ano, id_escola, rede, quantidade_matricula_educacao_basica AS quantidade_matriculas
FROM `basedosdados.br_inep_censo_escolar.escola`
WHERE id_municipio = '{id_municipio}'
"""

QUERY_DIRETORIO_ESCOLA = """
SELECT id_escola, nome, endereco, latitude, longitude
FROM `basedosdados.br_bd_diretorios_brasil.escola`
WHERE id_municipio = '{id_municipio}'
"""

_ANOS_ESCOLARES_TO_INDICADOR = {
    "iniciais (1-5)": "ideb_anos_iniciais",
    "finais (6-9)": "ideb_anos_finais",
}


def _map_indicadores_ideb_municipio(row: dict, id_municipio: str) -> list[dict]:
    ano = row.get("ano")
    nome = _ANOS_ESCOLARES_TO_INDICADOR.get(row.get("anos_escolares"))
    valor = row.get("ideb")
    if ano is None or nome is None or valor is None:
        return []
    return [
        {
            "id_municipio": id_municipio,
            "nome": nome,
            "valor": str(valor),
            "valor_numerico": valor,
            "ano_referencia": ano,
            "fonte": "br_inep_ideb",
            "unidade": "pontos",
        }
    ]


def _latest_by_school(rows: list[dict]) -> dict[str, dict]:
    """Keeps only the most recent `ano` row per id_escola (escolas has no ano column)."""
    latest: dict[str, dict] = {}
    for row in sorted(rows, key=lambda r: r.get("ano") or 0, reverse=True):
        id_escola = row.get("id_escola")
        if id_escola and id_escola not in latest:
            latest[id_escola] = row
    return latest


def sync(id_municipio: str):
    client = get_supabase_client()

    # 1. Municipal IDEB (fundamental, rede publica) -> indicadores
    ideb_mun_rows = bd_query(
        QUERY_IDEB_MUNICIPIO.format(id_municipio=id_municipio, rede=IDEB_REDE, ensino=IDEB_ENSINO)
    )
    indicador_rows = []
    for row in ideb_mun_rows:
        indicador_rows.extend(_map_indicadores_ideb_municipio(row, id_municipio))
    if indicador_rows:
        client.table("indicadores").upsert(
            indicador_rows, on_conflict="id_municipio,nome,ano_referencia"
        ).execute()
    print(f"[etl.bd.inep] indicadores (ideb municipal) registros={len(indicador_rows)}")

    # 2. Per-school IDEB + censo escolar + diretorio (name/geo) -> escolas
    ideb_escola = _latest_by_school(
        bd_query(QUERY_IDEB_ESCOLA.format(id_municipio=id_municipio, rede=IDEB_REDE, ensino=IDEB_ENSINO))
    )
    censo_escola = _latest_by_school(bd_query(QUERY_CENSO_ESCOLA.format(id_municipio=id_municipio)))
    diretorio_rows = bd_query(QUERY_DIRETORIO_ESCOLA.format(id_municipio=id_municipio))
    diretorio_by_id = {r["id_escola"]: r for r in diretorio_rows if r.get("id_escola")}

    escolas_map: dict[str, dict] = {}

    def _entry(id_escola: str) -> dict:
        return escolas_map.setdefault(
            id_escola, {"id_municipio": id_municipio, "id_inep": id_escola}
        )

    for id_escola, dir_row in diretorio_by_id.items():
        entry = _entry(id_escola)
        entry["nome"] = dir_row.get("nome")
        entry["lat"] = dir_row.get("latitude")
        entry["lng"] = dir_row.get("longitude")

    for id_escola, row in censo_escola.items():
        entry = _entry(id_escola)
        entry["rede"] = row.get("rede")
        entry["matriculas"] = row.get("quantidade_matriculas")

    for id_escola, row in ideb_escola.items():
        entry = _entry(id_escola)
        entry.setdefault("rede", row.get("rede"))
        # anos_escolares here is either 'iniciais (1-5)' or 'finais (6-9)' per
        # the query filter -- stash both if both years happen to be present.
        anos = row.get("anos_escolares")
        if anos == "iniciais (1-5)":
            entry["ideb_anos_iniciais"] = row.get("ideb")
        elif anos == "finais (6-9)":
            entry["ideb_anos_finais"] = row.get("ideb")

    escolas_rows = list(escolas_map.values())
    if escolas_rows:
        client.table("escolas").upsert(escolas_rows, on_conflict="id_municipio,id_inep").execute()
    print(f"[etl.bd.inep] escolas registros={len(escolas_rows)}")

    print(f"[etl.bd.inep] total_indicadores={len(indicador_rows)} total_escolas={len(escolas_rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.bd.inep] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
