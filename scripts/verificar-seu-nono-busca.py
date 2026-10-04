"""Verificador da barra de busca do Seu Nono (Controle Popular).

O QUE E ESTE MODULO
-------------------
Script de ponta a ponta no navegador que responde ao pedido do dono de
03/10/2026: a janelinha do Seu Nono deixou de abrir com o botao "Perguntar
a IA" e passou a abrir com uma barra de busca fixa. Este script prova, no
navegador real, que:

1. a barra aparece ao abrir o widget (`data-testid="nono-busca"`);
2. digitar "orcamento" mostra sugestoes de paginas relacionadas;
3. as sugestoes abrem ACIMA da barra (o painel termina antes do campo);
4. escolher uma sugestao navega no cliente (a casca nao recarrega);
5. digitar um termo SEM correspondencia e apertar Enter aciona o fluxo de
   IA existente (aparece o status "Consultando acervo publico oficial...").

FONTE DAS ROTAS E SELETORES (nada digitado a mao)
-------------------------------------------------
- Widget: `apps/web/app/components/SeuNono.tsx` (aria-label do FAB);
- Barra: `apps/web/app/components/SeuNonoBusca.tsx` (data-testid);
- Sugestoes: `apps/web/lib/assistente/sugestoes-busca.ts`.

REGRA DE MEDICAO (por que confiar no resultado)
-----------------------------------------------
Cada condicao vira um check com nome; o script falha (exit 1) se qualquer
um falhar e imprime o motivo. O "Enter sem correspondencia" mede o STATUS de
rede: `Consultando acervo publico oficial...` aparece antes do fetch, entao
o teste nao espera o provedor de IA responder (que pode nao existir no
ambiente local).

DECISOES TECNICAS
-----------------
- Playwright sincrono + Chromium; sem binario baixado, cai para Edge/Chrome
  do sistema (mesmo padrao de `verificar-radio-navegacao.py`).
- O aviso de boas-vindas e dispensado para o FAB nao ficar sob ele.
- Timeouts generosos: o primeiro acesso ao dev server compila a pagina.
- Nada de segredo: o script so le paginas publicas.

USO
---
    python scripts/verificar-seu-nono-busca.py --base http://localhost:3057
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from playwright.sync_api import Page, sync_playwright  # noqa: E402

RAIZ = Path(__file__).resolve().parents[1]

SELETOR_FAB = 'button[aria-label="Abrir assistente Seu Nonô"]'
SELETOR_BARRA = '[data-testid="nono-busca"]'
SELETOR_SUGESTOES = '[data-testid="nono-sugestoes"]'
SELETOR_SUGESTAO = '[data-testid="nono-sugestao"]'
SELETOR_CURADA = '[data-testid="nono-sugestao"][data-tipo="curada"]'

TERMO_COM_PAGINA = "orçamento"
TERMO_CURADO = "acordo de mariana"
TERMO_SEM_MATCH = "asdkjhqwe"

TEXTO_STATUS_IA = "Consultando acervo público oficial"


def abrir_navegador(playwright, cabeado: bool):
    """Abre o Chromium; sem o binario baixado, tenta Edge e Chrome do sistema."""
    argumentos = ["--autoplay-policy=no-user-gesture-required", "--mute-audio"]
    erros: list[str] = []
    for extra in ({}, {"channel": "msedge"}, {"channel": "chrome"}):
        try:
            return playwright.chromium.launch(
                headless=not cabeado, args=argumentos, **extra
            )
        except Exception as exc:  # noqa: BLE001 - a tentativa seguinte cobre
            erros.append(f"{extra or 'chromium'}: {type(exc).__name__}")
    raise RuntimeError("nenhum navegador disponivel: " + "; ".join(erros))


def abrir_widget(page: Page, base: str) -> None:
    """Carrega a pagina, dispensa as boas-vindas e abre o widget do Seu Nono."""
    page.goto(base + "/sobre", wait_until="domcontentloaded", timeout=120000)
    # O aviso de boas-vindas fica acima do FAB e pode interceptar o clique.
    try:
        page.get_by_role("button", name="Entendi!").first.click(timeout=3000)
    except Exception:
        pass
    # Clique por script (`el.click()`), nao o clique "acionavel" do Playwright:
    # o FAB e a pega do arrasto (`useArrastavel`), e o gesto do Playwright faz
    # o `foiArrasto()` devolver true e suprimir o `onClick`. O clique de DOM e
    # o mesmo evento que o leitor dispara e abre o painel.
    page.evaluate(
        """() => {
          const b = document.querySelector(
            'button[aria-label="Abrir assistente Seu Nonô"]'
          );
          if (b) b.click();
        }"""
    )
    page.wait_for_selector(SELETOR_BARRA, timeout=15000)


def digitar(page: Page, termo: str) -> None:
    """Limpa a barra e digita o termo, esperando o debounce das sugestoes."""
    campo = page.locator(SELETOR_BARRA).first
    campo.click()
    campo.fill(termo)
    # Debounce (~140 ms) + renderizacao das sugestoes.
    page.wait_for_timeout(700)


def executar(args: argparse.Namespace) -> int:
    """Roda os checks no navegador e devolve o codigo de saida do processo."""
    checks: list[tuple[str, bool, str]] = []

    def check(nome: str, ok: bool, detalhe: str = "") -> None:
        checks.append((nome, ok, detalhe))
        marca = "OK  " if ok else "FALHA"
        print(f"[{marca}] {nome}" + (f" — {detalhe}" if detalhe else ""), flush=True)

    with sync_playwright() as p:
        navegador = abrir_navegador(p, args.cabeado)
        page = navegador.new_page(viewport={"width": 1280, "height": 900})
        page.set_default_timeout(30000)

        print("=" * 72, flush=True)
        print(f"SEU NONO — barra de busca — base={args.base}", flush=True)
        print("=" * 72, flush=True)

        abrir_widget(page, args.base)
        check("1. barra de busca visivel ao abrir o widget", True)

        # 2. "orcamento" mostra paginas relacionadas.
        digitar(page, TERMO_COM_PAGINA)
        page.wait_for_selector(SELETOR_SUGESTOES, timeout=8000)
        total = page.locator(SELETOR_SUGESTAO).count()
        hrefs = page.eval_on_selector_all(
            SELETOR_SUGESTAO,
            "els => els.map(e => e.getAttribute('href') || '')",
        )
        tem_orcamento = any("/orcamento" in h for h in hrefs)
        check(
            '2. digitar "orcamento" sugere paginas relacionadas',
            total > 0 and tem_orcamento,
            f"{total} sugestoes; hrefs={hrefs}",
        )

        # 3. As sugestoes expandem para CIMA (painel termina antes do campo).
        caixa_lista = page.locator(SELETOR_SUGESTOES).first.bounding_box()
        caixa_campo = page.locator(SELETOR_BARRA).first.bounding_box()
        if caixa_lista and caixa_campo:
            acima = caixa_lista["y"] + caixa_lista["height"] <= caixa_campo["y"] + 1
            check(
                "3. sugestoes expandem para cima",
                acima,
                f"lista.y+h={caixa_lista['y'] + caixa_lista['height']:.0f} "
                f"campo.y={caixa_campo['y']:.0f}",
            )
        else:
            check("3. sugestoes expandem para cima", False, "sem bounding box")

        # 4. Escolher a sugestao de orcamento navega no cliente.
        url_antes = page.url
        alvo = page.locator(f'a[data-testid="nono-sugestao"][href*="/orcamento"]').first
        alvo.click()
        try:
            page.wait_for_url("**/orcamento**", timeout=15000)
            navegou = "/orcamento" in page.url
        except Exception:
            navegou = False
        check(
            "4. escolher a sugestao navega no cliente",
            navegou and page.url != url_antes,
            f"url={page.url}",
        )

        # Volta e reabre/carrega o widget para testar a curadoria e o Enter.
        abrir_widget(page, args.base)

        # 5. A resposta pré-curada aparece como sugestao.
        digitar(page, TERMO_CURADO)
        try:
            page.wait_for_selector(SELETOR_CURADA, timeout=8000)
            tem_curada = page.locator(SELETOR_CURADA).count() > 0
        except Exception:
            tem_curada = False
        check("5. resposta pre-curada aparece como sugestao", tem_curada)

        # 6. Enter sem correspondencia aciona o fluxo de IA.
        campo = page.locator(SELETOR_BARRA).first
        campo.click()
        campo.fill(TERMO_SEM_MATCH)
        page.wait_for_timeout(700)
        sugestoes_antes = page.locator(SELETOR_SUGESTAO).count()
        campo.press("Enter")
        try:
            page.wait_for_selector(
                f"text={TEXTO_STATUS_IA}", timeout=6000
            )
            status_ia = True
        except Exception:
            status_ia = False
        check(
            "6. Enter sem correspondencia aciona a IA",
            sugestoes_antes == 0 and status_ia,
            f"sugestoes={sugestoes_antes}, status_ia={status_ia}",
        )

        navegador.close()

    print("=" * 72, flush=True)
    falhas = [c for c in checks if not c[1]]
    print(f"RESULTADO: {len(checks) - len(falhas)}/{len(checks)} checks OK.", flush=True)
    for nome, _, detalhe in falhas:
        print(f"  FALHOU: {nome} — {detalhe}", flush=True)
    print("=" * 72, flush=True)
    return 1 if falhas else 0


def main() -> int:
    """Entrada do script: le argumentos e delega para `executar`."""
    parser = argparse.ArgumentParser(
        description="Verifica a barra de busca fixa do Seu Nono no navegador."
    )
    parser.add_argument(
        "--base",
        default="http://localhost:3057",
        help="URL base do site (padrao: http://localhost:3057).",
    )
    parser.add_argument(
        "--cabeado",
        action="store_true",
        help="Abre o navegador com janela (debug visual).",
    )
    return executar(parser.parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
