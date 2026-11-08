# -*- coding: utf-8 -*-
"""Foto do lote de resumos de realidade: quanto andou e com que qualidade.

Lê o log do gerador e conta os resumos publicados. Nada aqui altera o lote.

Uso:
    python scripts/progresso-resumos.py
"""
from __future__ import annotations

import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
LOG = RAIZ / "logs" / "resumos-rotas.out"
PASTA = RAIZ / "apps" / "web" / "data" / "resumos-realidade"
TOTAL = 58


def linhas_do_log() -> list[str]:
    if not LOG.exists():
        return []
    return LOG.read_text(encoding="utf-8", errors="replace").splitlines()


def main() -> int:
    linhas = linhas_do_log()
    ok = sum(1 for linha in linhas if linha.startswith("ok "))
    falhas = sum(1 for linha in linhas if linha.startswith("FALHA"))
    puladas = sum(1 for linha in linhas if linha.startswith("pula "))
    publicados = len(list(PASTA.glob("*.json"))) if PASTA.exists() else 0
    processadas = ok + falhas + puladas
    pct = 100 * processadas / TOTAL if TOTAL else 0
    ultima = linhas[-1] if linhas else "—"
    tamanhos = [arquivo.stat().st_size for arquivo in PASTA.glob("*.json")] if PASTA.exists() else []
    media = sum(tamanhos) / len(tamanhos) if tamanhos else 0

    print("\n".join([
        f"📝 Resumos de realidade — {processadas}/{TOTAL} rotas ({pct:.0f}%)",
        f"✅ {ok} ok · ⛔ {falhas} falha · ⏭️ {puladas} pulada",
        f"📄 {publicados} arquivos publicados · média {media/1024:.1f} KB",
        f"🕘 última: {ultima[:110]}",
    ]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
