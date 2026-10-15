#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Calibra o modelo v7 de cavas com temperature scaling.

Problema medido em 14/10/2026: o modelo v7 tem logits comprimidos
(std=0.030 no cabeçalho), resultando em sigmoid máximo ~0.658.
Isso impede usar limiares mais rígidos (0.70+).

Solução: temperature scaling — divide os logits por T < 1 antes do
sigmoid, "esticando" a distribuição sem mudar a ordem dos exemplos.

O T é otimizado no holdout para minimizar o NLL (negative log-likelihood),
que é a métrica padrão de calibração.

Uso:
  python scripts/oficina-cavas/calibrar-modelo.py --otimizar
  python scripts/oficina-cavas/calibrar-modelo.py --temperatura 0.5
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path

import torch
import torch.nn.functional as F

_RAIZ = Path(__file__).resolve().parents[2]
_MODELO = Path(r"C:\Users\teste\AppData\Local\Temp\opencode\cavas\treino-v7\melhor.pt")
_SPLIT = _RAIZ / "scripts" / ".cache" / "cavas-treino" / "split.json"
_SAIDA = Path(r"C:\Users\teste\AppData\Local\Temp\opencode\cavas\treino-v7\calibrado.json")
_SCRIPT_TREINO = _RAIZ / "scripts" / "treinar-cavas-chinese-clip.py"
_DIR_CLIP = Path(r"C:\Users\teste\AppData\Local\Temp\opencode\cavas\chinese-clip")


def _carregar_modulo():
    """Carrega o script de treino como módulo (nome tem hífen)."""
    spec = importlib.util.spec_from_file_location("treinar_cavas", _SCRIPT_TREINO)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _carregar_modelo(mod):
    """Carrega modelo v7 (Chinese-CLIP + Linear head)."""
    dispositivo = "cuda" if torch.cuda.is_available() else "cpu"
    modelo, processador = mod.carregar_modelo(_DIR_CLIP, dispositivo)
    cabeca = mod.cabeca_classificacao(512).to(dispositivo)

    ck = torch.load(_MODELO, map_location=dispositivo, weights_only=False)
    modelo.load_state_dict(ck["modelo"])
    cabeca.load_state_dict(ck["cabeca"])
    modelo.eval()
    cabeca.eval()
    return modelo, cabeca, processador, dispositivo


def _carregar_holdout(mod):
    """Carrega imagens do holdout (split por cena)."""
    cache = _RAIZ / "scripts" / ".cache" / "cavas-calibracao"
    dados = mod.carregar_registros(cache, nuvem_max=0.20)
    split = json.loads(_SPLIT.read_text())
    # split.json usa "val" com caminhos tipo "positivo/hash.jpg"
    val_paths = set(split.get("val", []))

    def _relativo(d):
        # Converte caminho absoluto para "tipo/hash.jpg"
        parts = Path(d["arquivo"]).parts
        # Encontra "recortes" no caminho
        try:
            idx = parts.index("recortes")
            return "/".join(parts[idx + 1:])
        except ValueError:
            return d["arquivo"]

    holdout = [d for d in dados if _relativo(d) in val_paths]
    return holdout


def _extrair_logits(modelo, cabeca, ctx, holdout):
    """Extrai logits do holdout uma vez só.
    
    ctx: dict com processador e dispositivo.
    """
    processador = ctx["processador"]
    dispositivo = ctx["dispositivo"]
    logits_list = []
    labels_list = []

    for item in holdout:
        from PIL import Image
        import torch.nn.functional as F_
        img = Image.open(item["arquivo"]).convert("RGB")
        inputs = processador(images=[img], return_tensors="pt")
        pv = inputs["pixel_values"].to(dispositivo)
        with torch.no_grad():
            out = modelo.get_image_features(pixel_values=pv)
            # MESMO caminho do treino e do analisar: pooler + F.normalize(L2).
            emb = F_.normalize(out.pooler_output, dim=-1)
            logit = cabeca(emb.float()).squeeze(-1).item()
        logits_list.append(logit)
        labels_list.append(item["rotulo"])

    return torch.tensor(logits_list), torch.tensor(labels_list, dtype=torch.float32)


def _otimizar_temperatura(logits, labels):
    """Acha T que minimiza NLL no holdout (T em 0.1 a 5.0)."""
    melhor_t = 1.0
    melhor_nll = float("inf")
    for i in range(50):
        t = 0.1 + (5.0 - 0.1) * i / 50
        scaled = logits / t
        nll = F.binary_cross_entropy_with_logits(scaled, labels).item()
        if nll < melhor_nll:
            melhor_nll = nll
            melhor_t = t
    return melhor_t, melhor_nll


def _avaliar(logits, labels, temperatura):
    """Avalia métricas com temperatura aplicada."""
    scaled = logits / temperatura
    probs = torch.sigmoid(scaled).numpy()
    labs = labels.numpy()

    metricas = {}
    for limiar in [0.5, 0.6, 0.7, 0.8, 0.9]:
        preds = (probs >= limiar).astype(int)
        tp = int(((preds == 1) & (labs == 1)).sum())
        fp = int(((preds == 1) & (labs == 0)).sum())
        fn = int(((preds == 0) & (labs == 1)).sum())
        tn = int(((preds == 0) & (labs == 0)).sum())
        precisao = tp / max(tp + fp, 1)
        recall = tp / max(tp + fn, 1)
        f1 = 2 * precisao * recall / max(precisao + recall, 1e-8)
        metricas[limiar] = {
            "precisao": round(precisao, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "tp": tp, "fp": fp, "fn": fn, "tn": tn,
        }
    return metricas


def main() -> int:
    parser = argparse.ArgumentParser(description="Calibra modelo v7")
    parser.add_argument("--temperatura", type=float, default=None,
                        help="Temperatura fixa")
    parser.add_argument("--otimizar", action="store_true",
                        help="Otimiza temperatura no holdout")
    args = parser.parse_args()

    print("Carregando módulo de treino...")
    mod = _carregar_modulo()

    print("Carregando modelo v7...")
    modelo, cabeca, processador, dispositivo = _carregar_modelo(mod)
    print(f"  Dispositivo: {dispositivo}")
    ctx = {"processador": processador, "dispositivo": dispositivo}

    print("Carregando holdout...")
    holdout = _carregar_holdout(mod)
    print(f"  {len(holdout)} imagens no holdout")

    print("Extraindo logits...")
    logits, labels = _extrair_logits(modelo, cabeca, ctx, holdout)

    if args.temperatura:
        t = args.temperatura
        print(f"Usando temperatura fixa: {t}")
    elif args.otimizar:
        print("Otimizando temperatura...")
        t, nll = _otimizar_temperatura(logits, labels)
        print(f"  T ideal: {t:.3f} (NLL={nll:.4f})")
    else:
        t = 1.0
        print("Usando T=1.0 (sem calibração)")

    print(f"\nAvaliando com T={t:.3f}...")
    metricas = _avaliar(logits, labels, t)

    print("\n=== Métricas por limiar ===")
    for limiar, m in metricas.items():
        print(f"  Limiar {limiar}: P={m['precisao']:.3f} "
              f"R={m['recall']:.3f} F1={m['f1']:.3f}")

    # Salva calibração
    saida = {
        "temperatura": t,
        "metricas": {str(k): v for k, v in metricas.items()},
        "modelo_origem": str(_MODELO),
        "n_holdout": len(holdout),
    }
    _SAIDA.parent.mkdir(parents=True, exist_ok=True)
    with open(_SAIDA, "w") as f:
        json.dump(saida, f, indent=2, ensure_ascii=False)
    print(f"\nCalibração salva: {_SAIDA}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
