"""etl.camaras.comissoes — sync "Participação em Comissões" (migration 0015).

Usage: python -m etl.camaras.comissoes --id-municipio 3106705

Fonte: a aba "Participação em Comissões" vive na PRÓPRIA página de detalhe
de cada vereador (`www.camarabetim.mg.gov.br/Parlamentares/Parlamentar/{id}`),
renderizada client-side pelo Blazor — não existe um catálogo central de
comissões no site nem uma página "Comissões" separada. O roster é
reconstruído agregando as 23 páginas individuais.

ACHADO QUE MOLDOU O DESENHO (ver migration 0015 pra detalhe completo):
comissões foram renomeadas ao longo das legislaturas ("Meio Ambiente e
Desenvolvimento Sustentável" → "..., ... e Proteção Animal" → "..., ...,
Bem-Estar, Proteção e Defesa Animal", mesmo padrão em "Segurança
Pública..." e "Finanças, Orçamento..."). Sem fonte que confirme se é
renomeação da mesma comissão ou uma nova, o catálogo (`comissoes`) é
semeado só com os nomes do bloco "Participações em andamento" — o roster
ATUAL, agregado nas 23 páginas, sem ambiguidade (24 comissões, confirmado
ao vivo 2026-07-23). Participação com nome histórico que não bate
EXATAMENTE com uma comissão atual fica sem `comissao_id` (mas o nome bruto
raspado sempre é gravado em `nome_comissao_bruto` — nada se perde).

Duas categorias de linha, tratadas diferente por causa da ausência de
período nas participações em andamento:
- "em andamento" (ativo=true, sem data_inicio/data_fim): recomputo total
  por vereador a cada rodada (delete + insert), mesmo padrão de
  `etl/grupos.py` — sem isso, um UNIQUE constraint com data_inicio/
  data_fim NULL não deduplica entre rodadas (NULL != NULL em Postgres) e
  duplicaria a cada execução.
- "finalizadas" (tem período real, imutável depois de encerrada): upsert
  normal via `on_conflict`, porque o período preenchido já é uma chave
  natural estável.
"""
import argparse
import re
import sys
import unicodedata
from html import unescape

from playwright.sync_api import sync_playwright

from etl.camaras.betim import BASE_URL, DETAIL_LINK_RE, _scrape_lista, _wait_for_blazor, _slugify
from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client, refresh_completo_seguro

TAG_RE = re.compile(r"<[^>]+>")
PERIODO_RE = re.compile(
    r"Per[íi]odo:\s*(\d{2}/\d{2}/\d{4})\s*at[ée]\s*(\d{2}/\d{2}/\d{4})", re.IGNORECASE
)
RECUO_DIV_RE = re.compile(r'<div class="my-3 recuo">(.*?)</div></div>', re.DOTALL)
APELIDO_RE = re.compile(r"\( ([^)]+) \)")


def _texto_limpo(html_fragmento: str) -> str:
    return re.sub(r"\s+", " ", unescape(TAG_RE.sub("", html_fragmento))).strip()


def _data_iso(data_br: str) -> str:
    d, m, a = data_br.split("/")
    return f"{a}-{m}-{d}"


def _parse_bloco(html_bloco: str) -> dict:
    """Devolve {"andamento": [...], "finalizadas": [...]}, cada item com
    comissao/papel/data_inicio/data_fim (as duas últimas None em
    andamento)."""
    idx_andamento = html_bloco.find("Participações em andamento")
    idx_finalizadas = html_bloco.find("Participações finalizadas")

    andamento, finalizadas = [], []
    for m in RECUO_DIV_RE.finditer(html_bloco):
        bruto = _texto_limpo(m.group(1))
        pos = m.start()
        em_andamento = idx_andamento != -1 and pos > idx_andamento and (
            idx_finalizadas == -1 or pos < idx_finalizadas
        )

        periodo = PERIODO_RE.search(bruto)
        nome_papel = bruto[: periodo.start()].strip(" -") if periodo else bruto.strip()
        partes = nome_papel.rsplit(" - ", 1)
        nome_comissao, papel = partes if len(partes) == 2 else (nome_papel, None)
        if not papel:
            continue

        item = {
            "comissao": re.sub(r"\s+", " ", nome_comissao).strip(),
            "papel": papel.strip(),
            "data_inicio": _data_iso(periodo.group(1)) if periodo else None,
            "data_fim": _data_iso(periodo.group(2)) if periodo else None,
        }
        (andamento if em_andamento else finalizadas).append(item)

    return {"andamento": andamento, "finalizadas": finalizadas}


def _scrape_comissoes_vereador(page, vereador_id: str) -> dict | None:
    page.goto(f"{BASE_URL}/Parlamentares/Parlamentar/{vereador_id}", wait_until="networkidle")
    _wait_for_blazor(page)

    aba = page.get_by_text("Participação em Comissões", exact=False)
    if aba.count() == 0:
        return None
    aba.first.click()
    page.wait_for_timeout(1200)
    _wait_for_blazor(page)

    apelido_m = APELIDO_RE.search(page.inner_text("body"))
    slug = _slugify(apelido_m.group(1)) if apelido_m else None

    html = page.inner_html("body")
    idx = html.find('class="cmb-portal-tab-list-tabs-content-active')
    bloco = html[idx:] if idx != -1 else ""
    return {"slug": slug, **_parse_bloco(bloco)}


def sync(id_municipio: str, permitir_reducao: bool = False) -> None:
    client = get_supabase_client()

    vereadores_db = (
        client.table("vereadores").select("id, slug").eq("id_municipio", id_municipio).execute()
    )
    uuid_by_slug = {r["slug"]: r["id"] for r in (vereadores_db.data or [])}

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        ids = _scrape_lista(page)
        print(f"[etl.camaras.comissoes] vereadores_listados={len(ids)}")

        resultados = []
        for vereador_id in ids:
            r = _scrape_comissoes_vereador(page, vereador_id)
            if r is None:
                print(f"[etl.camaras.comissoes] id={vereador_id}: aba não encontrada, pulando")
                continue
            if not r["slug"] or r["slug"] not in uuid_by_slug:
                print(f"[etl.camaras.comissoes] id={vereador_id}: slug '{r['slug']}' não casa com vereadores já sincronizados, pulando")
                continue
            resultados.append(r)

        browser.close()

    # Catálogo de comissões ATUAIS: só os nomes do bloco "em andamento",
    # agregados entre todos os vereadores — ver docstring do módulo.
    nomes_atuais = sorted({item["comissao"] for r in resultados for item in r["andamento"]})
    comissoes_rows = [
        {
            "id_municipio": id_municipio,
            "nome": nome,
            "especial": "especial" in nome.lower(),
        }
        for nome in nomes_atuais
    ]
    if comissoes_rows:
        client.table("comissoes").upsert(comissoes_rows, on_conflict="id_municipio,nome").execute()
    print(f"[etl.camaras.comissoes] comissoes_atuais={len(nomes_atuais)}")

    comissoes_db = (
        client.table("comissoes").select("id, nome").eq("id_municipio", id_municipio).execute()
    )
    comissao_id_by_nome = {r["nome"]: r["id"] for r in (comissoes_db.data or [])}

    total_andamento = total_finalizadas = 0
    for r in resultados:
        vereador_id = uuid_by_slug[r["slug"]]

        # "em andamento": recompute total pra este vereador (delete+insert),
        # não upsert -- ver docstring do módulo (NULL != NULL no unique).
        andamento_rows = [
            {
                "id_municipio": id_municipio,
                "comissao_id": comissao_id_by_nome.get(item["comissao"]),
                "nome_comissao_bruto": item["comissao"],
                "vereador_id": vereador_id,
                "papel": item["papel"],
                "data_inicio": None,
                "data_fim": None,
                "ativo": True,
            }
            for item in r["andamento"]
        ]
        # O delete+insert acontece dentro de `refresh_completo_seguro`: a aba
        # é renderizada pelo Blazor e pode voltar vazia/parcial numa rodada
        # ruim, e aí o recompute apagaria participações ativas reais (mesma
        # falha que custou 55 linhas de `verbas_indenizatorias` em
        # 2026-07-29). `ao_reduzir="skip"`: uma página incompleta não pode
        # derrubar a varredura dos outros 22 vereadores.
        if andamento_rows:
            gravou = refresh_completo_seguro(
                client,
                "comissao_membros",
                {"id_municipio": id_municipio, "vereador_id": vereador_id, "ativo": True},
                andamento_rows,
                permitir_reducao=permitir_reducao,
                ao_reduzir="skip",
                rotulo=f"etl.camaras.comissoes/{r['slug']}",
            )
            total_andamento += len(andamento_rows) if gravou else 0
        else:
            print(
                f"[etl.camaras.comissoes] {r['slug']}: bloco 'em andamento' vazio -- "
                "participações ativas atuais preservadas (nada apagado)."
            )

        # "finalizadas": período real já é chave natural estável -- upsert.
        finalizadas_rows = [
            {
                "id_municipio": id_municipio,
                "comissao_id": comissao_id_by_nome.get(item["comissao"]),
                "nome_comissao_bruto": item["comissao"],
                "vereador_id": vereador_id,
                "papel": item["papel"],
                "data_inicio": item["data_inicio"],
                "data_fim": item["data_fim"],
                "ativo": False,
            }
            for item in r["finalizadas"]
            if item["data_inicio"] and item["data_fim"]
        ]
        if finalizadas_rows:
            client.table("comissao_membros").upsert(
                finalizadas_rows,
                on_conflict="id_municipio,vereador_id,nome_comissao_bruto,papel,data_inicio,data_fim",
            ).execute()
        total_finalizadas += len(finalizadas_rows)

    print(
        f"[etl.camaras.comissoes] participacoes_andamento={total_andamento} "
        f"participacoes_finalizadas={total_finalizadas}"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--permitir-reducao",
        action="store_true",
        help="grava mesmo que a raspagem tenha menos participações ativas que o banco",
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, permitir_reducao=args.permitir_reducao)
    except RuntimeError as e:
        print(f"[etl.camaras.comissoes] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
