"""etl.bd.sih_sim — sync SIH (hospitalizations) + SIM (mortality) into `saude_internacoes` / `mortalidade`.

Source: `br_ms_sih.aihs_reduzidas`, `br_ms_sim.microdados`. Target:
`saude_internacoes` (ano, carater, qtd, obitos, permanencia_media),
`mortalidade` (ano, grupo_causa, obitos, obitos_infantis). Cron: monthly.

Schema verified live 2026-07-20 against the real BigQuery tables (project
`controle-popular`). Corrections vs. the original plan/guesses:

- `br_ms_sih.microdados` doesn't exist -- the real table is
  `br_ms_sih.aihs_reduzidas` (AIH = Autorização de Internação Hospitalar).
  It has `carater_internacao`, `data_internacao`, `quantidade_dias_permanencia`,
  and an `indicador_obito` INT64 flag (1/0) -- much more reliable than
  string-matching a `motivo_saida` field as originally guessed.
  Filtered by `id_municipio_paciente` (the patient's home municipality),
  which is what "hospitalizations of Betim residents" actually means --
  not `id_municipio_estabelecimento` (the hospital's location, which for a
  mid-size city like Betim is often a *different*, larger municipality).
  **Critical gotcha, confirmed live**: this table uses the classic DATASUS
  **6-digit** municipality code (e.g. `'310670'`), NOT the 7-digit IBGE code
  (`'3106705'`) used everywhere else in this project, including in SIM
  below. A query filtered on the 7-digit code silently returns zero rows
  (no error) instead of failing loudly -- confirmed by testing both: 0 rows
  for `'3106705'`, 345k+ rows for `'310670'`. `_datasus_6(id_municipio)`
  below does the truncation (drop the trailing IBGE check digit); this is
  the standard, well-known DATASUS convention, not particular to Betim, so
  the same helper will work for BH/SP in F11/F12.
- `br_ms_sim.microdados` exists as guessed, but has no `id_municipio` column
  -- only `id_municipio_residencia` and `id_municipio_ocorrencia`. This
  module filters by `id_municipio_ocorrencia` (deaths that occurred in
  Betim), matching "óbitos em Betim" framing. `causa_basica_capitulo`
  doesn't exist either -- `causa_basica` is a raw ICD-10 subcategory code
  (e.g. 'A162'). Joined against `br_bd_diretorios_brasil.cid_10`
  (`subcategoria` -> `descricao_capitulo`) to get a real, readable chapter
  grouping instead of a raw code.
- `idade` in SIM is a plain FLOAT64 (already years, not DATASUS's classic
  unit-encoded age field) based on live sample values -- `< 1` is used as
  the infant-death proxy, consistent with the original plan's intent.
"""
import argparse
import sys

from etl.bd.common import bd_query
from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

QUERY_INTERNACOES = """
SELECT
  EXTRACT(YEAR FROM data_internacao) AS ano,
  carater_internacao AS carater,
  COUNT(*) AS qtd,
  SUM(indicador_obito) AS obitos,
  AVG(quantidade_dias_permanencia) AS permanencia_media
FROM `basedosdados.br_ms_sih.aihs_reduzidas`
WHERE id_municipio_paciente = '{id_municipio_datasus}'
GROUP BY ano, carater_internacao
"""

QUERY_MORTALIDADE = """
SELECT
  sim.ano AS ano,
  COALESCE(cid.descricao_capitulo, 'Não classificado') AS grupo_causa,
  COUNT(*) AS obitos,
  SUM(CASE WHEN sim.idade < 1 THEN 1 ELSE 0 END) AS obitos_infantis
FROM `basedosdados.br_ms_sim.microdados` sim
LEFT JOIN `basedosdados.br_bd_diretorios_brasil.cid_10` cid
  ON sim.causa_basica = cid.subcategoria
WHERE sim.id_municipio_ocorrencia = '{id_municipio}'
GROUP BY ano, grupo_causa
"""


def _datasus_6(id_municipio: str) -> str:
    """Truncates a 7-digit IBGE municipality code to the 6-digit DATASUS
    convention used by br_ms_sih.aihs_reduzidas (drops the trailing check
    digit). Standard nationwide convention, not Betim-specific."""
    return id_municipio[:6]


def _map_internacao(row: dict, id_municipio: str) -> dict:
    return {
        "id_municipio": id_municipio,
        "ano": row.get("ano"),
        "carater": row.get("carater"),
        "qtd": row.get("qtd"),
        "obitos": row.get("obitos"),
        "permanencia_media": row.get("permanencia_media"),
    }


def _map_mortalidade(row: dict, id_municipio: str) -> dict:
    return {
        "id_municipio": id_municipio,
        "ano": row.get("ano"),
        "grupo_causa": row.get("grupo_causa"),
        "obitos": row.get("obitos"),
        "obitos_infantis": row.get("obitos_infantis"),
    }


def sync(id_municipio: str):
    client = get_supabase_client()

    internacoes_raw = bd_query(
        QUERY_INTERNACOES.format(id_municipio_datasus=_datasus_6(id_municipio))
    )
    internacoes_rows = [_map_internacao(r, id_municipio) for r in internacoes_raw]
    if internacoes_rows:
        client.table("saude_internacoes").upsert(
            internacoes_rows, on_conflict="id_municipio,ano,carater"
        ).execute()
    print(f"[etl.bd.sih_sim] saude_internacoes registros={len(internacoes_rows)}")

    mortalidade_raw = bd_query(QUERY_MORTALIDADE.format(id_municipio=id_municipio))
    mortalidade_rows = [_map_mortalidade(r, id_municipio) for r in mortalidade_raw]
    if mortalidade_rows:
        client.table("mortalidade").upsert(
            mortalidade_rows, on_conflict="id_municipio,ano,grupo_causa"
        ).execute()
    print(f"[etl.bd.sih_sim] mortalidade registros={len(mortalidade_rows)}")

    print(f"[etl.bd.sih_sim] total={len(internacoes_rows) + len(mortalidade_rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.bd.sih_sim] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
