"""etl.prefeitura.legislacao — sync Betim legislation into `atos_oficiais`.

Fonte: `https://www.betim.mg.gov.br/portal/dados-abertos/legislacao/{ano}`
— dataset "Legislação" do portal de dados abertos de Betim, JSON puro:
`{"dados":[{"ementa","data","numero","categoria","situacao",...}, ...]}`.
Descoberto 2026-07-24 (usuário perguntou por cobertura do Diário Oficial).

**Por que esta fonte e não a `APIDecreto` do portal de transparência:** a
APIDecreto só expõe decretos ORÇAMENTÁRIOS (crédito), sem variedade
temática. Este dataset traz a legislação GERAL — Decreto, Lei Ordinária,
Lei Complementar, Instrução Normativa, Resolução — cada uma com `ementa`
real, o que permite classificar por TEMA (o ranqueamento que o usuário
queria). Volume: ~112 (2026), ~310 (2025), ~181 (2024) por ano.

A ementa é classificada por tema com `etl/temas.py` (mesma regra por
palavra-chave das proposições/contratos). ~só as leis pegam tema; os
decretos de crédito (maioria) ficam sem — esperado, não é bug.

Target: `atos_oficiais` (tipo=categoria, temas=classificação). Full-refresh
por município. `temas` é coluna opcional (migration 0025) — degrada se não
rodou. Cron: weekly.
"""
import argparse
import datetime as dt
import sys

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client
from etl.temas import classificar_texto

BASE = "https://www.betim.mg.gov.br/portal/dados-abertos/legislacao"
ANO_MINIMO = 2015
ANO_MAXIMO = 2026  # dt.date.today() indisponível no sandbox; teto fixo


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=15))
def _get_ano(ano: int) -> list[dict]:
    resp = requests.get(
        f"{BASE}/{ano}",
        headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"},
        timeout=40,
    )
    resp.raise_for_status()
    dados = resp.json().get("dados", [])
    # Anos vazios devolvem [["Nenhum registro encontrado."]] — filtra pra dict.
    return [r for r in dados if isinstance(r, dict)]


def _map_ato(raw: dict, id_municipio: str) -> dict:
    data = (raw.get("data") or "").strip() or None  # já vem "YYYY-MM-DD"
    ano = None
    if data and len(data) >= 4 and data[:4].isdigit():
        ano = int(data[:4])
    ementa = (raw.get("ementa") or "").strip() or None
    numero = raw.get("numero")
    return {
        "id_municipio": id_municipio,
        "tipo": (raw.get("categoria") or "").strip() or "Ato",
        "numero": str(numero) if numero is not None else None,
        "ano": ano,
        "ementa": ementa,
        "data_publicacao": data,
        "temas": classificar_texto(ementa or ""),
    }


def _inserir_com_temas_opcional(client, rows: list[dict]):
    """Insert tolerando a coluna `temas` ausente (migration 0025 não rodada)."""
    from postgrest.exceptions import APIError

    # 42703 = Postgres undefined_column; PGRST204 = PostgREST não achou a
    # coluna no cache de schema (é o que o INSERT via REST devolve quando a
    # migration 0025 ainda não rodou). Trata os dois como "coluna ausente".
    try:
        client.table("atos_oficiais").insert(rows).execute()
    except APIError as e:
        if e.code not in ("42703", "PGRST204"):
            raise
        print("[etl.prefeitura.legislacao] coluna 'temas' ainda não existe -- gravando sem ela (rode a 0025).")
        client.table("atos_oficiais").insert(
            [{k: v for k, v in r.items() if k != "temas"} for r in rows]
        ).execute()


def sync(id_municipio: str) -> int:
    client = get_supabase_client()

    distintos: dict[tuple, dict] = {}
    for ano in range(ANO_MINIMO, ANO_MAXIMO + 1):
        for raw in _get_ano(ano):
            distintos[(raw.get("categoria"), raw.get("numero"), raw.get("data"))] = raw

    rows = [_map_ato(r, id_municipio) for r in distintos.values()]

    # Full-refresh (a tabela hoje só é populada por esta fonte).
    client.table("atos_oficiais").delete().eq("id_municipio", id_municipio).execute()
    if rows:
        _inserir_com_temas_opcional(client, rows)

    com_tema = sum(1 for r in rows if r["temas"])
    print(
        f"[etl.prefeitura.legislacao] id_municipio={id_municipio} atos={len(rows)} com_tema={com_tema}"
    )
    return len(rows)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except Exception as e:  # noqa: BLE001
        print(f"[etl.prefeitura.legislacao] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
