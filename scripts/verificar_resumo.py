# -*- coding: utf-8 -*-
"""Verifica o resumo de realidade de uma página: fonte, marca e número.

POR QUE EXISTE

O resumo é o primeiro texto que o leitor vê. Cada afirmação precisa de marca
de evidência e de fonte; cada número precisa existir no dado que a página
mostra. Este módulo é a régua usada na geração e na checagem avulsa.

REGRAS

1. `[medido]` exige fonte: link com página, ou o marcador interno
   `tabela medida` / `dados da página`.
2. Todo parágrafo e item de lista tem marca: `[medido]`, `[inferido]` ou
   `[nao da para concluir]`.
3. Link citado precisa existir no dossiê; rótulo de link precisa citar página.
4. Número citado precisa existir no dossiê.

Uso:
    python scripts/verificar-resumo.py apps/web/data/resumos-realidade/x.json
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

LINK = re.compile(r"\[([^\]]+)\]\((https?://[^)\s]+)\)")
URL = re.compile(r"https?://[^\s)\"',]+")
NUMERO = re.compile(r"\d[\d.,]*")
MARCA = re.compile(
    r"\[(medido|inferido|n[ãa]o d[áa] para concluir|nao da para concluir)[^\]]*\]", re.I)
MEDIDO = re.compile(r"\[medido", re.I)
INTERNA = re.compile(r"tabela medida|dados da p[áa]gina", re.I)
IGNORAR = re.compile(r"^(#|>|\s*$|\*\*[^*]{0,90}\*\*$|---+$)")


def normalizar_numero(bruto: str) -> str:
    return re.sub(r"\D", "", bruto)


def numeros(texto: str) -> set[str]:
    return {normalizar_numero(achado) for achado in NUMERO.findall(texto or "")
            if normalizar_numero(achado)}


def urls_do_dossie(dossie: str) -> set[str]:
    return {url.split("#")[0].rstrip(").,;") for url in URL.findall(dossie)}


def paragrafos(texto: str) -> list[tuple[int, str]]:
    """Bloco separado por linha vazia; item de lista começa bloco novo."""
    blocos: list[tuple[int, str]] = []
    atual: list[str] = []
    inicio = 0
    for numero, linha in enumerate(texto.splitlines(), 1):
        limpa = linha.strip()
        if not limpa:
            if atual:
                blocos.append((inicio, " ".join(atual)))
                atual = []
            continue
        if atual and limpa.startswith(("- ", "* ")):
            blocos.append((inicio, " ".join(atual)))
            atual = []
        if not atual:
            inicio = numero
        atual.append(limpa)
    if atual:
        blocos.append((inicio, " ".join(atual)))
    return [(n, t) for n, t in blocos if not IGNORAR.match(t)]


def verificar_texto(texto: str, dossie: str) -> list[str]:
    """Lista de falhas; vazia significa publicável."""
    falhas: list[str] = []
    permitidos = numeros(dossie)
    urls = urls_do_dossie(dossie)
    estrutura = {str(ano) for ano in range(1980, 2031)} | set("123456789") | {"0"}

    for linha, conteudo in paragrafos(texto):
        tem_fonte = bool(LINK.search(conteudo) or INTERNA.search(conteudo))
        if MEDIDO.search(conteudo) and not tem_fonte:
            falhas.append(f"linha {linha}: afirmação [medido] sem fonte")
        if not MARCA.search(conteudo):
            falhas.append(f"linha {linha}: afirmação sem marca de evidência")
        for rotulo, url in LINK.findall(conteudo):
            if url.split("#")[0].rstrip(").,;") not in urls:
                falhas.append(f"linha {linha}: link fora do dossiê — {url[:90]}")
            if "p." not in rotulo.lower():
                falhas.append(f"linha {linha}: rótulo do link sem página — {rotulo[:60]}")

    for numero in sorted(numeros(texto) - permitidos - estrutura):
        falhas.append(f"número fora do dossiê: {numero}")
    return falhas


def main() -> int:
    if len(sys.argv) < 2:
        raise SystemExit("uso: verificar-resumo.py <arquivo.json> [--dossie <arquivo>]")
    resumo = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    texto = resumo.get("markdown") or resumo.get("texto") or ""
    dossie = texto if "--dossie" not in sys.argv else Path(
        sys.argv[sys.argv.index("--dossie") + 1]).read_text(encoding="utf-8")
    falhas = verificar_texto(texto, dossie)
    print(f"falhas: {len(falhas)}")
    for falha in falhas[:30]:
        print(f"  - {falha}")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
