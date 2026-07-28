"""etl.apis.infodengue — sync InfoDengue alertcity (dengue/chikungunya/zika) into `arboviroses`.

Source: https://info.dengue.mat.br/api/alertcity?geocode=..&disease=..&format=json
(public, no key), one request per disease. Target: `arboviroses` (unique on
id_municipio, doenca, ano, semana_epidemiologica). Cron: weekly.
"""
import argparse
import sys

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

BASE_URL = "https://info.dengue.mat.br/api/alertcity"
DISEASES = ("dengue", "chikungunya", "zika")


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=30))
def _get(geocode: str, disease: str) -> list[dict]:
    resp = requests.get(
        BASE_URL,
        params={"geocode": geocode, "disease": disease, "format": "json"},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    return data if isinstance(data, list) else []


def _map_row(raw: dict, id_municipio: str, disease: str) -> dict | None:
    # InfoDengue's "SE" (semana epidemiológica) is formatted as YYYYWW, e.g. 202501.
    se = raw.get("SE")
    if se is None:
        return None
    return {
        "id_municipio": id_municipio,
        "doenca": disease,
        "ano": se // 100,
        "semana_epidemiologica": se % 100,
        "casos": raw.get("casos"),
        "nivel_alerta": raw.get("nivel"),
    }


def sync(id_municipio: str, geocode: str):
    client = get_supabase_client()
    total = 0
    for disease in DISEASES:
        raw_rows = _get(geocode, disease)
        rows = [m for r in raw_rows if (m := _map_row(r, id_municipio, disease)) is not None]
        if rows:
            client.table("arboviroses").upsert(
                rows, on_conflict="id_municipio,doenca,ano,semana_epidemiologica"
            ).execute()
        print(f"[etl.apis.infodengue] doenca={disease} registros={len(rows)}")
        total += len(rows)
    print(f"[etl.apis.infodengue] total={total}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--geocode", default=ID_MUNICIPIO_DEFAULT, help="Código IBGE (7 dígitos) usado pelo InfoDengue"
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.geocode)
    except RuntimeError as e:
        print(f"[etl.apis.infodengue] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
