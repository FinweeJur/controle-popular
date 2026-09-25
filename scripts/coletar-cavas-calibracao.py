"""coletar-cavas-calibracao.py — Fase 1 do plano de cavas: terreno de calibração.

Monta o dataset de treino/calibração do rastreamento de cavas (ver
docs/planos/PLANO-GLOBO-CAVAS-MINERACAO.md, Fase 1):

- POSITIVOS: poligonais MG do Monitor da Mineração (MapBiomas) nas fases que
  autorizam extrair (Concessão de Lavra, Lavra Garimpeira, Permissão de Lavra
  Garimpeira, Registro de Extração) — geometria vem da base ANM/SIGMINE.
- NEGATIVOS: pontos aleatórios em MG, FORA de todo polígono SIGMINE de MG,
  FORA da classe mineração do MapBiomas (`mining_age.dentro_sigmine=false`)
  e com margem de segurança.
- IMAGEM: recorte 512x512 px verdadeira-cor (BAND3/BAND2/BAND1) de cena
  CBERS-4A/WPM (8,4 m/px) via STAC + leitura por janela HTTP (range) —
  baixa só os pixels de cada recorte, não a cena inteira.
- NUVEM: `eo:cloud_cover` do CBERS vem nulo (medido em 25/09/2026); a nuvem
  e medida localmente no recorte, porque limiar absoluto de DN falhou entre
  cenas (medido 25/09: cena 206_133 com nuvem a 231 DN, cena 205_134 boa com
  terreno a 276 DN). A regra combinada e: (a) acromatismo — RGB proximos entre
  si (saturacao <= 0,20); (b) brilho relativo ao proprio recorte (acromaticos
  acima de 1,2x a mediana); (c) referencia de cena amostrada (3 janelas de
  256 px) com veto de cena majoritariamente acromatica (nublada); (d) recorte
  liso e acromatico (nuvem grossa sem textura). Se alguma regra dispara,
  `nuvem` vale 1.0; senao e a maior fracao medida. Corte final `--max-nuvem`.

Saída:
- imagens: scripts/.cache/cavas-calibracao/recortes/ (cache, fora do git)
- checkpoint: scripts/.cache/cavas-calibracao/checkpoint.jsonl (retomável)
- manifesto versionado: apps/web/data/cavas-calibracao-manifesto.json
  (só bbox, cena, data, hash — sem titular, sem CPF; vira item do
  varredor DIRETORIOS_DADO por morar em apps/web/data)

Rodar:
    python scripts/coletar-cavas-calibracao.py --limite 60        # piloto
    python scripts/coletar-cavas-calibracao.py --limite 5000      # lote
    python scripts/coletar-cavas-calibracao.py --tipo negativo --limite 5000
    python scripts/coletar-cavas-calibracao.py --exporta          # só reexporta

## Fonte e licenca

- Poligonais e fases: https://plataforma.monitormineracao.mapbiomas.org/
  (GeoServer WFS `pto:processos_minerarios`), base ANM/SIGMINE + classe
  MapBiomas. Atribuicao: MapBiomas / ANM-SIGMINE. CC BY 4.0.
- Classe mineracao por ano: camada `pto:mining_age` (mesmo WFS).
- Cenas CBERS-4A/WPM: INPE/BDC STAC https://data.inpe.br/bdc/stac/v1
  (sem login). Atribuicao: INPE/BDC, CC BY 4.0.

## Decisao robots.txt (consultado em 2026-09-25)

- data.inpe.br/robots.txt: `User-agent: * Disallow: /hiddenarea/` —
  area de dados publica do BDC liberada; UA honesto e pausa de 2 s entre
  cenas como cortesia.
- plataforma.geoserver.mapbiomas.org/robots.txt: HTTP 404 (sem
  declaracao) — acesso liberado por padrao; pausa de 2 s entre paginas.

## Ressalva editorial

 positivo = "area licenciada/autorizada para extrair na fase X em <data>",
 nada aqui prova atividade em curso. O manifesto e insumo de calibracao
 interno, nao achado publico (barra de publicacao do plano, secao 4).
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import random
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows = cp1252

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CACHE = Path(__file__).resolve().parent / ".cache" / "cavas-calibracao"
RECORTES = CACHE / "recortes"
CHECKPOINT = CACHE / "checkpoint.jsonl"
MANIFESTO = ROOT / "apps" / "web" / "data" / "cavas-calibracao-manifesto.json"

WFS = "https://plataforma.geoserver.mapbiomas.org/geoserver/pto/wfs"
STAC = "https://data.inpe.br/bdc/stac/v1/search"
UA = "ControlePopular/1.0 (+controlepopular.com.br; coleta de calibração de cavas)"
PAUSA = 2  # cortesia por host (robots.txt dos dois hosts lido em 25/09/2026)

MG_BBOX = (-23.0, -51.1, -14.0, -39.8)  # WFS 1.1.0 = ordem lat,lon (medido)
MG_EXT = {"minlat": -23.0, "maxlat": -14.0, "minlon": -51.1, "maxlon": -39.8}
FASES_EXTRATIVAS = (
    "CONCESSÃO DE LAVRA",
    "LAVRA GARIMPEIRA",
    "REGISTRO DE EXTRAÇÃO",
    "PERMISSÃO DE LAVRA GARIMPEIRA",
)
COLECAO = "CB4A-WPM-L2-DN-1"
RGB_BANDS = ("BAND3", "BAND2", "BAND1")  # R, G, B (cor verdadeira medida em 25/09)
TAM = 512  # px
MEIO_M = 2150  # ~4,3 km de lado a 8,4 m/px
BRILHO_NUVEM = 750  # DN; regra legada (fraca entre cenas, mantida como uma das somas)
SAT_NUVEM = 0.20  # saturacao (mx-mn)/mx maxima para o pixel valer como "acromatico"
ACROM_REC_LIM = 0.70  # frac. de acromaticos no recorte que ja caracteriza nuvem
CENA_ACROM_LIM = 0.80  # frac. acromatica da cena; acima disso a cena e nublada
CM_MULT = 1.2  # acromatico acima de CM_MULT x mediana do recorte
TEX_LIM = 0.02  # textura media (|diff|/mediana) abaixo disso = superficie lisa
TEX_ACROM_LIM = 0.45  # fracao acromatica minima para a regra de textura valer
AMOSTRAS_CENA = ((0.12, 0.15), (0.55, 0.45), (0.85, 0.80))  # frac. de linha/coluna
AMOSTRA_PX = 256  # cenas WPM ~14k px sem overviews: janela pequena (medido 25/09)
MARGEM_EXCLUSAO = 0.006  # ~600 m de folga na exclusao de negativos


def _get(url: str, timeout: int = 120, headers: dict | None = None) -> bytes:
    h = {"User-Agent": UA}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def _post_json(url: str, body: dict, timeout: int = 120) -> dict:
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(), method="POST",
        headers={"User-Agent": UA, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


# ---------------------------------------------------------------- WFS (Monitor)

def wfs_paginas(cql: str, max_features: int = 2500, so_geom: bool = False) -> list[dict]:
    """Páginas GeoJSON do WFS 1.1.0 (startIndex; acento e bbox só funcionam aqui)."""
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
    """Poligonais MG das fases extrativas (cache local por página)."""
    arq = CACHE / "positivos-mg.json"
    if arq.exists():
        return json.loads(arq.read_text(encoding="utf-8"))
    cql = ("fase IN (%s) AND BBOX(geom,%s)"
           % (",".join("'%s'" % f for f in FASES_EXTRATIVAS),
              ",".join(str(v) for v in MG_BBOX)))
    feats = wfs_paginas(cql)
    out = []
    for f in feats:
        pr = f.get("properties", {})
        g = f.get("geometry") or {}
        pts = _primeiro_anel(g)
        if not pts:
            continue
        out.append({
            "processo": pr.get("processo"),
            "fase": pr.get("fase"),
            "area_ha": pr.get("area_ha"),
            "bbox": _bbox_anel(pts),
            "centroide": _centroide(pts),
        })
    arq.parent.mkdir(parents=True, exist_ok=True)
    arq.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    return out


def carregar_exclusao() -> list[tuple[float, float, float, float]]:
    """Bboxes (com margem) de TODO polígono SIGMINE de MG + classe mineração
    do MapBiomas fora do cadastro. Usado só para sortear negativos."""
    arq = CACHE / "exclusao-mg-bbox.json"
    if arq.exists():
        return [tuple(b) for b in json.loads(arq.read_text(encoding="utf-8"))]
    bboxes: list[list[float]] = []
    # 1) todos os processos MG (só geometria)
    cql_all = "BBOX(geom,%s)" % ",".join(str(v) for v in MG_BBOX)
    n = 0
    for f in wfs_paginas(cql_all, max_features=2500, so_geom=True):
        pts = _primeiro_anel(f.get("geometry") or {})
        if pts:
            bboxes.append(list(_bbox_anel(pts)))
            n += 1
    print(f"  exclusao SIGMINE MG: {n} poligonais", flush=True)
    # 2) classe mineração MapBiomas fora do SIGMINE
    cql_mining = "dentro_sigmine = false AND BBOX(geom,%s)" % ",".join(str(v) for v in MG_BBOX)
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
    arq.write_text(json.dumps(bboxes), encoding="utf-8")
    return [tuple(b) for b in bboxes]


# ---------------------------------------------------------------- geometria

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


def ponto_dentro(pt, pts) -> bool:
    """Ray casting (stdlib; sem shapely no repo)."""
    x, y = pt
    dentro = False
    j = len(pts) - 1
    for i in range(len(pts)):
        xi, yi = pts[i][0], pts[i][1]
        xj, yj = pts[j][0], pts[j][1]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi + 1e-15) + xi):
            dentro = not dentro
        j = i
    return dentro


def rejeitado(pt, exclusao) -> bool:
    x, y = pt
    for (x0, y0, x1, y1) in exclusao:
        if x0 - MARGEM_EXCLUSAO <= x <= x1 + MARGEM_EXCLUSAO and \
           y0 - MARGEM_EXCLUSAO <= y <= y1 + MARGEM_EXCLUSAO:
            return True
    return False


def montar_indice(exclusao, celula: float = 0.5) -> dict:
    """Grade geográfica: cada bbox entra nas células que cobre (rejeição O(1))."""
    idx: dict = {}
    for b in exclusao:
        x0, y0, x1, y1 = b[0] - MARGEM_EXCLUSAO, b[1] - MARGEM_EXCLUSAO, \
            b[2] + MARGEM_EXCLUSAO, b[3] + MARGEM_EXCLUSAO
        for cx in range(int(math.floor(x0 / celula)), int(math.floor(x1 / celula)) + 1):
            for cy in range(int(math.floor(y0 / celula)), int(math.floor(y1 / celula)) + 1):
                idx.setdefault((cx, cy), []).append((x0, y0, x1, y1))
    return idx


def rejeitado_indice(pt, idx: dict, celula: float = 0.5) -> bool:
    x, y = pt
    cx = int(math.floor(x / celula))
    cy = int(math.floor(y / celula))
    for ddx in (-1, 0, 1):
        for ddy in (-1, 0, 1):
            for (x0, y0, x1, y1) in idx.get((cx + ddx, cy + ddy), ()):
                if x0 <= x <= x1 and y0 <= y <= y1:
                    return True
    return False


# ---------------------------------------------------------------- STAC / cenas

def buscar_cenas() -> list[dict]:
    """Cenas CBERS-4A/WPM de MG (18 meses), com paginação por token."""
    arq = CACHE / "cenas-mg.json"
    if arq.exists():
        return json.loads(arq.read_text(encoding="utf-8"))
    body = {"collections": [COLECAO],
            "bbox": [-51.1, -23.0, -39.8, -14.0],
            "datetime": "2025-03-25T00:00:00Z/2026-09-25T23:59:59Z",
            "limit": 1000}
    cenas: list[dict] = []
    token = None
    while True:
        if token:
            body["token"] = token
        j = _post_json(STAC, body)
        feats = j.get("features", [])
        for f in feats:
            cenas.append({
                "id": f.get("id"),
                "datetime": (f.get("properties", {}).get("datetime") or "")[:10],
                "geom": f.get("geometry"),
                "bands": {k: a.get("href") for k, a in f.get("assets", {}).items()
                          if k in RGB_BANDS},
            })
        token = None
        for ln in j.get("links", []):
            if ln.get("rel") == "next" and ln.get("href"):
                qs = urllib.parse.urlparse(ln["href"]).query
                token = dict(urllib.parse.parse_qsl(qs)).get("token")
        if not token or not feats:
            break
        time.sleep(PAUSA)
    time.sleep(PAUSA)
    arq.parent.mkdir(parents=True, exist_ok=True)
    arq.write_text(json.dumps(cenas, ensure_ascii=False), encoding="utf-8")
    print(f"  cenas CBERS-4A/WPM em MG (18 meses): {len(cenas)}", flush=True)
    return cenas


def cenas_que_contem(pt, cenas) -> list[dict]:
    ok = []
    for c in cenas:
        g = c.get("geom") or {}
        pts = _primeiro_anel(g)
        if pts and ponto_dentro(pt, pts):
            ok.append(c)
    ok.sort(key=lambda c: c["datetime"], reverse=True)  # mais recente primeiro
    return ok


# ---------------------------------------------------------------- recorte

_DATASETS: dict = {}  # cache de handles abertos (reaproveita por cena; cap 9)
_ENV = {"GDAL_DISABLE_READDIR_ON_OPEN": "EMPTY_DIR",
        "CPL_VSIL_CURL_ALLOWED_EXTENSIONS": ".tif",
        "GDAL_HTTP_HEADERS": f"User-Agent={UA}",
        "GDAL_HTTP_TIMEOUT": "120"}


def _abrir(href: str):
    import rasterio

    ds = _DATASETS.get(href)
    if ds is None:
        ctx = rasterio.Env(**_ENV)
        ctx.__enter__()
        ds = rasterio.open(href)
        ds._env_ctx = ctx  # mantém o Env vivo enquanto o handle abrir
        _DATASETS[href] = ds
        while len(_DATASETS) > 9:  # só as cenas recentes ficam abertas
            antigo = next(iter(_DATASETS))  # dict preserva ordem: o mais antigo
            ant_ds = _DATASETS.pop(antigo)
            try:
                ant_ds.close()
                ctx = getattr(ant_ds, "_env_ctx", None)
                if ctx:
                    ctx.__exit__(None, None, None)
            except Exception:
                pass
    return ds


def ler_janela(href: str, cx: float, cy: float) -> np.ndarray | None:
    from rasterio.windows import from_bounds
    from rasterio.warp import transform_bounds

    dlat = MEIO_M / 111320.0
    dlon = MEIO_M / (111320.0 * math.cos(math.radians(cy)))
    sub = (cx - dlon, cy - dlat, cx + dlon, cy + dlat)
    try:
        ds = _abrir(href)
        tb = transform_bounds("EPSG:4326", ds.crs, *sub)
        w = from_bounds(*tb, transform=ds.transform)
        if w.width <= 0 or w.height <= 0:
            return None
        arr = ds.read(1, window=w, out_shape=(TAM, TAM))
        return arr
    except Exception as e:  # janela fora da cena, rede, etc.
        if href in _DATASETS:
            try:
                _DATASETS.pop(href).close()
            except Exception:
                pass
        print(f"    leitura falhou: {type(e).__name__}: {e}", flush=True)
        return None


def stats_de_amostras(amostras: np.ndarray) -> dict | None:
    """(n, 3, h, w) das janelas de cena -> frac. acromática e mediana de brilho."""
    a = np.asarray(amostras, dtype=np.float32)
    r, g, bl = a[:, 0].ravel(), a[:, 1].ravel(), a[:, 2].ravel()
    v = (r > 0) & (g > 0) & (bl > 0)
    if int(v.sum()) < 500:
        return None
    r, g, bl = r[v], g[v], bl[v]
    br = (r + g + bl) / 3
    mx = np.maximum(np.maximum(r, g), bl)
    mn = np.minimum(np.minimum(r, g), bl)
    sat = (mx - mn) / np.maximum(mx, 1.0)
    return {"frac_acrom": float(np.mean(sat <= SAT_NUVEM)),
            "med": float(np.median(br))}


def medir_nuvem(r: np.ndarray, g: np.ndarray, bl: np.ndarray,
                stats: dict | None) -> float:
    """Regra combinada: acromatismo + brilho relativo + lisa + cena nublada."""
    v = (r > 0) & (g > 0) & (bl > 0)
    n = max(int(v.sum()), 1)
    br = np.where(v, (r + g + bl) / 3.0, 0.0)
    mx = np.maximum(np.maximum(r, g), bl)
    mn = np.minimum(np.minimum(r, g), bl)
    sat = (mx - mn) / np.maximum(mx, 1.0)
    acrom = (sat <= SAT_NUVEM) & v
    frac_acrom = float(acrom.sum()) / n
    med = float(np.median(br[v])) if n > 1 else 0.0
    nuvem = float(np.mean((r > BRILHO_NUVEM) & (g > BRILHO_NUVEM)
                          & (bl > BRILHO_NUVEM)))
    if med > 0:
        nuvem = max(nuvem, float(np.sum(acrom & (br > CM_MULT * med))) / n)
    if frac_acrom > ACROM_REC_LIM:
        nuvem = 1.0
    if stats and stats.get("frac_acrom", 0.0) > CENA_ACROM_LIM:
        nuvem = 1.0
    if med > 0 and frac_acrom > TEX_ACROM_LIM:
        dif = np.abs(np.diff(br, axis=1))
        par = v[:, :-1] & v[:, 1:]
        if par.any() and float(dif[par].mean() / med) < TEX_LIM:
            nuvem = 1.0
    return min(max(nuvem, 0.0), 1.0)


_REF_CENA: dict = {}
_REF_CARREGADO: list[bool] = [False]


def stats_cena(cena: dict) -> dict | None:
    """Referência da cena (3 janelas), cacheada em RAM e em disco por cena."""
    global _REF_CARREGADO
    sid = cena["id"]
    arq = CACHE / "refs-cena.json"
    if sid in _REF_CENA:
        return _REF_CENA[sid]
    if not _REF_CARREGADO[0]:
        _REF_CARREGADO[0] = True
        if arq.exists():
            try:
                _REF_CENA.update(json.loads(arq.read_text(encoding="utf-8")))
            except Exception:
                pass
        if sid in _REF_CENA:
            return _REF_CENA[sid]
    st = None
    try:
        amostras = []
        for fi, fj in AMOSTRAS_CENA:
            trio = []
            for b in RGB_BANDS:
                href = cena["bands"].get(b)
                if not href:
                    raise RuntimeError("banda ausente")
                arr = _ler_amostra(href, fi, fj)
                if arr is None:
                    raise RuntimeError("janela falhou")
                trio.append(arr)
            amostras.append(np.stack(trio))
        st = stats_de_amostras(np.stack(amostras))
    except Exception as e:
        print(f"    cena {sid}: sem referência ({type(e).__name__}: {e})",
              flush=True)
    _REF_CENA[sid] = st
    try:
        arq.parent.mkdir(parents=True, exist_ok=True)
        arq.write_text(json.dumps(_REF_CENA, ensure_ascii=False),
                       encoding="utf-8")
    except Exception:
        pass
    return st


def _ler_amostra(href: str, fi: float, fj: float) -> np.ndarray | None:
    from rasterio.windows import Window

    try:
        ds = _abrir(href)
        x0 = min(max(int(fi * ds.width), 0), ds.width - AMOSTRA_PX)
        y0 = min(max(int(fj * ds.height), 0), ds.height - AMOSTRA_PX)
        return ds.read(1, window=Window(x0, y0, AMOSTRA_PX, AMOSTRA_PX))
    except Exception:
        if href in _DATASETS:
            try:
                _DATASETS.pop(href).close()
            except Exception:
                pass
        return None


def compor_rgb(cena: dict, cx: float, cy: float,
               corte: float) -> tuple[np.ndarray | None, float]:
    """RGB (uint8) e nuvem (0..1, 1.0 quando alguma regra de rejeição dispara)."""
    canais = []
    for b in RGB_BANDS:
        href = cena["bands"].get(b)
        if not href:
            return None, 1.0
        arr = ler_janela(href, cx, cy)
        if arr is None:
            return None, 1.0
        canais.append(arr)
    r, g, bl = (c.astype(np.float32) for c in canais)
    frac_zero = float(np.mean((r == 0) | (g == 0) | (bl == 0)))
    if frac_zero > 0.30:
        return None, 1.0
    nuvem = medir_nuvem(r, g, bl, None)
    if nuvem <= corte:
        nuvem = medir_nuvem(r, g, bl, stats_cena(cena))
    lo, hi = np.percentile(np.concatenate([r.ravel(), g.ravel(), bl.ravel()]), (2, 98))
    span = max(hi - lo, 1.0)
    rgb = np.stack([np.clip((c - lo) / span * 255, 0, 255) for c in (r, g, bl)], axis=-1)
    return rgb.astype(np.uint8), nuvem


def _stretch(a: np.ndarray) -> np.ndarray:
    lo, hi = np.percentile(a, (2, 98))
    return np.clip((a - lo) / max(hi - lo, 1) * 255, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- checkpoint

def ler_checkpoint() -> tuple[set, list[dict]]:
    hashes: set = set()
    itens: list[dict] = []
    if CHECKPOINT.exists():
        with CHECKPOINT.open(encoding="utf-8") as f:
            for linha in f:
                linha = linha.strip()
                if not linha:
                    continue
                try:
                    it = json.loads(linha)
                except json.JSONDecodeError:
                    continue
                hashes.add(it.get("hash"))
                itens.append(it)
    return hashes, itens


def gravar_checkpoint(it: dict) -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    with CHECKPOINT.open("a", encoding="utf-8") as f:
        f.write(json.dumps(it, ensure_ascii=False) + "\n")


def exportar_manifesto(itens: list[dict]) -> None:
    agora = datetime.now(timezone.utc).isoformat(timespec="seconds")
    doc = {
        "gerado_em": agora,
        "plano": "docs/planos/PLANO-GLOBO-CAVAS-MINERACAO.md (Fase 1)",
        "fontes": [
            "MapBiomas Monitor da Mineracao (WFS pto:processos_minerarios; base ANM/SIGMINE)",
            "MapBiomas mining_age (classe mineracao; dentro_sigmine=false na exclusao)",
            "INPE/BDC STAC CBERS-4A/WPM L2 DN (CC BY 4.0)",
        ],
        "criterios": {
            "positivo": "poligonal MG em fase extrativa (concessao/lavra garimpeira/"
                        "registro/permissao) na data da cena",
            "negativo": "ponto aleatorio em MG fora de todo poligono SIGMINE MG, "
                        "fora da classe mineracao MapBiomas e com margem ~600 m",
            "imagem": "512x512 px, RGB B3/B2/B1 de cena CBERS-4A/WPM (~8,4 m/px), "
                      "cena mais recente com nuvem local <= 20%",
            "nuvem": "regra combinada no recorte: acromatismo (saturacao <= 0,20) "
                     "e brilho acima de 1,2x a mediana do proprio recorte, "
                     "referencia de cena amostrada (3 janelas de 256 px) com veto "
                     "de cena acromatica > 0,80, e recorte liso (< 0,02 de textura) "
                     "e acromatico; regra que dispara vale 1.0; eo:cloud_cover do "
                     "CBERS e nulo (medido 25/09/2026)",
        },
        "ressalva": "calibracao interna; positivo = area autorizada, nao atividade "
                    "em curso; nenhum campo pessoal (sem titular) por design",
        "total": {"positivo": 0, "negativo": 0},
        "itens": itens,
    }
    for it in itens:
        doc["total"][it["tipo"]] = doc["total"].get(it["tipo"], 0) + 1
    MANIFESTO.parent.mkdir(parents=True, exist_ok=True)
    MANIFESTO.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"manifesto: {MANIFESTO} | positivo {doc['total']['positivo']} | "
          f"negativo {doc['total']['negativo']}", flush=True)


# ---------------------------------------------------------------- coleta

def escolher_recorte(tipo: str, alvo, cenas, cands: list[dict], max_nuvem: float,
                     tentativas: int, hashes: set, rng: random.Random):
    """Tenta até `tentativas` cenas; devolve (bytes_jpg, cena, data, nuvem) ou None."""
    cx, cy = alvo
    escolhidas = cands[:tentativas] if cands else []
    if tipo == "negativo" and not escolhidas:
        # negativo fora de qualquer cena conhecida (borda do estado) — pula
        return None
    for cena in escolhidas:
        rgb, nuvem = compor_rgb(cena, cx, cy, max_nuvem)
        if rgb is None or nuvem > max_nuvem:
            time.sleep(1)
            continue
        img = Image.fromarray(rgb, "RGB")
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=85)
        h = hashlib.sha256(buf.getvalue()).hexdigest()
        if h in hashes:
            return None
        return buf.getvalue(), cena["id"], cena["datetime"], nuvem, h
    return None


def principal() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--limite", type=int, default=60, help="recortes a gerar nesta rodada")
    ap.add_argument("--tipo", choices=["ambos", "positivo", "negativo"], default="ambos")
    ap.add_argument("--max-nuvem", type=float, default=0.20)
    ap.add_argument("--tentativas", type=int, default=3, help="cenas por recorte")
    ap.add_argument("--semente", type=int, default=42)
    ap.add_argument("--exporta", action="store_true", help="só reexporta o manifesto")
    args = ap.parse_args()

    CACHE.mkdir(parents=True, exist_ok=True)
    RECORTES.mkdir(parents=True, exist_ok=True)
    hashes, itens = ler_checkpoint()
    if args.exporta:
        exportar_manifesto(itens)
        return 0

    feitos = {"positivo": 0, "negativo": 0}
    ja_pos = sum(1 for i in itens if i["tipo"] == "positivo")
    ja_neg = sum(1 for i in itens if i["tipo"] == "negativo")

    print("carregando cenas STAC...", flush=True)
    cenas = buscar_cenas()

    rng = random.Random(args.semente)
    pendentes_pos: list[dict] = []
    pendentes_neg: list[tuple[float, float]] = []

    if args.tipo in ("ambos", "positivo"):
        print("carregando positivos (fases extrativas MG)...", flush=True)
        pos = carregar_positivos()
        print(f"  positivos MG: {len(pos)} | ja no checkpoint: {ja_pos}", flush=True)
        rng.shuffle(pos)
        # agrupa por cena: reaproveita os 3 arquivos abertos (cache) por cena
        cenas_bboxes = [(c, _primeiro_anel(c.get("geom") or {})) for c in cenas]

        def cena_primaria(p):
            for c, pts in cenas_bboxes:
                if pts and ponto_dentro(p["centroide"], pts):
                    return c["id"]
            return ""

        marcados = [(cena_primaria(p), p) for p in pos]
        sem_cena = sum(1 for sid, _ in marcados if sid == "")
        marcados.sort(key=lambda t: t[0])
        pos = [p for _, p in marcados]
        print(f"  sem cena CBERS em 18 meses: {sem_cena}", flush=True)
        pendentes_pos = pos
    if args.tipo in ("ambos", "negativo"):
        print("carregando exclusao para negativos...", flush=True)
        exclusao = carregar_exclusao()
        print(f"  bboxes de exclusao: {len(exclusao)}", flush=True)
        idx = montar_indice(exclusao)
        print(f"  celulas do indice: {len(idx)}", flush=True)
        alvo_total = args.limite if args.tipo == "negativo" else max(0, args.limite - ja_neg)
        reserva = max(alvo_total * 3, alvo_total + 20)
        n = 0
        tent = 0
        while n < reserva and tent < alvo_total * 400 + 4000:
            tent += 1
            pt = (rng.uniform(MG_EXT["minlon"], MG_EXT["maxlon"]),
                  rng.uniform(MG_EXT["minlat"], MG_EXT["maxlat"]))
            if rejeitado_indice(pt, idx):
                continue
            pendentes_neg.append(pt)
            n += 1
        print(f"  candidatos a negativo: {len(pendentes_neg)} (tentativas {tent})", flush=True)

    feitos = {"positivo": 0, "negativo": 0}
    # --- positivos -------------------------------------------------------
    if args.tipo in ("ambos", "positivo"):
        limite_pos = args.limite if args.tipo == "positivo" else max(0, args.limite - ja_pos)
        for p in pendentes_pos:
            if feitos["positivo"] >= limite_pos:
                break
            cands = cenas_que_contem(p["centroide"], cenas)
            r = escolher_recorte("positivo", p["centroide"], cenas, cands,
                                 args.max_nuvem, args.tentativas, hashes, rng)
            if r is None:
                continue
            jpg, cena_id, data, nuvem, h = r
            destino = RECORTES / "positivo" / f"{h[:24]}.jpg"
            destino.parent.mkdir(parents=True, exist_ok=True)
            destino.write_bytes(jpg)
            bbox_recorte = _bbox_recorte(p["centroide"])
            it = {"tipo": "positivo", "processo": p["processo"], "fase": p["fase"],
                  "bbox": bbox_recorte, "cena": cena_id, "data": data,
                  "nuvem": round(nuvem, 4), "hash": h, "arquivo": str(destino.name)}
            gravar_checkpoint(it)
            hashes.add(h)
            itens.append(it)
            feitos["positivo"] += 1
            if feitos["positivo"] % 10 == 0:
                print(f"  positivos: +{feitos['positivo']} (nuvem {nuvem:.0%} {cena_id})", flush=True)
            time.sleep(PAUSA)

    # --- negativos -------------------------------------------------------
    if args.tipo in ("ambos", "negativo"):
        limite_neg = args.limite if args.tipo == "negativo" else max(0, args.limite - ja_neg)
        for pt in pendentes_neg:
            if feitos["negativo"] >= limite_neg:
                break
            cands = cenas_que_contem(pt, cenas)
            r = escolher_recorte("negativo", pt, cenas, cands,
                                 args.max_nuvem, args.tentativas, hashes, rng)
            if r is None:
                continue
            jpg, cena_id, data, nuvem, h = r
            destino = RECORTES / "negativo" / f"{h[:24]}.jpg"
            destino.parent.mkdir(parents=True, exist_ok=True)
            destino.write_bytes(jpg)
            it = {"tipo": "negativo", "bbox": _bbox_recorte(pt), "cena": cena_id,
                  "data": data, "nuvem": round(nuvem, 4), "hash": h,
                  "arquivo": str(destino.name)}
            gravar_checkpoint(it)
            hashes.add(h)
            itens.append(it)
            feitos["negativo"] += 1
            if feitos["negativo"] % 10 == 0:
                print(f"  negativos: +{feitos['negativo']} (nuvem {nuvem:.0%} {cena_id})", flush=True)
            time.sleep(PAUSA)

    exportar_manifesto(itens)
    print(f"rodada: +{feitos['positivo']} positivos, +{feitos['negativo']} negativos", flush=True)
    return 0


def _bbox_recorte(c) -> list[float]:
    cx, cy = c
    dlat = MEIO_M / 111320.0
    dlon = MEIO_M / (111320.0 * math.cos(math.radians(cy)))
    return [round(cx - dlon, 6), round(cy - dlat, 6),
            round(cx + dlon, 6), round(cy + dlat, 6)]


if __name__ == "__main__":
    raise SystemExit(principal())
