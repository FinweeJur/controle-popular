"""etl.camaras.betim — sync current councilors (vereadores) from camarabetim.mg.gov.br.

Usage: python -m etl.camaras.betim --id-municipio 3106705

Source: https://www.camarabetim.mg.gov.br (Blazor **Server** app -- confirmed
live 2026-07-21 via network inspection: the page loads over a persistent
SignalR circuit, `_blazor/negotiate` + `blazor.server.js`, not a REST/JSON
API we could hit directly. Unlike the city-hall transparency portal
(`etl/prefeitura/b3106705.py`), there is no shortcut here -- Playwright is
required, matching the plan's original assumption for F6.

PROLEGIS (`legislativo.camarabetim.mg.gov.br`, linked from the main site's
footer) was the other open question from F0-discovery.md. Confirmed live:
it's a login-gated internal system for council staff (username/password,
"Informe o mesmo usuário e senha de login do computador") with no public
content behind the login wall -- the sidebar labels ("Matérias
Legislativas", "Leis", "Sessões Plenárias") are inert placeholders on the
login page, not real links. All public legislative content lives on the
main site's own "Legislação"/"Transparência" sections instead.

Flow: `Parlamentares/Ativos` lists all current councilors as cards linking
to `Parlamentares/Parlamentar/{id}` (a stable numeric ID from the council's
own system -- NOT the same as `id_candidato_tse`, which needs a separate
TSE cross-reference in a later round). Each detail page has nome completo,
nome político (apelido), partido, telefone, e-mail, and a `Legislaturas`
list. `slug` is derived from nome_urna (kebab-case, ASCII-folded) rather
than the site's numeric ID, so `/vereadores/[slug]` URLs stay human-
readable; collisions are not expected across 23 councilors but would
currently silently overwrite each other (acceptable for this round -- flag
if it ever happens).

Proposições apresentadas (2026-07-21 addition): each councilor's detail
page links to `legislativo.camarabetim.mg.gov.br/Materia/BuscaAvancada`
per (legislatura, tipo) -- that PROLEGIS subdomain looked login-gated at
its root, but `Materia/BuscaAvancada` and `Materia/DadosMateria/{id}` are
public server-rendered ASP.NET MVC pages (NOT Blazor), confirmed live:
loading the URL with `?legislatura=&parlamentarId=&tipoMateriaId=` in the
querystring runs the search directly server-side and the result count
matched the councilor page's own count exactly. Much cheaper to scrape
than the Blazor Server pages -- no SignalR round-trip, just
`wait_until="domcontentloaded"`.

Scoped to the **current legislature only** (20ª, 2025-2028) -- a single
prolific councilor already has 100 matérias in this legislature alone
across 23 councilors, so historic legislaturas (17ª-19ª) are left for a
follow-up round rather than multiplying this run several times over.
`vereador_id` links to whichever councilor's search surfaced the matéria
first (co-authored matérias can appear under multiple councilors; the
full author list still lands in `autores`, just the FK points at one).

No unique constraint exists yet on `proposicoes` for a natural key
(tipo, numero, ano) -- migration `0007_proposicoes_unique.sql` adds one,
but applying it requires DDL access this ETL environment doesn't have
(supabase-py only does PostgREST CRUD, no raw SQL/DB connection string
configured). Until a human runs that migration via the Supabase SQL
Editor, `_upsert_proposicoes` below emulates upsert with a
select-then-insert/update per row instead of `on_conflict`.

Mesa Diretora (2026-07-21 addition): `Parlamentares/Mesa Diretora` lists
exactly 5 seats (Presidente, 1º/2º Vice-Presidente, 1º/2º Secretário) in
the same card format as Ativos -- cross-referenced by slug against the
councilors already scraped to fill `cargo_mesa`.

NOT scraped this round (left for a follow-up module):
- Legislaturas 17ª-19ª of proposições (see scoping note above).
- "Participação em Comissões" tab -- no `comissoes`/membership table
  exists in the schema yet, would need a migration first.
- `votos_eleicao`/`ano_eleicao`/`id_candidato_tse` -- vote counts appear
  inline in free-text biography prose (e.g. "eleito ... com 2.815 votos"),
  not a structured field; not reliable enough to regex-parse yet.
- `foto_url` -- `/api/download/imagem/{id}` linked from the councilor
  detail page turned out to be the **party logo**, not a headshot
  (confirmed visually), so it was deliberately left null rather than
  populate it with the wrong image.

Cron: monthly (councilor roster changes rarely outside election years;
proposições could go weekly once this is running reliably).
"""
import argparse
import re
import sys
import unicodedata

from playwright.sync_api import sync_playwright

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    PgAPIError,
    get_supabase_client,
    upsert_com_colunas_opcionais,
)
from etl.temas import classificar_texto

BASE_URL = "https://www.camarabetim.mg.gov.br"
LIST_PATH = "/Parlamentares/Ativos"
MESA_PATH = "/Parlamentares/Mesa Diretora"
PROLEGIS_URL = "https://legislativo.camarabetim.mg.gov.br"
DETAIL_LINK_RE = re.compile(r"Parlamentares/Parlamentar/(\d+)")
MATERIA_LINK_RE = re.compile(r"Materia/DadosMateria/(\d+)")

PROPOSICAO_LEGISLATURA = 20  # 20ª (2025-2028) -- see module docstring for why

# Fixed across the whole site (not per-councilor) -- confirmed live
# 2026-07-21 from the tipoMateriaId query params linked off every
# councilor's "Proposições apresentadas" tab.
TIPO_MATERIA = {
    1: "indicacao",
    3: "projeto_resolucao",
    4: "projeto_lei",
    5: "requerimento",
    8: "emenda",
    13: "emenda_loa",
}


def _slugify(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto or "")
    texto = "".join(ch for ch in texto if not unicodedata.combining(ch))
    texto = texto.lower().strip()
    texto = re.sub(r"[^a-z0-9]+", "-", texto).strip("-")
    return texto or "vereador"


def _wait_for_blazor(page, timeout_ms: int = 15000) -> None:
    """Blazor Server renders progressively -- cards show 'Carregando...'
    placeholders until the SignalR round-trip resolves each one. Poll until
    that text is gone instead of a fixed sleep."""
    page.wait_for_function(
        "() => !document.body.innerText.includes('Carregando...')",
        timeout=timeout_ms,
    )


def _scrape_lista(page) -> list[dict]:
    page.goto(f"{BASE_URL}{LIST_PATH}", wait_until="networkidle")
    _wait_for_blazor(page)
    hrefs = page.eval_on_selector_all("a[href*='Parlamentares/Parlamentar/']", "els => els.map(e => e.getAttribute('href'))")
    ids = []
    seen = set()
    for href in hrefs:
        m = DETAIL_LINK_RE.search(href or "")
        if m and m.group(1) not in seen:
            seen.add(m.group(1))
            ids.append(m.group(1))
    return ids


_HISTORICO_RE = re.compile(
    r"Histórico\n+(.+?)\n+(?:Aniversário:|Informações)", re.DOTALL
)
_ANIVERSARIO_RE = re.compile(r"Aniversário:\s*(\d{2}/\d{2})")


def _parse_detail_text(texto: str) -> dict:
    def _campo(label: str) -> str | None:
        m = re.search(rf"{re.escape(label)}\n([^\n]+)", texto)
        return m.group(1).strip() if m else None

    nome = _campo("Nome")
    nome_urna = _campo("Nome Político")
    email = _campo("E-mail")
    profissao = _campo("Profissão")

    # "Histórico" (pedido do usuário — parágrafo de biografia livre que a
    # própria Câmara publica, ex. "Vereador eleito para o quarto mandato
    # consecutivo com 2.815 votos..."). NÃO vem do TSE -- confirmado ao
    # vivo 2026-07-23 que `br_tse_eleicoes.candidatos` não tem campo de
    # texto livre nenhum, só estruturados (instrução, ocupação etc.).
    # Nem todo vereador tem "Histórico" preenchido -- ausência é tratada
    # como None, não erro.
    historico_m = _HISTORICO_RE.search(texto)
    biografia = re.sub(r"\s+", " ", historico_m.group(1)).strip() if historico_m else None

    aniversario_m = _ANIVERSARIO_RE.search(texto)
    aniversario_dia_mes = aniversario_m.group(1) if aniversario_m else None

    # Detail page layout (top of page, before the "Dados Pessoais" section
    # that repeats nome_urna under a "Nome Político" label -- this must NOT
    # match that second occurrence, only the first "( Apelido )" heading):
    #   Nome Completo
    #   ( Apelido )
    #   Partido Nome Completo Por Extenso
    #   SIGLA                <- what we want
    #   Histórico
    partido = None
    linhas = texto.splitlines()
    for i, line in enumerate(linhas):
        if line.strip() == f"( {(nome_urna or '').strip()} )" and i + 2 < len(linhas):
            partido = linhas[i + 2].strip() or None
            break

    legislaturas = re.findall(r"(\d+)ª Legislatura \( (\d{4}) - (\d{4}) \)", texto)
    mandato_inicio = mandato_fim = None
    if legislaturas:
        anos_fim = [int(l[2]) for l in legislaturas]
        anos_inicio = [int(l[1]) for l in legislaturas]
        idx_atual = anos_fim.index(max(anos_fim))
        mandato_inicio = f"{anos_inicio[idx_atual]}-01-01"
        mandato_fim = f"{anos_fim[idx_atual]}-12-31"

    return {
        "nome": nome,
        "nome_urna": nome_urna,
        "partido": partido,
        "email": email,
        "mandato_inicio": mandato_inicio,
        "mandato_fim": mandato_fim,
        "profissao": profissao,
        "biografia": biografia,
        "aniversario_dia_mes": aniversario_dia_mes,
    }


def _scrape_detail(page, vereador_id: str) -> dict:
    page.goto(f"{BASE_URL}/Parlamentares/Parlamentar/{vereador_id}", wait_until="networkidle")
    _wait_for_blazor(page)
    texto = page.inner_text("body")
    parsed = _parse_detail_text(texto)
    return parsed


def _scrape_mesa_diretora(page) -> dict[str, str]:
    """Returns {slug: cargo}. Layout mirrors Ativos: repeating groups of
    (apelido, nome completo, partido, cargo) -- 4 lines per seat, 5 seats."""
    page.goto(f"{BASE_URL}{MESA_PATH}", wait_until="networkidle")
    _wait_for_blazor(page)
    texto = page.inner_text("body")

    cargos = ["Presidente", "1º Vice-Presidente", "2º Vice-Presidente", "1º Secretário", "2º Secretário"]
    linhas = [l.strip() for l in texto.splitlines() if l.strip()]
    resultado: dict[str, str] = {}
    for i, linha in enumerate(linhas):
        if linha in cargos and i >= 1:
            apelido = linhas[i - 3] if i >= 3 else None
            if apelido:
                resultado[_slugify(apelido)] = linha
    return resultado


PAGINA_RE = re.compile(r"P[áa]gina\s+(\d+)\s+de\s+(\d+)")
RESULTADO_RE = re.compile(r"Resultado da pesquisa:\s*(\d+)\s*itens?", re.IGNORECASE)
MAX_PAGINAS_MATERIAS = 25  # safety bound (~500 matérias); a real total above this gets discarded, not truncated


def _ids_da_pagina_atual(page) -> tuple[set[str], list[dict]]:
    items = page.eval_on_selector_all(
        "a.header-materia",
        "els => els.map(e => ({href: e.getAttribute('href'), titulo: (e.querySelector('h4')||{}).innerText}))",
    )
    parsed = []
    ids: set[str] = set()
    for item in items:
        m = MATERIA_LINK_RE.search(item.get("href") or "")
        if m and item.get("titulo"):
            ids.add(m.group(1))
            parsed.append({"materia_id": m.group(1), "titulo": item["titulo"]})
    return ids, parsed


TENTATIVAS_LISTA_MATERIAS = 3


def _scrape_lista_materias(page, vereador_numeric_id: str, tipo_id: int) -> list[dict]:
    """Retries `_scrape_lista_materias_tentativa` up to
    `TENTATIVAS_LISTA_MATERIAS` times. The AJAX race that function
    guards against (see its docstring) is flaky, not deterministic --
    confirmed live 2026-07-22 when a full run against all 23 councilors
    discarded 12 of 138 (councilor, tipo) batches on the first attempt,
    all for the same transient reason. Since a discarded batch is always
    safe (never partial/wrong data, just stale until the next successful
    attempt), retrying immediately here means a full ETL run self-heals
    instead of leaving prolific councilors' real counts stuck on
    whatever the last successful run captured.

    `_scrape_lista_materias_tentativa` returns `None` (not `[]`) to signal
    a discard, precisely so this loop can tell "a batch was thrown out,
    retry" apart from "this councilor genuinely has zero matérias of this
    tipo, stop" -- collapsing the two would triple the page-load cost of
    every legitimately empty search for no benefit.

    Retries use a FRESH page (`page.context.new_page()`), not the same
    `page` passed in. Confirmed live 2026-07-22: a councilor with 406
    requerimentos across 21 pages failed identically at page 18 twice in
    a row within a full 138-search run on one long-lived `page`, then
    scraped all 21 pages cleanly on the very first attempt in a fresh,
    isolated page/browser. That points at cumulative degradation of the
    shared page over a long session (not a deterministic site bug at
    page 18), so a same-page retry would likely just fail the same way
    again -- a clean page gives each retry an independent shot instead.
    """
    for tentativa in range(1, TENTATIVAS_LISTA_MATERIAS + 1):
        # `page.context.new_page()` raises here -- the `page` passed in
        # comes from `browser.new_page()`, which creates an implicit
        # single-page context that Playwright refuses to add a second
        # page to ("Please use browser.new_context()", confirmed live
        # 2026-07-22). Going through `.browser` instead makes a fresh
        # implicit context + page pair, sidestepping that restriction.
        pagina_da_vez = page if tentativa == 1 else page.context.browser.new_page()
        try:
            resultado = _scrape_lista_materias_tentativa(pagina_da_vez, vereador_numeric_id, tipo_id)
        finally:
            if pagina_da_vez is not page:
                pagina_da_vez.close()
        if resultado is not None:
            return resultado
        if tentativa < TENTATIVAS_LISTA_MATERIAS:
            print(
                f"[etl.camaras.betim] parlamentarId={vereador_numeric_id} tipoMateriaId={tipo_id}: "
                f"tentativa {tentativa} descartada, tentando de novo com página nova "
                f"({TENTATIVAS_LISTA_MATERIAS - tentativa} restante(s))."
            )
    return []  # exhausted retries -- caller treats this exactly like a genuine zero-result search


def _scrape_lista_materias_tentativa(page, vereador_numeric_id: str, tipo_id: int) -> list[dict] | None:
    """One (councilor, tipo) search on the PROLEGIS subdomain, following
    pagination to completion. Returns [{materia_id, titulo}] -- titulo is
    like "Indicação Nº 078/2026", parsed into tipo/numero/ano by the caller
    (the search result itself doesn't expose those as separate fields, only
    the formatted heading). Returns `None` (discarding the whole batch, not
    a partial one -- and distinct from `[]`, a genuine zero-result search)
    if anything about the pagination didn't check out; the caller,
    `_scrape_lista_materias`, retries on `None`. Leaving that (councilor,
    tipo)'s existing DB rows untouched this attempt is safer than
    upserting duplicated or misclassified proposições.

    BuscaAvancada paginates at 20 results/page. The ORIGINAL version of
    this function read only page 1, which silently undercounted every
    councilor with more than 20 matérias of a given tipo in the current
    legislature -- confirmed live 2026-07-22: Layon Silva has 31
    projeto_lei, page 1 showed 20 and "Próxima" held the remaining 11.
    This fed straight into the weighted ranking score, so the
    undercounting understated exactly the councilors the ranking is
    supposed to surface. Three follow-up dead ends before landing here
    (all confirmed live 2026-07-22, same session):
    1. `Locator.click()` on "Próxima" hung in a 30s actionability retry
       loop -- a cookie-consent banner and an iziModal overlay intercept
       pointer events on this page.
    2. `click(force=True)` (after removing those overlays from the DOM)
       still failed with "Element is outside of the viewport" on some
       pages, and separately could fire while the page's OWN initial
       AJAX grid-population call was still in flight, dropping the
       click's request and landing back on page 1 -- which would have
       silently double-counted page 1's matérias as if they were later
       pages.
    3. Calling `executaBusca(current_page + 1)` directly via
       `page.evaluate` (sidestepping clicking entirely) fixed both of
       the above, but a THIRD failure mode showed up only when scraping
       many (councilor, tipo) combos back-to-back on the same `page`
       object (as `sync()` does): Layon Silva's `requerimento` search,
       run right after his `projeto_lei` search, returned 500 items with
       real duplicate materia_ids -- yet an isolated two-call repro of
       the exact same sequence came back clean (39/39, no dupes). That
       inconsistency points at a flaky AJAX race, not a deterministic
       page-numbering bug, so retrying-until-it-looks-right isn't a
       trustworthy fix either.

    The approach here is written to be correct even if some future
    request is slow or silently dropped, rather than to prevent that from
    ever happening: read the authoritative "Resultado da pesquisa: N
    itens" count and the total page count up front (both only from page
    1, before any navigation); request pages 1..total by absolute number
    (never "current + 1", so a stuck/duplicate response can't skew what
    page is requested next); require each page's ids to be completely
    disjoint from every id already collected, polling briefly rather than
    trusting a single read; and reject the ENTIRE batch (return []) if
    the final unique count doesn't match the announced total. A discarded
    batch just means this run doesn't update that one (councilor, tipo)
    -- next run tries again -- versus the alternative of writing data we
    can't vouch for into the table the ranking reads from.
    """
    url = (
        f"{PROLEGIS_URL}/Materia/BuscaAvancada"
        f"?legislatura={PROPOSICAO_LEGISLATURA}&parlamentarId={vereador_numeric_id}&tipoMateriaId={tipo_id}"
    )
    page.goto(url, wait_until="networkidle")
    try:
        # `networkidle` fires once the shell has loaded, but the grid
        # itself is populated by the page's OWN internal AJAX call after
        # that -- give it a chance to land before reading anything.
        page.wait_for_selector("a.header-materia", timeout=6000)
    except Exception:
        pass  # genuinely zero results for this (councilor, tipo) -- fine
    page.wait_for_timeout(300)

    body = page.inner_text("body")
    resultado_match = RESULTADO_RE.search(body)
    total_esperado = int(resultado_match.group(1)) if resultado_match else None

    pager = PAGINA_RE.search(body)
    total_paginas = int(pager.group(2)) if pager else 1

    if total_paginas > MAX_PAGINAS_MATERIAS:
        print(
            f"[etl.camaras.betim] parlamentarId={vereador_numeric_id} tipoMateriaId={tipo_id}: "
            f"{total_paginas} páginas anunciadas, acima do limite de segurança de "
            f"{MAX_PAGINAS_MATERIAS} -- descartando o lote em vez de raspar parcialmente."
        )
        return None

    ids_vistos, resultado = _ids_da_pagina_atual(page)

    for pagina_alvo in range(2, total_paginas + 1):
        page.evaluate(f"executaBusca({pagina_alvo})")

        ids_pagina, itens_pagina = set(), []
        for _tentativa in range(20):  # ~4s poll budget (200ms steps)
            page.wait_for_timeout(200)
            ids_pagina, itens_pagina = _ids_da_pagina_atual(page)
            if ids_pagina and ids_pagina.isdisjoint(ids_vistos):
                break
        else:
            print(
                f"[etl.camaras.betim] parlamentarId={vereador_numeric_id} tipoMateriaId={tipo_id}: "
                f"página {pagina_alvo} não avançou de forma limpa (grade repetida/vazia após "
                "4s de espera) -- descartando o lote inteiro."
            )
            return None

        resultado.extend(itens_pagina)
        ids_vistos |= ids_pagina

    if total_esperado is not None and len(ids_vistos) != total_esperado:
        print(
            f"[etl.camaras.betim] parlamentarId={vereador_numeric_id} tipoMateriaId={tipo_id}: "
            f"coletou {len(ids_vistos)} matérias únicas, mas a busca anunciou {total_esperado} -- "
            "descartando o lote inteiro em vez de gravar uma contagem que não bate."
        )
        return None

    return resultado


NUMERO_ANO_RE = re.compile(r"Nº\s*(\d+)\s*/\s*(\d{4})")


def _scrape_materia_detalhe(page, materia_id: str) -> dict:
    page.goto(f"{PROLEGIS_URL}/Materia/DadosMateria/{materia_id}", wait_until="domcontentloaded")
    page.wait_for_selector("#Ementa", timeout=15000)

    def _valor_apos_label(label: str) -> str | None:
        loc = page.locator(f"xpath=//label[contains(., '{label}')]/following::input[1]")
        if loc.count() == 0:
            return None
        v = loc.first.input_value()
        return v.strip() or None

    ementa = (page.locator("#Ementa").input_value() or "").strip() or None
    autores_raw = (page.locator("#AutoresMateria").input_value() or "").strip()
    autores = [a.strip() for a in re.split(r"[,;\n]", autores_raw) if a.strip()] if autores_raw else []
    situacao = _valor_apos_label("Situação da Matéria")

    # First "Tramitação" table row is the protocol date -- used as a proxy
    # for data_apresentacao (there's no separate "date filed" field exposed
    # on this page).
    data_apresentacao = None
    linhas_tab = page.locator("table tr").all_inner_texts()
    for linha in linhas_tab:
        m = re.search(r"(\d{2})/(\d{2})/(\d{4})", linha)
        if m:
            d, mo, y = m.groups()
            data_apresentacao = f"{y}-{mo}-{d}"
            break

    return {
        "ementa": ementa,
        "autores": autores,
        "situacao": situacao,
        "data_apresentacao": data_apresentacao,
        "link_fonte": f"{PROLEGIS_URL}/Materia/DadosMateria/{materia_id}",
        # Tema temático (pedido do usuário 2026-07-22, ver etl/temas.py).
        "temas": classificar_texto(ementa),
    }


def _upsert_proposicoes(client, rows: list[dict]) -> int:
    """Emulates upsert on (id_municipio, tipo, numero, ano) via
    select-then-insert/update -- see module docstring for why `on_conflict`
    isn't used here (no DB-level unique constraint applied yet).

    `temas` é uma coluna nova (migration 0012) que pode ainda não existir
    no banco do usuário -- na primeira falha 42703 (undefined_column),
    remove `temas` de todas as linhas restantes pro resto desta chamada
    (não tenta de novo linha por linha, seria centenas de tentativas
    fadadas -- ver `upsert_com_colunas_opcionais` em `etl/common.py` pro
    mesmo padrão usado em `etl/pncp/contratos.py`, adaptado aqui pro
    insert/update linha a linha que este módulo já usa)."""
    total = 0
    temas_disponivel = True
    for row in rows:
        if not temas_disponivel:
            row = {k: v for k, v in row.items() if k != "temas"}
        existing = (
            client.table("proposicoes")
            .select("id")
            .eq("id_municipio", row["id_municipio"])
            .eq("tipo", row["tipo"])
            .eq("numero", row["numero"])
            .eq("ano", row["ano"])
            .limit(1)
            .execute()
        )
        try:
            if existing.data:
                client.table("proposicoes").update(row).eq("id", existing.data[0]["id"]).execute()
            else:
                client.table("proposicoes").insert(row).execute()
        except PgAPIError as e:
            if e.code != "42703" or not temas_disponivel:
                raise
            print(
                f"[etl.camaras.betim] coluna 'temas' ainda não existe ({e.message}) -- "
                "gravando proposições sem tema até a migration 0012 rodar."
            )
            temas_disponivel = False
            row = {k: v for k, v in row.items() if k != "temas"}
            if existing.data:
                client.table("proposicoes").update(row).eq("id", existing.data[0]["id"]).execute()
            else:
                client.table("proposicoes").insert(row).execute()
        total += 1
    return total


def sync(id_municipio: str, incluir_proposicoes: bool = True) -> None:
    client = get_supabase_client()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        ids = _scrape_lista(page)
        print(f"[etl.camaras.betim] vereadores_listados={len(ids)}")

        rows = []
        numeric_id_by_slug: dict[str, str] = {}
        for vereador_id in ids:
            detail = _scrape_detail(page, vereador_id)
            if not detail.get("nome"):
                print(f"[etl.camaras.betim] pulei id={vereador_id}: não consegui extrair nome")
                continue
            slug = _slugify(detail["nome_urna"] or detail["nome"])
            numeric_id_by_slug[slug] = vereador_id
            rows.append(
                {
                    "id_municipio": id_municipio,
                    "slug": slug,
                    "nome": detail["nome"],
                    "nome_urna": detail["nome_urna"],
                    "partido": detail["partido"],
                    "email": detail["email"],
                    "mandato_inicio": detail["mandato_inicio"],
                    "mandato_fim": detail["mandato_fim"],
                    "profissao": detail["profissao"],
                    "biografia": detail["biografia"],
                    "aniversario_dia_mes": detail["aniversario_dia_mes"],
                    "ativo": True,
                }
            )

        cargo_por_slug = _scrape_mesa_diretora(page)
        print(f"[etl.camaras.betim] mesa_diretora={len(cargo_por_slug)}")
        for row in rows:
            row["cargo_mesa"] = cargo_por_slug.get(row["slug"])

        if rows:
            # `biografia`/`profissao`/`aniversario_dia_mes` são colunas
            # novas (migration 0017) -- degrada pra upsert sem elas se a
            # migration ainda não rodou, mesmo padrão de `temas` (0012).
            upsert_com_colunas_opcionais(
                client,
                "vereadores",
                rows,
                ["biografia", "profissao", "aniversario_dia_mes"],
                on_conflict="id_municipio,slug",
            )
        print(f"[etl.camaras.betim] total={len(rows)}")

        if not incluir_proposicoes:
            browser.close()
            return

        # id_municipio + slug -> uuid, needed for proposicoes.vereador_id FK
        vereadores_db = (
            client.table("vereadores").select("id, slug").eq("id_municipio", id_municipio).execute()
        )
        uuid_by_slug = {r["slug"]: r["id"] for r in (vereadores_db.data or [])}

        materias_vistas: dict[str, dict] = {}  # materia_id -> row (dedup across co-authors)
        for slug, numeric_id in numeric_id_by_slug.items():
            for tipo_id, tipo_nome in TIPO_MATERIA.items():
                itens = _scrape_lista_materias(page, numeric_id, tipo_id)
                for item in itens:
                    if item["materia_id"] in materias_vistas:
                        continue
                    m = NUMERO_ANO_RE.search(item["titulo"])
                    if not m:
                        continue
                    materias_vistas[item["materia_id"]] = {
                        "id_municipio": id_municipio,
                        "vereador_id": uuid_by_slug.get(slug),
                        "tipo": tipo_nome,
                        "numero": int(m.group(1)),
                        "ano": int(m.group(2)),
                    }
        print(f"[etl.camaras.betim] materias_unicas={len(materias_vistas)}")

        proposicoes_rows = []
        for materia_id, base_row in materias_vistas.items():
            try:
                detalhe = _scrape_materia_detalhe(page, materia_id)
            except Exception as e:
                print(f"[etl.camaras.betim] falha ao ler materia {materia_id}: {type(e).__name__}")
                continue
            proposicoes_rows.append({**base_row, **detalhe})

        browser.close()

    if proposicoes_rows:
        total_prop = _upsert_proposicoes(client, proposicoes_rows)
        print(f"[etl.camaras.betim] proposicoes_sincronizadas={total_prop}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--sem-proposicoes", action="store_true")
    args = parser.parse_args()
    try:
        sync(args.id_municipio, incluir_proposicoes=not args.sem_proposicoes)
    except RuntimeError as e:
        print(f"[etl.camaras.betim] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
