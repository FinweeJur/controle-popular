#!/usr/bin/env python3
"""
gerar-camadas-mineracao-protegida.py — as camadas da Fase D do
PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md.

O que faz: cruza a mineração detectada por satélite (Monitor da Mineração,
MapBiomas × poligonal ANM/SIGMINE) com as áreas protegidas e grava só os
polígonos cujo CENTROIDE cai dentro de cada uma:

  - `mineracao-em-uc.geojson`        — dentro de unidade de conservação (CNUC);
  - `mineracao-em-quilombo.geojson`  — dentro de território quilombola (INCRA).

Decisão técnica (a mesma da página): sem shapely, o teste é ray casting puro.
O número é PISO, não total — polígono que encosta mas tem centroide fora não
conta. O aviso da camada publica isso.

⚠️ O estado de evidência NÃO vem do modelo nem do mapa: "está dentro de UC" é
cruzamento de camadas oficiais; que seja mineração ilegal é conclusão da
autoridade (AGENTS § 7). A ficha traz a frase fixa.

Uso: python scripts/etl/cavas/gerar-camadas-mineracao-protegida.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[3]
CAM = RAIZ / "apps" / "web" / "public" / "terras" / "globo" / "dados" / "camadas"

MINERACAO = ("mineracao-sem-cadastro.geojson", "cavas-monitoradas.geojson")
PROTECAO = {
    "mineracao-em-uc": ("unidades-conservacao.geojson", "nome", "esfera"),
    "mineracao-em-quilombo": ("territorios-quilombolas.geojson", "nome", "esfera"),
}


def carregar(nome):
    with open(CAM / nome, encoding="utf-8") as f:
        return json.load(f)["features"]


def aneis(geom):
    t = geom.get("type")
    c = geom.get("coordinates") or []
    if t == "Polygon":
        return [c]
    if t == "MultiPolygon":
        return c
    return []


def dentro(p, anel):
    x, y = p
    res = False
    n = len(anel)
    j = n - 1
    for i in range(n):
        xi, yi = anel[i][0], anel[i][1]
        xj, yj = anel[j][0], anel[j][1]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            res = not res
        j = i
    return res


def centroide(geom):
    melhor, area_melhor = None, -1.0
    for poly in aneis(geom):
        if not poly:
            continue
        anel = poly[0]
        a = cx = cy = 0.0
        n = len(anel)
        for i in range(n):
            x0, y0 = anel[i][0], anel[i][1]
            x1, y1 = anel[(i + 1) % n][0], anel[(i + 1) % n][1]
            cross = x0 * y1 - x1 * y0
            a += cross
            cx += (x0 + x1) * cross
            cy += (y0 + y1) * cross
        if a == 0:
            continue
        a *= 0.5
        if abs(a) > area_melhor:
            area_melhor = abs(a)
            melhor = (cx / (6 * a), cy / (6 * a))
    return melhor


def ponto_em_geom(geom, p):
    for poly in aneis(geom):
        if poly and dentro(p, poly[0]) and not any(dentro(p, b) for b in poly[1:]):
            return True
    return False


def bbox(geom):
    xs, ys = [], []
    for poly in aneis(geom):
        for anel in poly:
            for pt in anel:
                xs.append(pt[0])
                ys.append(pt[1])
    return (min(xs), min(ys), max(xs), max(ys)) if xs else None


def simplificar(geom, casas=5):
    """Arredonda as coordenadas (5 casas ≈ 1 m) — corta peso sem mexer na forma
    aparente num polígono de menos de 1 hectare."""
    def arred(anel):
        return [[round(x, casas), round(y, casas)] for x, y in anel]

    t = geom["type"]
    if t == "Polygon":
        return {"type": t, "coordinates": [arred(a) for a in geom["coordinates"]]}
    return {"type": t, "coordinates": [[arred(a) for a in poly] for poly in geom["coordinates"]]}


mineracao = []
for arq in MINERACAO:
    for ft in carregar(arq):
        g = ft.get("geometry")
        if not g:
            continue
        c = centroide(g)
        if c:
            mineracao.append((c, ft, arq))
print(f"polígonos de mineração: {len(mineracao)}")

for chave, (arq_prot, campo_nome, campo_esfera) in PROTECAO.items():
    protegidas = []
    for ft in carregar(arq_prot):
        g = ft.get("geometry")
        if not g:
            continue
        protegidas.append((bbox(g), g, ft.get("properties") or {}))

    features = []
    for c, ft_min, arq_min in mineracao:
        px, py = c
        for bx, g, pr in protegidas:
            if not bx or not (bx[0] <= px <= bx[2] and bx[1] <= py <= bx[3]):
                continue
            if not ponto_em_geom(g, c):
                continue
            pm = ft_min.get("properties") or {}
            features.append({
                "type": "Feature",
                "properties": {
                    "id": pm.get("id"),
                    "ano": pm.get("ano"),
                    "area_ha": pm.get("area_ha"),
                    "estado": pm.get("estado"),
                    "dentro_de": pr.get(campo_nome),
                    "esfera": pr.get(campo_esfera),
                    "origem_mineracao": arq_min.replace(".geojson", ""),
                    "fonte": "Monitor da Mineração (MapBiomas) × ANM/SIGMINE; área protegida oficial",
                    "natureza": "cruzamento por centroide — piso, não total",
                },
                "geometry": simplificar(ft_min["geometry"]),
            })
    saida = CAM / f"{chave}.geojson"
    saida.write_text(json.dumps({
        "type": "FeatureCollection",
        "_nota": (
            "Mineração detectada por satélite cujo centroide cai dentro de área "
            "protegida oficial. Método por centroide: PISO, não total. Estar "
            "dentro não é, por si, ilícito — é convite para conferir na fonte."
        ),
        "features": features,
    }, ensure_ascii=False), encoding="utf-8")
    print(f"{chave}: {len(features)} polígonos | {saida.stat().st_size/1024:.0f} KB")
