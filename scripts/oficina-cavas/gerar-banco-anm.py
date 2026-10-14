#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extrai o banco de cavas reais ANM com bbox para calibração.

Fonte: positivos-mg.json (7.656 processos ANM de MG com coordenadas).
Cada processo vira uma entrada no banco com:
  - processo, fase, area_ha
  - bbox (minx, miny, maxx, maxy)
  - centroide (lon, lat)
  - municipio (quando disponível)

O banco é a REFERÊNCIA de positivos pra calibrar o modelo:
cavas confirmadas pela ANM que o modelo deve encontrar.

Uso: python scripts/oficina-cavas/gerar-banco-anm.py
Saida: scripts/.cache/cavas-banco/banco-anm.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

_RAIZ = Path(__file__).resolve().parents[2]
_FONTE = _RAIZ / "scripts" / ".cache" / "cavas-calibracao" / "positivos-mg.json"
_SAIDA_DIR = _RAIZ / "scripts" / ".cache" / "cavas-banco"
_SAIDA = _SAIDA_DIR / "banco-anm.json"


def main() -> int:
    if not _FONTE.exists():
        print(f"Fonte nao encontrada: {_FONTE}")
        return 1

    with open(_FONTE, encoding="utf-8") as fh:
        processos = json.load(fh)

    print(f"Processos ANM lidos: {len(processos)}")

    banco = []
    sem_bbox = 0
    for p in processos:
        bbox = p.get("bbox")
        if not bbox or len(bbox) != 4:
            sem_bbox += 1
            continue
        banco.append({
            "processo": p.get("processo", ""),
            "fase": p.get("fase", ""),
            "area_ha": p.get("area_ha", 0),
            "bbox": bbox,
            "centroide": p.get("centroide"),
            "fonte": "ANM/SIGBM",
            "confirmado": True,  # é mineração autorizada
        })

    _SAIDA_DIR.mkdir(parents=True, exist_ok=True)
    with open(_SAIDA, "w", encoding="utf-8") as fh:
        json.dump(banco, fh, ensure_ascii=False, indent=1)

    print(f"Banco salvo: {len(banco)} cavas -> {_SAIDA}")
    if sem_bbox:
        print(f"  ({sem_bbox} processos sem bbox — pulados)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
