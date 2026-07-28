"""etl.apis.ibge — sync IBGE servicodados (Localidades + Malhas) into `municipios`.

Source: servicodados.ibge.gov.br — public, no key. Two endpoints:
- /api/v1/localidades/municipios/{id}: administrative hierarchy
  (microrregiao/mesorregiao/regiao-imediata/regiao-intermediaria/UF/regiao).
- /api/v3/malhas/municipios/{id}?formato=application/vnd.geo+json: GeoJSON
  polygon boundary of the municipality.
Both live-verified 2026-07-20 for id_municipio=3106705 (Betim).
Target: `municipios.regiao_ibge` / `municipios.malha_geojson`. Cron: quarterly
(this data essentially never changes between IBGE territorial reviews).
"""
import argparse
import sys

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

LOCALIDADES_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios/{id_municipio}"
MALHAS_URL = "https://servicodados.ibge.gov.br/api/v3/malhas/municipios/{id_municipio}"


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=30))
def _get(url: str, params: dict | None = None) -> dict:
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def _fetch_regiao(id_municipio: str) -> dict:
    return _get(LOCALIDADES_URL.format(id_municipio=id_municipio))


def _fetch_malha(id_municipio: str) -> dict:
    return _get(
        MALHAS_URL.format(id_municipio=id_municipio),
        params={"formato": "application/vnd.geo+json", "qualidade": "minima"},
    )


def sync(id_municipio: str):
    client = get_supabase_client()

    regiao = _fetch_regiao(id_municipio)
    malha = _fetch_malha(id_municipio)

    client.table("municipios").update(
        {"regiao_ibge": regiao, "malha_geojson": malha}
    ).eq("id_municipio", id_municipio).execute()

    print(f"[etl.apis.ibge] id_municipio={id_municipio} regiao+malha atualizados")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.apis.ibge] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
