"""etl.apis.osm_comercios — sync supermercados e farmácias de Betim
(OpenStreetMap/Overpass) into `comercios_essenciais`. Pedido do usuário
2026-07-24: "cadastre já supermercados e farmácias... publicidade
gratuita e informação pública relevante".

Fonte: Overpass API (`shop=supermarket` + `amenity=pharmacy`), pública e
sem cota -- ao contrário do CNPJ da Receita Federal via Base dos Dados
(`br_me_cnpj.estabelecimentos`), que teria endereço/telefone oficiais
melhores mas é uma tabela histórica gigante (Brasil inteiro, vários
meses) que estoura a cota gratuita do BigQuery com um filtro só por
município -- fica de backlog migrar pra ela quando a cota permitir.

ACHADO IMPORTANTE sobre qualidade do dado: uma busca ingênua por raio a
partir do centro de Betim traz estabelecimentos de cidades VIZINHAS
(Contagem, Ibirité, Igarapé, Brumadinho, Belo Horizonte -- Betim faz
divisa com várias). A tag `addr:city` do OSM também não é confiável
sozinha: um resultado com `addr:suburb=Centro` ("Droga Norte") tinha
coordenadas reais a ~13km do centro de Betim, fora do polígono
municipal -- provável erro de cadastro de quem editou o OSM. Por isso
este módulo faz um teste geométrico de verdade (ponto dentro do
polígono administrativo real de Betim, via Nominatim/relation 368812),
não só filtro por texto.

Cobertura real (crowdsourced, incompleta): 27 estabelecimentos
confirmados dentro do polígono de Betim, de ~106 candidatos brutos
somando 3 buscas por raio diferentes.
"""
import argparse
import sys
import time
import unicodedata

import requests

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/lookup"
BETIM_RELATION_ID = "R368812"
USER_AGENT = "ControlePopularBetim/1.0 (contato via github.com/FinweeJur/betim-ai)"

# Raio a partir do centro de Betim (CITY_LAT/CITY_LNG) -- usado só pra
# achar CANDIDATOS; o filtro de verdade é geométrico (polígono real).
CENTRO_LAT, CENTRO_LNG = -19.9681, -44.1983
RAIOS_METROS = [15000, 20000]

CNAE_TIPO = {"supermarket": "supermercado", "pharmacy": "farmacia"}


def _overpass_query(lat: float, lng: float, raio: int) -> list[dict]:
    query = f"""
[out:json][timeout:40];
(
  node["shop"="supermarket"](around:{raio},{lat},{lng});
  node["amenity"="pharmacy"](around:{raio},{lat},{lng});
);
out body;
"""
    headers = {"User-Agent": USER_AGENT}
    for tentativa in range(5):
        try:
            resp = requests.get(OVERPASS_URL, params={"data": query}, headers=headers, timeout=70)
            if resp.status_code == 200:
                return resp.json().get("elements", [])
            print(f"[etl.apis.osm_comercios] Overpass status={resp.status_code}, tentativa {tentativa + 1}/5")
        except requests.RequestException as e:
            print(f"[etl.apis.osm_comercios] Overpass erro: {type(e).__name__}, tentativa {tentativa + 1}/5")
        time.sleep(10)
    return []


def _polygono_municipio() -> list[list[float]]:
    """Anel externo do polígono administrativo real de Betim (lon, lat)."""
    headers = {"User-Agent": USER_AGENT}
    resp = requests.get(
        NOMINATIM_URL,
        params={"osm_ids": BETIM_RELATION_ID, "format": "json", "polygon_geojson": 1},
        headers=headers,
        timeout=30,
    )
    resp.raise_for_status()
    geom = resp.json()[0]["geojson"]
    if geom["type"] == "Polygon":
        return geom["coordinates"][0]
    # MultiPolygon: usa o maior anel (município sem exclave relevante aqui)
    aneis = [poly[0] for poly in geom["coordinates"]]
    return max(aneis, key=len)


def _ponto_dentro(lon: float, lat: float, anel: list[list[float]]) -> bool:
    """Ray casting -- ponto dentro de um polígono simples (sem buracos)."""
    dentro = False
    n = len(anel)
    j = n - 1
    for i in range(n):
        xi, yi = anel[i]
        xj, yj = anel[j]
        if ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-15) + xi
        ):
            dentro = not dentro
        j = i
    return dentro


def _normalizar_telefone(tags: dict) -> str | None:
    return tags.get("phone") or tags.get("contact:phone")


def sync(id_municipio: str) -> None:
    client = get_supabase_client()

    brutos: dict[int, dict] = {}
    for raio in RAIOS_METROS:
        for el in _overpass_query(CENTRO_LAT, CENTRO_LNG, raio):
            brutos[el["id"]] = el
    print(f"[etl.apis.osm_comercios] candidatos_brutos={len(brutos)}")

    anel = _polygono_municipio()

    rows = []
    for el in brutos.values():
        tags = el.get("tags", {})
        nome = tags.get("name")
        lat, lon = el.get("lat"), el.get("lon")
        tipo_osm = tags.get("shop") if tags.get("shop") == "supermarket" else tags.get("amenity")
        if not nome or lat is None or lon is None or tipo_osm not in CNAE_TIPO:
            continue
        if not _ponto_dentro(lon, lat, anel):
            continue

        endereco_partes = [tags.get("addr:street"), tags.get("addr:housenumber")]
        endereco = " ".join(p for p in endereco_partes if p) or None

        rows.append(
            {
                "id_municipio": id_municipio,
                "osm_id": el["id"],
                "nome": nome,
                "tipo": CNAE_TIPO[tipo_osm],
                "bairro": tags.get("addr:suburb") or tags.get("addr:neighbourhood"),
                "endereco": endereco,
                "telefone": _normalizar_telefone(tags),
                "lat": lat,
                "lng": lon,
            }
        )

    if rows:
        # Preserva telefone já cadastrado (ex. pesquisado no Google Maps e
        # gravado à mão 2026-07-24) quando o OSM não traz o próprio -- sem
        # isto o upsert sobrescreveria com None a cada rodada, apagando os
        # números confirmados. O OSM ganha se TIVER telefone (dado mais
        # fresco da fonte); só o vazio é que cede pro que já existe.
        osm_ids = [str(r["osm_id"]) for r in rows]
        resp = (
            client.table("comercios_essenciais")
            .select("osm_id, telefone")
            .eq("id_municipio", id_municipio)
            .in_("osm_id", osm_ids)
            .execute()
        )
        existentes = {
            str(e["osm_id"]): e["telefone"] for e in (resp.data or []) if e.get("telefone")
        }
        for r in rows:
            if not r["telefone"] and str(r["osm_id"]) in existentes:
                r["telefone"] = existentes[str(r["osm_id"])]
        client.table("comercios_essenciais").upsert(rows, on_conflict="id_municipio,osm_id").execute()
    print(f"[etl.apis.osm_comercios] confirmados_dentro_do_municipio={len(rows)}")
    supermercados = sum(1 for r in rows if r["tipo"] == "supermercado")
    farmacias = sum(1 for r in rows if r["tipo"] == "farmacia")
    print(f"[etl.apis.osm_comercios] supermercados={supermercados} farmacias={farmacias}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.apis.osm_comercios] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
