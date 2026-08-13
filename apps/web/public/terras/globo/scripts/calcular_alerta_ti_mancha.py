#!/usr/bin/env python3
r"""calcular_alerta_ti_mancha.py — cruza as 16 Terras Indígenas de MG (FUNAI)
com as 156 manchas de inundação de barragem (FEAM) e grava
dados/camadas/alerta-ti-mancha.geojson: só as INTERSEÇÕES DE VERDADE, uma
feição por par (TI, barragem) que realmente se toca.

POR QUE ESTE SCRIPT EXISTE (docs/FONTES-TERRITORIO-E-MINERACAO.md, seções 1 e
4). O documento de pesquisa já apontava um resultado usando filtro BBOX (a
caixa da TI Aldeia Katurama cruzando 6 manchas), com o aviso explícito de que
BBOX não é interseção de polígono: "antes de virar alerta publicado tem que
rodar ST_Intersects de verdade". Este script faz essa conta de verdade, com
`shapely.intersects()`/`intersection()` sobre a geometria completa (não a
versão simplificada que dados/camadas/mancha-inundacao-barragens.geojson
publica para desenho no globo — simplificação muda a borda o suficiente para
mudar a resposta de sim/não perto da fronteira, e um alerta jurídico não pode
depender de uma forma desenhada para caber na tela).

Requer que scripts/ingerir_funai_terras_indigenas.py e
scripts/ingerir_feam_zas_mancha.py já tenham rodado — o segundo deixa a
geometria BRUTA da mancha de inundação em cache
(scripts/.tmp-ingest/mancha.json); se não estiver lá, este script baixa de
novo (mesma fonte, ~600 MB, ver a nota no outro script sobre o motivo do
tamanho).

═══ O QUE ENTRA NA SAÍDA ═══

Uma feição por par (TI, barragem) cuja geometria REALMENTE se sobrepõe —
`intersects()`, não bbox. A geometria da feição é a INTERSEÇÃO recortada (não
a TI inteira nem a mancha inteira): mostra exatamente qual pedaço da terra
está dentro do alcance da onda. Cada feição carrega os dois lados do alerta:
de quem é a terra e de qual barragem vem o risco.

Pré-filtro por bounding box antes do `intersects()` de verdade — 16 × 156 =
2.496 pares, e a maioria nem chega perto: o bbox descarta em O(1) o que
`intersects()` gastaria segundos para descartar.

═══ RESULTADO MEDIDO em 13/08/2026, RODADO de verdade ═══

ZERO interseções reais nas 2.496 combinações. O documento de pesquisa achou 6
barragens cruzando a CAIXA (bbox) da TI Aldeia Katurama e avisou, com todas as
letras, que bbox não é interseção de polígono — rodada a conta de verdade
(este script), era isso mesmo: falso positivo de bbox. Conferido por medição
direta (`Polygon.distance()`, não só o booleano de `intersects()`): a mancha
mais próxima de Katurama fica a ~2,3 km; as 6 que bateram a caixa ficam entre
~450 m e ~650 m da borda da TI — perto, mas do lado de fora.

Isto NÃO significa que a camada é dispensável. "Nenhuma TI de MG está hoje
dentro de mancha publicada" é a resposta à pergunta que este script existe
para fazer — e só é uma resposta confiável porque a conta rodou de verdade em
vez de ficar no bbox. Ver config.js (`vazia: true` na camada `alerta-ti-mancha`,
com a ressalva de que ausência de mancha publicada para 103 das 259 barragens
de MG significa que "zero hoje" não é "seguro para sempre").

⚠️ CUSTO MEDIDO: esta rodada levou ~21 minutos de CPU. A causa não é o
pré-filtro bbox (que já descarta a maioria em O(1)) — é que as manchas que
SOBREVIVEM ao bbox (perto o bastante para valer a pena checar) são
multipolígonos de malha hidráulica com até dezenas de milhares de vértices, e
`intersects()`/`intersection()` do GEOS sobre geometria complexa não é
instantâneo. Rodar de novo com os arquivos já em cache
(scripts/.tmp-ingest/mancha.json) pula o download (~600 MB, ~80s) mas não
pula esta parte.

Uso:
    python scripts/calcular_alerta_ti_mancha.py
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

from shapely.geometry import mapping, shape
from shapely.validation import make_valid

LOG = "[calcular_alerta_ti_mancha]"

DIR_GLOBO = Path(__file__).resolve().parent.parent
DIR_CAMADAS = DIR_GLOBO / "dados" / "camadas"
DIR_TMP = DIR_GLOBO / "scripts" / ".tmp-ingest"

TI_PATH = DIR_CAMADAS / "terras-indigenas.geojson"
MANCHA_BRUTA_PATH = DIR_TMP / "mancha.json"
SAIDA_PATH = DIR_CAMADAS / "alerta-ti-mancha.geojson"

# Mesma tolerância da camada visual de mancha (ver ingerir_feam_zas_mancha.py)
# — a INTERSEÇÃO calculada usa geometria bruta, mas a feição gravada para
# desenho no globo é simplificada com a mesma régua das outras camadas deste
# lote, por consistência visual e de tamanho de arquivo.
TOLERANCIA_GRAUS = 0.0002


def _carregar_ti() -> list[dict]:
    with open(TI_PATH, encoding="utf-8") as f:
        d = json.load(f)
    return d["features"]


def _carregar_manchas_brutas() -> list[dict]:
    if not MANCHA_BRUTA_PATH.exists():
        print(f"{LOG} {MANCHA_BRUTA_PATH} não está em cache — baixando de novo "
              f"(mesma fonte do ingerir_feam_zas_mancha.py, ~600 MB)...")
        import shutil
        import urllib.request
        DIR_TMP.mkdir(parents=True, exist_ok=True)
        url = ("https://geoserver.meioambiente.mg.gov.br/IDE/ows?service=WFS&version=1.0.0"
               "&request=GetFeature&typeName=IDE:ide_1903_mg_mancha_inundacao_pae_pol"
               "&outputFormat=application/json")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; ControlePopular/1.0)"})
        with urllib.request.urlopen(req, timeout=600) as resp, open(MANCHA_BRUTA_PATH, "wb") as f:
            shutil.copyfileobj(resp, f, length=1024 * 1024)
    with open(MANCHA_BRUTA_PATH, encoding="utf-8") as f:
        d = json.load(f)
    return d["features"]


def _area_ha(poligono) -> float:
    """Área aproximada em hectares de uma geometria em graus (SIRGAS 2000 ~
    WGS84). 1° de latitude ~= 111.320 m em qualquer lugar; 1° de longitude
    encolhe por cos(latitude) — em MG (~20°S) isso é ~6% de diferença, o
    bastante para não arredondar a zero na conta de uma interseção pequena.
    Usa a latitude do centróide da própria interseção, não uma constante: é
    aproximação de mapa (não geodésica de verdade), suficiente para o número
    que acompanha um alerta, não para um laudo."""
    lat_media = poligono.centroid.y
    m_por_grau_lat = 111_320.0
    m_por_grau_lon = 111_320.0 * math.cos(math.radians(lat_media))
    return poligono.area * m_por_grau_lat * m_por_grau_lon / 10_000


def _geom_valida(geo_interface: dict):
    g = shape(geo_interface)
    if not g.is_valid:
        # A malha de simulação hidráulica já produziu polígono geometricamente
        # inválido antes (auto-interseção entre partes vizinhas) — `make_valid`
        # é o reparo padrão do GEOS/shapely; sem ele, `intersects()` levanta
        # `TopologicalError` e o script pararia no primeiro polígono torto.
        g = make_valid(g)
    return g


def main() -> None:
    if not TI_PATH.exists():
        print(f"{LOG} ERRO: {TI_PATH} não existe — rode "
              f"scripts/ingerir_funai_terras_indigenas.py primeiro.", file=sys.stderr)
        sys.exit(1)

    tis = _carregar_ti()
    manchas = _carregar_manchas_brutas()
    print(f"{LOG} {len(tis)} terras indígenas × {len(manchas)} manchas de inundação "
          f"= {len(tis) * len(manchas)} pares a checar.")

    # Pré-computa geometria + bbox de cada mancha uma vez só (reusado para as
    # 16 TIs, não recalculado por par).
    manchas_prontas = []
    for m in manchas:
        props = m.get("properties") or {}
        geom = m.get("geometry")
        if geom is None:
            continue
        try:
            g = _geom_valida(geom)
        except Exception as e:  # noqa: BLE001 — geometria de origem pode vir torta; não paramos o lote por uma
            print(f"{LOG} AVISO: mancha '{props.get('estrutura')}' com geometria inválida mesmo após reparo: {e}")
            continue
        if g.is_empty:
            continue
        manchas_prontas.append((props, g, g.bounds))

    achados = []
    for ti in tis:
        ti_props = ti.get("properties") or {}
        ti_geom = ti.get("geometry")
        if ti_geom is None:
            continue
        g_ti = _geom_valida(ti_geom)
        if g_ti.is_empty:
            continue
        bx = g_ti.bounds  # (minx, miny, maxx, maxy)

        for props_m, g_m, bm in manchas_prontas:
            # Pré-filtro bbox: descarta o par sem pagar o custo de intersects()
            # numa mancha que pode ter dezenas de milhares de vértices.
            if bx[2] < bm[0] or bm[2] < bx[0] or bx[3] < bm[1] or bm[3] < bx[1]:
                continue
            if not g_ti.intersects(g_m):
                continue

            inter = g_ti.intersection(g_m)
            if inter.is_empty or inter.area == 0:
                # Bbox bateu e `intersects()` disse que sim (podem se tocar só
                # na borda, área de interseção zero) — não é sobreposição real
                # de área, não vira alerta.
                continue

            inter_simpl = inter.simplify(TOLERANCIA_GRAUS, preserve_topology=True)
            if inter_simpl.is_empty:
                inter_simpl = inter

            achados.append({
                "type": "Feature",
                "properties": {
                    "ti_nome": ti_props.get("nome"),
                    "ti_etnia": ti_props.get("etnia_nome"),
                    "ti_fase": ti_props.get("fase_ti"),
                    "ti_municipio": ti_props.get("municipio_nome"),
                    "barragem": props_m.get("estrutura"),
                    "empreendedor": props_m.get("empreended"),
                    "municipio_barragem": props_m.get("municipio"),
                    "status_pae": props_m.get("status_pae"),
                    "area_intersecao_ha": round(_area_ha(inter), 2),
                },
                "geometry": mapping(inter_simpl),
            })
            print(f"{LOG} ALERTA: {ti_props.get('nome')} ({ti_props.get('fase_ti')}) "
                  f"× {props_m.get('estrutura')} ({props_m.get('empreended')}, "
                  f"{props_m.get('municipio')})")

    print(f"{LOG} {len(achados)} interseção(ões) real(is) encontrada(s), "
          f"de {len(tis)} TIs × {len(manchas_prontas)} manchas válidas.")

    saida = {
        "type": "FeatureCollection",
        "name": "alerta-ti-mancha",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": achados,
    }
    with open(SAIDA_PATH, "w", encoding="utf-8") as fh:
        json.dump(saida, fh, ensure_ascii=False, separators=(",", ": "))
    print(f"{LOG} gravado em {SAIDA_PATH} ({SAIDA_PATH.stat().st_size:,} bytes).")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001
        print(f"{LOG} ERRO: {e}", file=sys.stderr)
        raise
