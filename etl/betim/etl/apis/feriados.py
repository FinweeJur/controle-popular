"""etl.apis.feriados — sync national holidays into `feriados_nacionais`.

Source: BrasilAPI `GET /api/feriados/v1/{ano}` — public, no key, computes
fixed + moveable (Easter-based) national holidays. Live-verified 2026-07-20.

Not per-município (holidays are the same everywhere in Brazil), so this
module takes no `--id-municipio` and `feriados_nacionais` has no
`id_municipio` column — a deliberate deviation from every other table in
this schema. Fetches the current year and the next one, so next year's
dates are already available before December. Cron: quarterly.
"""
import argparse
import datetime as dt
import sys

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import get_supabase_client

FERIADOS_URL = "https://brasilapi.com.br/api/feriados/v1/{ano}"


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=30))
def _fetch_ano(ano: int) -> list[dict]:
    resp = requests.get(FERIADOS_URL.format(ano=ano), timeout=30)
    resp.raise_for_status()
    return resp.json()


def sync(anos: list[int] | None = None):
    client = get_supabase_client()

    if anos is None:
        ano_atual = dt.date.today().year
        anos = [ano_atual, ano_atual + 1]

    rows = []
    for ano in anos:
        for item in _fetch_ano(ano):
            rows.append({"data": item["date"], "nome": item["name"], "tipo": item["type"]})

    if rows:
        client.table("feriados_nacionais").upsert(rows, on_conflict="data").execute()
    print(f"[etl.apis.feriados] anos={anos} registros={len(rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--anos", type=int, nargs="*", default=None)
    args = parser.parse_args()
    try:
        sync(args.anos)
    except RuntimeError as e:
        print(f"[etl.apis.feriados] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
