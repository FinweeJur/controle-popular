#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Treina o modelo de ALTA RESOLUÇÃO (PAN 2 m) das cavas.

Contexto (medido 15/10): em 8 m/px mina, lavoura e desmate são o mesmo
"chão pelado" (a assinatura de cor não separa). Em 2 m (banda PAN do
CBERS-4A) aparecem parede, degrau de lavra e drenagem — a geometria que
diferencia. Este script consome os recortes 2 m rotulados produzidos por
gerar-recortes-2m-rotulados.py e treina uma cabeça sobre o backbone
Chinese-CLIP (mesmo tronco do v7, para reaproveitar visão já boa).

Dados de entrada: scripts/.cache/cavas-2m/checkpoint-2m.jsonl com
{hash, arquivo, tipo, label, cena, nuvem, status}. Descarta nuvem alta
(nuvem > NUVEM_TREINO) — recorte nublado engana o modelo.

REGRA DO SPLIT — POR CENA (nunca por imagem): recortes da mesma cena
compartilham luz/dia/sensor; misturá-los no treino e na validação vazaria o
holdout. Com poucas cenas o split fica frágil e o script avisa.

Saída (não vai pro git): pesos em Temp/opencode/cavas/treino-2m e
metricas.json ali mesmo. O driver (rotina-2m.py) lê o metricas e commita
um resumo versionado.

Uso:
  python scripts/oficina-cavas/treinar-cavas-2m.py --epocas 6 --min 400
  python scripts/oficina-cavas/treinar-cavas-2m.py --recorte 224  # 2 m/px
"""
from __future__ import annotations

import argparse
import json
import random
import sys
from collections import namedtuple
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torch.utils.data import DataLoader, Dataset

Ctx = namedtuple("Ctx", ["modelo", "cabeca", "disp", "otim"])
Treino = namedtuple("Treino", ["epocas", "batch", "lr", "min_entradas",
                               "recorte", "sem_hard"])

_RC = Path(__file__).resolve().parents[2]
_DADOS = _RC / "scripts" / ".cache" / "cavas-2m"
_CKPT = _DADOS / "checkpoint-2m.jsonl"
_SPLIT = _RC / "scripts" / "dados" / "cavas-2m" / "split-2m.json"
_HARD = _RC / "scripts" / ".cache" / "cavas-calibracao" / "hard-negativos.txt"
_TMP = Path.home() / "AppData" / "Local" / "Temp" / "opencode" / "cavas"
_CLIP = _TMP / "chinese-clip"
_SAIDA = _TMP / "treino-2m"
NUVEM_TREINO = 0.30
TAM = 224   # o visual tower do Chinese-CLIP exige 224x224 (erro medido 16/10)


def _linha_util(o: dict, nuvem_max: float) -> bool:
    if o.get("status") != "ok":
        return False
    if (o.get("nuvem") or 0) > nuvem_max:
        return False
    return o.get("label") is not None and bool(o.get("cena"))


def _com_caminho(o: dict):
    caminho = _DADOS / o["tipo"] / o["arquivo"]
    if not caminho.exists():
        return None
    o["caminho"] = str(caminho)
    return o


def _parse_linha(linha: str, nuvem_max: float):
    if not linha.strip():
        return None
    try:
        o = json.loads(linha)
    except json.JSONDecodeError:
        return None
    if not _linha_util(o, nuvem_max):
        return None
    return _com_caminho(o)


def _mais_limpo(novo: dict, atual: dict | None) -> bool:
    """True se o recorte novo tem menos nuvem que o atual (ou é o primeiro)."""
    if atual is None:
        return True
    return (novo.get("nuvem") or 1) < (atual.get("nuvem") or 1)


def _hard_hashes() -> set:
    if not _HARD.exists():
        return set()
    return {l.strip() for l in _HARD.read_text(encoding="utf-8").splitlines()
            if l.strip()}


def carregar_entradas(nuvem_max: float = NUVEM_TREINO) -> list[dict]:
    """Recortes 2 m limpos (status ok, nuvem <= teto), com label e cena.

    Dedupe por hash: duas máquinas ou duas execuções podem gravar o mesmo
    recorte. Fica o de menor nuvem; sem isso o mesmo pixel pode cair no treino
    e na validação, vazando o holdout.
    """
    if not _CKPT.exists():
        return []
    por_hash: dict[str, dict] = {}
    for linha in _CKPT.read_text(encoding="utf-8").splitlines():
        anot = _parse_linha(linha, nuvem_max)
        if not anot:
            continue
        h = anot["hash"]
        if _mais_limpo(anot, por_hash.get(h)):
            por_hash[h] = anot
    return list(por_hash.values())


def _split_congelado(itens: list[dict]):
    """Lê o split versionado; None se o arquivo não existe ou está vazio."""
    if not _SPLIT.exists():
        return None
    try:
        dados = json.loads(_SPLIT.read_text(encoding="utf-8"))
        val_cenas = set(dados.get("val_cenas", []))
    except (OSError, json.JSONDecodeError):
        return None
    if not val_cenas:
        return None
    treino = [i for i in itens if i["cena"] not in val_cenas]
    val = [i for i in itens if i["cena"] in val_cenas]
    if not treino or not val:
        return None
    return treino, val, len(val_cenas)


def split_por_cena(itens: list[dict], frac_val: float, seed: int = 42):
    """Holdout = cenas inteiras fora do treino (regra de ouro do projeto).

    Se `scripts/dados/cavas-2m/split-2m.json` existe, ele manda: o holdout é
    congelado e cenas novas vão para o treino. Sem isso, cada lote novo muda
    o split e invalida a comparação entre modelos (medido 20/10).
    """
    cenas = sorted({i["cena"] for i in itens})
    congelado = _split_congelado(itens)
    if congelado:
        treino, val, n_val = congelado
        print(f"split congelado: {n_val} cenas de val, {len(val)} recortes",
              flush=True)
        return treino, val, len(cenas)
    rng = random.Random(seed)
    rng.shuffle(cenas)
    n_val = max(1, int(len(cenas) * frac_val))
    val_cenas = set(cenas[:n_val])
    if len(cenas) < 8:
        print(f"AVISO: só {len(cenas)} cenas — holdout frágil (split por cena "
              "precisa de muitas cenas).", flush=True)
    treino = [i for i in itens if i["cena"] not in val_cenas]
    val = [i for i in itens if i["cena"] in val_cenas]
    return treino, val, len(cenas)


class Dataset2m(Dataset):
    """Carga de PNG cinza 2 m -> tensor 3-canais (repetido) normalizado.

    `recorte` > 0 usa o pixel NATIVO de 2 m: corta o quadrado central antes de
    redimensionar. Sem ele, 700 px (1.400 m) viram 224 px e o modelo enxerga
    ~6,25 m/px — quase o mesmo que o tronco de 8 m.
    """

    def __init__(self, itens: list[dict], treino: bool, recorte: int = 0):
        self.itens = itens
        self.treino = treino
        self.recorte = recorte

    def __len__(self):
        return len(self.itens)

    def __getitem__(self, idx: int):
        item = self.itens[idx]
        img = Image.open(item["caminho"]).convert("L")
        if self.recorte > 0:
            img = _centro(img, self.recorte)
        if self.treino:
            img = _aumentar(img)
        img = img.resize((TAM, TAM))
        a = np.asarray(img, dtype=np.float32) / 255.0
        a = (a - 0.5) / 0.5
        rgb = np.stack([a, a, a], axis=0)
        return torch.tensor(rgb), float(item["label"])


def _aumentar(img: Image.Image) -> Image.Image:
    if random.random() < 0.5:
        img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if random.random() < 0.5:
        img = img.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    return img


def _centro(img: Image.Image, lado: int) -> Image.Image:
    """Quadrado central `lado` px, sem reamostrar (mantém o pixel de 2 m)."""
    l, a = img.size
    lado = min(lado, l, a)
    x, y = (l - lado) // 2, (a - lado) // 2
    return img.crop((x, y, x + lado, y + lado))


def montar_modelo(dispositivo):
    """Chinese-CLIP (base) + cabeça Linear(512,1). Backbone congelado no 1º passe."""
    from transformers import ChineseCLIPModel

    modelo = ChineseCLIPModel.from_pretrained(str(_CLIP))
    modelo.visual = modelo.vision_model
    emb_dim = 512
    for p in modelo.parameters():
        p.requires_grad_(False)
    cabeca = torch.nn.Linear(emb_dim, 1)
    modelo.to(dispositivo)
    modelo.eval()  # features determinísticas: backbone congelado, sem dropout
    cabeca.to(dispositivo)
    return modelo, cabeca


def _features(ctx, batch):
    with torch.no_grad():
        out = ctx.modelo.get_image_features(pixel_values=batch.to(ctx.disp))
    return out.pooler_output if hasattr(out, "pooler_output") else out


def epoca(ctx, loader) -> float:
    """Uma época de treino na cabeça (só a cabeça tem grad)."""
    ctx.cabeca.train()
    total, n = 0.0, 0
    for x, y in loader:
        y = y.to(ctx.disp).view(-1, 1)
        emb = _features(ctx, x)
        ctx.otim.zero_grad()
        loss = torch.nn.functional.binary_cross_entropy_with_logits(
            ctx.cabeca(emb.float()), y)
        loss.backward()
        ctx.otim.step()
        total += loss.detach().item() * x.size(0)
        n += x.size(0)
    return total / max(n, 1)


def avaliar(ctx, loader, limiar=0.5):
    ctx.cabeca.eval()
    pros, labs = [], []
    for x, y in loader:
        emb = _features(ctx, x)
        with torch.no_grad():
            p = torch.sigmoid(ctx.cabeca(emb.float()).squeeze(-1)).cpu().numpy()
        pros.extend(p.tolist())
        labs.extend(y.numpy().tolist())
    return _metricas(np.asarray(pros), np.asarray(labs), limiar)


def _metricas(pros, labs, limiar) -> dict:
    pred = (pros >= limiar).astype(int)
    tp = int(((pred == 1) & (labs == 1)).sum())
    fp = int(((pred == 1) & (labs == 0)).sum())
    fn = int(((pred == 0) & (labs == 1)).sum())
    prec = tp / max(tp + fp, 1)
    rec = tp / max(tp + fn, 1)
    f1 = 2 * prec * rec / max(prec + rec, 1e-9)
    return {"precisao": round(prec, 4), "recall": round(rec, 4),
            "f1": round(f1, 4), "tp": tp, "fp": fp, "fn": fn,
            "tn": int(len(labs)) - tp - fp - fn, "n": int(len(labs))}


def _conta(itens: list[dict]) -> tuple[int, int]:
    pos = sum(1 for i in itens if i["label"] == 1)
    return pos, len(itens) - pos


def _rodar_epocas(ctx, dl_treino, dl_val, epocas: int) -> dict:
    melhor = {"f1": -1.0}
    for ep in range(1, epocas + 1):
        epoca(ctx, dl_treino)
        m = avaliar(ctx, dl_val)
        print(f"  época {ep}: val F1={m['f1']:.3f} P={m['precisao']:.3f} "
              f"R={m['recall']:.3f}", flush=True)
        if m["f1"] > melhor["f1"]:
            melhor = dict(m)
            melhor["epoca"] = ep
            torch.save({"cabeca": ctx.cabeca.state_dict(), "epoca": ep,
                        "f1": melhor["f1"]}, _SAIDA / "melhor.pt")
    return melhor


def treinar(cfg: Treino) -> dict:
    epocas, batch, lr, min_entradas, recorte, sem_hard = cfg
    itens = carregar_entradas()
    pos, neg = _conta(itens)
    # Sem negativo não há o que separar: o modelo só reaprenderia "tudo é cava"
    # (o dano que a inspeção humana de 15/10 flagrou). Exige piso dos dois lados.
    if pos < min_entradas or neg < min(200, min_entradas // 2):
        print(f"dados insuficientes (pos={pos} neg={neg}); precisa >= "
              f"{min_entradas} e negativos>= {min(200, min_entradas // 2)}. "
              "Adiar.", flush=True)
        return {"adiado": True, "pos": pos, "neg": neg}
    treino, val, n_cenas = split_por_cena(itens, 0.2)
    if sem_hard:
        # A validação fica INTACTA (mesmos 155) para comparar com o modelo
        # que treinou com hard; só o treino perde os hashes difíceis.
        hard = _hard_hashes()
        treino = [i for i in treino if i["hash"] not in hard]
    tpos, tneg = _conta(treino)
    print(f"entradas: treino={len(treino)} (pos {tpos}/neg {tneg}) "
          f"val={len(val)} cenas={n_cenas}", flush=True)
    disp = "cuda" if torch.cuda.is_available() else "cpu"
    modelo, cabeca = montar_modelo(disp)
    otim = torch.optim.AdamW(cabeca.parameters(), lr=lr)
    ctx = Ctx(modelo, cabeca, disp, otim)
    dl_treino = DataLoader(Dataset2m(treino, True, recorte),
                           batch_size=batch, shuffle=True)
    dl_val = DataLoader(Dataset2m(val, False, recorte), batch_size=batch)
    melhor = _rodar_epocas(ctx, dl_treino, dl_val, epocas)
    melhor["entradas_treino"] = len(treino)
    melhor["n_cenas"] = n_cenas
    return melhor


def main() -> int:
    ap = argparse.ArgumentParser(description="Treino alta-resolução 2m")
    ap.add_argument("--epocas", type=int, default=6)
    ap.add_argument("--batch", type=int, default=8)
    ap.add_argument("--lr", type=float, default=1e-3)
    ap.add_argument("--min", type=int, default=400,
                    help="mínimo de entradas limpas p/ treinar (senão adia)")
    ap.add_argument("--recorte", type=int, default=0,
                    help="px do quadrado central p/ usar o pixel nativo (0=full)")
    ap.add_argument("--sem-hard", action="store_true",
                    help="exclui os hard negatives (linha de base controlada)")
    args = ap.parse_args()
    _SAIDA.mkdir(parents=True, exist_ok=True)
    cfg = Treino(args.epocas, args.batch, args.lr, args.min, args.recorte,
                 args.sem_hard)
    res = treinar(cfg)
    res["recorte"] = args.recorte
    res["sem_hard"] = args.sem_hard
    res["lr"] = args.lr
    res["epocas"] = args.epocas
    res["gerado_em"] = str(Path(__file__).name)
    (_SAIDA / "metricas-2m.json").write_text(
        json.dumps(res, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n{res}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
