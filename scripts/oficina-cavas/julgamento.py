#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Módulo de revisão humana da Oficina de Cavas.

O que é: registra o julgamento do dono sobre cada recorte — confirmado
como cava ou rejeitado. O modelo v7 dá a palpite; o humano confirma.

Onde mora: `julgamentos.jsonl` no cache, uma linha por hash julgado.
Formato: {"hash": "...", "julgamento": "confirmado"|"rejeitado",
          "ts": "2026-10-14T23:00:00", "score_cava": 0.82}

Fluxo:
  1. Painel mostra próxima imagem pendente (score >= 0.45, sem julgamento).
  2. Dono aperta Enter (confirmar) ou Backspace (rejeitar).
  3. Julgamento gravado; próxima imagem aparece.
  4. `aplicar_julgamentos()` copia julgamentos para analisados.jsonl.

Uso interno (painel.py):
    from julgamento import proximo_pendente, salvar_julgamento
"""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

_CACHE = Path(__file__).resolve().parent.parent / ".cache" / "cavas-calibracao"
_JULGAMENTOS = _CACHE / "julgamentos.jsonl"
_ANALISADOS = _CACHE / "analisados.jsonl"
_CHECKPOINT = _CACHE / "checkpoint.jsonl"
_RECORTES = _CACHE / "recortes"

# Limiar mínimo pra aparecer na revisão: 0.45 (abaixo disso o modelo
# já diz com confiança que não é cava; revisar gastaria tempo à toa).
LIMIAR_REVISAO = 0.45


def _ler_jsonl_hash(caminho: Path) -> dict[str, dict]:
    """Lê JSONL e retorna dict hash → registro. Base para as 3 leituras."""
    out: dict[str, dict] = {}
    if not caminho.exists():
        return out
    with open(caminho, encoding="utf-8") as fh:
        for linha in fh:
            linha = linha.strip()
            if not linha:
                continue
            try:
                o = json.loads(linha)
                if o.get("hash"):
                    out[o["hash"]] = o
            except json.JSONDecodeError:
                continue
    return out


def ler_julgamentos() -> dict[str, dict]:
    """Hash → registro de julgamento. Retomável."""
    return _ler_jsonl_hash(_JULGAMENTOS)


def ler_analisados() -> dict[str, dict]:
    """Hash → registro analisado (tem score_cava e caminho do JPG)."""
    return _ler_jsonl_hash(_ANALISADOS)


def ler_checkpoint() -> dict[str, dict]:
    """Hash → registro do coletor (tem tipo e bbox)."""
    return _ler_jsonl_hash(_CHECKPOINT)


def proximo_pendente() -> dict | None:
    """Próximo recorte com score >= LIMIAR_REVISAO e sem julgamento.

    Ordena por score decrescente — o mais provável primeiro, pra
    revisão começar pelo que tem mais chance de ser cava real.
    """
    julgados = ler_julgamentos()
    analisados = ler_analisados()
    checkpoint = ler_checkpoint()

    pendentes = []
    for h, reg in analisados.items():
        if h in julgados:
            continue
        score = reg.get("score_cava", 0)
        if score < LIMIAR_REVISAO:
            continue
        ck = checkpoint.get(h, {})
        pendentes.append({
            "hash": h,
            "score_cava": score,
            "nuvem_jpg": reg.get("nuvem_jpg", 0),
            "tipo": ck.get("tipo", ""),
            "processo": ck.get("processo", ""),
            "cena": ck.get("cena", ""),
            "data": ck.get("data", ""),
            "bbox": ck.get("bbox"),
            "arquivo": _caminho_jpg(h, ck.get("tipo", "")),
        })

    pendentes.sort(key=lambda x: x["score_cava"], reverse=True)
    return pendentes[0] if pendentes else None


def _caminho_jpg(hash_: str, tipo: str) -> str | None:
    """Caminho absoluto do JPG, se existir."""
    # O nome do arquivo é o hash truncado + .jpg (padrão do coletor).
    # Procura por prefixo do hash no diretório do tipo.
    dir_tipo = _RECORTES / tipo
    if not dir_tipo.exists():
        return None
    # O coletor salva como hash[:24] + .jpg
    prefixo = hash_[:24]
    for p in dir_tipo.glob(f"{prefixo}*.jpg"):
        return str(p)
    return None


def salvar_julgamento(hash_: str, julgamento: str,
                      score_cava: float | None = None) -> bool:
    """Grava o julgamento do dono. Retorna True se salvou.

    julgamento: "confirmado" ou "rejeitado".
    """
    if julgamento not in ("confirmado", "rejeitado"):
        return False
    reg = {
        "hash": hash_,
        "julgamento": julgamento,
        "ts": datetime.now().isoformat(timespec="seconds"),
        "score_cava": score_cava,
    }
    with open(_JULGAMENTOS, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(reg, ensure_ascii=False) + "\n")
    return True


def progresso() -> dict:
    """Estatísticas da revisão."""
    julgados = ler_julgamentos()
    analisados = ler_analisados()
    pendentes = 0
    for h, reg in analisados.items():
        if h not in julgados and reg.get("score_cava", 0) >= LIMIAR_REVISAO:
            pendentes += 1
    confirmados = sum(1 for j in julgados.values()
                      if j.get("julgamento") == "confirmado")
    rejeitados = sum(1 for j in julgados.values()
                     if j.get("julgamento") == "rejeitado")
    return {
        "pendentes": pendentes,
        "confirmados": confirmados,
        "rejeitados": rejeitados,
        "total_julgados": len(julgados),
        "limiar_revisao": LIMIAR_REVISAO,
    }
