#!/usr/bin/env python3
"""Monta o projeto QGIS da Oficina de Cavas via PyQGIS.

Por que PyQGIS e nao XML mao: o .qgs e XML interno do QGIS, cheio de
campos obrigatorios (extent, srs, renderer-v2 aninhado). Montar a mao
gerou basemap branco (medido 14/10). Com o PyQGIS o QGIS monta o
projeto dele, do jeito que ele espera.

Uso (com o python do QGIS):
  "C:\\Program Files\\QGIS 3.44.15\\bin\\python.exe" scripts/oficina-cavas/gerar-projeto-qgis-pyqgis.py
"""

from __future__ import annotations

import sys
from pathlib import Path

# PyQGIS so existe dentro do python do QGIS.
from qgis.core import (  # noqa: E402
    QgsApplication,
    QgsCoordinateReferenceSystem,
    QgsFillSymbol,
    QgsMarkerSymbol,
    QgsProject,
    QgsRasterLayer,
    QgsSingleSymbolRenderer,
    QgsVectorLayer,
)

_RAIZ = Path(__file__).resolve().parents[2]
_CACHE = _RAIZ / "scripts" / ".cache" / "cavas-calibracao"
_SAIDA = _CACHE / "qgis"


def _estilizar_cenas(layer: QgsVectorLayer) -> None:
    """Cenas CBERS: contorno azul, SEM preenchimento — o basemap fica visivel.

    O defeito medido 14/10: preenchimento verde opaco cobria o OSM inteiro.
    """
    simb = QgsFillSymbol.createSimple({
        "color": "0,0,255,0",       # alpha 0 = invisivel
        "outline_color": "0,80,200,160",
        "outline_width": "0.4",
        "style": "no",
    })
    layer.setRenderer(QgsSingleSymbolRenderer(simb))


def _estilizar_ibama(layer: QgsVectorLayer) -> None:
    """Autuados IBAMA: triangulo vermelho, transparente no centro."""
    simb = QgsMarkerSymbol.createSimple({
        "name": "triangle",
        "color": "220,20,60,140",
        "outline_color": "150,0,40,200",
        "outline_width": "0.3",
        "size": "3",
    })
    layer.setRenderer(QgsSingleSymbolRenderer(simb))


def _estilizar_recortes(layer: QgsVectorLayer) -> None:
    """Recortes: circulo verde-escuro uniforme.

    O score_cava fica no painel de atributos; filtrar la e mais
    simples que montar renderer graduado no PyQGIS (medido 14/10:
    QgsGradientColorRamp nao aceita string direto no construtor).
    """
    simb = QgsMarkerSymbol.createSimple({
        "name": "circle",
        "color": "34,139,34,180",   # verde escuro
        "outline_color": "0,80,0,200",
        "outline_width": "0.2",
        "size": "2",
    })
    layer.setRenderer(QgsSingleSymbolRenderer(simb))


def _estilizar_score(layer: QgsVectorLayer) -> None:
    """Recortes com score_cava: categorizado por faixa.

    Verde = alta confianca (>=0.65), amarelo = incerto (0.45-0.65),
    vermelho = baixa (<0.45). Cor por categoria e mais simples que
    renderer graduado no PyQGIS 3.44.
    """
    from qgis.core import (
        QgsCategorizedSymbolRenderer,
        QgsRendererCategory,
    )
    categories = [
        QgsRendererCategory(
            "positivo-alta", QgsMarkerSymbol.createSimple({
                "name": "circle", "color": "34,139,34,200",
                "outline_color": "0,80,0,220", "outline_width": "0.3", "size": "2.5",
            }), "Alta confianca (>=0.65)"),
        QgsRendererCategory(
            "incerto", QgsMarkerSymbol.createSimple({
                "name": "circle", "color": "255,193,7,200",
                "outline_color": "180,130,0,220", "outline_width": "0.3", "size": "2",
            }), "Incerto (0.45-0.65)"),
        QgsRendererCategory(
            "negativo-baixa", QgsMarkerSymbol.createSimple({
                "name": "circle", "color": "211,47,47,160",
                "outline_color": "150,0,0,200", "outline_width": "0.2", "size": "1.5",
            }), "Baixa (<0.45)"),
    ]
    rend = QgsCategorizedSymbolRenderer("faixa_score", categories)
    layer.setRenderer(rend)


_ESTILOS = {
    "Cenas CBERS-4A": _estilizar_cenas,
    "Autuados IBAMA MG": _estilizar_ibama,
    "Recortes score": _estilizar_score,
}


def _carregar_basemaps(projeto: QgsProject) -> None:
    """Carrega OSM (ruas, embaixo) e Esri World Imagery (satélite, por cima).

    Ordem importa: OSM primeiro, Esri depois — o Esri fica por cima e
    não deixa o OSM cobrir o satélite (medido 14/10: OSM por cima
    'flashing' sobre o Esri).
    """
    crs_3857 = QgsCoordinateReferenceSystem("EPSG:3857")

    url_osm = "type=xyz&url=https://tile.openstreetmap.org/{z}/{x}/{y}.png&zmin=0&zmax=19"
    basemap = QgsRasterLayer(url_osm, "Ruas OSM", "wms")
    if basemap.isValid():
        basemap.setCrs(crs_3857)
        projeto.addMapLayer(basemap)
        print("ruas OSM: OK")

    url_sat = ("type=xyz&url=https://server.arcgisonline.com/ArcGIS/rest/"
               "services/World_Imagery/MapServer/tile/{z}/{y}/{x}&zmin=0&zmax=19")
    satelite = QgsRasterLayer(url_sat, "Satélite (Esri)", "wms")
    if satelite.isValid():
        satelite.setCrs(crs_3857)
        projeto.addMapLayer(satelite)
        print("satélite Esri: OK")
    else:
        print("satélite Esri: FALHOU (rede?)")


def _carregar_vetores(projeto: QgsProject) -> None:
    """Carrega os GeoJSONs gerados, aplicando o estilo de cada um."""
    camadas = [
        (_SAIDA / "cenas-cbers.geojson", "Cenas CBERS-4A"),
        (_SAIDA / "positivos-ibama.geojson", "Autuados IBAMA MG"),
        (_SAIDA / "recortes-score.geojson", "Recortes score"),
    ]
    for caminho, nome in camadas:
        if not caminho.exists():
            print(f"{nome}: arquivo nao encontrado; pulando")
            continue
        uri = f"{caminho}|layername={caminho.stem}"
        layer = QgsVectorLayer(uri, nome, "ogr")
        if not layer.isValid():
            layer = QgsVectorLayer(str(caminho), nome, "ogr")
        if not layer.isValid():
            print(f"{nome}: FALHOU ao carregar")
            continue
        estilo = _ESTILOS.get(nome)
        if estilo:
            estilo(layer)
        projeto.addMapLayer(layer)
        print(f"{nome}: OK ({layer.featureCount()} feats)")


def _carregar_vrt(projeto: QgsProject) -> None:
    """Carrega o VRT dos 5.133 recortes CBERS com visibilidade por escala.

    Aparece so quando o dono aproxima o zoom (escala max 1:50000),
    igual ao site que carrega a camada conforme o zoom.
    """
    vrt = _SAIDA / "recortes-cbers.vrt"
    if not vrt.exists():
        print("VRT CBERS: nao encontrado")
        return
    r_vrt = QgsRasterLayer(str(vrt), "CBERS recortes (foto)", "gdal")
    if not r_vrt.isValid():
        print("VRT CBERS: FALHOU ao carregar")
        return
    r_vrt.setScaleBasedVisibility(True)
    r_vrt.setMaximumScale(50000)
    projeto.addMapLayer(r_vrt)
    print(f"VRT CBERS: OK ({r_vrt.width()}x{r_vrt.height()} px)")


def main() -> int:
    qgs_prefix = r"C:\Program Files\QGIS 3.44.15"
    QgsApplication.setPrefixPath(qgs_prefix, True)
    app = QgsApplication([], False)
    app.initQgis()

    projeto = QgsProject.instance()
    # EPSG:3857 (Web Mercator) e o padrao de tiles XYZ (Esri, OSM).
    # Recortes CBERS em 4326 sao reprojetados on-the-fly pelo QGIS.
    projeto.setCrs(QgsCoordinateReferenceSystem("EPSG:3857"))

    _carregar_basemaps(projeto)
    _carregar_vetores(projeto)
    _carregar_vrt(projeto)

    projeto.writeEntry("SpatialRefSys", "/ProjectionsEnabled", 1)
    destino = _SAIDA / "oficina-cavas.qgs"
    ok = projeto.write(str(destino))
    print(f"projeto salvo: {ok} -> {destino}")
    app.exitQgis()
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
