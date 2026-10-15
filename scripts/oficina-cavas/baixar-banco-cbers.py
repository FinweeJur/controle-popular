#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Baixa imagens CBERS em DUAS escalas para o banco de cavas ANM.

Esteira de calibração — o modelo aprende em dois níveis:
  - Zoom médio (~17 km): contexto da região, proximidade com rios,
    serras, outras minerações. Entrada da Esteira 1.
  - Zoom máximo (~4.3 km): textura da cava, bordas, sombra.
    Entrada da Esteira 2.

Para cada cava do banco-anm.json, busca a cena CBERS-4A/WPM mais
próxima via STAC (INPE/BDC) e lê um recorte em cada escala via
rasterio (HTTP range — baixa só os pixels, não a cena inteira).

Mesmo método do coletar-cavas-calibracao.py: STAC + rasterio.
WMS do INPE falha com SSL (medido 14/10); STAC funciona.

Retomável: checkpoint por hash (registra ok E falha).
Pausa 2 s entre cenas (robots).

Uso:
  python scripts/oficina-cavas/baixar-banco-cbers.py --limite 50
  python scripts/oficina-cavas/baixar-banco-cbers.py          # todos
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
import threading
import time
import urllib.request
from dataclasses import dataclass
from pathlib import Path

import numpy as np

_RAIZ = Path(__file__).resolve().parents[2]
_BANCO = _RAIZ / "scripts" / ".cache" / "cavas-banco"
_SAIDA = _BANCO / "imagens"
_CHECKPOINT = _BANCO / "checkpoint-banco.jsonl"

STAC = "https://data.inpe.br/bdc/stac/v1/search"
UA = "ControlePopular/1.0 (+controlepopular.com.br; banco de cavas ANM)"
PAUSA = 2
COLECAO = "CB4A-WPM-L2-DN-1"
RGB_BANDS = ("BAND3", "BAND2", "BAND1")

# Escalas: nome → (lado_m, out_px)
ESCALAS = {
    "medio": (17203, 2048),
    "maximo": (4301, 512),
}

# Cache de datasets abertos (rasterio) — thread-local para o runner paralelo.
# Cada thread guarda os próprios handles; assim um worker nunca fecha o
# dataset que outro está lendo em meio à leitura (HTTP range).
_TL = threading.local()
_ENV = {"GDAL_DISABLE_READDIR_ON_OPEN": "EMPTY_DIR",
        "CPL_VSIL_CURL_ALLOWED_EXTENSIONS": ".tif",
        "GDAL_HTTP_HEADERS": f"User-Agent={UA}",
        "GDAL_HTTP_TIMEOUT": "120"}


def _cache() -> dict:
    """Dict de datasets desta thread (cria no primeiro acesso)."""
    if not hasattr(_TL, "datasets"):
        _TL.datasets = {}
    return _TL.datasets


@dataclass
class Estatisticas:
    """Contadores da execução."""
    processados: int = 0
    baixados: int = 0
    falhas: int = 0


def _evict_dataset() -> None:
    """Remove o dataset mais antigo do cache desta thread."""
    d = _cache()
    if not d:
        return
    antigo = next(iter(d))
    ant_ds = d.pop(antigo)
    try:
        ant_ds.close()
        c = getattr(ant_ds, "_env_ctx", None)
        if c:
            c.__exit__(None, None, None)
    except Exception:
        pass


def _abrir(href: str):
    """Abre TIF remoto via rasterio (HTTP range). Cache de 6 por thread."""
    import rasterio
    d = _cache()
    ds = d.get(href)
    if ds is None:
        ctx = rasterio.Env(**_ENV)
        ctx.__enter__()
        ds = rasterio.open(href)
        ds._env_ctx = ctx
        d[href] = ds
        while len(d) > 6:
            _evict_dataset()
    return ds


def _buscar_cena(lon: float, lat: float) -> dict | None:
    """Cena CBERS-4A/WPM mais próxima do ponto via STAC."""
    body = {
        "collections": [COLECAO],
        "intersects": {"type": "Point", "coordinates": [lon, lat]},
        "limit": 1,
        "sortby": [{"field": "properties.datetime", "direction": "desc"}],
    }
    try:
        req = urllib.request.Request(
            STAC, data=json.dumps(body).encode(), method="POST",
            headers={"User-Agent": UA, "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=120) as r:
            resp = json.load(r)
        feats = resp.get("features", [])
        return feats[0] if feats else None
    except Exception as e:
        print(f"  STAC falhou: {type(e).__name__}: {e}")
        return None


def _fechar_dataset(href: str) -> None:
    """Fecha e remove dataset do cache desta thread."""
    d = _cache()
    if href in d:
        try:
            d.pop(href).close()
        except Exception:
            pass


def _ler_janela(href: str, centro: tuple[float, float],
                lado_m: int, out_px: int) -> np.ndarray | None:
    """Lê janela RGB de um TIF remoto via rasterio."""
    import rasterio
    from rasterio.windows import from_bounds
    from rasterio.warp import transform_bounds

    cx, cy = centro
    dlat = lado_m / 111320.0
    dlon = lado_m / (111320.0 * math.cos(math.radians(cy)))
    sub = (cx - dlon, cy - dlat, cx + dlon, cy + dlat)
    try:
        ds = _abrir(href)
        tb = transform_bounds("EPSG:4326", ds.crs, *sub)
        w = from_bounds(*tb, transform=ds.transform)
        if w.width <= 0 or w.height <= 0:
            return None
        return ds.read(1, window=w, out_shape=(out_px, out_px))
    except Exception as e:
        _fechar_dataset(href)
        print(f"    leitura falhou: {type(e).__name__}: {e}")
        return None


def _compor_rgb(cena: dict, centro: tuple[float, float],
                escala: tuple[int, int]) -> np.ndarray | None:
    """RGB uint8 (stretch 2-98 percentile) de uma janela."""
    lado_m, out_px = escala
    canais = []
    for b in RGB_BANDS:
        href = cena.get("assets", {}).get(b, {}).get("href")
        if not href:
            return None
        arr = _ler_janela(href, centro, lado_m, out_px)
        if arr is None:
            return None
        canais.append(arr)
    r, g, bl = (c.astype(np.float32) for c in canais)
    frac_zero = float(np.mean((r == 0) | (g == 0) | (bl == 0)))
    # Limiar 0.50 (não 0.30 do coletor): bbox do banco é maior
    if frac_zero > 0.50:
        return None
    lo, hi = np.percentile(
        np.concatenate([r.ravel(), g.ravel(), bl.ravel()]), (2, 98))
    span = max(hi - lo, 1.0)
    rgb = np.stack(
        [np.clip((c - lo) / span * 255, 0, 255) for c in (r, g, bl)],
        axis=-1)
    return rgb.astype(np.uint8)


def _salvar_jpg(rgb: np.ndarray, caminho: Path) -> bool:
    """Salva RGB uint8 como JPEG."""
    try:
        from PIL import Image
        caminho.parent.mkdir(parents=True, exist_ok=True)
        Image.fromarray(rgb).save(caminho, "JPEG", quality=90)
        return True
    except Exception as e:
        print(f"    salvar falhou: {e}")
        return False


def _hash_bbx(bbox: list[float], escala: str) -> str:
    chave = f"{bbox[0]:.6f},{bbox[1]:.6f},{bbox[2]:.6f},{bbox[3]:.6f}|{escala}"
    return hashlib.sha256(chave.encode()).hexdigest()[:24]


def _ler_checkpoint() -> set[str]:
    feitos: set[str] = set()
    if not _CHECKPOINT.exists():
        return feitos
    with open(_CHECKPOINT, encoding="utf-8") as fh:
        for linha in fh:
            linha = linha.strip()
            if not linha:
                continue
            try:
                o = json.loads(linha)
                if o.get("hash"):
                    feitos.add(o["hash"])
            except json.JSONDecodeError:
                continue
    return feitos


def _gravar_checkpoint(hash_: str, escala: str, arquivo: str,
                       status: str = "ok") -> None:
    with open(_CHECKPOINT, "a", encoding="utf-8") as fh:
        fh.write(json.dumps({
            "hash": hash_, "escala": escala, "arquivo": arquivo,
            "status": status
        }, ensure_ascii=False) + "\n")


def _processar_cava(cava: dict, cena: dict, feitos: set[str],
                    stats: Estatisticas) -> None:
    """Processa uma cava (ambas as escalas)."""
    bbox = cava["bbox"]
    proc = cava["processo"].replace("/", "-")
    centro = ((bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2)
    hashes = {e: _hash_bbx(bbox, e) for e in ESCALAS}

    for escala, (lado_m, out_px) in ESCALAS.items():
        h = hashes[escala]
        if h in feitos:
            continue
        nome = f"{proc}_{escala}.jpg"
        caminho = _SAIDA / escala / nome
        rgb = _compor_rgb(cena, centro, (lado_m, out_px))
        if rgb is not None and _salvar_jpg(rgb, caminho):
            _gravar_checkpoint(h, escala, nome, "ok")
            stats.baixados += 1
            print(f"  OK {escala}: {nome}")
        else:
            _gravar_checkpoint(h, escala, nome, "falhou")
            stats.falhas += 1
            print(f"  FALHOU {escala}: {nome}")

    stats.processados += 1
    if stats.processados % 20 == 0:
        print(f"\n--- {stats.processados} processados, "
              f"{stats.baixados} baixados, {stats.falhas} falhas ---\n")


def _buscar_cena_cacheada(cx: float, cy: float,
                          cena_cache: dict[str, dict | None]) -> dict | None:
    """Busca cena com cache por região ~0.1°."""
    chave = f"{cx:.1f},{cy:.1f}"
    if chave not in cena_cache:
        cena_cache[chave] = _buscar_cena(cx, cy)
        time.sleep(PAUSA)
    return cena_cache[chave]


def main() -> int:
    parser = argparse.ArgumentParser(description="Baixa banco CBERS 2 escalas")
    parser.add_argument("--limite", type=int, default=0,
                        help="Máximo de cavas para processar (0 = todas)")
    args = parser.parse_args()

    with open(_BANCO / "banco-anm.json", encoding="utf-8") as fh:
        banco = json.load(fh)
    print(f"Banco ANM: {len(banco)} cavas")

    feitos = _ler_checkpoint()
    print(f"Checkpoint: {len(feitos)} downloads anteriores")

    stats = Estatisticas()
    cena_cache: dict[str, dict | None] = {}

    for cava in banco:
        if args.limite and stats.processados >= args.limite:
            break
        bbox = cava["bbox"]
        proc = cava["processo"].replace("/", "-")
        cx = (bbox[0] + bbox[2]) / 2
        cy = (bbox[1] + bbox[3]) / 2

        # Pula se todas as escalas já baixadas
        hashes = {e: _hash_bbx(bbox, e) for e in ESCALAS}
        if all(h in feitos for h in hashes.values()):
            stats.processados += 1
            continue

        cena = _buscar_cena_cacheada(cx, cy, cena_cache)
        if cena is None:
            stats.falhas += 1
            print(f"  sem cena: {proc}")
            stats.processados += 1
            continue

        _processar_cava(cava, cena, feitos, stats)

    print(f"\nFim: {stats.processados} cavas, "
          f"{stats.baixados} imagens, {stats.falhas} falhas")
    return 0


if __name__ == "__main__":
    sys.exit(main())
