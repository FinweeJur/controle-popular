"""etl.camaras.verbas — sync councilor "verbas indenizatórias" (itemized
reimbursements: meals, media/comms, office rent, etc.) from
camarabetim.mg.gov.br's Transparência section into `verbas_indenizatorias`.

Usage: python -m etl.camaras.verbas --id-municipio 3106705

Source: `Transparência/Verbas Indenizatórias` (Blazor Server, same pattern
as etl.camaras.diarias). Distinct from `diarias` (specific travel/per-diem
events) -- this is itemized ongoing reimbursements per purchase, grouped by
`grupo_verba` (Alimentação, Mídia, Copa Interna, Locação de Imóveis, etc.).
98 records / R$ 89.173,18 total as of 2026-07-21, current legislature only
(no period filter applied -- the page defaults to showing everything
available, which so far is all within the current term).

Unlike `diarias`'s 2-line-per-record layout, this page's rows are a single
tab-separated line each: "data\tvereador\tgrupo_verba\tfornecedor\tvalor".

`vereador_id` matched by exact `nome` against `vereadores` (populated by
etl.camaras.betim, which must run first).

PERDA DE DADOS CORRIGIDA (2026-07-29): este módulo levou
`verbas_indenizatorias` de 98 para 43 linhas (20 vereadores distintos) sem
erro nenhum. Causa: refresh total (delete de tudo do município + insert só
do que a rodada raspou) sobre uma raspagem que lia UMA página da grid. A
grid rendeu menos linhas que na rodada anterior e o delete levou o
histórico. Duas travas agora:
1. `_scrape` pagina a grid (ver SELETORES_PROXIMA) em vez de ler só a
   primeira página;
2. a escrita passa por `etl.common.refresh_completo_seguro`, que se recusa a
   apagar quando a raspagem trouxe menos linhas do que o banco já tem.
A trava (2) é a garantia de verdade -- ela vale mesmo se a paginação parar
de funcionar quando o site mudar. Redução real na fonte: confirme e rode
com `--permitir-reducao`.

Cron: monthly.
"""
import argparse
import re
import sys

from playwright.sync_api import sync_playwright

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client, refresh_completo_seguro

BASE_URL = "https://www.camarabetim.mg.gov.br"
VERBAS_PATH = "/Transparência/Verbas Indenizatórias"


def _wait_for_blazor(page, timeout_ms: int = 20000) -> None:
    page.wait_for_function(
        "() => !document.body.innerText.includes('Carregando...')",
        timeout=timeout_ms,
    )


def _parse_data_br(value: str) -> str | None:
    m = re.match(r"(\d{2})/(\d{2})/(\d{4})", value.strip())
    if not m:
        return None
    d, mo, y = m.groups()
    return f"{y}-{mo}-{d}"


def _parse_valor_br(value: str) -> float | None:
    m = re.search(r"([\d.]+,\d{2})", value)
    if not m:
        return None
    return float(m.group(1).replace(".", "").replace(",", "."))


DATA_LINE_RE = re.compile(r"^\d{2}/\d{2}/\d{4}\t")

# A grid é paginada e `inner_text("body")` só vê a página corrente -- ler uma
# página só e mandar isso pra um refresh total é exatamente o que apagou
# histórico em 2026-07-29 (98 -> 43 linhas). Estes seletores cobrem os
# paginadores mais comuns em Blazor (QuickGrid `Paginator`, Radzen,
# Bootstrap `.pagination`); NÃO foi possível confirmar ao vivo qual deles a
# Câmara usa (o site não abriu na sessão em que isto foi escrito), então
# `_scrape` avisa alto quando nenhum casa -- e mesmo nesse caso a proteção de
# `refresh_completo_seguro` impede a perda de dados.
SELETORES_PROXIMA = (
    "[aria-label*='rox' i]",  # Próxima / Próximo página
    "[aria-label*='next' i]",
    "button.go-next, a.go-next",
    "a[rel='next']",
    ".pagination li:not(.disabled) a:has-text('›')",
    ".pagination li:not(.disabled) a:has-text('»')",
    "button:has-text('Próxima'), button:has-text('Próximo')",
)
MAX_PAGINAS = 200


def _parse_pagina(page) -> list[dict]:
    """Registros renderizados na página CORRENTE da grid."""
    registros = []
    for linha in page.inner_text("body").splitlines():
        if not DATA_LINE_RE.match(linha):
            continue
        campos = linha.split("\t")
        if len(campos) < 5:
            continue
        data, vereador, grupo, fornecedor, valor = campos[:5]
        registros.append(
            {
                "data": _parse_data_br(data),
                "beneficiario": vereador.strip(),
                "grupo_verba": grupo.strip() or None,
                "fornecedor": fornecedor.strip() or None,
                "valor": _parse_valor_br(valor),
            }
        )
    return registros


def _clicar_proxima(page) -> bool:
    """Tenta avançar uma página. False = nenhum controle clicável achado
    (última página, ou paginador com marcação diferente da esperada)."""
    for seletor in SELETORES_PROXIMA:
        try:
            alvo = page.locator(seletor).first
            if alvo.count() == 0 or not alvo.is_enabled():
                continue
            alvo.click()
            page.wait_for_timeout(800)
            _wait_for_blazor(page)
            return True
        except Exception:
            continue
    return False


def _scrape(page) -> list[dict]:
    page.goto(f"{BASE_URL}{VERBAS_PATH}", wait_until="networkidle")
    _wait_for_blazor(page)

    registros: list[dict] = []
    assinaturas_vistas: set[tuple] = set()
    paginas = 0
    while paginas < MAX_PAGINAS:
        pagina = _parse_pagina(page)
        assinatura = tuple(tuple(sorted(r.items())) for r in pagina)
        if assinatura in assinaturas_vistas:
            # Clicou mas a grid não mudou (ou voltou a uma página já lida):
            # para em vez de duplicar/loopar.
            break
        assinaturas_vistas.add(assinatura)
        registros.extend(pagina)
        paginas += 1
        if not _clicar_proxima(page):
            break

    if paginas <= 1:
        print(
            "[etl.camaras.verbas] AVISO: nenhum controle de próxima página encontrado "
            f"({len(registros)} linha(s) numa única página) -- se a grid é paginada, "
            "SELETORES_PROXIMA precisa ser atualizado."
        )
    else:
        print(f"[etl.camaras.verbas] paginas_lidas={paginas}")
    return registros


def sync(id_municipio: str, permitir_reducao: bool = False) -> None:
    client = get_supabase_client()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        registros = _scrape(page)
        if not registros:
            # Blazor Server round-trip occasionally comes back empty
            # (transient -- confirmed live 2026-07-21, second attempt on
            # the same run succeeded). One retry with a fresh navigation
            # before giving up.
            print("[etl.camaras.verbas] 0 registros na 1a tentativa, tentando de novo...")
            registros = _scrape(page)
        browser.close()

    print(f"[etl.camaras.verbas] registros_encontrados={len(registros)}")
    if not registros:
        return

    vereadores_db = (
        client.table("vereadores").select("id, nome").eq("id_municipio", id_municipio).execute()
    )
    uuid_by_nome = {r["nome"]: r["id"] for r in (vereadores_db.data or [])}

    rows = []
    for r in registros:
        rows.append(
            {
                "id_municipio": id_municipio,
                "vereador_id": uuid_by_nome.get(r["beneficiario"]),
                "beneficiario": r["beneficiario"],
                "data": r["data"],
                "grupo_verba": r["grupo_verba"],
                "fornecedor": r["fornecedor"],
                "valor": r["valor"],
                "link_fonte": f"{BASE_URL}{VERBAS_PATH}",
            }
        )

    # Same no-DDL-access situation as diarias/proposicoes -- full
    # delete+reinsert per id_municipio, dataset is small (under 200 rows).
    # Mas via `refresh_completo_seguro`: se a raspagem trouxe menos linhas do
    # que o banco já tem, NADA é apagado (ver docstring do módulo).
    gravou = refresh_completo_seguro(
        client,
        "verbas_indenizatorias",
        {"id_municipio": id_municipio},
        rows,
        permitir_reducao=permitir_reducao,
        rotulo="etl.camaras.verbas",
    )
    if gravou:
        print(f"[etl.camaras.verbas] total={len(rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--permitir-reducao",
        action="store_true",
        help="grava mesmo que a raspagem tenha menos linhas que o banco (use só "
        "depois de confirmar na fonte que os registros sumiram de verdade)",
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, permitir_reducao=args.permitir_reducao)
    except RuntimeError as e:
        print(f"[etl.camaras.verbas] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
