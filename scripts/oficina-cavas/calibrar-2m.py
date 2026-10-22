#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Calibra o limiar do modelo 2 m por precisão, não por F1.

O treino escolhe a época pelo maior F1, e isso guarda o ponto de P 0,548
(medido 19/10). Para descoberta, o limiar útil é o de maior recall com
precisão mínima — o ponto conservador de P 0,857/R 0,429 existia, mas não
foi salvo. Este script lê os pesos salvos, recalcula as probabilidades no
MESMO split por cena (seed 42) e varre o limiar de 0,05 a 0,95.

Uso:
  python scripts/oficina-cavas/calibrar-2m.py
  python scripts/oficina-cavas/calibrar-2m.py --pesos <melhor.pt> --piso 0.90

Saída: JSON em %LOCALAPPDATA%\\Temp\\opencode\\cavas\\treino-2m\\calibracao-2m.json
Nada é escrito no repositório.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader

_RC = Path(__file__).resolve().parents[2]
_TREINO = _RC / "scripts" / "oficina-cavas" / "treinar-cavas-2m.py"
_SAIDA = (Path.home() / "AppData" / "Local" / "Temp" / "opencode" / "cavas"
          / "treino-2m")
_PESOS = _SAIDA / "melhor.pt"
_JSON = _SAIDA / "calibracao-2m.json"


def _modulo_treino():
    spec = importlib.util.spec_from_file_location("treino_2m", _TREINO)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["treino_2m"] = mod
    spec.loader.exec_module(mod)
    return mod


def _probabilidades(mod, itens, pesos: Path, recorte: int) -> tuple:
    disp = "cuda" if torch.cuda.is_available() else "cpu"
    modelo, cabeca = mod.montar_modelo(disp)
    estado = torch.load(pesos, map_location=disp)
    cabeca.load_state_dict(estado["cabeca"])
    cabeca.eval()
    loader = DataLoader(mod.Dataset2m(itens, False, recorte), batch_size=8)
    probs, labs = [], []
    for x, y in loader:
        with torch.no_grad():
            emb = mod._features(type("Ctx", (), {"modelo": modelo, "disp": disp})(), x)
            p = torch.sigmoid(cabeca(emb.float()).squeeze(-1)).cpu().numpy()
        probs.extend(np.asarray(p).tolist())
        labs.extend(y.numpy().tolist())
    return np.asarray(probs), np.asarray(labs)


def _varredura(mod, probs, labs) -> list[dict]:
    saida = []
    for i in range(5, 96):
        t = round(i / 100, 2)
        m = mod._metricas(probs, labs, t)
        m["limiar"] = t
        saida.append(m)
    return saida


def _melhor(tabela: list[dict], chave: str) -> dict | None:
    if not tabela:
        return None
    return max(tabela, key=lambda m: m[chave])


def _com_piso(tabela: list[dict], piso: float) -> dict | None:
    validos = [m for m in tabela if m["precisao"] >= piso]
    if not validos:
        return None
    return max(validos, key=lambda m: m["recall"])


def main() -> int:
    ap = argparse.ArgumentParser(description="Calibra limiar do modelo 2 m")
    ap.add_argument("--pesos", type=Path, default=_PESOS)
    ap.add_argument("--recorte", type=int, default=224)
    ap.add_argument("--piso", type=float, default=0.90)
    args = ap.parse_args()
    if not args.pesos.exists():
        print(f"pesos ausentes: {args.pesos}", flush=True)
        return 1

    mod = _modulo_treino()
    itens = mod.carregar_entradas()
    _, val, n_cenas = mod.split_por_cena(itens, 0.2, seed=42)
    pos = sum(1 for i in val if i["label"] == 1)
    print(f"val={len(val)} (pos {pos}/neg {len(val) - pos}) cenas={n_cenas}",
          flush=True)
    probs, labs = _probabilidades(mod, val, args.pesos, args.recorte)
    tabela = _varredura(mod, probs, labs)
    escolhido = _com_piso(tabela, args.piso)
    res = {
        "n_val": len(val),
        "pos": pos,
        "neg": len(val) - pos,
        "n_cenas": n_cenas,
        "recorte": args.recorte,
        "piso": args.piso,
        "melhor_f1": _melhor(tabela, "f1"),
        "melhor_com_piso": escolhido,
        "max_precisao": _melhor(tabela, "precisao"),
        "tabela": tabela,
    }
    _JSON.parent.mkdir(parents=True, exist_ok=True)
    _JSON.write_text(json.dumps(res, indent=2, ensure_ascii=False),
                     encoding="utf-8")
    print(f"melhor F1: {res['melhor_f1']}", flush=True)
    print(f"P>={args.piso}: {escolhido}", flush=True)
    print(f"salvo em {_JSON}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
