# -*- coding: utf-8 -*-
"""Gera os 4 GeoJSONs de recorte territorial do globo (Brasil, MG, Curvelo, Sudeste)
a partir das malhas baixadas. Simplifica com shapely para ficarem leves no WebGL.

As saídas SÃO versionadas — as malhas de entrada não. Para regerar, baixe antes
os dois arquivos abaixo para o diretório de entrada (variável de ambiente
RECORTES_IN, padrão %TEMP%):

    br-ufs.geojson   malha de UFs do Brasil (origem usada: click_that_hood).
                     Requisito: cada feição com propriedade "sigla" (ex.: "MG").
    mg-muns.geojson  malha de municípios de MG (origem usada: tbrugz/geodata-br,
                     equivalente IBGE). Requisito: propriedade "id" ou "codarea"
                     com o geocódigo (Curvelo = 3120904) e "name" ou "nome".

Rodar: backend/.venv/Scripts/python.exe backend/static/globe/data/gerar_recortes.py
"""
import json
import os
from pathlib import Path
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

# Entrada fica fora do repo (malhas brutas, dezenas de MB); saída é aqui do lado.
TMP = Path(os.environ.get("RECORTES_IN") or os.environ.get("TEMP") or ".")
OUT = Path(__file__).resolve().parent
OUT.mkdir(parents=True, exist_ok=True)

ufs = json.load(open(TMP / "br-ufs.geojson", encoding="utf-8"))
muns = json.load(open(TMP / "mg-muns.geojson", encoding="utf-8"))

geom_uf = {f["properties"]["sigla"]: shape(f["geometry"]) for f in ufs["features"]}

def save(nome, geom, tol=0.005, props=None):
    g = geom.simplify(tol, preserve_topology=True)
    fc = {"type": "FeatureCollection", "features": [
        {"type": "Feature", "properties": props or {}, "geometry": mapping(g)}]}
    p = OUT / f"{nome}.geojson"
    p.write_text(json.dumps(fc, ensure_ascii=False), encoding="utf-8")
    print(f"{nome}: {p.stat().st_size/1024:.0f} KB")

# Brasil: dissolve de todas as UFs
save("brasil", unary_union(list(geom_uf.values())), tol=0.01, props={"nome": "Brasil"})
# Minas Gerais
save("mg", geom_uf["MG"], props={"nome": "Minas Gerais", "uf": "MG"})
# Sudeste: dissolve SP+RJ+MG+ES
save("sudeste", unary_union([geom_uf[u] for u in ("SP", "RJ", "MG", "ES")]), tol=0.008, props={"nome": "Sudeste"})
# Curvelo: procurar pelo código IBGE 3120904
curv = None
for f in muns["features"]:
    props = f["properties"]
    if str(props.get("id") or props.get("codarea") or "") == "3120904":
        curv = shape(f["geometry"]); nome = props.get("name") or props.get("nome"); break
assert curv is not None, "Curvelo (3120904) não encontrado na malha de municípios MG"
save("curvelo", curv, tol=0.001, props={"nome": nome, "geocodigo": "3120904"})
