#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Exporta os N suspeitos mais fortes para inspeção visual humana.

Contexto (medido no audit-positivos.py): o modelo chama de cava um lote de
pontos que o coletor ROTULOU NEGATIVO (fora de todo polígono SIGBMINE e fora
da classe mineração MapBiomas). Isso é um de dois casos, e o olho humano
precisa separar:
  - falso positivo: açude, desmate, obra, terra revolvida — parece buraco;
  - descoberta: mineração real não registrada (o caso que interessa).

Este script NÃO afirma nada: só entrega os recortes de maior score para o
dono olhar. A decisão de "é cava?" fica com o humano (regra editorial §7 —
o número vem do dado, a conclusão vem da verificação).

Sorteia os maiores scores primeiro (candidatos mais fortes), copia os JPGs
com nome numerado e monta uma folha-contato (uma imagem só, 6x5) com o
número e o score gravados, mais um index.csv com lon/lat/cena.

Uso: python scripts/oficina-cavas/exportar-suspeitas.py --n 30
Saida: scripts/.cache/cavas-suspeitas/ (folha.png, index.csv, recortes/)
"""
from __future__ import annotations

import argparse
import csv
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parents[2]
CACHE = RAIZ / "scripts" / ".cache" / "cavas-calibracao"
RECORTES = CACHE / "recortes"
CHECKPOINT = CACHE / "checkpoint.jsonl"
ANALISADOS = CACHE / "analisados.jsonl"
SAIDA = RAIZ / "scripts" / ".cache" / "cavas-suspeitas"
LIMIAR = 0.65
CELULA = 360
COLS = 6


def _ler_jsonl(p: Path) -> list[dict]:
    if not p.exists():
        return []
    out = []
    for linha in p.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha:
            continue
        try:
            out.append(json.loads(linha))
        except json.JSONDecodeError:
            continue
    return out


def _anota(o: dict, a: dict, score: float) -> dict:
    """Monta o registro de um candidato (lon/lat do bbox centro)."""
    bbox = o.get("bbox") or [0, 0, 0, 0]
    return {
        "hash": a["hash"], "arquivo": o.get("arquivo", a.get("arquivo")),
        "score": round(score, 3),
        "lon": round((bbox[0] + bbox[2]) / 2, 5),
        "lat": round((bbox[1] + bbox[3]) / 2, 5),
        "cena": o.get("cena", ""), "data": o.get("data", ""),
    }


def _negativos_flagados(ck: dict) -> list[dict]:
    """Negativos (não-mineração) que o modelo chama de cava (score>=limiar)."""
    cand = []
    for a in _ler_jsonl(ANALISADOS):
        score = a.get("score_cava")
        if score is None or score < LIMIAR:
            continue
        o = ck.get(a.get("hash"), {})
        if o.get("tipo") != "negativo":
            continue
        cand.append(_anota(o, a, score))
    return cand


def _seleciona(n: int) -> list[dict]:
    """Negativos flagados, espalhados entre cenas (regiões), top N.

    Com T=0.5 os flags fortes saturam no teto (~0.788) e o score não
    diferencia. Então a amostra prioriza DIVERSIDADE de cena: um
    candidato por cena em rodízio, até N — inspeção representativa.
    """
    ck = {o["hash"]: o for o in _ler_jsonl(CHECKPOINT) if o.get("hash")}
    return _rodizio_por_cena(_negativos_flagados(ck), n)


def _rodizio_por_cena(cand: list[dict], n: int) -> list[dict]:
    """Round-robin: um por cena, em ordem de score, até n."""
    por_cena: dict[str, list[dict]] = {}
    for c in sorted(cand, key=lambda d: d["score"], reverse=True):
        por_cena.setdefault(c["cena"], []).append(c)
    eleitos: list[dict] = []
    while len(eleitos) < n and por_cena:
        for cena in list(por_cena.keys()):
            if not por_cena[cena]:
                del por_cena[cena]
                continue
            eleitos.append(por_cena[cena].pop(0))
            if len(eleitos) >= n:
                break
    return eleitos[:n]


def _monta_folha(itens: list[dict]) -> Image.Image:
    """Grade 6 colunas; cada célula com número+score gravado no topo."""
    linhas = (len(itens) + COLS - 1) // COLS
    w, h = CELULA * COLS, (CELULA + 26) * linhas
    folha = Image.new("RGB", (w, h), (20, 20, 20))
    des = ImageDraw.Draw(folha)
    fonte = _fonte()
    for i, it in enumerate(itens):
        cx = (i % COLS) * CELULA
        cy = (i // COLS) * (CELULA + 26)
        des.rectangle([cx, cy, cx + CELULA, cy + 24], fill=(0, 0, 0))
        rotulo = f"{i + 1:02d}  score {it['score']:.2f}"
        des.text((cx + 6, cy + 5), rotulo, fill=(255, 255, 0), font=fonte)
        _cola(folha, it["arquivo"], cx, cy + 26)
    return folha


def _cola(folha: Image.Image, arquivo: str, cx: int, cy: int) -> None:
    """Cola um recorte (ou quadrado cinza se faltar o arquivo)."""
    caminho = RECORTES / "negativo" / arquivo
    try:
        with Image.open(caminho) as im:
            folha.paste(im.convert("RGB").resize((CELULA, CELULA)), (cx, cy))
    except Exception:
        des = ImageDraw.Draw(folha)
        des.rectangle([cx, cy, cx + CELULA, cy + CELULA], fill=(80, 80, 80))


def _fonte():
    for tam in (18, 16, 14):
        try:
            return ImageFont.truetype("arial.ttf", tam)
        except Exception:
            continue
    return ImageFont.load_default()


def main() -> int:
    ap = argparse.ArgumentParser(description="Exporta suspeitos p/ inspeção")
    ap.add_argument("--n", type=int, default=30, help="quantos exportar")
    args = ap.parse_args()

    itens = _seleciona(args.n)
    if not itens:
        print("nenhum suspeito acima do limiar")
        return 1

    (SAIDA / "recortes").mkdir(parents=True, exist_ok=True)
    for i, it in enumerate(itens):
        src = RECORTES / "negativo" / it["arquivo"]
        if src.exists():
            shutil.copy(src, SAIDA / "recortes" / f"{i + 1:02d}.jpg")

    with open(SAIDA / "index.csv", "w", newline="", encoding="utf-8-sig") as fh:
        campos = ["num"] + list(itens[0].keys())
        wr = csv.DictWriter(fh, fieldnames=campos)
        wr.writeheader()
        for i, it in enumerate(itens):
            wr.writerow({"num": i + 1, **it})

    _monta_folha(itens).save(SAIDA / "folha.png")
    print(f"exportados {len(itens)} suspeitos (score {itens[-1]['score']}..{itens[0]['score']})")
    print(f"folha: {SAIDA / 'folha.png'}")
    print(f"lista: {SAIDA / 'index.csv'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
