"""etl.apis.anp — sync ANP fuel-retailer registry into `postos_anp`.

Source: `https://revendedoresapi.anp.gov.br/v1/combustivel` — public API, no
key required (confirmed live 2026-07-21, see docs/F0-discovery.md). Query
params are `uf` and `municipio`; **`municipio` must be the upper-case,
accent-free name exactly as ANP stores it** ("BETIM", not "Betim") — the
lower/mixed-case forms silently return `data: []` instead of an error.
Pagination via `numeropagina`, but Betim's ~63 retailers all fit on page 1
(page 2 already returns empty) — the loop below still walks pages until an
empty page, so it keeps working for bigger cities (BH/SP, F11/F12) where the
real page size will matter.

`inadimplenciaPMQC` (PMQC program violations) was empty for all 63 Betim
retailers as of 2026-07-21 — so `nota_anp`/`interditado` are derived
best-effort from that field (5 minus violation count, floor 0; interditado
if any violation entry looks like an interdiction) and will likely read as
"5 / not interdicted" for everyone until a real violation appears in the
data. Documented as a known limitation, not a bug.
"""
import argparse
import datetime as dt
import sys

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

API_BASE = "https://revendedoresapi.anp.gov.br/v1/combustivel"


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=30))
def _get_page(uf: str, municipio: str, pagina: int) -> dict:
    resp = requests.get(
        API_BASE,
        params={"uf": uf, "municipio": municipio, "numeropagina": pagina},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def _score(inadimplencias: list) -> tuple[int, bool]:
    """Best-effort 0-5 score and interdiction flag from PMQC violation history."""
    if not inadimplencias:
        return 5, False
    interditado = any(
        "interdi" in str(v).lower() for v in inadimplencias
    )
    nota = max(0, 5 - len(inadimplencias))
    return nota, interditado


def _fetch_all(uf: str, municipio: str) -> list[dict]:
    rows: list[dict] = []
    pagina = 1
    while True:
        payload = _get_page(uf, municipio, pagina)
        data = payload.get("data") or []
        if not data:
            break
        rows.extend(data)
        pagina += 1
    return rows


def sync(id_municipio: str, uf: str, municipio: str):
    client = get_supabase_client()
    postos = _fetch_all(uf, municipio)

    rows = []
    for p in postos:
        inadimplencias = p.get("inadimplenciaPMQC") or []
        nota, interditado = _score(inadimplencias)
        produtos = [prod.get("produto") for prod in (p.get("produtos") or []) if prod.get("produto")]

        lat = p.get("latitude")
        lng = p.get("longitude")

        rows.append(
            {
                "id_municipio": id_municipio,
                "cnpj": p.get("cnpj"),
                "razao_social": p.get("razaoSocial"),
                "endereco": ", ".join(
                    filter(None, [p.get("endereco"), p.get("complemento"), p.get("bairro")])
                ),
                "bairro": p.get("bairro"),
                "bandeira": p.get("distribuidora"),
                "produtos": produtos,
                "nota_anp": nota,
                "infracoes": inadimplencias,
                "interditado": interditado,
                "lat": float(lat) if lat not in (None, "") else None,
                "lng": float(lng) if lng not in (None, "") else None,
                "atualizado_em": dt.date.today().isoformat(),
            }
        )

    if rows:
        client.table("postos_anp").upsert(rows, on_conflict="cnpj").execute()
    print(f"[etl.apis.anp] id_municipio={id_municipio} postos={len(rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--uf", default="MG")
    parser.add_argument("--municipio", default="BETIM", help="Upper-case, accent-free (ANP convention)")
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.uf, args.municipio)
    except RuntimeError as e:
        print(f"[etl.apis.anp] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
