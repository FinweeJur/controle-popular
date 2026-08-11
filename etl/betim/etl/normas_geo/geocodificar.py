r"""etl.normas_geo.geocodificar — resolve `atos_oficiais_geo.query_geocodificacao`
em lat/lng via Nominatim (OpenStreetMap), a mesma fonte que o resto do
projeto usa por ser gratuita e pública.

    python -m etl.normas_geo.geocodificar

═══ POLÍTICA DE USO DO NOMINATIM (operations.osmfoundation.org/policies/nominatim) ═══

  - Máximo 1 requisição por segundo (`_PAUSA_ENTRE_REQ` abaixo).
  - `User-Agent` identificando a aplicação, com jeito de achar quem mantém
    (`_USER_AGENT` aponta para o repositório público do projeto).
  - Resultado tem de ser CACHEADO -- nunca geocodificar a mesma consulta
    duas vezes. Cache em disco (`_cache_path()`), sobrevive entre rodadas.

═══ POR QUE DEDUPLICAR A QUERY, NÃO SÓ CACHEAR ═══

Muitos atos citam o MESMO lugar ("Bairro Buritis" aparece em vários decretos
de desapropriação diferentes). Geocodificar por `query_geocodificacao`
DISTINCT em vez de por linha corta o número de requisições reais várias
vezes -- e é o comportamento certo mesmo sem cache: a pergunta "onde fica
Bairro Buritis, Belo Horizonte, MG, Brasil" tem uma resposta só.

═══ SEM RESULTADO NÃO VIRA CHUTE ═══

Nominatim sem resultado (`[]`) fica com `lat`/`lng` NULL -- a linha
continua em `atos_oficiais_geo` (a extração foi válida), só não entra no
GeoJSON (`gerar_geojson.py` só lê `lat is not null`). Regra do projeto:
cobertura menor e confiável vale mais que cobertura maior e inventada.
"""
import argparse
import json
import sys
import time
from pathlib import Path

import requests

from etl.normas_geo._db import conectar

_USER_AGENT = "controle-popular-normas-geo/1.0 (+https://github.com/FinweeJur/controle-popular)"
_ENDPOINT = "https://nominatim.openstreetmap.org/search"
_PAUSA_ENTRE_REQ = 1.1  # > 1 req/s de folga, não no limite exato
_CACHE_PATH = Path(__file__).parent / ".cache" / "nominatim.json"


def _carregar_cache() -> dict:
    if not _CACHE_PATH.exists():
        return {}
    return json.loads(_CACHE_PATH.read_text(encoding="utf-8"))


def _salvar_cache(cache: dict) -> None:
    _CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    _CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding="utf-8")


def _consultar_nominatim(query: str) -> dict | None:
    """Uma chamada real ao Nominatim. `None` = sem resultado (não erro)."""
    resp = requests.get(
        _ENDPOINT,
        params={"q": query, "format": "json", "limit": 1, "countrycodes": "br"},
        headers={"User-Agent": _USER_AGENT},
        timeout=20,
    )
    resp.raise_for_status()
    dados = resp.json()
    if not dados:
        return None
    d = dados[0]
    return {"lat": float(d["lat"]), "lng": float(d["lon"]), "display_name": d.get("display_name")}


def geocodificar_distintas(queries: list[str], cache: dict) -> dict:
    """Resolve cada query DISTINCT, uma vez, respeitando o cache e o limite
    de taxa. Devolve {query: {"lat", "lng"} | None}."""
    resultado: dict[str, dict | None] = {}
    pendentes = [q for q in queries if q not in cache]
    print(f"[normas_geo.geocodificar] {len(queries)} consultas distintas, "
          f"{len(queries) - len(pendentes)} já em cache, {len(pendentes)} para buscar.")

    for i, q in enumerate(pendentes):
        try:
            achado = _consultar_nominatim(q)
        except requests.RequestException as e:
            print(f"[normas_geo.geocodificar] ERRO em {q!r}: {e} -- deixando sem coordenada.")
            achado = None
        cache[q] = achado
        if (i + 1) % 25 == 0 or i == len(pendentes) - 1:
            _salvar_cache(cache)  # salva em lotes: uma queda no meio não perde tudo
            print(f"[normas_geo.geocodificar] {i + 1}/{len(pendentes)} buscadas.")
        if i < len(pendentes) - 1:
            time.sleep(_PAUSA_ENTRE_REQ)

    _salvar_cache(cache)
    for q in queries:
        resultado[q] = cache.get(q)
    return resultado


def rodar() -> None:
    conn = conectar()
    with conn.cursor() as cur:
        cur.execute(
            "select distinct query_geocodificacao from atos_oficiais_geo where lat is null"
        )
        queries = [r["query_geocodificacao"] for r in cur.fetchall()]

    if not queries:
        print("[normas_geo.geocodificar] nada pendente -- todas as linhas já têm lat/lng ou já falharam antes.")
        return

    cache = _carregar_cache()
    resolvidas = geocodificar_distintas(queries, cache)

    achados = sum(1 for v in resolvidas.values() if v)
    print(f"[normas_geo.geocodificar] {achados}/{len(queries)} consultas encontraram um ponto.")

    conn = conectar()
    with conn.cursor() as cur:
        for q, achado in resolvidas.items():
            if not achado:
                continue
            cur.execute(
                """
                update atos_oficiais_geo
                   set lat = %s, lng = %s, geocodificado_em = now()
                 where query_geocodificacao = %s and lat is null
                """,
                (achado["lat"], achado["lng"], q),
            )

    with conn.cursor() as cur:
        cur.execute("select count(*) as c from atos_oficiais_geo where lat is not null")
        total_com_ponto = cur.fetchone()["c"]
        cur.execute("select count(*) as c from atos_oficiais_geo")
        total = cur.fetchone()["c"]
    print(f"[normas_geo.geocodificar] atos_oficiais_geo: {total_com_ponto}/{total} linhas com lat/lng.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.parse_args()
    try:
        rodar()
    except Exception as e:  # noqa: BLE001
        print(f"[normas_geo.geocodificar] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
