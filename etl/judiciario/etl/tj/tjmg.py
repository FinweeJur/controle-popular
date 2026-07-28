"""etl.tj.tjmg — coleta de desembargadores do TJMG (F8, primeiro TJ).

Rodar:
  python -m etl.tj.tjmg --coletar   # roda Playwright, grava JSON, ~30-40s
  python -m playwright install chromium   # 1x, se ainda não tiver o browser

CORREÇÃO DE UM ACHADO ERRADO DA F0: o plano registrava TJMG como
"raspável por HTML" só porque a URL institucional responde 200 com UA de
browser. **Isso estava incompleto.** A página de composição
(`/institucional/magistratura/desembargadores.htm`) devolve 200 com HTML
que NÃO CONTÉM a lista — ela é injetada via JS por um widget Lumis CMS
(confirmado: `requests`/`curl` puro devolve 74 KB de menu, zero nome de
desembargador; só aparece depois de renderizar com um browser de
verdade). **TJMG exige Playwright**, como o plano original já cogitava
como fallback — só que aqui não é fallback, é a única forma que funciona.

O QUE FOI CONFIRMADO AO VIVO (2026-07-25), navegando de verdade:
- Listagem em `.card-title` (atributo `title` = nome completo, `href` =
  página individual). Paginação é postback JS (formulário Lumis, não
  querystring) — precisa clicar "1", "2", "3", não dá pra montar URL.
- 148 desembargadores ATIVOS, 3 páginas de 50, zero duplicata.
- Filtro `vw_compositions.filter.MAGISTRATE_ISACTIVE.value=1` ("Ativo")
  aplicado explicitamente — não confiar no estado default do formulário.
- Página individual do desembargador tem `DATA DE ADMISSÃO` (→
  `ocupacoes.data_posse`) e formação/carreira (→ pista de
  `origem_carreira`), mas **NÃO tem data de nascimento**. Mesma lacuna já
  documentada para os tribunais superiores — TJMG não muda essa
  disciplina: sem fonte verificada por pessoa, `data_nascimento` fica
  null, nunca chutada.

O QUE ESTE MÓDULO NÃO FAZ AINDA (F8 é "adoção incremental", isto é só o
primeiro passo — coleta bruta, não integração):
  1. Não grava em `tribunais`/`cadeiras`/`magistrados` — TJMG nem está
     semeado em `tribunais` ainda. Precisa antes decidir como modelar as
     cadeiras de 2ª instância: TJMG não numera cadeira por desembargador
     como o STJ faz; o quinto (1/5 OAB+MP) e a carreira (4/5) são
     proporção agregada, não assento individualmente rotulado.
  2. Não busca `DATA DE ADMISSÃO` de cada um dos 148 (visitaria 148
     páginas — o scraper de listagem já demorou ~30s; o de detalhe é
     trabalho futuro, sob demanda).
  3. Não resolve data de nascimento — precisaria de fonte externa por
     pessoa (mesma disciplina de curadoria dos tribunais superiores).
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

URL_LISTAGEM = "https://www.tjmg.jus.br/portal-tjmg/institucional/magistratura/desembargadores.htm"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
SAIDA_PADRAO = Path(__file__).resolve().parent.parent / "dados" / "tjmg-desembargadores.json"


def coletar() -> list[dict]:
    """Lista os desembargadores ATIVOS do TJMG. Exige Playwright + Chromium
    instalados (`python -m playwright install chromium`)."""
    from playwright.sync_api import sync_playwright

    todos: list[dict] = []
    vistos: set[str] = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(user_agent=UA)
        try:
            page.goto(URL_LISTAGEM, timeout=30_000)
            page.wait_for_timeout(2000)

            # Filtro explícito "Ativo" — não confiar no default do form.
            page.select_option(
                'select[name="vw_compositions.filter.MAGISTRATE_ISACTIVE.value"]', "1"
            )
            page.wait_for_timeout(300)
            page.get_by_role("button", name="Filtrar").click()
            page.wait_for_timeout(2500)

            # Descobre quantas páginas existem ANTES de clicar (o número
            # de páginas é fixo depois do filtro aplicado).
            links_pagina = page.query_selector_all('a[href^="javascript:function f1"]')
            numeros = sorted(
                {l.inner_text().strip() for l in links_pagina if l.inner_text().strip().isdigit()},
                key=int,
            )
            if not numeros:
                numeros = ["1"]

            for numero in numeros:
                if numero != "1":
                    page.get_by_role("link", name=numero, exact=True).click()
                    page.wait_for_timeout(2500)

                cards = page.query_selector_all(".card-title")
                for c in cards:
                    nome = (c.get_attribute("title") or "").strip()
                    href = c.get_attribute("href") or ""
                    if not nome or nome in vistos:
                        continue  # link duplicado ".office" na mesma card
                    vistos.add(nome)
                    url = href.replace("../../../", "https://www.tjmg.jus.br/")
                    todos.append({"nome": nome, "url_curriculo": url, "categoria": "ativo"})
        finally:
            browser.close()

    return todos


def rodar(saida: Path = SAIDA_PADRAO) -> int:
    dados = coletar()
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(
        json.dumps(
            {
                "tribunal": "tjmg",
                "fonte": URL_LISTAGEM,
                "total": len(dados),
                "desembargadores": dados,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"[tj.tjmg] {len(dados)} desembargador(es) ativo(s) gravado(s) em {saida}")
    return len(dados)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--coletar", action="store_true", help="roda o scraper e grava o JSON")
    p.add_argument("--saida", type=Path, default=SAIDA_PADRAO)
    args = p.parse_args()
    if args.coletar:
        sys.exit(0 if rodar(args.saida) > 0 else 1)
    else:
        p.print_help()
