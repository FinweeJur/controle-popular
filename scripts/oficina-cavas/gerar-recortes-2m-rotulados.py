#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera recortes FINOS (PAN 2 m) ROTULADOS a partir do dataset de calibração.

Por que existe (medido 15/10): o banco ANM é só positivo (processos
autorizados); sem negativo em 2 m o modelo reaprende "chão pelado = cava".
O dataset de calibração JÁ tem os dois lados com coordenada: tipo=positivo
(cava ANM) e tipo=negativo (ponto fora de todo SIGBMINE, verificado por duas
fontes). Este script corta o PAN 2 m no centroide de cada um e grava com o
rótulo, num checkpoint próprio — assim o treino de alta resolução tem par.

Reusa o _abrir (cache rasterio thread-local) e as constantes do
baixar-banco-cbers.py por importlib (nome tem hífen). Guardas vindos de
defeito real: nodata (cena com buraco corta preto), contraste (DN constante
colapsa). A nuvem é só número no checkpoint — triagem humana, não porta
(regra §7; cloud_cover do INPE vem nulo).

Cenas do checkpoint de calibração alimentam o split por cena do treino: cada
linha guarda `cena`, então o holdout pode vedar cena inteira (nunca por
imagem — vazaria).

Uso:
  python scripts/oficina-cavas/gerar-recortes-2m-rotulados.py --limite 8
Saida: scripts/.cache/cavas-2m/{positivo,negativo}/<hash>.png
       scripts/.cache/cavas-2m/checkpoint-2m.jsonl
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import math
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import numpy as np

_RAIZ = Path(__file__).resolve().parents[2]
_CALIB = _RAIZ / "scripts" / ".cache" / "cavas-calibracao"
_BASE_PATH = _RAIZ / "scripts" / "oficina-cavas" / "baixar-banco-cbers.py"
_SAIDA = _RAIZ / "scripts" / ".cache" / "cavas-2m"
_CHECKPOINT = _SAIDA / "checkpoint-2m.jsonl"
_LOCK = _SAIDA / "coleta.lock"

SIDE_M = 1400
OUT_PX = 700
PAUSA = 2
NODATA_MAX = 0.20
CONTRASTE_MIN = 8.0
CANDIDATAS = 4
_MAX_TENTA = 3

_lock_stac = threading.Lock()
_lock_ckpt = threading.Lock()
_stats = {"ok": 0, "sem-cena": 0, "falhou": 0}
base = None
_cena_cache: dict = {}


def _carregar_base():
    spec = importlib.util.spec_from_file_location("bc", _BASE_PATH)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["bc"] = mod
    spec.loader.exec_module(mod)
    return mod


def _buscar_cenas(cx: float, cy: float, k: int = CANDIDATAS):
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
        print(f"  STAC falhou: {type(e).__name__}: {e}")
        return []


def _cenas(cx: float, cy: float):
    chave = f"{cx:.1f},{cy:.1f}"
    with _lock_stac:
        if chave not in _cena_cache:
            _cena_cache[chave] = _buscar_cenas(cx, cy)
            time.sleep(PAUSA)
        return _cena_cache[chave]


def _recorta_pan(href: str, cx: float, cy: float):
    from rasterio.windows import from_bounds
    from rasterio.warp import transform_bounds
    dlat = SIDE_M / 111320.0
    dlon = SIDE_M / (111320.0 * math.cos(math.radians(cy)))
    sub = (cx - dlon, cy - dlat, cx + dlon, cy + dlat)
    try:
        ds = base._abrir(href)
        w = from_bounds(*transform_bounds("EPSG:4326", ds.crs, *sub),
                        transform=ds.transform)
        if w.width <= 0 or w.height <= 0:
            return None
        return ds.read(1, window=w, out_shape=(OUT_PX, OUT_PX))
    except Exception:
        base._fechar_dataset(href)
        return None


def _serve(pan) -> bool:
    return (float(np.mean(pan != 0)) >= (1.0 - NODATA_MAX)
            and float(pan.std()) >= CONTRASTE_MIN)


def _nuvem(pan) -> float:
    topo = float(np.percentile(pan, 99))
    return 0.0 if topo <= 0 else float(np.mean(pan.astype(np.float32) > 0.62 * topo))


def _pan_de(cena):
    """PAN recortado da cena (None se sem banda ou leitura falhar)."""
    href = cena.get("assets", {}).get("BAND0", {}).get("href")
    if not href:
        return None
    return _recorta_pan(href, *cena["_centro"])


def _menos_nuvem(candidatas):
    """Escolhe (pan, nuvem) de menor nuvem; (None, 1.0) se lista vazia."""
    if not candidatas:
        return None, 1.0
    return min(candidatas, key=lambda t: t[1])


def _melhor(cenas):
    """Entre as primeiras cobertas, a de MENOS nuvem (set de treino limpo).

    Cada janela de PAN custa ~40 s num TIF de 57 mil px, então só tento
    _MAX_TENTA cenas; se vier praticamente limpa (<=0.02), paro cedo.
    """
    candidatas = []
    for cena in cenas[:_MAX_TENTA]:
        pan = _pan_de(cena)
        if pan is not None and _serve(pan):
            par = (pan, _nuvem(pan))
            candidatas.append(par)
            if par[1] <= 0.02:
                break
    return _menos_nuvem(candidatas)


def _salva(pan, caminho: Path) -> None:
    from PIL import Image
    lo, hi = np.percentile(pan, (2, 98))
    est = np.clip((pan - lo) / max(hi - lo, 1) * 255, 0, 255).astype(np.uint8)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(est, mode="L").save(caminho)


def _gravar(rec: dict, ok: bool) -> None:
    with _lock_ckpt:
        with open(_CHECKPOINT, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
    if ok:
        _stats["ok"] += 1
    else:
        _stats[rec["status"]] += 1


def _pid_vivo(pid: int) -> bool:
    """True se o PID existe e é de outro processo vivo."""
    if pid <= 0:
        return False
    try:
        import psutil
        return psutil.pid_exists(pid) and psutil.Process(pid).is_running()
    except Exception:
        return True


def _trava_estrangeira(pid: int) -> bool:
    """True se o PID do lock é de outro processo vivo."""
    return bool(pid) and pid != os.getpid() and _pid_vivo(pid)


def _adquirir_trava() -> bool:
    """Um gerador por cache: evita PNG truncado e linha duplicada.

    Medido 20/10: o supervisor e a execução manual podem rodar juntos; sem
    trava, os dois leem o mesmo `_ler_feitos` antes das appends e recortam o
    mesmo hash. Trava órfã (PID morto) é reciclada.
    """
    if _LOCK.exists():
        try:
            pid = int(json.loads(_LOCK.read_text(encoding="utf-8")).get("pid", 0))
        except (OSError, ValueError, json.JSONDecodeError):
            pid = 0
        if _trava_estrangeira(pid):
            return False
    _LOCK.parent.mkdir(parents=True, exist_ok=True)
    _LOCK.write_text(json.dumps({"pid": os.getpid(), "ts": time.time()}),
                     encoding="utf-8")
    return True


def _liberar_trava() -> None:
    try:
        if _LOCK.exists():
            dados = json.loads(_LOCK.read_text(encoding="utf-8"))
            if int(dados.get("pid", -1)) == os.getpid():
                _LOCK.unlink()
    except (OSError, ValueError, json.JSONDecodeError):
        pass


def _ler_feitos(apenas_ok: bool = False) -> set:
    """Hashes já tentados, para não repetir a mesma fila.

    Por padrão inclui `sem-cena`: sem isso os 48 pontos sem cena do começo da
    lista eram retentados em todo run e a fila nunca avançava (medido 19/10).
    `apenas_ok=True` volta a tentar os sem-cena (cena nova pode ter aparecido).
    """
    if not _CHECKPOINT.exists():
        return set()
    alvos = {"ok"} if apenas_ok else {"ok", "sem-cena"}
    feito = set()
    for linha in _CHECKPOINT.read_text(encoding="utf-8").splitlines():
        if not linha.strip():
            continue
        try:
            o = json.loads(linha)
            if o.get("status") in alvos:
                feito.add(o["hash"])
        except json.JSONDecodeError:
            continue
    return feito


def _trabalha(item: dict) -> None:
    bbox = item.get("bbox") or [0, 0, 0, 0]
    cx = (bbox[0] + bbox[2]) / 2
    cy = (bbox[1] + bbox[3]) / 2
    tipo = item["tipo"]
    label = 1 if tipo == "positivo" else 0
    cenas = _cenas(cx, cy)
    for c in cenas:
        c["_centro"] = (cx, cy)
    pan, nuvem = _melhor(cenas)
    base = {"hash": item["hash"], "lon": round(cx, 6), "lat": round(cy, 6),
            "tipo": tipo, "label": label, "cena": item.get("cena")}
    if pan is None:
        _gravar({**base, "status": "sem-cena"}, False)
        return
    _salva(pan, _SAIDA / tipo / f"{item['hash']}.png")
    _gravar({**base, "arquivo": f"{item['hash']}.png",
             "nuvem": round(nuvem, 3), "status": "ok"}, True)


def _usavel(o: dict) -> bool:
    return (bool(o.get("hash")) and o.get("tipo") in ("positivo", "negativo")
            and bool(o.get("bbox")))


def _carrega_calib(limite: int):
    ck = _CALIB / "checkpoint.jsonl"
    if not ck.exists():
        return []
    out = []
    for linha in ck.read_text(encoding="utf-8").splitlines():
        if not linha.strip():
            continue
        try:
            o = json.loads(linha)
        except json.JSONDecodeError:
            continue
        if _usavel(o):
            out.append(o)
    return out[:limite] if limite else out


def _from_manifesto(o: dict):
    """Linha do manifesto publicado (lon/lat/tipo) -> item de corte."""
    if not o.get("hash"):
        return None
    if o.get("lon") is None:
        return None
    if o.get("tipo") not in ("positivo", "negativo"):
        return None
    lon, lat = o["lon"], o["lat"]
    return {"hash": o["hash"], "tipo": o["tipo"], "cena": o.get("cena"),
            "bbox": [lon, lat, lon, lat]}


def _carrega_manifesto(limite: int, caminho: Path | None = None):
    """Item pra REGERAR os hashes que a outra máquina publicou (só a lista)."""
    pub = caminho or (_RC / "scripts" / "dados" / "cavas-2m"
                      / "checkpoint-2m.jsonl")
    if not pub.exists():
        return []
    out = []
    for linha in pub.read_text(encoding="utf-8").splitlines():
        if not linha.strip():
            continue
        try:
            o = json.loads(linha)
        except json.JSONDecodeError:
            continue
        item = _from_manifesto(o)
        if item:
            out.append(item)
    return out[:limite] if limite else out


def _fonte_de(args):
    if args.fonte == "manifesto":
        return lambda n: _carrega_manifesto(n, args.manifesto)
    return _carrega_calib


def _seleciona(args, feitos) -> list[dict]:
    """Universo da fonte -> tira feitos -> filtra tipo -> aplica limite."""
    alvos = [o for o in _fonte_de(args)(0) if o["hash"] not in feitos]
    if args.tipo != "ambos":
        alvos = [o for o in alvos if o.get("tipo") == args.tipo]
    return alvos[:args.limite] if args.limite else alvos


def _executar(alvos: list[dict], workers: int) -> None:
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = [ex.submit(_trabalha, o) for o in alvos]
        for i, fut in enumerate(as_completed(futs), 1):
            _colhe(fut, i, len(alvos))


def _colhe(fut, i: int, total: int) -> None:
    try:
        fut.result()
    except Exception as e:
        _stats["falhou"] += 1
        print(f"  erro: {type(e).__name__}: {e}", flush=True)
    if i % 25 == 0:
        print(f"--- {i}/{total} | ok={_stats['ok']} "
              f"sem-cena={_stats['sem-cena']} ---", flush=True)


def main() -> int:
    global base
    ap = argparse.ArgumentParser(description="Recortes 2m PAN rotulados")
    ap.add_argument("--limite", type=int, default=0)
    ap.add_argument("--workers", type=int, default=2,
                    help="1 respeita o ritmo de 1-2 s por host; 2 só se a rede ajudar")
    ap.add_argument("--retentar-sem-cena", action="store_true",
                    help="volta a tentar hashes que já deram sem-cena")
    ap.add_argument("--fonte", choices=("calib", "manifesto"), default="calib",
                    help="calib=meu dataset; manifesto=regerar lista da outra máquina")
    ap.add_argument("--manifesto", type=Path, default=None,
                    help="caminho do manifesto p/ --fonte manifesto (default: versionado)")
    ap.add_argument("--tipo", choices=("ambos", "positivo", "negativo"),
                    default="ambos",
                    help="só corta desse tipo (negativo=destrava o treino honesto)")
    args = ap.parse_args()

    if not _adquirir_trava():
        print("outra coleta 2m está rodando; saindo sem tocar no cache",
              flush=True)
        return 0
    try:
        base = _carregar_base()
        alvos = _seleciona(args, _ler_feitos(apenas_ok=args.retentar_sem_cena))
        print(f"{args.fonte}/{args.tipo} pendentes: {len(alvos)} "
              f"| workers={args.workers}", flush=True)
        _executar(alvos, args.workers)
        print(f"\nFim: ok={_stats['ok']} sem-cena={_stats['sem-cena']} "
              f"falhou={_stats['falhou']}", flush=True)
        return 0
    finally:
        _liberar_trava()


if __name__ == "__main__":
    sys.exit(main())
