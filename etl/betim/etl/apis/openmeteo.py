"""etl.apis.openmeteo — sync Open-Meteo forecast + precipitation archive into `clima_cache`.

Source: api.open-meteo.com/v1/forecast (current weather + daily forecast) and
archive-api.open-meteo.com/v1/archive (last-7-days precipitation history),
both public/no-key, using CITY_LAT/CITY_LNG. Target: `clima_cache` (one row
per município, pk id_municipio). Cron: daily.
"""
import argparse
import datetime as dt
import sys

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import ID_MUNICIPIO_DEFAULT, carregar_municipio, get_supabase_client

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=30))
def _get(url: str, params: dict) -> dict:
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def _fetch_forecast(lat: float, lng: float) -> dict:
    return _get(
        FORECAST_URL,
        {
            "latitude": lat,
            "longitude": lng,
            "current_weather": "true",
            "daily": "precipitation_sum,temperature_2m_max,temperature_2m_min,weathercode",
            "timezone": "America/Sao_Paulo",
        },
    )


def _fetch_chuva_7d(lat: float, lng: float) -> float:
    """Sums precipitation_sum over the last 7 completed days from the archive API."""
    today = dt.date.today()
    start = today - dt.timedelta(days=7)
    end = today - dt.timedelta(days=1)
    payload = _get(
        ARCHIVE_URL,
        {
            "latitude": lat,
            "longitude": lng,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "daily": "precipitation_sum",
            "timezone": "America/Sao_Paulo",
        },
    )
    valores = (payload.get("daily") or {}).get("precipitation_sum") or []
    return round(sum(v for v in valores if v is not None), 2)


def sync(id_municipio: str, lat: float | None = None, lng: float | None = None):
    """As coordenadas saem de `municipios.lat/lng`.

    Derivado de `municipios` (ver `carregar_municipio`): este parâmetro tinha
    default fixo de Betim, então rodar só com `--id-municipio <outra cidade>`
    coletava o dado de Betim e o gravava com o id da outra — sem erro. Mesmo
    defeito encontrado e corrigido em `etl.apis.anp` em 2026-08-03.
    """
    client = get_supabase_client()
    cidade = carregar_municipio(id_municipio)
    if lat is None:
        lat = cidade["lat"]
    if lng is None:
        lng = cidade["lng"]
    if lat is None or lng is None:
        raise RuntimeError(
            f"municipios.lat/lng vazios para id_municipio={id_municipio}; "
            "sem coordenada não há previsão para buscar."
        )
    lat, lng = float(lat), float(lng)

    forecast = _fetch_forecast(lat, lng)
    chuva_7d = _fetch_chuva_7d(lat, lng)

    row = {
        "id_municipio": id_municipio,
        "atual": forecast.get("current_weather"),
        "diario": forecast.get("daily"),
        "chuva_7d": chuva_7d,
        "atualizado_em": dt.datetime.now(dt.timezone.utc).isoformat(),
    }
    client.table("clima_cache").upsert(row, on_conflict="id_municipio").execute()
    print(f"[etl.apis.openmeteo] id_municipio={id_municipio} chuva_7d={chuva_7d}mm")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--lat", type=float, default=None, help="Override; o padrão vem de `municipios`.")
    parser.add_argument("--lng", type=float, default=None, help="Override; o padrão vem de `municipios`.")
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.lat, args.lng)
    except RuntimeError as e:
        print(f"[etl.apis.openmeteo] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
