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
    QgsProject,
    QgsRasterLayer,
    QgsVectorLayer,
)

_RAIZ = Path(__file__).resolve().parents[2]
_CACHE = _RAIZ / "scripts" / ".cache" / "cavas-calibracao"
_SAIDA = _CACHE / "qgis"


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

    # ─── 2. Camadas vetoriais dos GeoJSONs ────────────────────────────────
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
            # Fallback sem layername (GeoJSON simples)
            layer = QgsVectorLayer(str(caminho), nome, "ogr")
        if layer.isValid():
            projeto.addMapLayer(layer)
            print(f"{nome}: OK ({layer.featureCount()} feats)")
        else:
            print(f"{nome}: FALHOU ao carregar")

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
