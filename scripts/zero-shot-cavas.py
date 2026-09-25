#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/zero-shot-cavas.py

Linha de base do Fase 2: zero-shot do Chinese-CLIP nos recortes de
cava, SEM treino nenhum. Serve de régua para comparar com o fine-tune
(scripts/treinar-cavas-chinese-clip.py).

Como funciona: cada imagem vira um vetor de 512 dimensões; cada texto
candidato também. A imagem é classificada como "cava" quando a
similaridade de cosseno com o texto positivo é maior que com o texto
negativo (soma dos pares de prompt). Testa 2–3 pares de textos e diz
qual separa melhor.

REGRA DE OURO DO SPLIT — POR CENA, NUNCA ALEATÓRIO POR IMAGEM:

    O relatório traz duas linhas: TODOS os recortes e o HOLDOUT POR
    CENA (mesmo split do fine-tune: cenas vedadas do treino, ~20%,
    seed fixa). Recortes da mesma cena se parecem (mesma luz, mesmo
    dia) — métrica embaralhada por imagem vaza e infla o número.

Dados: checkpoint.jsonl + JPGs, nuvem <= 0.20, 1=positivo, 0=negativo.

Compatibilidade transformers 5.5.0: get_image_features() /
get_text_features() devolvem BaseModelOutputWithPooling — a.embedding
projetada está em .pooler_output (512 dim, sem normalizar; normalizar
é por conta aqui). O .bin não é tocado (CVE-2025-32434); só
model.safetensors.

Exemplos:
    python scripts/zero-shot-cavas.py
    python scripts/zero-shot-cavas.py --dados <dir> --modelo <dir>
"""

import argparse
import json
import sys
import tempfile
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from transformers import ChineseCLIPModel, ChineseCLIPProcessor

# reusa o pipeline de dados/split/métricas do script de treino — mesma
# regra de ouro, mesmo split, sem código duplicado que possa divergir
import importlib.util as _ilu

_spec = _ilu.spec_from_file_location(
    "treinar_cavas_clip",
    Path(__file__).resolve().parent / "treinar-cavas-chinese-clip.py",
)
_treino = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_treino)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

TMP = Path(tempfile.gettempdir())
DEFAULT_MODELO = TMP / "opencode" / "cavas" / "chinese-clip"
DEFAULT_SAIDA = TMP / "opencode" / "cavas" / "zero-shot-cavas.json"
DEFAULT_DADOS = (
    Path(__file__).resolve().parent.parent
    / "scripts" / ".cache" / "cavas-calibracao"
)

# Pares candidatos: positivo vs negativo. Testar 2–3 e escolher o que
# separa melhor (o relatório ranqueia por F1 no holdout por cena).
PARES = [
    {
        "nome": "A: cava-ceu-aberto x floresta",
        "positivos": [
            "cava de mineração a céu aberto, terra exposta, poeira",
            "mina a céu aberto, escavação de solo, cratera de mineração",
        ],
        "negativos": [
            "floresta, mata fechada, vegetação nativa",
            "vegetação densa, cerrado preservado, árvores",
        ],
    },
    {
        "nome": "B: solo-exposto x cobertura-vegetal",
        "positivos": [
            "solo exposto cavado por máquinas, áreas mineradas",
            "terra movimentada, taludes, poços de mineração",
        ],
        "negativos": [
            "campo verde, pastagem, cobertura vegetal contínua",
            "lavoura ordenada, vegetação saudável",
        ],
    },
    {
        "nome": "C: mining-ingles",
        "positivos": [
            "open pit mine, exposed soil, excavation, quarry",
            "mining pit, bare ground, haul roads, dust",
        ],
        "negativos": [
            "forest, trees, dense green vegetation",
            "grassland, farmland, natural landscape",
        ],
    },
]


class DatasetCavasZS(Dataset):
    def __init__(self, registros):
        self.registros = registros

    def __len__(self):
        return len(self.registros)

    def __getitem__(self, k):
        r = self.registros[k]
        return {
            "imagem": Image.open(r["arquivo"]).convert("RGB"),
            "rotulo": float(r["rotulo"]),
        }


@torch.no_grad()
def embeddings_imagem(modelo, processador, registros, batch, dispositivo):
    loader = DataLoader(
        DatasetCavasZS(registros), batch_size=batch, shuffle=False,
        num_workers=0,
        collate_fn=lambda ls: processador(
            images=[l["imagem"] for l in ls], return_tensors="pt"
        )["pixel_values"],
    )
    saida = []
    uso_amp = torch.amp.autocast("cuda", dtype=torch.float16,
                                 enabled=dispositivo.type == "cuda")
    for pv in loader:
        pv = pv.to(dispositivo, non_blocking=True)
        with uso_amp:
            out = modelo.get_image_features(pixel_values=pv)
        saida.append(F.normalize(out.pooler_output, dim=-1).float().cpu())
    return torch.cat(saida)


@torch.no_grad()
def embeddings_texto(modelo, processador, textos, dispositivo):
    enc = processador(
        text=textos, return_tensors="pt", padding=True, truncation=True
    )
    enc = {k: v.to(dispositivo) for k, v in enc.items()}
    uso_amp = torch.amp.autocast("cuda", dtype=torch.float16,
                                 enabled=dispositivo.type == "cuda")
    with uso_amp:
        out = modelo.get_text_features(**enc)
    return F.normalize(out.pooler_output, dim=-1).float().cpu()


def main():
    ap = argparse.ArgumentParser(
        description="Zero-shot do Chinese-CLIP nos recortes de cava "
                    "(linha de base do fine-tune)."
    )
    ap.add_argument("--dados", type=Path, default=DEFAULT_DADOS)
    ap.add_argument("--modelo", type=Path, default=DEFAULT_MODELO)
    ap.add_argument("--saida", type=Path, default=DEFAULT_SAIDA,
                    help="caminho do relatório JSON")
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--frac-val", type=float, default=0.2)
    ap.add_argument("--nuvem-max", type=float, default=_treino.NUVEM_MAX)
    args = ap.parse_args()

    dispositivo = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    registros = _treino.carregar_registros(args.dados,
                                           nuvem_max=args.nuvem_max)
    idx_treino, idx_val, info_split = _treino.split_por_cena(
        registros, frac_val=args.frac_val, seed=args.seed
    )
    # holdout = cenas vedadas; treino entra só para a linha "todos"
    registros_val = [registros[i] for i in idx_val]

    modelo, processador = _treino.carregar_modelo(args.modelo, dispositivo)
    modelo.eval()

    if dispositivo.type == "cuda":
        torch.cuda.reset_peak_memory_stats(dispositivo)
    t0 = time.time()
    emb_img = embeddings_imagem(modelo, processador, registros, args.batch,
                                dispositivo)
    print(
        f"Embeddings de imagem: {emb_img.shape} em {time.time() - t0:.1f}s"
    )

    relatorio = {
        "dados": str(args.dados),
        "modelo": str(args.modelo),
        "n_total": len(registros),
        "split": info_split,
        "pares": [],
        "torch": torch.__version__,
        "transformers": __import__("transformers").__version__,
        "data": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    rotulos = np.array([r["rotulo"] for r in registros], dtype=int)
    mascara_val = np.zeros(len(registros), dtype=bool)
    mascara_val[idx_val] = True

    print()
    print(f"{'par de textos':38s} | {'escopo':8s} | precisão  recall     F1"
          f"   acurác  matriz (tp/fp/fn/tn)")
    print("-" * 118)
    melhor = None
    for par in PARES:
        textos = par["positivos"] + par["negativos"]
        emb_txt = embeddings_texto(modelo, processador, textos, dispositivo)
        n_pos_t = len(par["positivos"])
        # similaridade média: imagem x prompts positivos vs negativos
        sim = emb_img @ emb_txt.T  # [N, n_textos]
        score_pos = sim[:, :n_pos_t].mean(dim=1)
        score_neg = sim[:, n_pos_t:].mean(dim=1)
        pred = (score_pos > score_neg).numpy().astype(int)

        linhas = {}
        for escopo, mask in (("todos", np.ones(len(registros), bool)),
                             ("holdout", mascara_val)):
            m = _treino.calcular_metricas(rotulos[mask], pred[mask])
            linhas[escopo] = m
            print(
                f"{par['nome']:38s} | {escopo:8s} | "
                f"{m['precisao']:.3f}    {m['recall']:.3f}    "
                f"{m['f1']:.3f}   {m['acuracia']:.3f}   "
                f"{m['tp']}/{m['fp']}/{m['fn']}/{m['tn']}"
            )
        gate = linhas["holdout"]["precisao"] >= _treino.ALVO_PRECISAO
        entrada = {
            "nome": par["nome"],
            "positivos": par["positivos"],
            "negativos": par["negativos"],
            "metricas_todos": linhas["todos"],
            "metricas_holdout": linhas["holdout"],
            "gate_holdout": "PASSOU" if gate else "NÃO PASSOU",
        }
        relatorio["pares"].append(entrada)
        chave = (linhas["holdout"]["f1"], linhas["holdout"]["precisao"])
        if melhor is None or chave > melhor["chave"]:
            melhor = {"nome": par["nome"], "chave": chave,
                      "entrada": entrada}

    print("-" * 118)
    print(f"Melhor par (F1 no holdout por cena): {melhor['nome']} "
          f"(F1={melhor['chave'][0]:.3f}, precisão={melhor['chave'][1]:.3f})")
    h = melhor["entrada"]["metricas_holdout"]
    gate = "PASSOU" if h["precisao"] >= _treino.ALVO_PRECISAO else "NÃO PASSOU"
    print(f"Gate do plano (precisão >= {_treino.ALVO_PRECISAO:.0%} no "
          f"holdout): {gate}")
    relatorio["melhor_par"] = melhor["nome"]
    relatorio["gate_melhor_holdout"] = gate

    vram = (torch.cuda.max_memory_allocated(dispositivo) / 2**30
            if dispositivo.type == "cuda" else 0.0)
    relatorio["vram_max_gb"] = round(vram, 3)
    args.saida.parent.mkdir(parents=True, exist_ok=True)
    args.saida.write_text(
        json.dumps(relatorio, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"VRAM máxima: {vram:.2f} GiB | Relatório: {args.saida}")


if __name__ == "__main__":
    main()
