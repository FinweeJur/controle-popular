#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Assinatura de pixel de um recorte CBERS (medição, NÃO é filtro que funciona).

Resultado medido em 15/10/2026 — e é uma NEGATIVA, documentada para ninguém
reintroduzir "peneira de cor" achando que separa cava de campo:

  rodamos a assinatura nos 1.750 positivos REAIS (cavas ANM) e nos 1.109
  falsos (pontos rotulados não-mineração que o modelo chamou de cava):

    grupo            n     mediana veg   mediana solo(bare)
    cavas REAIS    1750      0.00            0.97
    falsos         1109      0.00            0.97

  Os dois são "quase tudo chão pelado". Cor não separa, porque cava de
  minério a céu aberto, lavoura e desmate COMPARTILHAM a mesma assinatura:
  muita área nua, pouca vegetação, dentro do recorte de 4,3 km a 8,4 m/px.

  Por isso o modelo (treinado em "chão pelado com borda") confunde os três,
  e a inspeção humana dos 30 mais fortes deu 0 de 30 cava ilegal.

O que de fato separa é GEOMETRIA em ALTA resolução (paredes, degraus de
lavra, água no fundo da cava) — o que o banco zoom-máximo captura, não a cor
deste recorte. As funções abaixo ficam para reproduzir a medição e orientar
o próximo treino (negativos difíceis), não para filtrar publicação.
"""
from __future__ import annotations

import numpy as np
from PIL import Image

# Limiares medidos sobre os 30 suspeitos de 15/10 (não derivados de paper).
VEG_MIN = 0.15   # precisa de mato em volta (senão é campo aberto)
VEG_MAX = 0.90   # mata recorte puro-floresta (não tem abertura nenhuma)
BARE_MIN = 0.08  # solo exposto mínimo — é onde a cava aparece
WATER_MAX = 0.30  # não pode ser dominado por água
CLOUD_MAX = 0.15  # nuvem alta descarta


def _fracoes(rgb: np.ndarray) -> dict[str, float]:
    """Frações de vegetação, água, nuvem e solo exposto no recorte."""
    a = rgb.astype(np.float32) / 255.0
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(axis=2)
    mn = a.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1e-6)
    n = max(r.size, 1)
    veg = (g > r + 0.04) & (g > b + 0.04)
    water = (mx < 0.28) & (b >= r)
    cloud = (sat < 0.12) & (mx > 0.55)
    return {
        "veg": float(veg.mean()),
        "water": float(water.mean()),
        "cloud": float(cloud.mean()),
        "bare": float((~(veg | water | cloud)).mean()),
    }


def assinatura(caminho) -> dict[str, float] | None:
    """Abre o JPG e devolve as frações; None se o arquivo estiver ilegível."""
    try:
        with Image.open(caminho) as im:
            rgb = np.asarray(im.convert("RGB"))
    except Exception:
        return None
    if rgb.shape[0] < 8 or rgb.shape[1] < 8:
        return None
    return _fracoes(rgb)


def passa_peneira(f: dict[str, float]) -> bool:
    """Heurística 'buraco no verde' — NÃO validada: só ~2/1109 e 1/1750
    cavas reais passam, porque o predomínio é chão pelado nos dois casos.
    Mantida para reproduzir a medição acima, não para filtrar publicação."""
    if f is None:
        return False
    if f["cloud"] > CLOUD_MAX or f["water"] > WATER_MAX:
        return False
    return (VEG_MIN <= f["veg"] <= VEG_MAX) and f["bare"] >= BARE_MIN
