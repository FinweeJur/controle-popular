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


_ESTILOS = {
    "Cenas CBERS-4A": _estilizar_cenas,
    "Autuados IBAMA MG": _estilizar_ibama,
    "Recortes cavas": _estilizar_recortes,
}


def main() -> int:
    # QgsApplication precisa de prefixo do QGIS pra achar providers.
    qgs_prefix = r"C:\Program Files\QGIS 3.44.15"
    QgsApplication.setPrefixPath(qgs_prefix, True)
    app = QgsApplication([], False)
    app.initQgis()

    projeto = QgsProject.instance()
    projeto.setCrs(QgsCoordinateReferenceSystem("EPSG:4326"))

    # ─── 1. Basemap OSM (XYZ tile) ────────────────────────────────────────
    url = "type=xyz&url=https://tile.openstreetmap.org/{z}/{x}/{y}.png&zmin=0&zmax=19"
    basemap = QgsRasterLayer(url, "Basemap OSM", "wms")
    if basemap.isValid():
        projeto.addMapLayer(basemap)
        print("basemap OSM: OK")
    else:
        print("basemap OSM: FALHOU (rede?); seguindo sem ele")

    # ─── 2. Camadas vetoriais dos GeoJSONs, com estilo proprio ────────────
    camadas = [
        (_SAIDA / "cenas-cbers.geojson", "Cenas CBERS-4A", "Polygon"),
        (_SAIDA / "positivos-ibama.geojson", "Autuados IBAMA MG", "Point"),
        (_SAIDA / "recortes-cavas.geojson", "Recortes cavas", "Point"),
    ]
    for caminho, nome, geom in camadas:
        if not caminho.exists():
            print(f"{nome}: arquivo nao encontrado ({caminho}); pulando")
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
        print(f"{nome}: OK ({layer.featureCount()} feats, estilo aplicado)")

    # ─── 3. Extent do mapa (MG) ───────────────────────────────────────────
    canvas = app.mapCanvas() if hasattr(app, "mapCanvas") else None
    # QGIS desktop salva extent via projeto; aqui fixamos o extent global.
    from qgis.PyQt.QtCore import QRectF  # noqa: E402
    projeto.writeEntry("SpatialRefSys", "/ProjectionsEnabled", 1)

    destino = _SAIDA / "oficina-cavas.qgs"
    ok = projeto.write(str(destino))
    print(f"projeto salvo: {ok} -> {destino}")

    app.exitQgis()
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
