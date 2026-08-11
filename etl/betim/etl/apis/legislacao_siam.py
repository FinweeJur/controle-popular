r"""etl.apis.legislacao_siam — arquivo histórico de legislação ambiental de
Minas Gerais no SIAM (Sistema de Legislação Ambiental), mantido pela SEMAD.
Sobrepõe parcialmente ALMG e SEMAD (mesmas Leis/Decretos estaduais, mesmas
Deliberações Copam/Portarias IEF/Igam) mas cobre até 2024 com um
identificador de norma (`idNorma`) que as outras duas fontes não têm.

Fonte: `https://www.siam.mg.gov.br/sla/action/Consulta.do` — um GET **sem
parâmetro nenhum devolve a TABELA INTEIRA, sem paginação**. Contrato testado
ao vivo em 2026-08-11 (ver `docs/ambiental/F0-discovery.md` §6):
**4.098 normas** numa única resposta (~2,4 MB de HTML).

═══ A ARMADILHA DO NOME `download.pdf` (medida, não bug deste coletor) ═══

`download.pdf?idNorma={id}` devolve **`Content-Type: text/html`**, não PDF —
confirmado por HEAD ao vivo (2026-08-11: `idNorma=41`, 200, `text/html`).
Apesar do nome do endpoint, é HTML. Este coletor não baixa o conteúdo (só
guarda o link — a mesma URL, com o mesmo nome enganoso, é o que a tela
oferece ao cidadão como "ver a norma").

═══ A ARMADILHA DA TABELA ANINHADA (mesma classe de bug do `legislacao_semad`) ═══

`<table class="tabelaAdm">` é a maior tabela da página, mas coexiste com
outras 7 tabelas de layout. A extração usa `./tbody/tr` (linhas FILHAS
diretas do `<tbody>` da própria `tabelaAdm`, não `.//tr`, que pegaria linha
de tabela aninhada em rodapé/paginação de outras seções) — 4.098 medidas,
batendo com a paginação zero da fonte.

═══ POR QUE `tipo` E `orgao` PRECISAM SER SEPARADOS AQUI, E NAS OUTRAS DUAS
    FONTES NÃO ═══

O SIAM grava tipo+órgão colados numa coluna só ("Portaria IEF", "Decreto
Estadual", "Resolução Conjunta Semad/Ief/Feam/Igam" — 78 combinações
distintas medidas). `_dividir_tipo_orgao` casa um prefixo de tipo conhecido
(Lei, Decreto, Portaria, Deliberação [Normativa|Conjunta], Resolução
[Conjunta], Ato [de Delegação], Extrato de Portaria) e trata o resto da
string como órgão — exceto "Estadual" sozinho, que é ÂMBITO (já implícito:
as três fontes deste eixo só cobrem MG), não órgão. Uma combinação que não
bate com nenhum prefixo conhecido entra com o texto INTEIRO em `tipo` e
`orgao=None` — perde a separação fina, mas não perde a norma (nenhuma linha
é descartada por causa deste parsing).

═══ DEDUP COM AS OUTRAS DUAS FONTES ═══

Ver `etl.apis._legislacao_ambiental` — a normalização de tipo aqui
("Decreto Estadual" -> "DECRETO", igual à ALMG "DEC" e à SEMAD "Decreto")
existe exatamente para que `chave_dedup` reconheça a MESMA norma nas três
fontes sem fundir as linhas.

Uso:

    python -m etl.apis.legislacao_siam --sondar
    python -m etl.apis.legislacao_siam --sondar --linhas 20
    python -m etl.apis.legislacao_siam
"""
import argparse
import datetime as dt
import re
import sys
import unicodedata
from urllib.parse import urljoin, parse_qs, urlparse

import requests
from lxml import html
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed

from etl.common import get_supabase_client
from etl.apis._legislacao_ambiental import UA, chave_dedup

LOG = "[etl.apis.legislacao_siam]"

URL = "https://www.siam.mg.gov.br/sla/action/Consulta.do"
TIMEOUT = 120  # a resposta é ~2,4 MB numa página só, sem paginação — dar folga

# Ordem importa: prefixos mais específicos ANTES dos genéricos que os
# contêm ("Deliberação Normativa Conjunta" antes de "Deliberação Normativa"
# antes de "Deliberação"), senão o genérico casa primeiro e sobra órgão
# errado (ex. "Normativa Conjunta Copam/CERH" viraria órgão de
# "Deliberação").
_PREFIXOS_TIPO = [
    "Extrato de Portaria",
    "Deliberação Normativa Conjunta",
    "Deliberação Conjunta",
    "Deliberação Normativa",
    "Deliberação",
    "Portaria Conjunta",
    "Portaria",
    "Resolução Conjunta",
    "Resolução",
    "Ato de Delegação",
    "Ato",
    "Decreto",
    "Lei Complementar",
    "Lei",
]


def _sem_acento_upper(s: str) -> str:
    base = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in base if unicodedata.category(c) != "Mn").upper()


def _dividir_tipo_orgao(bruto: str) -> tuple[str, str | None]:
    normalizado = " ".join((bruto or "").split())
    alvo = _sem_acento_upper(normalizado)
    for prefixo in _PREFIXOS_TIPO:
        p = _sem_acento_upper(prefixo)
        if alvo.startswith(p):
            resto = normalizado[len(prefixo):].strip(" -/")
            # "Estadual" sozinho é ÂMBITO (Decreto Estadual), não ÓRGÃO —
            # as três fontes deste eixo só cobrem MG, então a informação é
            # redundante, não perdida.
            if resto and re.fullmatch(r"(?i)estadual", resto):
                resto = ""
            return prefixo, (resto or None)
    # Nenhum prefixo conhecido bateu: guarda o literal inteiro em `tipo` em
    # vez de arriscar um corte errado. Não descarta a linha.
    return normalizado, None


def _data_iso(bruto: str) -> str | None:
    """`"14/01/2004"` -> `"2004-01-14"`."""
    try:
        return dt.datetime.strptime(bruto.strip(), "%d/%m/%Y").date().isoformat()
    except (ValueError, AttributeError):
        return None


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    return s


@retry(
    retry=retry_if_exception_type(requests.exceptions.Timeout),
    stop=stop_after_attempt(3),
    wait=wait_fixed(5),
)
def _buscar_tabela(sessao: requests.Session):
    r = sessao.get(URL, timeout=TIMEOUT)
    if r.status_code in (403, 429):
        raise RuntimeError(f"{LOG} HTTP {r.status_code} — parando (não retentando).")
    r.raise_for_status()
    doc = html.fromstring(r.content)
    tabelas = doc.xpath("//table[@class='tabelaAdm']")
    if not tabelas:
        raise RuntimeError(f"{LOG} tabela 'tabelaAdm' não encontrada — layout da fonte mudou?")
    return tabelas[0].xpath("./tbody/tr")  # NUNCA .//tr — mesma armadilha do legislacao_semad


def _linha(tr) -> dict | None:
    tds = tr.xpath("./td")
    if len(tds) < 6:
        return None
    tipo_bruto = tds[0].text_content().strip()
    numero = tds[1].text_content().strip() or None
    data = _data_iso(tds[2].text_content())
    # tds[3] é o Âmbito (Federal/Estadual) — descartado, ver docstring.
    ementa = " ".join(tds[4].text_content().split()) or None

    links = tds[5].xpath(".//a[contains(@href,'download.pdf')]") or tr.xpath(".//a[contains(@href,'download.pdf')]")
    if not links:
        return None
    href = links[0].get("href")
    link_pdf = urljoin(URL, href)
    id_fonte = (parse_qs(urlparse(link_pdf).query).get("idNorma") or [None])[0]
    if not id_fonte:
        return None

    tipo, orgao = _dividir_tipo_orgao(tipo_bruto)
    ano = int(data[:4]) if data else None

    return {
        "fonte": "siam",
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


def coletar(*, max_linhas: int | None = None, verboso: bool = False) -> tuple[list[dict], dict]:
    """Uma requisição só — a fonte não pagina (armadilha central deste
    módulo). `max_linhas` existe só para truncar a AMOSTRA impressa em
    `--sondar`; não evita a requisição, que já veio inteira."""
    sessao = _sessao()
    trs = _buscar_tabela(sessao)
    diag = {
        "total_linhas_html": len(trs),
        "sem_link": 0,
        "duplicatas_na_fonte": 0,
        "truncado": max_linhas is not None,
    }

    # Por `id_fonte` (idNorma), não lista — mesma cautela das outras duas
    # fontes: upsert em lote com `id_fonte` repetido no mesmo lote quebra o
    # Postgres inteiro (`CardinalityViolation`), não só duplica a linha.
    por_id: dict[str, dict] = {}
    for tr in trs:
        if max_linhas is not None and len(por_id) >= max_linhas:
            break
        linha = _linha(tr)
        if linha is None:
            diag["sem_link"] += 1
            continue
        if linha["id_fonte"] in por_id:
            diag["duplicatas_na_fonte"] += 1
        por_id[linha["id_fonte"]] = linha
        if verboso and len(por_id) % 500 == 0:
            print(f"{LOG}   {len(por_id)} linha(s) processada(s)...")

    return list(por_id.values()), diag


def sondar(max_linhas: int | None) -> None:
    linhas, diag = coletar(max_linhas=max_linhas, verboso=True)
    print(f"\n{LOG} {diag['total_linhas_html']} linha(s) na tabela HTML "
          f"(fonte devolve tudo numa página só, sem paginação).")
    if diag["sem_link"]:
        print(f"{LOG} {diag['sem_link']} linha(s) sem link de download — puladas.")
    print(f"{LOG} {len(linhas)} norma(s) montada(s).")
    for l in linhas[:10]:
        print(f"       {l['tipo']:<22} {l['orgao'] or '':<20} nº{l['numero']:<10} {l['ano']} "
              f"chave={l['chave_dedup']!r}  {(l['ementa'] or '')[:45]}")


def sync() -> None:
    client = get_supabase_client()
    linhas, diag = coletar(verboso=True)
    print(f"{LOG} {diag['total_linhas_html']} linha(s) na fonte, {len(linhas)} montada(s) para gravar "
          f"({diag['sem_link']} sem link, pulada(s)).")
    if not linhas:
        print(f"{LOG} nada coletado — NÃO apago o que já existe.")
        return
    for i in range(0, len(linhas), 200):
        client.table("ambiental_legislacao").upsert(
            linhas[i : i + 200], on_conflict="fonte,id_fonte"
        ).execute()
    print(f"{LOG} {len(linhas)} linha(s) gravada(s)/atualizada(s) (fonte=siam).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sondar", action="store_true", help="consulta e relata, NÃO grava, NÃO lê o banco")
    parser.add_argument("--linhas", type=int, help="teto de linhas impressas na amostra — só com --sondar")
    args = parser.parse_args()

    try:
        if args.sondar:
            sondar(args.linhas)
        else:
            sync()
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
