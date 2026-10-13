"""Geometria pura do coletor de cavas — módulo irmão de
`coletar-cavas-calibracao.py`.

Mantido separado do coletor por duas razões medidas em 13/10/2026:
1. o coletor passou de 600 linhas de código e o hook do CodeScene barra o
   commit quando um arquivo cresce além do teto — tirar a geometria devolve
   o coletor abaixo do limite sem perder nada;
2. a geometria é stdlib pura (sem numpy, sem rasterio), então dá para
   testar e importar de qualquer lugar — inclusive pelos diagnosticos em
   `%TEMP%` — sem puxar o motor de imagem.

Nada aqui fala com rede nem com disco: é só ponto, anel, bbox e índice
geográfico. O coletor continua dono da política de exclusão (o que conta
como área minerária), que vive no WFS do MapBiomas.
"""
from __future__ import annotations

import math

# ~600 m de folga na exclusão de negativos. Um ponto de controle caiu dentro
# de área minerária por erro de geocodificação na borda; a margem empurra o
# sorteio para fora da área sem afastar o ponto do entorno real.
MARGEM_EXCLUSAO = 0.006
# Célula da grade de janelas JÁ coletadas (~2,2 km). Serve para pular
# candidato dentro de área já coletada ANTES de compor a imagem: a rodada
# de 29/09/2026 gastou ~30 s por candidato para o teste de hash descartar
# depois (mesma semente 42 redesenhava os pontos da rodada v1; 2 h = zero
# recorte novo). Menor que a janela (4,3 km) sobra pouca recusa indevida.
CELULA_COLETADOS = 0.02


def primeiro_anel(geom: dict) -> list[list[float]] | None:
    """Primeiro anel (ilha externa) de um Polygon/MultiPolygon GeoJSON.

    Devolve None quando a geometria é vazia ou de tipo que não sabemos
    tratar — o chamador trata None como "sem geometria" e pula, em vez de
    assumir coordenada.
    """
    if not geom:
        return None
    if geom.get("type") == "Polygon":
        rings = geom.get("coordinates") or []
        return rings[0] if rings else None
    if geom.get("type") == "MultiPolygon":
        polys = geom.get("coordinates") or []
        if polys and polys[0]:
            return polys[0][0]
    return None


def bbox_anel(pts) -> tuple[float, float, float, float]:
    """(minlon, minlat, maxlon, maxlat) de um anel de pontos."""
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return (min(xs), min(ys), max(xs), max(ys))


def centroide(pts) -> tuple[float, float]:
    """Centroide aritmético do anel (média simples dos vértices).

    Não é o centroide de massa do polígono; para janela de 4,3 km sobre um
    ponto de mineração, a diferença é desprezível e a média evita depender
    de shapely.
    """
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return (sum(xs) / len(xs), sum(ys) / len(ys))


def ponto_dentro(pt, pts) -> bool:
    """Ray casting (stdlib; sem shapely no repo)."""
    x, y = pt
    dentro = False
    j = len(pts) - 1
    for i in range(len(pts)):
        xi, yi = pts[i][0], pts[i][1]
        xj, yj = pts[j][0], pts[j][1]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi + 1e-15) + xi):
            dentro = not dentro
        j = i
    return dentro


def _com_margem(bbox) -> tuple[float, float, float, float]:
    """Estica a bbox em MARGEM_EXCLUSAO nos quatro lados."""
    x0, y0, x1, y1 = bbox
    return (x0 - MARGEM_EXCLUSAO, y0 - MARGEM_EXCLUSAO,
            x1 + MARGEM_EXCLUSAO, y1 + MARGEM_EXCLUSAO)


def _cobre(bbox, x: float, y: float) -> bool:
    """O ponto (x, y) cai dentro da bbox (com margem já aplicada)?"""
    x0, y0, x1, y1 = bbox
    return x0 <= x <= x1 and y0 <= y <= y1


def rejeitado(pt, exclusao) -> bool:
    """O ponto cai em alguma bbox de exclusão (com margem)?"""
    x, y = pt
    return any(_cobre(_com_margem(b), x, y) for b in exclusao)


def montar_indice(exclusao, celula: float = 0.5) -> dict:
    """Grade geográfica: cada bbox entra nas células que cobre (rejeição O(1)).

    Piso/teto com `math.floor` e um `range` por eixo: uma bbox cobre de
    célula a célula, e o loop de duas dimensões fica sem `if` aninhado — o
    CodeScene mediu profundidade 4 na versão com três laços em 13/10/2026.
    """
    idx: dict = {}
    for b in exclusao:
        x0, y0, x1, y1 = _com_margem(b)
        cxs = range(int(math.floor(x0 / celula)), int(math.floor(x1 / celula)) + 1)
        cys = range(int(math.floor(y0 / celula)), int(math.floor(y1 / celula)) + 1)
        for cx in cxs:
            for cy in cys:
                idx.setdefault((cx, cy), []).append((x0, y0, x1, y1))
    return idx


def rejeitado_indice(pt, idx: dict, celula: float = 0.5) -> bool:
    """O ponto cai em alguma bbox vizinha da grade?

    Checa a célula do ponto e as 8 vizinhas, porque uma bbox pode começar
    na célula anterior. Os três `for` aninhados davam profundidade 4 e o
    CodeScene barrou o commit em 13/10/2026 — achatar para `any()` sobre
    um gerador devolve a profundidade para 1 sem mudar o resultado.
    """
    x, y = pt
    cx = int(math.floor(x / celula))
    cy = int(math.floor(y / celula))
    celulas_vizinhas = ((cx + ddx, cy + ddy)
                        for ddx in (-1, 0, 1) for ddy in (-1, 0, 1))
    return any(_cobre(bbox, x, y)
               for chave in celulas_vizinhas
               for bbox in idx.get(chave, ()))
