r"""etl.apis.legislacao_semad — Banco de Legislação Ambiental da SEMAD-MG.
Cobre o que a ALMG NÃO tem: Deliberação Copam, Portaria IEF, Portaria Igam,
Resolução Conjunta Semad/Feam/IEF/Igam — atos administrativos dos órgãos do
Sisema, não leis/decretos da Assembleia.

Fonte: `https://semad.mg.gov.br/banco-de-legislação-ambiental` — página
Liferay com um portlet Asset Publisher. **Não há API headless utilizável**
(`/o/headless-delivery/v1.0/sites` devolve HTTP 500, confirmado no F0) —
este módulo faz parsing de HTML mesmo, contrato testado ao vivo em
2026-08-11.

═══ A ARMADILHA DA PAGINAÇÃO (docs/ambiental/F0-discovery.md §6) ═══

O Asset Publisher do Liferay pagina por `_cur`/`_delta`, NÃO por `start`
simples — e os dois nomes de parâmetro vêm prefixados pelo id da instância
do portlet nesta página específica
(`_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_vopo_`).
Sem o prefixo certo o Liferay ignora o parâmetro em silêncio e devolve
sempre a página 1.

═══ A ARMADILHA DA TABELA ANINHADA ═══

`<table class="normas-table">` tem **12 tabelas aninhadas** dentro de
células de rodapé/paginação — pegar `.//tr` (qualquer profundidade) conta
linha de tabela errada e infla a contagem sem erro nenhum (medido: 258
`<tr>` por XPath profundo contra **80** reais). A extração correta é
`./tbody/tr`, filhos DIRETOS.

═══ POR QUE O ENCODING PARECE QUEBRADO NO TERMINAL, E NÃO ESTÁ ═══

A resposta declara `charset=UTF-8` corretamente e os bytes batem (`õ` =
`\xc3\xb5`, confirmado por `ord()`). Mojibake visto ao imprimir no console
do Windows é problema de codepage do terminal — mesmo achado do
`copam_reunioes` (F0 §14.4), não bug deste coletor.

═══ COBERTURA MEDIDA ═══

2.237 normas (28 páginas de `delta=80`), a mais antiga por volta de
set/2025. `data` já vem em ISO (`2026-08-11`) — sem parsing de data BR aqui,
ao contrário do SIAM.

Uso:

    python -m etl.apis.legislacao_semad --sondar
    python -m etl.apis.legislacao_semad --sondar --paginas 2
    python -m etl.apis.legislacao_semad
"""
import argparse
import re
import sys
import time
from urllib.parse import parse_qs, urlparse

import requests
from lxml import html
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed

from etl.common import get_supabase_client
from etl.apis._legislacao_ambiental import UA, chave_dedup

LOG = "[etl.apis.legislacao_semad]"

BASE = "https://semad.mg.gov.br/banco-de-legislação-ambiental"
DOMINIO = "https://semad.mg.gov.br"
# O id da instância do portlet NESTA página — se a SEMAD trocar o layout,
# este prefixo muda e todo `_cur` passa a ser ignorado (a paginação volta
# sempre pra página 1, sem erro). É por isso que `coletar()` confere
# `paginas_lidas`/total no fim, não confia cegamente no loop.
PREFIXO_PORTLET = "_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_vopo_"
DELTA = 80
TIMEOUT = 60
PAUSA_PADRAO = 1.0

_RE_TOTAL = re.compile(r"Exibindo\s+[\d.]+\s*-\s*[\d.]+\s+de\s+([\d.]+)\s+resultados", re.IGNORECASE)


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    return s


@retry(
    retry=retry_if_exception_type(requests.exceptions.Timeout),
    stop=stop_after_attempt(3),
    wait=wait_fixed(3),
)
def _buscar_pagina(sessao: requests.Session, cur: int) -> tuple[list, int | None]:
    """(linhas_tr, total_declarado_pela_fonte | None)."""
    params = {
        "p_p_id": "com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_vopo",
        "p_p_lifecycle": "0",
        "p_p_state": "normal",
        "p_p_mode": "view",
        PREFIXO_PORTLET + "delta": str(DELTA),
        PREFIXO_PORTLET + "cur": str(cur),
    }
    r = sessao.get(BASE, params=params, timeout=TIMEOUT)
    if r.status_code in (403, 429):
        raise RuntimeError(f"{LOG} HTTP {r.status_code} na página {cur} — parando (não retentando).")
    r.raise_for_status()
    doc = html.fromstring(r.content)
    tabelas = doc.xpath("//table[contains(@class,'normas-table')]")
    if not tabelas:
        return [], None
    linhas = tabelas[0].xpath("./tbody/tr")  # NUNCA .//tr — armadilha da tabela aninhada

    total = None
    m = _RE_TOTAL.search(doc.text_content())
    if m:
        total = int(m.group(1).replace(".", ""))
    return linhas, total


def _linha(tr) -> dict | None:
    tds = tr.xpath("./td")
    if len(tds) < 6:
        return None
    tipo = tds[0].text_content().strip()
    orgao = tds[1].text_content().strip() or None
    numero = tds[2].text_content().strip() or None
    data = tds[3].text_content().strip() or None  # já ISO, ex. "2026-08-11"
    ementa = " ".join(tds[4].text_content().split()) or None

    links = tds[5].xpath(".//a[contains(@href,'get_file')]")
    link_pdf = None
    id_fonte = None
    if links:
        href = links[0].get("href") or ""
        link_pdf = href if href.startswith("http") else DOMINIO + href
        qs = parse_qs(urlparse(href).query)
        id_fonte = (qs.get("fileEntryId") or [None])[0]
    if not id_fonte:
        # Sem fileEntryId não há como fazer upsert idempotente por linha —
        # nesta amostra (2.237 normas, 2026-08-11) toda linha tinha o link;
        # se a fonte mudar isso, é melhor pular a linha e AVISAR do que
        # inventar uma chave.
        return None

    ano = int(data[:4]) if data and len(data) >= 4 and data[:4].isdigit() else None

    return {
        "fonte": "semad",
        "id_fonte": id_fonte,
        "tipo": tipo,
        "numero": numero,
        "ano": ano,
        "ementa": ementa,
        "data": data,
        "orgao": orgao,
        "link_pdf": link_pdf,
        "id_ibge_municipio": None,  # ver a nota da migration 0063
        "chave_dedup": chave_dedup(tipo, numero, ano),
    }


def coletar(
    *, pausa: float = PAUSA_PADRAO, max_paginas: int | None = None, verboso: bool = False
) -> tuple[list[dict], dict]:
    sessao = _sessao()
    primeira_trs, total = _buscar_pagina(sessao, 1)
    total = total or 0
    total_paginas = (total + DELTA - 1) // DELTA if total else 1
    ultima = min(max_paginas, total_paginas) if max_paginas else total_paginas

    diag = {
        "total_declarado": total,
        "total_paginas": total_paginas,
        "paginas_lidas": 0,
        "truncado": max_paginas is not None and max_paginas < total_paginas,
        "duplicatas_na_fonte": 0,
    }

    # Por `id_fonte`, não lista: a própria fonte repetiu uma norma
    # (Deliberação Copam 1731/2022, `fileEntryId=9732536`, medido ao vivo em
    # 2026-08-11 — duas linhas idênticas na listagem) e um upsert em lote com
    # `id_fonte` repetido DENTRO do mesmo lote quebra o Postgres
    # (`CardinalityViolation: ON CONFLICT DO UPDATE command cannot affect
    # row a second time`) — não é erro do coletor, é o dado real da fonte.
    por_id: dict[str, dict] = {}
    for cur in range(1, ultima + 1):
        trs = primeira_trs if cur == 1 else _buscar_pagina(sessao, cur)[0]
        if not trs:
            # Página além do fim (armadilha: cur muito alto não erra, só
            # devolve tabela vazia) — para de pedir mais.
            if verboso:
                print(f"{LOG}   página {cur}: vazia — parando.")
            break
        for tr in trs:
            linha = _linha(tr)
            if linha:
                if linha["id_fonte"] in por_id:
                    diag["duplicatas_na_fonte"] += 1
                por_id[linha["id_fonte"]] = linha
        diag["paginas_lidas"] += 1
        if verboso:
            print(f"{LOG}   página {cur}/{ultima}: {len(trs)} linha(s), "
                  f"{len(por_id)} acumulada(s)")
        if cur < ultima:
            time.sleep(pausa)

    return list(por_id.values()), diag


def sondar(pausa: float, max_paginas: int | None) -> None:
    linhas, diag = coletar(pausa=pausa, max_paginas=max_paginas, verboso=True)
    print(f"\n{LOG} fonte declara {diag['total_declarado']} norma(s) "
          f"({diag['total_paginas']} página(s)); {diag['paginas_lidas']} página(s) lida(s), "
          f"{len(linhas)} linha(s) montada(s).")
    if diag["truncado"]:
        print(f"{LOG} SONDAGEM TRUNCADA — amostra, não o corpus inteiro.")
    for l in linhas[:8]:
        print(f"       {l['tipo']:<12} {l['orgao'] or '':<28} nº{l['numero']:<8} {l['data']} "
              f"chave={l['chave_dedup']!r}  {(l['ementa'] or '')[:50]}")


def sync(*, pausa: float = PAUSA_PADRAO) -> None:
    client = get_supabase_client()
    linhas, diag = coletar(pausa=pausa, verboso=True)
    print(f"{LOG} fonte declara {diag['total_declarado']}, {len(linhas)} linha(s) montada(s) para gravar.")
    if not linhas:
        print(f"{LOG} nada coletado — NÃO apago o que já existe.")
        return
    if diag["total_declarado"] and len(linhas) < diag["total_declarado"] * 0.9:
        print(f"{LOG} ATENÇÃO: {len(linhas)} linha(s) contra {diag['total_declarado']} declaradas "
              "pela fonte — coleta possivelmente truncada ou parser desalinhado. Gravando mesmo assim.")
    for i in range(0, len(linhas), 200):
        client.table("ambiental_legislacao").upsert(
            linhas[i : i + 200], on_conflict="fonte,id_fonte"
        ).execute()
    print(f"{LOG} {len(linhas)} linha(s) gravada(s)/atualizada(s) (fonte=semad).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sondar", action="store_true", help="consulta e relata, NÃO grava, NÃO lê o banco")
    parser.add_argument("--paginas", type=int, help="teto de páginas (amostra) — só com --sondar")
    parser.add_argument("--pausa", type=float, default=PAUSA_PADRAO, help="segundos entre requisições")
    args = parser.parse_args()

    try:
        if args.sondar:
            sondar(args.pausa, args.paginas)
        else:
            sync(pausa=args.pausa)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
