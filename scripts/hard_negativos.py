#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Negativos difíceis para o treino de cavas (módulo separado do monólito).

Por que existe: a inspeção humana (15/10) mostrou que o modelo confunde
"chão pelado" (lavoura, desmate, açude, cidade) com cava. Este módulo dá ao
treino a alavanca de REPESAR os negativos que o modelo já erra, no sorteio de
sobreamostragem, para a cabeça aprender a rejeitá-los.

Fica fora de treinar-cavas-chinese-clip.py (um arquivo de 1300 linhas, já bem
acima do teto saudável) de propósito: a lógica nova vive aqui, pequena e
testável, e o treinador só chama. Facilita o refatorar pendente do treinador.

Medido no mesmo holdout (n=1039): peso 1,5 corta falsos positivos 158→76
(precisão 0,77→0,85) pagando recall (0,92→0,76); peso 3,0 desaba o recall.
"""
from __future__ import annotations

from pathlib import Path


def carregar_hard(caminho) -> set:
    """Lê o .txt de hashes (um por linha). Ausente/None -> set vazio."""
    if not caminho or not Path(caminho).exists():
        return set()
    texto = Path(caminho).read_text(encoding="utf-8")
    return {lin.strip() for lin in texto.splitlines() if lin.strip()}


def _peso_base(rotulo: int, pesos_classe: dict) -> float:
    return pesos_classe.get(rotulo, 1.0)


def monta_pesos(registros: list[dict], pesos_classe: dict,
                dificeis: set, peso_dificil: float) -> list[float]:
    """Peso de sorteio por registro; hard negative multiplica por peso_dificil.

    pesos_classe já traz 1/n_pos (rótulo 1) e 1/n_neg (rótulo 0) — metade e
    metade. Se o hash está em `dificeis`, pesa a mais para ser re-visto mais
    vezes em cada época, com aumento aleatório diferente (segura o overfit do
    negativo repetido).
    """
    out = []
    for r in registros:
        base = _peso_base(r["rotulo"], pesos_classe)
        if r.get("hash") in dificeis:
            base *= peso_dificil
        out.append(base)
    return out
