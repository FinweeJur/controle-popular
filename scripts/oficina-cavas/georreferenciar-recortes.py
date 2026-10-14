#!/usr/bin/env python3
"""Georreferencia os recortes CBERS da Oficina de Cavas.

Cada recorte e um JPG 512x512 cortado de uma cena CBERS-4A, com bbox
em WGS84 guardado no checkpoint.jsonl. O QGIS so posiona o JPG no
mapo se existir um world file .pgw ao lado — este script gera um .pgw
para cada recorte, usando o bbox do checkpoint.

World file (.pgw) — 6 linhas, padrao ESRI:
  1. tamanho do pixel em X (graus)
  2. rotacao (0)
  3. rotacao (0)
  4. tamanho do pixel em Y (negativo: tela cresce pra baixo)
  5. X do centro do pixel do canto superior esquerdo
  6. Y do centro do pixel do canto superior esquerdo

Uso: python scripts/oficina-cavas/georreferenciar-recortes.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

_RAIZ = Path(__file__).resolve().parents[2]
_CACHE = _RAIZ / "scripts" / ".cache" / "cavas-calibracao"
_RECORTES = _CACHE / "recortes"
LARGURA = 512  # todos os recortes sao 512x512 (medido 14/10)


def gerar_pgw(bbox: list[float], caminho_jpg: Path) -> bool:
    """Escreve o .pgw ao lado do .jpg. Retorna True se gravou."""
    minx, miny, maxx, maxy = bbox
    px_x = (maxx - minx) / LARGURA
    px_y = -(maxy - miny) / LARGURA  # negativo: eixo Y do mundo
    ul_x = minx + px_x / 2
    ul_y = maxy + px_y / 2
    pgw = caminho_jpg.with_suffix(".pgw")
    pgw.write_text(
        f"{px_x:.12f}\n0\n0\n{px_y:.12f}\n{ul_x:.12f}\n{ul_y:.12f}\n",
        encoding="ascii",
    )
    return True


def _bbox_valido(bbox: object) -> bool:
    """bbox precisa ser lista de 4 numeros (minx, miny, maxx, maxy)."""
    return isinstance(bbox, list) and len(bbox) == 4


def _processar_linha(o: dict) -> bool:
    """Retorna True se gerou .pgw; False se linha invalida ou arquivo ausente."""
    bbox = o.get("bbox")
    arq = o.get("arquivo", "")
    if not _bbox_valido(bbox) or not arq:
        return False
    caminho = _RECORTES / o.get("tipo", "") / arq
    if not caminho.exists():
        return False
    return gerar_pgw(bbox, caminho)


def main() -> int:
    total = feitos = faltando = 0
    with open(_CACHE / "checkpoint.jsonl", encoding="utf-8") as f:
        for linha in f:
            try:
                o = json.loads(linha)
            except json.JSONDecodeError:
                continue
            total += 1
            if _processar_linha(o):
                feitos += 1
            else:
                faltando += 1
            if total % 1000 == 0:
                print(f"  {total} lidos, {feitos} .pgw, {faltando} faltando")
    print(f"\nFim: {total} no checkpoint, {feitos} .pgw gerados, {faltando} faltando")
    return 0


if __name__ == "__main__":
    sys.exit(main())
