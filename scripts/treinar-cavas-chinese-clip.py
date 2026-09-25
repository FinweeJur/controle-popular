#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/treinar-cavas-chinese-clip.py

Fine-tune do Chinese-CLIP (OFA-Sys/chinese-clip, MIT) para classificar
recortes de satélite 512x512 em "cava de mineração" (1) vs
"sem mineração" (0). Fase 2 do plano de rastreamento de cavas.

REGRA DE OURO DO SPLIT — POR CENA, NUNCA ALEATÓRIO POR IMAGEM:

    A separação treino/validação é feita pelo campo "cena" do
    checkpoint.jsonl (ex.: CBERS_4A_WPM_20260912_196_136_L2).
    Recortes da mesma cena se parecem — mesma luz, mesmo dia, mesmo
    sensor — e vazariam a validação se as imagens fossem embaralhadas
    à toa. A validação só vale alguma coisa quando a cena inteira foi
    vedada do treino.

    Com poucas cenas (< 8) o split vira "last-scene-out": uma única
    cena (a que cobre mais classes) fica de fora, com aviso de que a
    estimativa é frágil. Com 1 cena só, o script recusa rodar — não há
    split por cena válido, e split aleatório por imagem é proibido.

O que este script faz:
  - lê checkpoint.jsonl + JPGs (valida nuvem <= 0.20; 1=positivo,
    0=negativo);
  - split por cena (acima);
  - aumento de dados (flip H/V, rotação 90°, zoom leve) só no treino;
  - fine-tune com fp16/AMP, batch pequeno + gradient accumulation,
    LR cosine com warmup, early stop por F1 de validação;
  - checkpoint em Temp (nunca no repo), resumível com --continuar;
  - métricas no holdout: precisão (gate >= 70%), recall, F1,
    acurácia, matriz de confusão e varredura de limiar.

Pesos: só model.safetensors (o pytorch_model.bin NÃO pode ser lido com
torch.load no torch 2.5.1 — CVE-2025-32434). O script recusa rodar sem
o safetensors.

Compatibilidade transformers 5.5.0 (medido nesta máquina):
  - ChineseCLIPModel / ChineseCLIPProcessor existem e carregam;
  - get_image_features() devolve BaseModelOutputWithPooling com
    pooler_output JÁ projetado em 512 dim (sem normalizar);
  - tokenizer vem de vocab.txt no mesmo diretório (sem ele, o
    vocabulário cai para 5 tokens e tudo vira [UNK]).

Exemplos:
    # smoke test (2 épocas, 48 recortes atuais)
    python scripts/treinar-cavas-chinese-clip.py --epocas 2 --batch 4

    # retomar de onde parou
    python scripts/treinar-cavas-chinese-clip.py --epocas 8 --continuar

    # só avaliar o melhor checkpoint no holdout
    python scripts/treinar-cavas-chinese-clip.py --sem-treino
"""

import argparse
import json
import math
import random
import sys
import tempfile
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from transformers import ChineseCLIPModel, ChineseCLIPProcessor
from transformers.optimization import get_cosine_schedule_with_warmup

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

ALVO_PRECISAO = 0.70  # gate do plano: precisão >= 70% no holdout
NUVEM_MAX = 0.20
MIN_CENAS_SPLIT = 8  # abaixo disso, last-scene-out com aviso

TMP = Path(tempfile.gettempdir())
DEFAULT_MODELO = TMP / "opencode" / "cavas" / "chinese-clip"
DEFAULT_SAIDA = TMP / "opencode" / "cavas" / "treino-cavas"
DEFAULT_DADOS = (
    Path(__file__).resolve().parent.parent
    / "scripts" / ".cache" / "cavas-calibracao"
)


# ---------------------------------------------------------------- dados ----

def carregar_registros(dados: Path, nuvem_max: float = NUVEM_MAX):
    """Lê checkpoint.jsonl + confere os JPGs. Retorna lista de dicts."""
    ckp = dados / "checkpoint.jsonl"
    if not ckp.exists():
        raise SystemExit(
            f"checkpoint.jsonl não encontrado em {dados}\n"
            "Passe --dados com o diretório que contém checkpoint.jsonl "
            "e recortes/{positivo,negativo}/."
        )
    registros, sem_arquivo, sem_cena = [], 0, 0
    descartados_nuvem, tipos_ruins = 0, 0
    with open(ckp, encoding="utf-8") as f:
        for linha in f:
            linha = linha.strip()
            if not linha:
                continue
            r = json.loads(linha)
            tipo = r.get("tipo")
            if tipo not in ("positivo", "negativo"):
                tipos_ruins += 1
                continue
            nuvem = r.get("nuvem")
            nuvem = 0.0 if nuvem is None else float(nuvem)
            if nuvem > nuvem_max:
                descartados_nuvem += 1
                continue
            nome = r.get("arquivo")
            caminho = dados / "recortes" / tipo / (nome or "")
            if not nome or not caminho.exists():
                sem_arquivo += 1
                continue
            cena = r.get("cena")
            if not cena:
                sem_cena += 1
                cena = f"SEM-CENA/{r.get('hash', nome)}"
            registros.append(
                {
                    "arquivo": str(caminho),
                    "rotulo": 1 if tipo == "positivo" else 0,
                    "cena": cena,
                    "tipo": tipo,
                    "nuvem": nuvem,
                    "hash": r.get("hash", ""),
                }
            )
    if not registros:
        raise SystemExit(
            f"Nenhum recorte válido em {dados} "
            f"(sem_arquivo={sem_arquivo}, nuvem>{nuvem_max}={descartados_nuvem})."
        )
    n_pos = sum(1 for r in registros if r["rotulo"] == 1)
    n_neg = len(registros) - n_pos
    print(
        f"Dados: {len(registros)} recortes "
        f"(positivo={n_pos}, negativo={n_neg}) em {dados}"
    )
    if descartados_nuvem:
        print(f"  descartados por nuvem > {nuvem_max}: {descartados_nuvem}")
    if sem_arquivo:
        print(f"  descartados por JPG ausente: {sem_arquivo}")
    if tipos_ruins:
        print(f"  descartados por tipo inesperado: {tipos_ruins}")
    if sem_cena:
        print(
            f"  AVISO: {sem_cena} sem campo 'cena' — cada um vira cena "
            "única (pior que cena verdadeira, mas nunca mistura imagem "
            "com cena de outro dia)"
        )
    if n_pos == 0 or n_neg == 0:
        print(
            f"  AVISO: só há uma classe ({'positivo' if n_pos else 'negativo'}). "
            "Métricas de precisão não significam nada com uma classe só."
        )
    return registros


def split_por_cena(registros, frac_val=0.2, seed=42):
    """REGRA DE OURO: split POR CENA, nunca aleatório por imagem.

    cenas >= MIN_CENAS_SPLIT: holdout por cena (~frac_val das cenas,
        com cobertura das duas classes dos dois lados quando os dados
        permitem).
    2..MIN_CENAS_SPLIT-1 cenas: last-scene-out — uma cena (a que cobre
        mais classes) fica de fora; estimativa frágil, aviso incluso.
    1 cena: recusa (não existe split por cena válido).

    Retorna (idx_treino, idx_val, info).
    """
    por_cena = defaultdict(list)
    for i, r in enumerate(registros):
        por_cena[r["cena"]].append(i)
    cenas = sorted(por_cena)
    rng = random.Random(seed)
    rng.shuffle(cenas)
    rotulo_cena = {
        c: {registros[i]["rotulo"] for i in por_cena[c]} for c in cenas
    }
    classes = sorted({r["rotulo"] for r in registros})
    n = len(registros)

    if len(cenas) < 2:
        raise SystemExit(
            "Só existe 1 cena nos dados. A regra de ouro proíbe split "
            "aleatório por imagem (a validação vazaria). Colete cenas "
            "novas antes de treinar."
        )

    avisos = []
    if len(cenas) < MIN_CENAS_SPLIT:
        # last-scene-out: a cena que cobre mais classes fica de fora
        ordem = list(cenas)  # já embaralhada pelo seed
        val_c = {max(ordem, key=lambda c: (len(rotulo_cena[c]), ordem.index(c)))}
        avisos.append(
            f"só {len(cenas)} cenas (< {MIN_CENAS_SPLIT}) — last-scene-out: "
            f"cena {sorted(val_c)[0]} fica de fora; a estimativa de "
            "validação é frágil"
        )
    else:
        alvo = max(1, round(frac_val * n))
        val_c = set()

        def cobertura(excluidos):
            s = set()
            for c in excluidos:
                s |= rotulo_cena[c]
            return s

        # fase 1: garantir as duas classes na validação, sem esvaziar o
        # treino de nenhuma classe
        for cl in classes:
            if any(cl in rotulo_cena[c] for c in val_c):
                continue
            for c in cenas:
                if c in val_c or cl not in rotulo_cena[c]:
                    continue
                resto = [x for x in cenas if x != c and x not in val_c]
                if not resto or cl not in cobertura(resto):
                    continue
                val_c.add(c)
                break
        # fase 2: encher até a fração alvo mantendo o treino completo
        for c in cenas:
            if sum(len(por_cena[x]) for x in val_c) >= alvo:
                break
            if c in val_c:
                continue
            resto = [x for x in cenas if x != c and x not in val_c]
            if not resto or not set(classes) <= cobertura(resto):
                continue
            val_c.add(c)

    idx_val = sorted(i for c in val_c for i in por_cena[c])
    idx_treino = sorted(i for c in cenas if c not in val_c for i in por_cena[c])
    if not idx_val or not idx_treino:
        raise SystemExit("Split por cena gerou treino ou validação vazio.")

    def conta(idx):
        pos = sum(1 for i in idx if registros[i]["rotulo"] == 1)
        return pos, len(idx) - pos

    tp, tn = conta(idx_treino)
    vp, vn = conta(idx_val)
    for lado, (p, g) in (("treino", (tp, tn)), ("validação", (vp, vn))):
        if p == 0 or g == 0:
            avisos.append(f"{lado} ficou com uma classe só ({p} pos / {g} neg)")
    info = {
        "cenas_total": len(cenas),
        "cenas_treino": len(cenas) - len(val_c),
        "cenas_val": len(val_c),
        "n_treino": len(idx_treino),
        "n_val": len(idx_val),
        "treino_pos": tp,
        "treino_neg": tn,
        "val_pos": vp,
        "val_neg": vn,
        "seed": seed,
        "frac_val": frac_val,
        "cenas_val_lista": sorted(val_c),
        "avisos": avisos,
    }
    print(
        f"Split POR CENA: treino {info['n_treino']} imgs / "
        f"{info['cenas_treino']} cenas ({tp} pos, {tn} neg) | "
        f"validação {info['n_val']} imgs / {info['cenas_val']} cenas "
        f"({vp} pos, {vn} neg) [seed={seed}]"
    )
    for a in avisos:
        print(f"  AVISO: {a}")
    return idx_treino, idx_val, info


# ------------------------------------------------------------ métricas ----

def calcular_metricas(y_verdadeiro, y_probabilidade, limiar=0.5):
    y_true = np.asarray(y_verdadeiro, dtype=int)
    y_prob = np.asarray(y_probabilidade, dtype=float)
    y_pred = (y_prob >= limiar).astype(int)
    tp = int(((y_pred == 1) & (y_true == 1)).sum())
    fp = int(((y_pred == 1) & (y_true == 0)).sum())
    fn = int(((y_pred == 0) & (y_true == 1)).sum())
    tn = int(((y_pred == 0) & (y_true == 0)).sum())
    precisao = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * precisao * recall / (precisao + recall)
          if (precisao + recall) else 0.0)
    n = len(y_true)
    acuracia = (tp + tn) / n if n else 0.0
    return {
        "n": n,
        "positivos": int(y_true.sum()),
        "limiar": float(limiar),
        "precisao": precisao,
        "recall": recall,
        "f1": f1,
        "acuracia": acuracia,
        "tp": tp, "fp": fp, "fn": fn, "tn": tn,
    }


def varredura_limiar(y_verdadeiro, y_probabilidade, alvo=ALVO_PRECISAO):
    """Maior recall entre os limiares que atingem precisão >= alvo."""
    melhor = None
    for l in np.arange(0.05, 1.0, 0.01):
        m = calcular_metricas(y_verdadeiro, y_probabilidade, limiar=float(l))
        if m["precisao"] < alvo:
            continue
        chave = (m["recall"], m["precisao"])
        if melhor is None or chave > melhor["chave"]:
            melhor = {"limiar": m["limiar"], "recall": m["recall"],
                      "precisao": m["precisao"], "chave": chave}
    if melhor:
        melhor.pop("chave")
    return melhor


def imprimir_metricas(m, titulo, alvo=ALVO_PRECISAO):
    gate = "PASSOU" if m["precisao"] >= alvo else "NÃO PASSOU"
    print(f"=== {titulo} (n={m['n']}, limiar={m['limiar']:.2f}) ===")
    print(f"  precisão : {m['precisao']:.3f}  [gate >= {alvo:.2f}] {gate}")
    print(f"  recall   : {m['recall']:.3f}")
    print(f"  F1       : {m['f1']:.3f}")
    print(f"  acurácia : {m['acuracia']:.3f}")
    print("  matriz de confusão (linhas=real, colunas=previsto):")
    print(f"              prev_pos  prev_neg")
    print(f"    real_pos  {m['tp']:8d}  {m['fn']:8d}")
    print(f"    real_neg  {m['fp']:8d}  {m['tn']:8d}")
    return gate


# ------------------------------------------------------------- modelo ----

def carregar_modelo(dir_modelo: Path, dispositivo):
    dir_modelo = Path(dir_modelo)
    safetensors = dir_modelo / "model.safetensors"
    if not safetensors.exists():
        raise SystemExit(
            f"model.safetensors não encontrado em {dir_modelo}.\n"
            "O pytorch_model.bin não pode ser usado (CVE-2025-32434 no "
            "torch 2.5.1). Baixe o safetensors com curl, ex.:\n"
            "  curl -L -o model.safetensors "
            "https://huggingface.co/OFA-Sys/chinese-clip-vit-base-patch16/"
            "resolve/main/model.safetensors"
        )
    modelo = ChineseCLIPModel.from_pretrained(
        str(dir_modelo), use_safetensors=True
    )
    processador = ChineseCLIPProcessor.from_pretrained(str(dir_modelo))
    if len(processador.tokenizer) < 1000:
        raise SystemExit(
            f"Tokenizer inválido em {dir_modelo} "
            f"(vocab={len(processador.tokenizer)}). Falta o vocab.txt:\n"
            "  curl -L -o vocab.txt "
            "https://huggingface.co/OFA-Sys/chinese-clip-vit-base-patch16/"
            "resolve/main/vocab.txt"
        )
    modelo.to(dispositivo)
    return modelo, processador


def congelar_texto(modelo):
    """Congela o text tower (decisão do plano: fp16 + congelar texto).

    Retorna a contagem de parâmetros congelados.
    """
    n_cong = 0
    for p in modelo.text_model.parameters():
        p.requires_grad_(False)
        n_cong += p.numel()
    for p in modelo.text_projection.parameters():
        p.requires_grad_(False)
        n_cong += p.numel()
    modelo.logit_scale.requires_grad_(False)
    n_cong += modelo.logit_scale.numel()
    return n_cong


def cabeca_classificacao(dim=512):
    return torch.nn.Linear(dim, 1)


def parametros_treinaveis(modelo, cabeca, so_cabeca=False):
    if so_cabeca:
        for p in modelo.parameters():
            p.requires_grad_(False)
    params = [p for p in modelo.parameters() if p.requires_grad]
    params += list(cabeca.parameters())
    return params


# ---------------------------------------------------------- aumento ----

def aumentar(img: Image.Image, rng: random.Random) -> Image.Image:
    """Flip H/V, rotação 90° e zoom leve — só no treino."""
    if rng.random() < 0.5:
        img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if rng.random() < 0.5:
        img = img.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    k = rng.randint(0, 3)
    if k:
        img = img.transpose(
            getattr(Image.Transpose, f"ROTATE_{90 * k}")
        )
    if rng.random() < 0.5:
        w, h = img.size
        s = rng.uniform(0.85, 1.0)
        bw, bh = max(1, int(w * s)), max(1, int(h * s))
        x0 = rng.randint(0, w - bw)
        y0 = rng.randint(0, h - bh)
        img = img.crop((x0, y0, x0 + bw, y0 + bh))
    return img


class DatasetCavas(Dataset):
    def __init__(self, registros, treino, seed=42):
        self.registros = registros
        self.treino = treino
        self.rng = random.Random(seed)

    def __len__(self):
        return len(self.registros)

    def __getitem__(self, k):
        r = self.registros[k]
        img = Image.open(r["arquivo"]).convert("RGB")
        if self.treino:
            img = aumentar(img, self.rng)
        return {"imagem": img, "rotulo": float(r["rotulo"])}


def fazer_collate(processador):
    def collate(lotes):
        px = processador(
            images=[l["imagem"] for l in lotes], return_tensors="pt"
        )["pixel_values"]
        y = torch.tensor([l["rotulo"] for l in lotes], dtype=torch.float32)
        return {"pixel_values": px, "labels": y}
    return collate


# -------------------------------------------------------- avaliação ----

def extrair_embedding_imagem(modelo, pixel_values):
    """pooler_output projetado em 512 dim e normalizado (L2)."""
    out = modelo.get_image_features(pixel_values=pixel_values)
    return F.normalize(out.pooler_output, dim=-1)


@torch.no_grad()
def avaliar(modelo, cabeca, loader, dispositivo, uso_amp, limiar=0.5):
    modelo.eval()
    cabeca.eval()
    probs, reais = [], []
    for lote in loader:
        pv = lote["pixel_values"].to(dispositivo, non_blocking=True)
        with uso_amp:
            emb = extrair_embedding_imagem(modelo, pv)
            logits = cabeca(emb.float()).squeeze(-1)
        probs.extend(torch.sigmoid(logits).cpu().tolist())
        reais.extend(lote["labels"].tolist())
    return calcular_metricas(reais, probs, limiar=limiar), probs, reais


# --------------------------------------------------------- treino ----

def salvar_ultimo(caminho, epoca, modelo, cabeca, otimizador, escalador,
                  agendador, melhor_f1, historico, args):
    torch.save(
        {
            "epoca": epoca,
            "modelo": modelo.state_dict(),
            "cabeca": cabeca.state_dict(),
            "otimizador": otimizador.state_dict(),
            "escalador": escalador.state_dict(),
            "agendador": agendador.state_dict(),
            "melhor_f1": melhor_f1,
            "historico": historico,
            "args": vars(args),
            "torch_rng": torch.get_rng_state(),
            "cuda_rng": (torch.cuda.get_rng_state_all()
                         if torch.cuda.is_available() else None),
        },
        caminho,
    )


def salvar_melhor(caminho, epoca, modelo, cabeca, melhor_f1, metricas, args):
    torch.save(
        {
            "epoca": epoca,
            "modelo": modelo.state_dict(),
            "cabeca": cabeca.state_dict(),
            "melhor_f1": melhor_f1,
            "metricas": metricas,
            "args": vars(args),
        },
        caminho,
    )


def carregar_checkpoint(caminho, modelo, cabeca, otimizador=None,
                        escalador=None, agendador=None):
    ck = torch.load(caminho, map_location="cpu", weights_only=False)
    modelo.load_state_dict(ck["modelo"])
    cabeca.load_state_dict(ck["cabeca"])
    if otimizador is not None and "otimizador" in ck:
        otimizador.load_state_dict(ck["otimizador"])
    if escalador is not None and "escalador" in ck:
        escalador.load_state_dict(ck["escalador"])
    if agendador is not None and "agendador" in ck:
        agendador.load_state_dict(ck["agendador"])
    if "torch_rng" in ck:
        torch.set_rng_state(ck["torch_rng"].cpu())
    if ck.get("cuda_rng") and torch.cuda.is_available():
        try:
            torch.cuda.set_rng_state_all([s.cpu() for s in ck["cuda_rng"]])
        except RuntimeError:
            pass
    return ck


def treinar(args, registros, idx_treino, idx_val, info_split,
            modelo, processador, dispositivo, saida: Path):
    treino_ds = DatasetCavas([registros[i] for i in idx_treino], treino=True,
                             seed=args.seed)
    val_ds = DatasetCavas([registros[i] for i in idx_val], treino=False,
                          seed=args.seed)
    collate = fazer_collate(processador)
    treino_dl = DataLoader(
        treino_ds, batch_size=args.batch, shuffle=True, num_workers=0,
        collate_fn=collate, drop_last=False,
    )
    val_dl = DataLoader(
        val_ds, batch_size=max(args.batch, 8), shuffle=False, num_workers=0,
        collate_fn=collate,
    )

    congelar_texto(modelo)
    cabeca = cabeca_classificacao().to(dispositivo)
    params = parametros_treinaveis(modelo, cabeca, so_cabeca=args.so_cabeca)
    n_treinaveis = sum(p.numel() for p in params)
    n_cabeca = sum(p.numel() for p in cabeca.parameters())
    rotulo_params = (
        "só a cabeça" if args.so_cabeca else "visão + projeção + cabeça"
    )
    print(
        f"Parâmetros treináveis: {n_treinaveis / 1e6:.3f} M "
        f"({rotulo_params}; cabeça={n_cabeca}; text tower congelado)"
    )

    otimizador = torch.optim.AdamW(params, lr=args.lr, weight_decay=0.01)
    passos_epoca = math.ceil(len(treino_ds) / (args.batch * args.acum))
    total_passos = max(1, passos_epoca * args.epocas)
    agendador = get_cosine_schedule_with_warmup(
        otimizador,
        num_warmup_steps=max(1, int(0.05 * total_passos)),
        num_training_steps=total_passos,
    )
    uso_amp = torch.amp.autocast(
        "cuda", dtype=torch.float16, enabled=dispositivo.type == "cuda"
    )
    escalador = torch.amp.GradScaler("cuda", enabled=dispositivo.type == "cuda")

    n_pos = info_split["treino_pos"]
    n_neg = info_split["treino_neg"]
    pos_weight = torch.tensor(
        [(n_neg / n_pos) if n_pos else 1.0], device=dispositivo
    )
    criterio = torch.nn.BCEWithLogitsLoss(pos_weight=pos_weight)

    ultimo = saida / "ultimo.pt"
    melhor = saida / "melhor.pt"
    epoca_inicio = 0
    melhor_f1 = -1.0
    historico = []
    if args.continuar:
        if ultimo.exists():
            ck = carregar_checkpoint(ultimo, modelo, cabeca, otimizador,
                                     escalador, agendador)
            epoca_inicio = ck["epoca"] + 1
            melhor_f1 = ck.get("melhor_f1", -1.0)
            historico = ck.get("historico", [])
            print(
                f"Retomando de {ultimo} (época {ck['epoca']}, "
                f"melhor F1={melhor_f1:.3f}) → épocas {epoca_inicio}.."
                f"{args.epocas - 1}"
            )
        else:
            print(f"--continuar dado, mas {ultimo} não existe; começando do zero")
    if epoca_inicio >= args.epocas:
        print(f"Já treinado até a época {epoca_inicio - 1} (>= {args.epocas}).")
        return melhor, historico

    if dispositivo.type == "cuda":
        torch.cuda.reset_peak_memory_stats(dispositivo)

    paciencia = args.paciencia
    sem_melhora = 0
    t_total = time.time()
    for epoca in range(epoca_inicio, args.epocas):
        modelo.train()
        cabeca.train()
        otimizador.zero_grad(set_to_none=True)
        soma_loss, n_lotes = 0.0, 0
        t0 = time.time()
        for passo, lote in enumerate(treino_dl):
            pv = lote["pixel_values"].to(dispositivo, non_blocking=True)
            y = lote["labels"].to(dispositivo, non_blocking=True)
            with uso_amp:
                emb = extrair_embedding_imagem(modelo, pv)
                logits = cabeca(emb.float()).squeeze(-1)
                loss = criterio(logits, y) / args.acum
            escalador.scale(loss).backward()
            soma_loss += loss.item() * args.acum
            n_lotes += 1
            fim_de_grupo = ((passo + 1) % args.acum == 0
                            or (passo + 1) == len(treino_dl))
            if fim_de_grupo:
                escalador.unscale_(otimizador)
                torch.nn.utils.clip_grad_norm_(params, 1.0)
                escalador.step(otimizador)
                escalador.update()
                otimizador.zero_grad(set_to_none=True)
                agendador.step()
        loss_medio = soma_loss / max(1, n_lotes)

        m_val, probs, reais = avaliar(
            modelo, cabeca, val_dl, dispositivo, uso_amp, limiar=0.5
        )
        vram = (torch.cuda.max_memory_allocated(dispositivo) / 2**30
                if dispositivo.type == "cuda" else 0.0)
        lr_atual = otimizador.param_groups[0]["lr"]
        registro = {
            "epoca": epoca,
            "loss_treino": round(loss_medio, 5),
            "lr": lr_atual,
            "val": m_val,
            "vram_max_gb": round(vram, 3),
            "segundos": round(time.time() - t0, 1),
        }
        historico.append(registro)
        print(
            f"Época {epoca + 1}/{args.epocas}: loss={loss_medio:.4f} "
            f"lr={lr_atual:.2e} | val F1={m_val['f1']:.3f} "
            f"precisão={m_val['precisao']:.3f} recall={m_val['recall']:.3f} "
            f"| {registro['segundos']}s VRAM={vram:.2f} GiB"
        )
        if m_val["f1"] > melhor_f1:
            melhor_f1 = m_val["f1"]
            sem_melhora = 0
            salvar_melhor(melhor, epoca, modelo, cabeca, melhor_f1, m_val, args)
        else:
            sem_melhora += 1
            print(f"  sem melhora no F1 há {sem_melhora} época(s) "
                  f"(paciência={paciencia})")
        salvar_ultimo(ultimo, epoca, modelo, cabeca, otimizador, escalador,
                      agendador, melhor_f1, historico, args)
        if sem_melhora >= paciencia:
            print(f"Early stop na época {epoca + 1} "
                  f"(melhor F1={melhor_f1:.3f}).")
            break

    print(
        f"Treino pronto em {time.time() - t_total:.0f}s. "
        f"VRAM máxima: "
        f"{torch.cuda.max_memory_allocated(dispositivo) / 2**30:.2f} GiB "
        "(torch.cuda.max_memory_allocated)"
    )
    return melhor, historico


# ------------------------------------------------------------- main ----

def main():
    ap = argparse.ArgumentParser(
        description="Fine-tune do Chinese-CLIP para classificar cava de "
                    "mineração (split POR CENA — regra de ouro)."
    )
    ap.add_argument("--epocas", type=int, default=8)
    ap.add_argument("--batch", type=int, default=4,
                    help="batch micro (4–8 recomendado na RTX 3050 4 GB)")
    ap.add_argument("--acum", type=int, default=2,
                    help="gradient accumulation (batch efetivo = batch*acum)")
    ap.add_argument("--lr", type=float, default=2e-5)
    ap.add_argument("--dados", type=Path, default=DEFAULT_DADOS,
                    help="dir com checkpoint.jsonl + recortes/")
    ap.add_argument("--modelo", type=Path, default=DEFAULT_MODELO,
                    help="dir dos pesos safetensors do Chinese-CLIP")
    ap.add_argument("--saida", type=Path, default=DEFAULT_SAIDA,
                    help="dir de checkpoints (precisa ficar FORA do repo)")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--frac-val", type=float, default=0.2,
                    help="fração-alvo de IMAGENS na validação; o grupo é "
                         "sempre a cena inteira (>=8 cenas)")
    ap.add_argument("--paciencia", type=int, default=3,
                    help="early stop por F1 de validação")
    ap.add_argument("--nuvem-max", type=float, default=NUVEM_MAX)
    ap.add_argument("--limiar", type=float, default=0.5)
    ap.add_argument("--so-cabeca", action="store_true",
                    help="só treina a cabeça linear (backbone congelado)")
    ap.add_argument("--continuar", action="store_true",
                    help="retoma de saida/ultimo.pt se existir")
    ap.add_argument("--so-avaliar", "--sem-treino",
                    "--sem-treino-so-avaliar",
                    "--sem-treino-só-avaliar", action="store_true",
                    dest="so_avaliar",
                    help="sem treino: só avalia o melhor checkpoint no holdout")
    args = ap.parse_args()

    raiz = Path(__file__).resolve().parent.parent
    try:
        dentro = args.saida.resolve().is_relative_to(raiz.resolve())
    except (OSError, ValueError):
        dentro = False
    if dentro:
        raise SystemExit(
            f"--saida {args.saida} cai dentro do repositório. Checkpoints "
            "nunca vão para o repo (fica em Temp, pesado e descartável). "
            "Use o default ou um caminho em Temp."
        )

    dispositivo = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if dispositivo.type == "cpu":
        print("AVISO: sem CUDA — treino em CPU é lento; rodando em fp32.")

    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)

    registros = carregar_registros(args.dados, nuvem_max=args.nuvem_max)
    idx_treino, idx_val, info_split = split_por_cena(
        registros, frac_val=args.frac_val, seed=args.seed
    )

    modelo, processador = carregar_modelo(args.modelo, dispositivo)
    saida = Path(args.saida)
    saida.mkdir(parents=True, exist_ok=True)

    if args.so_avaliar:
        caminho = saida / "melhor.pt"
        if not caminho.exists():
            caminho = saida / "ultimo.pt"
        if not caminho.exists():
            raise SystemExit(
                f"Nenhum checkpoint em {saida} (melhor.pt/ultimo.pt). "
                "Rode o treino antes, ou ajuste --saida."
            )
        cabeca = cabeca_classificacao().to(dispositivo)
        ck = torch.load(caminho, map_location="cpu", weights_only=False)
        modelo.load_state_dict(ck["modelo"])
        cabeca.load_state_dict(ck["cabeca"])
        val_ds = DatasetCavas([registros[i] for i in idx_val], treino=False)
        val_dl = DataLoader(val_ds, batch_size=max(args.batch, 8),
                            shuffle=False, num_workers=0,
                            collate_fn=fazer_collate(processador))
        uso_amp = torch.amp.autocast(
            "cuda", dtype=torch.float16, enabled=dispositivo.type == "cuda"
        )
        m, probs, reais = avaliar(modelo, cabeca, val_dl, dispositivo,
                                  uso_amp, limiar=args.limiar)
        gate = imprimir_metricas(m, f"Avaliação holdout ({caminho.name})")
        varred = varredura_limiar(reais, probs)
        if varred:
            print(f"  varredura: limiar {varred['limiar']:.2f} → "
                  f"precisão {varred['precisao']:.3f} / "
                  f"recall {varred['recall']:.3f} no gate de "
                  f"{ALVO_PRECISAO:.0%}")
        relatorio = {
            "modo": "so-avaliar",
            "checkpoint": str(caminho),
            "epoca_ckp": ck.get("epoca"),
            "dados": str(args.dados),
            "split": info_split,
            "metricas_holdout": m,
            "varredura_limiar": varred,
            "gate": gate,
            "alvo_precisao": ALVO_PRECISAO,
            "vram_max_gb": round(
                (torch.cuda.max_memory_allocated(dispositivo) / 2**30
                 if dispositivo.type == "cuda" else 0.0), 3
            ),
        }
        (saida / "metricas.json").write_text(
            json.dumps(relatorio, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        print(f"Relatório: {saida / 'metricas.json'}")
        return

    melhor, historico = treinar(
        args, registros, idx_treino, idx_val, info_split,
        modelo, processador, dispositivo, saida
    )

    # avaliação final com o MELHOR checkpoint no holdout
    if melhor.exists():
        ck = torch.load(melhor, map_location="cpu", weights_only=False)
        modelo.load_state_dict(ck["modelo"])
        cabeca = cabeca_classificacao().to(dispositivo)
        cabeca.load_state_dict(ck["cabeca"])
        epoca_best = ck.get("epoca")
    else:
        cabeca = cabeca_classificacao().to(dispositivo)
        epoca_best = None
        print("AVISO: melhor.pt não encontrado; avaliando o modelo final.")
    val_ds = DatasetCavas([registros[i] for i in idx_val], treino=False)
    val_dl = DataLoader(val_ds, batch_size=max(args.batch, 8), shuffle=False,
                        num_workers=0, collate_fn=fazer_collate(processador))
    uso_amp = torch.amp.autocast(
        "cuda", dtype=torch.float16, enabled=dispositivo.type == "cuda"
    )
    m, probs, reais = avaliar(modelo, cabeca, val_dl, dispositivo, uso_amp,
                              limiar=args.limiar)
    gate = imprimir_metricas(
        m, f"HOLDOUT final (melhor checkpoint, época {epoca_best})"
    )
    varred = varredura_limiar(reais, probs)
    if varred:
        print(f"  varredura: limiar {varred['limiar']:.2f} → "
              f"precisão {varred['precisao']:.3f} / recall {varred['recall']:.3f}")
    else:
        print(f"  varredura: NENHUM limiar atinge precisão >= "
              f"{ALVO_PRECISAO:.0%} neste holdout")
    vram = (torch.cuda.max_memory_allocated(dispositivo) / 2**30
            if dispositivo.type == "cuda" else 0.0)
    relatorio = {
        "modo": "treino",
        "dados": str(args.dados),
        "modelo": str(args.modelo),
        "args": {k: (str(v) if isinstance(v, Path) else v)
                 for k, v in vars(args).items()},
        "split": info_split,
        "epoca_melhor": epoca_best,
        "historico": historico,
        "metricas_holdout": m,
        "varredura_limiar": varred,
        "gate": gate,
        "alvo_precisao": ALVO_PRECISAO,
        "vram_max_gb": round(vram, 3),
        "torch": torch.__version__,
        "transformers": __import__("transformers").__version__,
        "data": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    (saida / "metricas.json").write_text(
        json.dumps(relatorio, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"VRAM máxima: {vram:.2f} GiB | Relatório: {saida / 'metricas.json'}")


if __name__ == "__main__":
    main()
