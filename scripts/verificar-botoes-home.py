"""Prova dos botões de base do cartão de eixo da home.

O dono pediu (04/10/2026) que cada chip de "PRINCIPAIS BASES & DADOS
MONITORADOS" virasse botão para a página que sustenta o número. Aqui
troca de eixo e confere se os chips viraram <a href> com a rota certa.

Uso: python verificar-botões-home.py [url]
"""

import sys
from playwright.sync_api import sync_playwright

ALVOS = {
    "1. Direitos em Movimento": [
        ("/direitos-em-movimento/saude-publica", "SUS & CNES"),
        ("/direitos-em-movimento/educacao", "IDEB & Escolas"),
        ("/direitos-em-movimento/trabalho-e-renda", "CAGED & Emprego"),
        ("/direitos-em-movimento/denuncia", "Canais de Denúncia"),
        ("/direitos-em-movimento/ajuda", "Moradia & Direitos"),
    ],
    "2. Terra e Territórios": [
        ("/terra-e-territorios/cidades", "203 Cidades Estratégicas"),
        ("/ambiental/licenciamento", "Licenças Ambientais (11 Estados)"),
        ("/ambiental/barragens", "942 Barragens SIGBM"),
        ("/ambiental/car", "CAR & Terras Indígenas"),
        ("/ambiental/nossos-rios", "Rios & Bacias"),
    ],
    "3. Estado e Economia": [
        ("/indicadores", "Contratos PNCP"),
        ("/estado-e-economia/orcamento", "Orçamento das Capitais"),
        ("/judiciario/instituicoes", "Tribunais Superiores"),
        ("/congresso", "Congresso Nacional"),
        ("/empresas", "Empresas & Concessões"),
    ],
}


def main() -> int:
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3047/"
    falhas = []
    with sync_playwright() as p:
        nav = p.chromium.launch(channel="msedge", headless=True)
        pagina = nav.new_page()
        pagina.goto(url, wait_until="networkidle", timeout=120_000)
        for eixo, alvos in ALVOS.items():
            pagina.click(f'button[aria-label="Selecionar {eixo}"]')
            pagina.wait_for_timeout(600)
            for href, rotulo in alvos:
                # A mesma rota aparece no menu superior; o que importa é se
                # EXISTE um <a> com essa rota E com o rótulo do chip.
                loc = pagina.locator(f'a[href="{href}"]', has_text=rotulo)
                achou = loc.count() > 0
                marca = "OK " if achou else "FALHA"
                print(f"{marca} [{eixo}] {rotulo} -> {href}")
                if not achou:
                    falhas.append((eixo, rotulo, href))
        nav.close()
    print(f"\n{len(falhas)} falha(s) de 15 botões")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(main())
