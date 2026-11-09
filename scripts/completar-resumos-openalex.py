# -*- coding: utf-8 -*-
"""Completa o resumo dos artigos citados usando o OpenAlex.

POR QUE EXISTE

Sem o PDF, o que resta é o resumo público e o link do DOI. A biblioteca de
evidências já tem 118 resumos; a do litoral tem 67 trabalhos sem resumo. O
OpenAlex devolve o abstract como índice invertido — dá para reconstruir o
texto sem baixar PDF.

REGRA: só completa o que está vazio. O que já existe não é sobrescrito.

Uso:
    python scripts/completar-resumos-openalex.py
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
ARQUIVOS = [
    RAIZ / "apps" / "web" / "data" / "evidencias-cientificas-rio-doce-costeiro.json",
    RAIZ / "apps" / "web" / "data" / "biblioteca-evidencias-cientificas.json",
]
UA = "finweejur/github artur colito"
PAUSA = 1.2
OPENALEX = "https://api.openalex.org/works/https://doi.org/"


def requisitar(url: str) -> dict | None:
    pedido = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(pedido, timeout=45) as resposta:
            return json.load(resposta)
    except (urllib.error.HTTPError, OSError, ValueError):
        return None


def resumo_do_indice(indice: dict | None) -> str:
    """Reconstrói o abstract a partir do índice invertido do OpenAlex."""
    if not isinstance(indice, dict) or not indice:
        return ""
    posicoes: dict[int, str] = {}
    for palavra, lugares in indice.items():
        for lugar in lugares or []:
            posicoes[lugar] = palavra
    if not posicoes:
        return ""
    return " ".join(posicoes[i] for i in sorted(posicoes))


def main() -> int:
    total = preenchidos = 0
    for caminho in ARQUIVOS:
        dados = json.loads(caminho.read_text(encoding="utf-8"))
        chave = "itens" if "itens" in dados else "trabalhos"
        itens = dados.get(chave) or []
        alterado = False
        for item in itens:
            doi = (item.get("doi") or "").strip().lower()
            if not doi or (item.get("resumo") or "").strip():
                continue
            total += 1
            registro = requisitar(OPENALEX + urllib.parse.quote(doi))
            time.sleep(PAUSA)
            if not registro:
                continue
            resumo = resumo_do_indice(registro.get("abstract_inverted_index"))
            if resumo:
                item["resumo"] = resumo[:1200]
                preenchidos += 1
                alterado = True
                print(f"ok  {resumo[:70]}…")
        if alterado:
            caminho.write_text(json.dumps(dados, ensure_ascii=False, indent=1),
                               encoding="utf-8")
            print(f"gravado: {caminho.name}")
    print(f"sem resumo: {total} | preenchidos: {preenchidos}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
