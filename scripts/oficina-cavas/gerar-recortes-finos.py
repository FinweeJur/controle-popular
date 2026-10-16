#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera recortes FINOS (PAN 2 m) centrados nas cavas ANM do banco.

Por que existe (medido 15/10/2026): a resolução BAND0 (pan Cromática) do
CBERS-4A/WPM é 2,00 m/px, 4x mais fina que o multiespectral (8 m). Os
recortes de 4,3 km a 8 m que o modelo v7 vê NÃO separam mina de lavoura —
a assinatura de cor deu solo nu 0,97 nos dois casos. Já a geometria de uma
cava (parede, degrau de lavra, água no fundo, estrada de acesso) só aparece
em alta resolução. Este script corta o PAN em ~1400 m de lado (~700 px),
centrado no centroide de cada cava do banco ANM.

Saída: scripts/.cache/cavas-finos/pan/<processo>.png (uint8, stretch 2-98).
Registro em checkpoint-finos.jsonl com umidade de nuvem medida no próprio
corte — retomável por hash.

Reusa a busca de cena e o cache rasterio thread-local do baixar-banco-cbers.py
(por importlib, nome com hífen). Cortesia INPE mantida: STAC serializado com
pausa; as leituras de janela rodam em até --workers threads (rede, não GPU).

Uso:
  python scripts/oficina-cavas/gerar-recortes-finos.py --limite 20
  python scripts/oficina-cavas/gerar-recortes-finos.py --workers 2
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import numpy as np

_RAIZ = Path(__file__).resolve().parents[2]
_BANCO_DIR = _RAIZ / "scripts" / ".cache" / "cavas-banco"
_BASE_PATH = _RAIZ / "scripts" / "oficina-cavas" / "baixar-banco-cbers.py"
_SAIDA = _RAIZ / "scripts" / ".cache" / "cavas-finos"
_PAN = _SAIDA / "pan"
_CHECKPOINT = _SAIDA / "checkpoint-finos.jsonl"

SIDE_M = 1400      # lado do recorte em metros (~1,4 km)
OUT_PX = 700       # 700 px a 2 m = 1400 m
PAUSA = 2          # cortesia por cena nova (STAC)

_LOCK_STAC = threading.Lock()
_LOCK_CKPT = threading.Lock()
_lock_stat = threading.Lock()
_stats = {"ok": 0, "falhou": 0, "sem-cena": 0, "stac-erro": 0}
base = None        # módulo baixar-banco-cbers carregado no main

# Nodata máximo aceito num recorte (medido 15/10: a cena mais nova da cava
# 833364-2012 tinha 92% de buraco no PAN; as anteriores, 0%. Escolher só a
# mais recente corta preto. Tentar até 3 e pegar a primeira coberta.)
NODATA_MAX = 0.20
CANDIDATAS = 6
# Contraste mínimo: corte plano/preto (DN constante) colapsa no stretch e sai
# todo 0 — descarta. Nuvem NÃO é porta de entrada: o cloud_cover do INPE vem
# nulo e o proxy de brilho em cinza é fraco; só registramos o número p/ triagem
# humana. (Medido 15/10: um recorte com metade de nuvem dava 0.0 na métrica de
# textura — por isso não gateamos por ela.)
CONTRASTE_MIN = 8.0   # desvio-padrão do PAN (0-255) mínimo p/ ter estrutura


def _carregar_base():
    spec = importlib.util.spec_from_file_location("bc", _BASE_PATH)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["bc"] = mod  # dataclass do base precisa estar registrado
    spec.loader.exec_module(mod)
    return mod


def _hash_centroide(cx: float, cy: float) -> str:
    return hashlib.sha256(f"{cx:.5f},{cy:.5f}".encode()).hexdigest()[:24]


def _ler_checkpoint() -> set:
    feitos = set()
    if not _CHECKPOINT.exists():
        return feitos
    for linha in _CHECKPOINT.read_text(encoding="utf-8").splitlines():
        if not linha.strip():
            continue
        try:
            o = json.loads(linha)
            # stac-erro NAO conta como feito: a cena pode existir, a consulta
            # e que falhou. Medido 16/10: 14 resets (WinError 10054) em 37 h
            # de rodada; com o cache antigo, cada reset contaminava uma regiao
            # inteira como "sem-cena" e a retomada pulava tudo.
            if o.get("hash") and o.get("status") in ("ok", "sem-cena"):
                feitos.add(o["hash"])
        except json.JSONDecodeError:
            continue
    return feitos


def _gravar(hash_: str, arquivo: str, status: str, nuvem: float = 0.0) -> None:
    with _LOCK_CKPT:
        with open(_CHECKPOINT, "a", encoding="utf-8") as fh:
            fh.write(json.dumps({"hash": hash_, "arquivo": arquivo,
                                 "status": status, "nuvem": round(nuvem, 3)},
                                ensure_ascii=False) + "\n")
    with _lock_stat:
        if status in _stats:
            _stats[status] += 1
        else:
            _stats["falhou"] += 1


def _buscar_cenas(cx: float, cy: float, k: int = CANDIDATAS):
    """STAC: as k cenas mais recentes cujo footprint cobre o ponto."""
    import urllib.request
    body = {
        "collections": [base.COLECAO],
        "intersects": {"type": "Point", "coordinates": [cx, cy]},
        "limit": k,
        "sortby": [{"field": "properties.datetime", "direction": "desc"}],
    }
    req = urllib.request.Request(
        base.STAC, data=json.dumps(body).encode(), method="POST",
        headers={"User-Agent": base.UA, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.load(r).get("features", [])
    except Exception as e:
        # None = a consulta FALHOU (rede/reset); [] = consultou e nao ha cena.
        # Confundir os dois perdia cavas boas em silencio (ver _ler_checkpoint).
        print(f"  STAC falhou: {type(e).__name__}: {e}")
        return None


def _cenas(cx: float, cy: float, cache: dict):
    """Candidatas serializadas (cortesia INPE) com cache por região ~0.1°.

    So cacheia resposta VALIDA: erro de rede fica de fora do cache e a
    proxima cava da mesma regiao tenta de novo (corrigido 16/10)."""
    chave = f"{cx:.1f},{cy:.1f}"
    with _LOCK_STAC:
        if chave not in cache:
            resposta = _buscar_cenas(cx, cy)
            if resposta is not None:
                cache[chave] = resposta
            time.sleep(PAUSA)
            return resposta
        return cache[chave]


def _recorta_pan(href: str, cx: float, cy: float) -> np.ndarray | None:
    """Lê janela PAN (BAND0) de ~SIDE_M em volta do centroide."""
    import rasterio
    from rasterio.windows import from_bounds
    from rasterio.warp import transform_bounds

    dlat = SIDE_M / 111320.0
    dlon = SIDE_M / (111320.0 * math.cos(math.radians(cy)))
    sub = (cx - dlon, cy - dlat, cx + dlon, cy + dlat)
    try:
        ds = base._abrir(href)
        tb = transform_bounds("EPSG:4326", ds.crs, *sub)
        w = from_bounds(*tb, transform=ds.transform)
        if w.width <= 0 or w.height <= 0:
            return None
        return ds.read(1, window=w, out_shape=(OUT_PX, OUT_PX))
    except Exception as e:
        base._fechar_dataset(href)
        print(f"    leitura PAN falhou: {type(e).__name__}: {e}")
        return None


def _nuvem(pan: np.ndarray) -> float:
    """Proxy fraco de nuvem em PAN (cinza, sem NIR, cloud_cover do INPE nulo).

    Nuvem = mancha CLARA e grande. Fração de pixels acima de 0.62 * p99.
    É heurística, não prova: terra clara também pontua. Por isso NUVEM_MAX é
    folgado e a escolha é só "a menos clara" entre as cobertas — a confirmação
    final de céu limpo continua humana (regra §7). Medido 15/10: a métrica de
    "bloco liso" (std baixo) NÃO pegava nuvem texturizada (dava 0.0 num recorte
    com metade de nuvem); a de brilho puro pega.
    """
    p = pan.astype(np.float32)
    topo = float(np.percentile(p, 99))
    if topo <= 0:
        return 0.0
    return float(np.mean(p > 0.62 * topo))


def _contraste(pan: np.ndarray) -> float:
    return float(pan.std())


def _salva_png(pan: np.ndarray, caminho: Path) -> None:
    from PIL import Image
    lo, hi = np.percentile(pan, (2, 98))
    est = np.clip((pan - lo) / max(hi - lo, 1) * 255, 0, 255).astype(np.uint8)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(est, mode="L").save(caminho)


def _cobertura(pan: np.ndarray) -> float:
    """Fração de pixels com dado real (não-nodata) no recorte."""
    return float(np.mean(pan != 0))


def _serve(pan) -> bool:
    return (_cobertura(pan) >= (1.0 - NODATA_MAX)
            and _contraste(pan) >= CONTRASTE_MIN)


def _primeira_boa(cenas: list, cx: float, cy: float, max_tenta: int = 3):
    """Primeira candidata (mais recente primeiro) com cobertura+contraste.

    Não varre todas as cenas: ler janela de um PAN de 57 mil px custa ~50 s,
    então tentamos no máximo `max_tenta` e pegamos a primeira boa. A nuvem não
    é porta de entrada — o INPE devolve cloud_cover nulo e o proxy de brilho
    em cinza é fraco; guardamos só o número no checkpoint para a triagem humana
    decidir (regra §7: não afirmar céu limpo sem ver).
    """
    for cena in cenas[:max_tenta]:
        href = cena.get("assets", {}).get("BAND0", {}).get("href")
        if not href:
            continue
        pan = _recorta_pan(href, cx, cy)
        if pan is not None and _serve(pan):
            return pan
    return None


def _trabalha(cava: dict, feitos: set, cache: dict) -> None:
    proc = cava["processo"].replace("/", "-")
    bbox = cava["bbox"]
    cx = (bbox[0] + bbox[2]) / 2
    cy = (bbox[1] + bbox[3]) / 2
    h = _hash_centroide(cx, cy)
    if h in feitos:
        return
    cenas = _cenas(cx, cy, cache)
    if cenas is None:
        # consulta falhou: registra e segue; a retomada tenta outra vez
        _gravar(h, f"{proc}.png", "stac-erro")
        return
    pan = _primeira_boa(cenas, cx, cy) if cenas else None
    if pan is None:
        _gravar(h, f"{proc}.png", "sem-cena")
        return
    _salva_png(pan, _PAN / f"{proc}.png")
    _gravar(h, f"{proc}.png", "ok", _nuvem(pan))


def main() -> int:
    global base
    ap = argparse.ArgumentParser(description="Recortes finos PAN 2m das cavas")
    ap.add_argument("--limite", type=int, default=0)
    ap.add_argument("--workers", type=int, default=2)
    args = ap.parse_args()

    base = _carregar_base()
    with open(_BANCO_DIR / "banco-anm.json", encoding="utf-8") as fh:
        banco = json.load(fh)
    feitos = _ler_checkpoint()
    pend = [c for c in banco
            if _hash_centroide((c["bbox"][0] + c["bbox"][2]) / 2,
                               (c["bbox"][1] + c["bbox"][3]) / 2) not in feitos]
    if args.limite:
        pend = pend[:args.limite]
    print(f"banco: {len(banco)} | pendentes: {len(pend)} | workers={args.workers}",
          flush=True)

    cache: dict = {}
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = [ex.submit(_trabalha, c, feitos, cache) for c in pend]
        for i, fut in enumerate(as_completed(futs), 1):
            try:
                fut.result()
            except Exception as e:
                print(f"  erro: {type(e).__name__}: {e}", flush=True)
            if i % 25 == 0:
                print(f"--- {i}/{len(pend)} | ok={_stats['ok']} "
                      f"sem-cena={_stats['sem-cena']} "
                      f"falhou={_stats['falhou']} ---", flush=True)
    print(f"\nFim: ok={_stats['ok']} sem-cena={_stats['sem-cena']} "
          f"falhou={_stats['falhou']}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
