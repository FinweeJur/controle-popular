#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Recorta o PAN 2 m dos casos do gold set, sem contaminar o treino.

Por que existe: o CSV de revisão tem 34 casos (24 positivos + 10 controles),
mas o revisor precisa da imagem. O gerador de treino escreve no checkpoint e
não pode receber o gold set (vazaria a avaliação). Este script usa as mesmas
funções de corte, grava em `scripts/.cache/cavas-2m/gold-set/imagens/` e deixa
um manifesto `imagens-gold.jsonl`.

Uso:
  python scripts/oficina-cavas/recortar-gold-2m.py --limite 1
  python scripts/oficina-cavas/recortar-gold-2m.py
"""
from __future__ import annotations

import argparse
import csv
import importlib.util
import json
import sys
import time
from pathlib import Path

_RC = Path(__file__).resolve().parents[2]
_GOLD = (_RC / "scripts" / ".cache" / "cavas-2m" / "gold-set"
         / "revisao-gold-enriquecido.csv")
_SAIDA = _RC / "scripts" / ".cache" / "cavas-2m" / "gold-set"
_IMG = _SAIDA / "imagens"
_MANIFESTO = _SAIDA / "imagens-gold.jsonl"
_GERADOR = _RC / "scripts" / "oficina-cavas" / "gerar-recortes-2m-rotulados.py"


def _modulo():
    spec = importlib.util.spec_from_file_location("gerador_2m", _GERADOR)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["gerador_2m"] = mod
    spec.loader.exec_module(mod)
    mod.base = mod._carregar_base()
    return mod


def _ler_gold(limite: int) -> list[dict]:
    if not _GOLD.exists():
        return []
    rows = list(csv.DictReader(_GOLD.read_text(encoding="utf-8-sig").splitlines()))
    return rows[:limite] if limite else rows


def _feitos() -> set:
    if not _MANIFESTO.exists():
        return set()
    ok = set()
    for linha in _MANIFESTO.read_text(encoding="utf-8").splitlines():
        try:
            o = json.loads(linha)
        except json.JSONDecodeError:
            continue
        if o.get("status") == "ok":
            ok.add(o.get("id"))
    return ok


def _uma(g, row: dict) -> dict:
    lon, lat = float(row["lon"]), float(row["lat"])
    cenas = g._buscar_cenas(lon, lat)
    for c in cenas:
        c["_centro"] = (lon, lat)
    pan, nuvem = g._melhor(cenas)
    base = {"id": row["id"], "papel": row["papel"], "lat": lat, "lon": lon}
    if pan is None:
        return {**base, "status": "sem-cena"}
    destino = _IMG / f"{row['id']}.png"
    g._salva(pan, destino)
    return {**base, "status": "ok", "nuvem": round(nuvem, 3),
            "arquivo": destino.name, "cena": cenas[0].get("id") if cenas else ""}


def main() -> int:
    ap = argparse.ArgumentParser(description="Recortes 2 m do gold set")
    ap.add_argument("--limite", type=int, default=0)
    ap.add_argument("--pausa", type=int, default=2)
    args = ap.parse_args()
    _IMG.mkdir(parents=True, exist_ok=True)
    g = _modulo()
    feitos = _feitos()
    rows = _ler_gold(args.limite)
    print(f"gold: {len(rows)} | ja ok: {len(feitos)}", flush=True)
    for row in rows:
        if row["id"] in feitos:
            continue
        res = _uma(g, row)
        with _MANIFESTO.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(res, ensure_ascii=False) + "\n")
        print(f"  {row['id']}: {res['status']}", flush=True)
        time.sleep(args.pausa)
    return 0


if __name__ == "__main__":
    sys.exit(main())
