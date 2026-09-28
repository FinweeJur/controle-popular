"""alvos-go.py — Fase 1 do plano de cavas: alvos positivos e exclusão de GO.

Coleta do GeoServer WFS MapBiomas Monitor da Mineração:
- positivos-go.json: processos minerários de GO nas fases extrativas
  (Concessão de Lavra, Lavra Garimpeira, Registro de Extração, Permissão
  de Lavra Garimpeira) — mesma fonte do MG.
- exclusao-go-bbox.json: polígonos SIGMINE de GO + classe mineração
  MapBiomas (mining_age, dentro_sigmine=false) com margem de 0,01°.

Saída versionada: scripts/dados/cavas-go/ (não é gitignored).

Uso:
    python scripts/etl/cavas/alvos-go.py

## Fonte e licença

- WFS: https://plataforma.geoserver.mapbiomas.org/geoserver/pto/wfs
- Camadas: pto:processos_minerarios (base ANM/SIGMINE), pto:mining_age
- Licença: CC BY 4.0 — "MapBiomas - Monitor da Mineração, acessado em [data]"

## Decisão robots.txt (consultado em 2026-09-25)

- plataforma.geoserver.mapbiomas.org/robots.txt: HTTP 404 (sem declaração)
  → acesso liberado por padrão; UA honesta e pausa ≥ 2 s.

## Decisões técnicas

- WFS 1.1.0 obrigatório (BBOX em ordem lat,lon, campo geom).
- Pausa de 2 s entre requisições.
- User-Agent honesto: ControlePopular/1.0 (+controlepopular.com.br; transparencia).
- Sem titular, sem CPF — só id, processo, fase, centroide.
"""
from __future__ import annotations

import json
import math
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent.parent.parent
SAIDA = ROOT / "scripts" / "dados" / "cavas-go"
CACHE = ROOT / "scripts" / ".cache" / "cavas-go"

WFS = "https://plataforma.geoserver.mapbiomas.org/geoserver/pto/wfs"
UA = "ControlePopular/1.0 (+controlepopular.com.br; transparencia)"
PAUSA = 2

GO_BBOX = (-19.5, -53.0, -13.5, -45.5)  # WFS 1.1.0 = ordem lat,lon (minlat, minlon, maxlat, maxlon)
GO_EXT = {"minlat": -19.5, "maxlat": -13.5, "minlon": -53.0, "maxlon": -45.5}
FASES_EXTRATIVAS = (
    "CONCESSÃO DE LAVRA",
    "LAVRA GARIMPEIRA",
    "REGISTO DE EXTRAÇÃO",
    "PERMISSÃO DE LAVRA GARIMPEIRA",
)
MARGEM = 0.01  # ~1,1 km de folga na exclusão


def _get(url: str, timeout: int = 120) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def _primeiro_anel(geom: dict) -> list[list[float]] | None:
    if not geom:
        return None
    if geom.get("type") == "Polygon":
        rings = geom.get("coordinates") or []
        return rings[0] if rings else None
    if geom.get("type") == "MultiPolygon":
        polys = geom.get("coordinates") or []
        if polys and polys[0]:
            return polys[0][0]
    return None


def _bbox_anel(pts) -> tuple[float, float, float, float]:
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return (min(xs), min(ys), max(xs), max(ys))


def _centroide(pts) -> tuple[float, float]:
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return (sum(xs) / len(xs), sum(ys) / len(ys))


def wfs_paginas(cql: str, max_features: int = 2500, so_geom: bool = False) -> list[dict]:
    """Páginas GeoJSON do WFS 1.1.0 (startIndex)."""
    features: list[dict] = []
    start = 0
    while True:
        p = {"service": "WFS", "version": "1.1.0", "request": "GetFeature",
             "typeName": "pto:processos_minerarios", "outputFormat": "application/json",
             "CQL_FILTER": cql, "maxFeatures": str(max_features),
             "startIndex": str(start)}
        if so_geom:
            p["propertyName"] = "geom"
        q = urllib.parse.urlencode(p)
        raw = _get(f"{WFS}?{q}")
        page = json.loads(raw).get("features", [])
        if not page:
            break
        features.extend(page)
        if len(page) < max_features:
            break
        start += len(page)
        time.sleep(PAUSA)
    time.sleep(PAUSA)
    return features


def carregar_positivos() -> list[dict]:
    """Processos minerários de GO nas fases extrativas."""
    arq = CACHE / "positivos-go.json"
    if arq.exists():
        print(f"  cache: {arq}", flush=True)
        return json.loads(arq.read_text(encoding="utf-8"))

    cql = ("fase IN (%s) AND BBOX(geom,%s)"
           % (",".join("'%s'" % f for f in FASES_EXTRATIVAS),
              ",".join(str(v) for v in GO_BBOX)))
    feats = wfs_paginas(cql)
    out = []
    for f in feats:
        pr = f.get("properties", {})
        g = f.get("geometry") or {}
        pts = _primeiro_anel(g)
        if not pts:
            continue
        out.append({
            "id": f.get("id"),
            "processo": pr.get("processo"),
            "fase": pr.get("fase"),
            "centroide": list(_centroide(pts)),
        })
    CACHE.mkdir(parents=True, exist_ok=True)
    arq.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"  positivos GO: {len(out)}", flush=True)
    return out


def carregar_exclusao() -> list[list[float]]:
    """Bboxes (com margem) de TODO polígono SIGMINE de GO + classe mineração
    MapBiomas fora do cadastro."""
    arq = CACHE / "exclusao-go-bbox.json"
    if arq.exists():
        print(f"  cache: {arq}", flush=True)
        return json.loads(arq.read_text(encoding="utf-8"))

    bboxes: list[list[float]] = []
    # 1) todos os processos GO (só geometria)
    cql_all = "BBOX(geom,%s)" % ",".join(str(v) for v in GO_BBOX)
    n = 0
    for f in wfs_paginas(cql_all, max_features=2500, so_geom=True):
        pts = _primeiro_anel(f.get("geometry") or {})
        if pts:
            bboxes.append(list(_bbox_anel(pts)))
            n += 1
    print(f"  exclusao SIGMINE GO: {n} poligonais", flush=True)
    # 2) classe mineração MapBiomas fora do SIGMINE
    cql_mining = "dentro_sigmine = false AND BBOX(geom,%s)" % ",".join(str(v) for v in GO_BBOX)
    p = {"service": "WFS", "version": "1.1.0", "request": "GetFeature",
         "typeName": "pto:mining_age", "outputFormat": "application/json",
         "CQL_FILTER": cql_mining, "maxFeatures": "2500", "startIndex": "0",
         "propertyName": "geom"}
    start = 0
    m = 0
    while True:
        p["startIndex"] = str(start)
        q = urllib.parse.urlencode(p)
        page = json.loads(_get(f"{WFS}?{q}")).get("features", [])
        if not page:
            break
        for f in page:
            pts = _primeiro_anel(f.get("geometry") or {})
            if pts:
                bboxes.append(list(_bbox_anel(pts)))
                m += 1
        if len(page) < 2500:
            break
        start += len(page)
        time.sleep(PAUSA)
    print(f"  exclusao mining_age fora_sigmine: {m} poligonais", flush=True)
    # aplica margem
    com_margem = [[b[0] - MARGEM, b[1] - MARGEM, b[2] + MARGEM, b[3] + MARGEM]
                  for b in bboxes]
    CACHE.mkdir(parents=True, exist_ok=True)
    arq.write_text(json.dumps(com_margem), encoding="utf-8")
    return com_margem


def principal() -> int:
    print("coletando alvos de Goiás (WFS MapBiomas)...", flush=True)
    positivos = carregar_positivos()
    exclusao = carregar_exclusao()

    SAIDA.mkdir(parents=True, exist_ok=True)
    (SAIDA / "positivos-go.json").write_text(
        json.dumps(positivos, ensure_ascii=False, indent=1), encoding="utf-8")
    (SAIDA / "exclusao-go-bbox.json").write_text(
        json.dumps(exclusao, ensure_ascii=False), encoding="utf-8")

    print(f"positivos: {len(positivos)}", flush=True)
    print(f"exclusao: {len(exclusao)} bboxes", flush=True)
    print(f"saida: {SAIDA}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(principal())
