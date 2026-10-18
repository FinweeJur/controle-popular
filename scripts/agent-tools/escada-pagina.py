#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""escada-pagina.py - degraus D3 e D4 da escada de reparo de links do LinkMender.

Por que existe: os degraus D0-D2 (memoria, truques de URL, busca por chave) ja
vivem em TypeScript puro (`apps/web/lib/linkmender/escada.ts`). Quando os tres
falham, precisa de NAVEGADOR de verdade:

- D3 (busca no proprio site): abre a pagina do orgao, digita o termo na caixa
  de busca e devolve os links dos resultados. Resolve site que monta o HTML por
  JavaScript, onde o HTML cru nao tem os links.
- D4 (print + visao): grava um PNG da pagina para um modelo de visao analisar
  quando nao ha texto util (canvas, PDF visual).

Este script e o "braco" do navegador; quem decide (cotas, ordem, memoria) e o
nucleo em `escada.ts`. Roda so quando chamado - nao entra em CI (rede real).

Uso:
    python scripts/agent-tools/escada-pagina.py --url https://x.gov.br/transparencia
    python scripts/agent-tools/escada-pagina.py --url X --busca "processo 12345"
    python scripts/agent-tools/escada-pagina.py --url X --print saida.png

Saida: JSON no stdout — { "ok": true, "titulo": "...", "links": [...] }.

Regras do projeto: User-Agent honesto; uma pagina por chamada; timeout curto.
"""

from __future__ import annotations

import argparse
import json
import sys
from urllib.parse import urljoin

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular; LinkMender)"
TIMEOUT_MS = 20000
ESPERA_RESULTADO_MS = 2500

# Seletores de caixa de busca por ordem de confianca.
SELETORES_BUSCA = [
    "input[type='search']",
    "input[name*='q']",
    "input[id*='busca']",
    "input[placeholder*='uscar']",
    "input[type='text']",
]


def _extrair_links(pagina, base: str, limite: int) -> list[str]:
    """Todos os href absolutos da pagina, na ordem, sem repeticao."""
    hrefs = pagina.eval_on_selector_all(
        "a[href]", "els => els.map(e => e.getAttribute('href'))"
    )
    saida: list[str] = []
    vistos: set[str] = set()
    for href in hrefs:
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        absoluto = urljoin(base, href)
        if absoluto not in vistos:
            vistos.add(absoluto)
            saida.append(absoluto)
        if len(saida) >= limite:
            break
    return saida


def _digitar_busca(pagina, termo: str) -> None:
    """Preenche a primeira caixa de busca visivel e dispara Enter."""
    for seletor in SELETORES_BUSCA:
        try:
            if pagina.locator(seletor).count() > 0:
                campo = pagina.locator(seletor).first
                campo.fill(termo, timeout=TIMEOUT_MS)
                campo.press("Enter")
                pagina.wait_for_timeout(ESPERA_RESULTADO_MS)
                return
        except Exception:
            continue


def executar(url: str, busca: str | None, print_para: str | None, canal: str | None) -> dict:
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        navegador = p.chromium.launch(channel=canal, headless=True) if canal else p.chromium.launch(headless=True)
        pagina = navegador.new_page(user_agent=UA)
        pagina.set_default_timeout(TIMEOUT_MS)
        try:
            pagina.goto(url, wait_until="domcontentloaded", timeout=TIMEOUT_MS)
            if busca:
                _digitar_busca(pagina, busca)
            if print_para:
                pagina.screenshot(path=print_para, full_page=True)
            titulo = pagina.title()
            links = _extrair_links(pagina, pagina.url, 200)
            return {"ok": True, "titulo": titulo, "links": links, "url_final": pagina.url}
        finally:
            navegador.close()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True, help="pagina a abrir")
    parser.add_argument("--busca", default=None, help="termo para a caixa de busca do site")
    parser.add_argument("--print", dest="print_para", default=None, help="caminho do PNG (D4)")
    parser.add_argument("--canal", default=None, help="canal do navegador (ex.: msedge); vazio = chromium")
    args = parser.parse_args()
    try:
        resultado = executar(args.url, args.busca, args.print_para, args.canal)
    except Exception as erro:  # noqa: BLE001 - devolve o erro como JSON, sem derrubar o chamador
        resultado = {"ok": False, "erro": f"{type(erro).__name__}: {erro}", "links": []}
    print(json.dumps(resultado, ensure_ascii=False))
    return 0 if resultado.get("ok") else 1


if __name__ == "__main__":
    sys.exit(main())
