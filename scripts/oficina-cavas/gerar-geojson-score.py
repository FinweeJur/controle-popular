#!/usr/bin/env python3
"""Gera GeoJSON dos recortes CBERS com score_cava para o QGIS.

Cruza o checkpoint.jsonl (bbox, tipo, cena) com o analisados.jsonl
(score_cava, nuvem_jpg) e produz um FeatureCollection onde cada
ponto tem:
  - score_cava (0..1): saída do modelo v7 (limiar 0.65)
  - nuvem_jpg (0..1): regra de nuvem no JPEG
  - tipo (positivo/negativo): origem do recorte
  - cena, data, processo (se houver)

O QGIS abre o GeoJSON direto e o dono filtra por score_cava
no painel de atributos — sem precisar de Deepness nem ONNX.

Uso: python scripts/oficina-cavas/gerar-geojson-score.py
Saida: scripts/.cache/cavas-calibracao/qgis/recortes-score.geojson
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

_RAIZ = Path(__file__).resolve().parents[2]
_CACHE = _RAIZ / "scripts" / ".cache" / "cavas-calibracao"
_CHECKPOINT = _CACHE / "checkpoint.jsonl"
_ANALISADOS = _CACHE / "analisados.jsonl"
_SAIDA = _CACHE / "qgis" / "recortes-score.geojson"


def _ler_jsonl(caminho: Path) -> list[dict]:
    """Lê um JSONL devolvendo lista de dicts; linhas inválidas são puladas."""
    itens: list[dict] = []
    if not caminho.exists():
        return itens
    with open(caminho, encoding="utf-8") as fh:
        for linha in fh:
            linha = linha.strip()
            if not linha:
                continue
            try:
                itens.append(json.loads(linha))
            except json.JSONDecodeError:
                continue
    return itens


def _faixa(score: float) -> str:
    """Categoriza o score nas 3 faixas de revisao."""
    if score >= 0.65:
        return "positivo-alta"
    if score >= 0.45:
        return "incerto"
    return "negativo-baixa"


def _criar_feature(o: dict, reg: dict) -> dict | None:
    """Monta um Feature GeoJSON a partir do checkpoint + analisado."""
    bbox = o.get("bbox")
    if not bbox or len(bbox) != 4:
        return None
    minx, miny, maxx, maxy = bbox
    cx, cy = (minx + maxx) / 2, (miny + maxy) / 2
    score = reg.get("score_cava", 0)
    h = o.get("hash", "")
    props = {
        "hash": h[:16],
        "tipo": o.get("tipo", ""),
        "score_cava": round(score, 4),
        "faixa_score": _faixa(score),
        "nuvem_jpg": round(reg.get("nuvem_jpg", 0), 4),
        "cena": o.get("cena", ""),
        "data": o.get("data", ""),
    }
    if o.get("processo"):
        props["processo"] = o["processo"]
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [cx, cy]},
        "properties": props,
    }


def main() -> int:
    checkpoint = _ler_jsonl(_CHECKPOINT)
    analisados = {o["hash"]: o for o in _ler_jsonl(_ANALISADOS) if o.get("hash")}
    print(f"checkpoint: {len(checkpoint)} recortes")
    print(f"analisados: {len(analisados)} com score")

    features = []
    sem_score = 0
    for o in checkpoint:
        reg = analisados.get(o.get("hash", ""))
        if not reg:
            sem_score += 1
            continue
        feat = _criar_feature(o, reg)
        if feat:
            features.append(feat)

    fc = {"type": "FeatureCollection", "features": features}
    _SAIDA.parent.mkdir(parents=True, exist_ok=True)
    with open(_SAIDA, "w", encoding="utf-8") as fh:
        json.dump(fc, fh, ensure_ascii=False)
    print(f"GeoJSON: {len(features)} features -> {_SAIDA}")
    if sem_score:
        print(f"  ({sem_score} recortes sem score — rode analisar.py)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
