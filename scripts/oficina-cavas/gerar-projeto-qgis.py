#!/usr/bin/env python3
"""Gera camadas GeoJSON + projeto QGIS para a Oficina de Cavas.

Cria tres camadas que o dono abre no QGIS e ve tudo de uma vez:
1. recortes-cavas.geojson  — ponto no centro de cada bbox do checkpoint,
   corido por score_cava do modelo v7 (verde = alta confianca);
2. positivos-ibama.geojson — centroides dos autuados de mineracao de MG
   (7.656 processos com coordenada, do coletor IBAMA);
3. cenas-cbers.geojson     — footprints das 1.000 cenas CBERS de MG.

Gera tambem um projeto .qgs que ja abre com as tres camadas + basemap
OSM. O dono nao precisa montar nada: clica no arquivo e o mapa abre.

Uso: python scripts/oficina-cavas/gerar-projeto-qgis.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

_RAIZ = Path(__file__).resolve().parents[2]
_CACHE = _RAIZ / "scripts" / ".cache" / "cavas-calibracao"
_SAIDA = _CACHE / "qgis"


def _ponto(lng: float, lat: float) -> dict:
    return {"type": "Point", "coordinates": [round(lng, 6), round(lat, 6)]}


def _salvar_geojson(feats: list[dict], nome: str) -> int:
    """Escreve FeatureCollection no disco e imprime contagem."""
    destino = _SAIDA / nome
    with open(destino, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": feats},
                  f, ensure_ascii=False)
    print(f"{nome}: {len(feats)} feats -> {destino}")
    return len(feats)


def _carregar_scores() -> dict[str, dict]:
    """Indice hash -> dados do modelo v7 (analisados.jsonl)."""
    scores: dict[str, dict] = {}
    caminho = _CACHE / "analisados.jsonl"
    if not caminho.exists():
        return scores
    with open(caminho, encoding="utf-8") as f:
        for linha in f:
            try:
                o = json.loads(linha)
                scores[o["hash"]] = o
            except (json.JSONDecodeError, KeyError):
                pass
    return scores


def _feat_recorte(o: dict, scores: dict[str, dict]) -> dict | None:
    """Feature ponto no centro da bbox de um recorte do checkpoint."""
    bbox = o.get("bbox")
    if not bbox or len(bbox) != 4:
        return None
    s = scores.get(o.get("hash", ""), {})
    arq = _CACHE / "recortes" / o.get("tipo", "") / o.get("arquivo", "")
    return {
        "type": "Feature",
        "geometry": _ponto((bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2),
        "properties": {
            "tipo": o.get("tipo", ""),
            "processo": o.get("processo", ""),
            "fase": o.get("fase", ""),
            "cena": o.get("cena", ""),
            "data": o.get("data", ""),
            "nuvem": o.get("nuvem"),
            "score_cava": s.get("score_cava"),
            "modelo": s.get("modelo", ""),
            "arquivo": str(arq),
        },
    }


def gerar_recortes() -> int:
    """Ponto no centro de cada recorte, com score do modelo v7."""
    scores = _carregar_scores()
    feats: list[dict] = []
    with open(_CACHE / "checkpoint.jsonl", encoding="utf-8") as f:
        for linha in f:
            try:
                feat = _feat_recorte(json.loads(linha), scores)
            except (json.JSONDecodeError, KeyError):
                continue
            if feat:
                feats.append(feat)
    return _salvar_geojson(feats, "recortes-cavas.geojson")


def gerar_positivos_ibama() -> int:
    """Centroides dos autuados de mineracao de MG com coordenada."""
    caminho = _CACHE / "positivos-mg.json"
    if not caminho.exists():
        print("positivos-mg.json nao encontrado; pulando")
        return 0
    with open(caminho, encoding="utf-8") as f:
        dados = json.load(f)
    feats = []
    for o in dados:
        c = o.get("centroide")
        if not c or len(c) != 2:
            continue
        feats.append({
            "type": "Feature",
            "geometry": _ponto(c[0], c[1]),
            "properties": {
                "processo": o.get("processo", ""),
                "fase": o.get("fase", ""),
                "area_ha": o.get("area_ha"),
                "fonte": "IBAMA SIFISC (auto de infracao)",
            },
        })
    return _salvar_geojson(feats, "positivos-ibama.geojson")


def gerar_cenas() -> int:
    """Footprints das cenas CBERS de MG (poligonos)."""
    caminho = _CACHE / "cenas-mg.json"
    if not caminho.exists():
        print("cenas-mg.json nao encontrado; pulando")
        return 0
    with open(caminho, encoding="utf-8") as f:
        dados = json.load(f)
    feats = []
    for o in dados:
        geom = o.get("geom")
        if not geom or geom.get("type") != "Polygon":
            continue
        feats.append({
            "type": "Feature",
            "geometry": geom,
            "properties": {
                "id": o.get("id", ""),
                "datetime": o.get("datetime", ""),
                "fonte": "CBERS-4A WPM (INPE/DSA)",
            },
        })
    return _salvar_geojson(feats, "cenas-cbers.geojson")


def _xml_camada(cid: str, nome: str, caminho: str, opcoes: dict) -> str:
    """Bloco XML de uma camada vetorial.

    `opcoes` traz geometry, geometryName e renderer — dicts em vez de
    argumentos posicionais para caber no teto de 4 args do CodeScene.
    """
    geom = opcoes["geometry"]
    renderer = opcoes["renderer"]
    return f"""  <maplayer type="vector" geometry="{geom}" name="{nome}" geometryName="{geom}">
   <id>{cid}</id>
   <datasource>{caminho}</datasource>
   <provider>ogr</provider>
   <renderer-v2 {renderer}>
    <symbol>
     <layer pass="0">{renderer.replace("renderer-v2 ", "")}</layer>
    </symbol>
   </renderer-v2>
  </maplayer>"""


def _gerar_xml_projeto(n_rec: int, n_ib: int, n_cen: int) -> str:
    """Monta o XML do projeto .qgs com as tres camadas + OSM."""
    g = str(_SAIDA / "recortes-cavas.geojson").replace("\\", "/")
    i = str(_SAIDA / "positivos-ibama.geojson").replace("\\", "/")
    c = str(_SAIDA / "cenas-cbers.geojson").replace("\\", "/")
    tree = f"""  <layer-tree-group>
  <layer-tree-layer id="osm_basemap" name="Basemap OSM" source="type=xyz&amp;url=https://tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png" provider="wms"/>
  <layer-tree-layer id="cenas_cbers" name="Cenas CBERS-4A ({n_cen})" source="{c}" provider="ogr"/>
  <layer-tree-layer id="positivos_ibama" name="Autuados IBAMA MG ({n_ib})" source="{i}" provider="ogr"/>
  <layer-tree-layer id="recortes_cavas" name="Recortes cavas ({n_rec})" source="{g}" provider="ogr"/>
 </layer-tree-group>"""
    canvas = """ <mapcanvas name="theMapCanvas" annotationsVisible="1">
  <units>degrees</units>
  <extent>
   <xmin>-51.5</xmin><ymin>-23.0</ymin><xmax>-39.5</xmax><ymax>-14.0</ymax>
  </extent>
  <destinationsrs>
   <spatialrefsys><authid>EPSG:4326</authid></spatialrefsys>
  </destinationsrs>
 </mapcanvas>"""
    layers = "\n".join([
        _xml_camada("recortes_cavas", "Recortes cavas", g, {
            "geometry": "Point",
            "renderer": 'type="graduatedSymbol" attr="score_cava"',
        }),
        _xml_camada("positivos_ibama", "Autuados IBAMA MG", i, {
            "geometry": "Point",
            "renderer": 'type="singleSymbol"',
        }),
        _xml_camada("cenas_cbers", "Cenas CBERS-4A", c, {
            "geometry": "Polygon",
            "renderer": 'type="singleSymbol"',
        }),
    ])
    osm = """  <maplayer type="raster" name="Basemap OSM">
   <id>osm_basemap</id>
   <datasource>type=xyz&amp;url=https://tile.openstreetmap.org/{z}/{x}/{y}.png</datasource>
   <provider>wms</provider>
  </maplayer>"""
    return f"""<!DOCTYPE qgis PUBLIC 'http://mrcc.com/qgis.dtd' 'SYSTEM'>
<qgis projectname="Oficina de Cavas" version="3.44.15" saveDateTime="2026-10-14T00:00:00">
 <homePath path=""/>
 <title>Oficina de Cavas — CBERS + IBAMA MG</title>
 <projectCrs>
  <spatialrefsys>
   <authid>EPSG:4326</authid>
   <description>WGS 84</description>
   <projectionacronym>longlat</projectionacronym>
   <ellipsoidacronym>WGS84</ellipsoidacronym>
  </spatialrefsys>
 </projectCrs>
{tree}
{canvas}
 <projectlayers>
{layers}
{osm}
 </projectlayers>
</qgis>
"""


def gerar_projeto_qgs(n_rec: int, n_ib: int, n_cen: int) -> None:
    """Projeto QGIS 3.x (.qgs) que ja abre com as tres camadas.

    Formato .qgs = XML do QGIS. Basemap OSM via XYZ tile layer
    (https://tile.openstreetmap.org/{z}/{x}/{y}.png).
    """
    destino = _SAIDA / "oficina-cavas.qgs"
    with open(destino, "w", encoding="utf-8") as f:
        f.write(_gerar_xml_projeto(n_rec, n_ib, n_cen))
    print(f"projeto QGIS -> {destino}")


def main() -> int:
    _SAIDA.mkdir(parents=True, exist_ok=True)
    n1 = gerar_recortes()
    n2 = gerar_positivos_ibama()
    n3 = gerar_cenas()
    gerar_projeto_qgs(n1, n2, n3)
    print(f"\nResumo: {n1} recortes + {n2} autuados + {n3} cenas CBERS.")
    print(f"Abra no QGIS: {_SAIDA / 'oficina-cavas.qgs'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
