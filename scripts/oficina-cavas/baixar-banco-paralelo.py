#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Baixa o banco CBERS em PARALELO (várias janelas simultâneas).

Por que paralelo: o download é limitado por REDE (latência do INPE
e leitura rasterio por HTTP range), não por GPU. Dá para processar
várias cavas ao mesmo tempo sem brigar por recurso — ao contrário
do treino, que satura a GPU (RTX 3050, 4 GB VRAM).

Cortesia com o INPE (robots.txt lido 25/09, regra do FONTES.md):
  - STAC (busca de cena) é SERIALIZADO por lock + pausa de 2 s.
    A maioria das cavas reusa cena em cache, então o gargalo passa
    a ser a leitura rasterio, que roda em paralelo (HTTP range,
    bytes diferentes, sem peso no rate de catálogo).
  - Workers = 3 por padrão (modesto; dá para subir com --workers).

Retomável: mesmo checkpoint do baixar-banco-cbers.py (por hash),
com lock de escrita.

Uso:
  python scripts/oficina-cavas/baixar-banco-paralelo.py --workers 4
  python scripts/oficina-cavas/baixar-banco-paralelo.py --limite 1000
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

_RAIZ = Path(__file__).resolve().parents[2]
_BANCO = _RAIZ / "scripts" / ".cache" / "cavas-banco"
_MODULO_PATH = _RAIZ / "scripts" / "oficina-cavas" / "baixar-banco-cbers.py"


def _carregar_base():
    """Importa as funções do baixar-banco-cbers (nome tem hífen)."""
    spec = importlib.util.spec_from_file_location("bc", _MODULO_PATH)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["bc"] = mod  # registra ANTES: dataclass precisa do sys.modules
    spec.loader.exec_module(mod)
    return mod


# Locks compartilhados (preenche em _preparar)
_LOCK_STAC = threading.Lock()
_LOCK_CKPT = threading.Lock()
_LOCK_STAT = threading.Lock()


def _baixa_escala(proc, escala_h, cena, centro):
    """Compõe e salva uma escala; grava no checkpoint. Retorna ok/falhou."""
    mod = mod_global
    escala, h = escala_h
    lado_m, out_px = mod.ESCALAS[escala]
    nome = f"{proc}_{escala}.jpg"
    caminho = mod._SAIDA / escala / nome
    rgb = mod._compor_rgb(cena, centro, (lado_m, out_px))
    if rgb is not None and mod._salvar_jpg(rgb, caminho):
        _ckpt(h, escala, nome, "ok")
        return "ok"
    _ckpt(h, escala, nome, "falhou")
    return "falhou"


def _trabalho(mod, cava, cena_cache, feitos):
    """Processa uma cava: busca cena (lock) + compõe as duas escalas."""
    bbox = cava["bbox"]
    proc = cava["processo"].replace("/", "-")
    centro = ((bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2)
    hashes = {e: mod._hash_bbx(bbox, e) for e in mod.ESCALAS}

    pendentes = {e: h for e, h in hashes.items() if h not in feitos}
    if not pendentes:
        return "pulado"

    cena = _cena_com_lock(mod, centro[0], centro[1], cena_cache)
    if cena is None:
        return "sem-cena"

    resultados = [_baixa_escala(proc, (e, h), cena, centro)
                  for e, h in pendentes.items()]
    return "ok" if "ok" in resultados else "falhou"


def _cena_com_lock(mod, cx, cy, cena_cache):
    """Busca cena serializada (cortesia INPE) com cache compartilhado."""
    chave = f"{cx:.1f},{cy:.1f}"
    with _LOCK_STAC:
        if chave not in cena_cache:
            cena_cache[chave] = mod._buscar_cena(cx, cy)
            import time
            time.sleep(mod.PAUSA)
        return cena_cache[chave]


def _ckpt(hash_, escala, nome, status):
    """Escreve no checkpoint com lock."""
    with _LOCK_CKPT:
        mod_global._gravar_checkpoint(hash_, escala, nome, status)
    with _LOCK_STAT:
        if status == "ok":
            mod_global_stats["ok"] += 1
        else:
            mod_global_stats["falhou"] += 1


mod_global = None  # preenchido no main
mod_global_stats = {"ok": 0, "falhou": 0}


def main() -> int:
    parser = argparse.ArgumentParser(description="Baixa banco CBERS em paralelo")
    parser.add_argument("--limite", type=int, default=0,
                        help="Máximo de cavas nesta rodada (0 = todas)")
    parser.add_argument("--workers", type=int, default=3,
                        help="Leituras rasterio simultâneas")
    args = parser.parse_args()

    global mod_global
    mod_global = _carregar_base()
    mod = mod_global

    with open(_BANCO / "banco-anm.json", encoding="utf-8") as fh:
        banco = json.load(fh)
    feitos = mod._ler_checkpoint()
    restantes = [c for c in banco
                 if any(mod._hash_bbx(c["bbox"], e) not in feitos
                        for e in mod.ESCALAS)]
    if args.limite:
        restantes = restantes[:args.limite]
    print(f"Banco: {len(banco)} | Restantes nesta rodada: {len(restantes)} "
          f"| workers={args.workers}", flush=True)

    cena_cache: dict = {}
    concluidos = 0
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = {ex.submit(_trabalho, mod, c, cena_cache, feitos): c
                   for c in restantes}
        for fut in as_completed(futures):
            try:
                fut.result()
            except Exception as e:
                print(f"  erro: {type(e).__name__}: {e}", flush=True)
            concluidos += 1
            if concluidos % 25 == 0:
                print(f"--- {concluidos}/{len(restantes)} cavas | "
                      f"ok={mod_global_stats['ok']} "
                      f"falhou={mod_global_stats['falhou']} ---", flush=True)

    print(f"\nFim: {concluidos} cavas, ok={mod_global_stats['ok']}, "
          f"falhou={mod_global_stats['falhou']}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
