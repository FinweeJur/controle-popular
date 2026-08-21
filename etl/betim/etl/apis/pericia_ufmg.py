r"""etl.apis.pericia_ufmg — o acervo de resultados técnicos do Projeto
Brumadinho UFMG (perícia pública encomendada para produzir as informações
técnicas do processo de reparação de Brumadinho).

Fonte: `http://projetobrumadinho.ufmg.br` (Drupal).

═══ NÃO CONFUNDIR COM A *PLATAFORMA* BRUMADINHO UFMG ═══

Este é o site do PROJETO de perícia. `apps/web/lib/paraopeba/documentos.ts`
já usa outra fonte, o Solr da *Plataforma* Brumadinho
(`plataforma.projetobrumadinho.ufmg.br`) — essa traz as 471 PEÇAS DO
PROCESSO JUDICIAL (petição, laudo, decisão). São coisas diferentes com
autoria e finalidade diferentes:

  - **Plataforma** (já coletada): o que o PROCESSO produziu — peça
    processual, ato judicial.
  - **Projeto** (este coletor): o que os PESQUISADORES produziram —
    resultado técnico, apresentação, edital de chamada, ata de reunião com
    as partes. Nunca peça processual.

Não misturar os dois acervos numa tela só sem rotular a origem seria fazer
o leitor achar que o mesmo tipo de documento vem dobrado.

═══ MEDIDO AO VIVO EM 2026-08-20: 137 PDFs DISTINTOS, VIA BFS DE 60 PÁGINAS ═══

Todos servidos de `/sites/default/files/AAAA-MM/<nome>.pdf` (às vezes com
domínio absoluto — o site mistura `http://projetobrumadinho.ufmg.br/sites/...`
e caminho relativo `/sites/...` para o MESMO arquivo; `_normalizar_url_pdf`
resolve os dois para o caminho absoluto, então não duplicam por causa disso).
Concentração medida por página semente:

    /chamadasencerradas ......... 101 PDFs
    /subprojetos ................  20
    /reuniao-com-partes .........  10
    /node/582 ...................   8   (Apresentações e gravação — resultados, nov/2025)
    /subprojetos/meio-ambiente/... 2

═══ (a) `/chamadasencerradas` SÃO EDITAIS, NÃO RESULTADO DE PERÍCIA ═══

101 dos 137 PDFs — três quartos do acervo — são EDITAIS DE CHAMADA
("Retificação 11.pdf", "CHAMADA06_2019.pdf"): o projeto convocando
pesquisadores a se inscrever, não um laudo ou relatório técnico. Quem
procura "o que a perícia encontrou" não quer edital misturado com laudo
num balaio só. Por isso cada PDF é classificado por SEÇÃO DE ORIGEM
(`_classificar_secao`, aplicada à URL da PÁGINA onde o link foi
encontrado, nunca ao conteúdo do PDF em si — este coletor não abre PDF):

  - `chamada` — página contém `/chamadasencerradas` ou `/chamadasabertas`
    (ou o `/node/N` que espelha uma delas, ver item (b)).
  - `subprojeto` — `/subprojetos` (qualquer subseção, ex.
    `/subprojetos/meio-ambiente/...`).
  - `reuniao_com_partes` — `/reuniao-com-partes`.
  - `apresentacao_de_resultados` — `/node/582` (confirmado ao vivo: 8 PDFs
    de apresentações e gravação de resultados, nov/2025 — um `/node/N` que
    NÃO espelha nenhuma seção nomeada do menu, por isso tem rótulo próprio
    em vez de cair em "institucional").
  - `processo` — `/processos` ou `/integra-dos-processos`: as duas rotas
    da MESMA seção, e o maior acervo do site (262 dos 445 documentos).
  - `material_didatico` — `/escola/eu-quero-saber/...`: os explicadores que
    traduzem o laudo para quem não é técnico.
  - `comunicacao` — `/materias`, `/videos`, `/podcasts`,
    `/nucleo-de-comunicacao`.
  - `institucional` — qualquer outra página do BFS (home, `/sobre`) —
    fallback explícito, nunca "sem seção".

═══ (b) O SITE ESPELHA `/en/` E DUPLICA PELO MESMO CONTEÚDO EM DOIS CAMINHOS ═══

`/subprojetos` e `/en/subprojetos` servem os MESMOS 20 PDFs (confirmado ao
vivo). `/node/4` == `/chamadasencerradas` (mesmo conteúdo, caminhos
diferentes — Drupal expõe o node numérico e o alias amigável para a mesma
página). Um coletor que contasse PDF por PÁGINA VISITADA, sem deduplicar
pela URL FINAL do PDF, contaria cada arquivo duas a quatro vezes.

A deduplicação é pela URL NORMALIZADA do PDF (`_normalizar_url_pdf`, que
resolve caminho relativo para absoluto e remove aspas/decodificação de
`%20` etc. de forma consistente — NUNCA pelo nome do arquivo sozinho, que
pode colidir entre seções). `citado_em` registra TODAS as páginas
distintas (por caminho, não por título) que apontam para aquele PDF —
inclusive o par `/subprojetos`+`/en/subprojetos` e o par
`/node/4`+`/chamadasencerradas` — porque a pergunta "esse documento está
em mais de um lugar do site" é informação, não ruído a descartar.

═══ MÉTODO: BFS COM TETO EXPLÍCITO, E O TETO É REPORTADO ═══

Sementes: as seções do menu principal (`/`, `/chamadasabertas`,
`/chamadasencerradas`, `/subprojetos` e suas quatro subseções conhecidas,
`/reuniao-com-partes`, `/node/582`, `/escola`, `/sobre`, ...) — a lista
completa em `SEMENTES`. BFS restrito ao HOST (`projetobrumadinho.ufmg.br`,
inclusive `dev.projetobrumadinho.ufmg.br`, visto uma vez na amostra e
tratado como o mesmo host lógico para fins de dedup de PDF, NUNCA visitado
como página), ignorando `/node/add`, `/user`, `/admin` — únicas restrições
reais do `robots.txt` do host (`Disallow: /node/add/` mais os caminhos de
admin/usuário, sem `crawl-delay` declarado; 1,5s de atraso é cortesia do
projeto, não exigência da fonte).

**Teto explícito** (`--teto`, padrão `TETO_PADRAO`): se a fila BFS não
esvaziar antes do teto, `sync`/`sondar` IMPRIME quantas páginas ficaram na
fila e grava esse número em `paginas_na_fila_ao_parar` no JSON de saída —
nunca trunca em silêncio. Um acervo que parece completo porque o
truncamento não avisou é exatamente o erro que este módulo existe para não
cometer (mesma disciplina do irmão `ambiental_decisoes.py` com
`paginas_perdidas`).

═══ O QUE ESTE MÓDULO NÃO FAZ ═══

Não abre o conteúdo de nenhum PDF (a classificação de seção vem da PÁGINA
onde o link foi achado, nunca do PDF). Não grava no Postgres (Neon em HTTP
402 até 2026-09-01) — só em JSON. `--baixar` grava manifesto com sha256 do
arquivo original; retomada pula o que já tem sha256 batendo no manifesto,
e nunca sobrescreve um arquivo de nome local igual quando a URL é
diferente.

Uso:

    python -m etl.apis.pericia_ufmg --sondar
    python -m etl.apis.pericia_ufmg --saida dados/pericia-ufmg.json
    python -m etl.apis.pericia_ufmg --saida X.json --teto 200
    python -m etl.apis.pericia_ufmg --saida X.json --baixar dados/pdfs-pericia-ufmg/
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import html as html_mod
import json
import re
import sys
import time
import urllib.parse
from collections import deque
from pathlib import Path

import requests

LOG = "[etl.apis.pericia_ufmg]"

HOST = "projetobrumadinho.ufmg.br"
BASE = f"http://{HOST}"
UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"
TIMEOUT = 60
ATRASO_ENTRE_REQUISICOES = 1.5

# Medido em 20/08/2026: a varredura completa visita 555 páginas e só então
# esvazia a fila. Um teto de 400 pararia com ~150 páginas pendentes e
# devolveria acervo parcial COM aviso -- correto, mas inútil como padrão.
# 800 dá folga para o site crescer sem virar varredura sem fim.
TETO_PADRAO = 800

SAIDA_PADRAO = Path(__file__).resolve().parents[2] / "dados" / "pericia-ufmg.json"

# Sementes do BFS: seções do menu principal + o node que a pesquisa/medição
# ao vivo confirmou concentrar PDFs de resultado (582) mesmo sem estar no
# menu nomeado. Caminhos relativos, resolvidos contra BASE.
SEMENTES = (
    "/",
    # `/processos` entrou depois da medição: concentra 229 documentos e não
    # estava no conjunto original — o menu leva a ele, mas só a partir de
    # páginas internas, e o BFS demorava a chegar.
    "/processos",
    "/chamadasabertas",
    "/chamadasencerradas",
    "/subprojetos",
    "/subprojetos/infraestrutura",
    "/subprojetos/meio-ambiente/subdivisoes",
    "/subprojetos/saude-da-populacao",
    "/subprojetos/socioeconomico",
    "/reuniao-com-partes",
    "/node/582",
    "/escola",
    "/especialidades",
    "/eventos",
    "/integra-dos-processos",
    "/laboratorio-cra",
    "/materias",
    "/mulheres-na-ciencia",
    "/nucleo-de-comunicacao",
    "/podcasts",
    "/sobre",
    "/videos",
    "/videos-campo",
)

# Caminhos que o robots.txt do host proíbe (mais os equivalentes /en/), e
# caminhos de asset que não são página de conteúdo — nunca enfileirados.
_CAMINHOS_PROIBIDOS_RE = re.compile(
    r"^/(?:en/)?(?:node/add|user|admin|index\.php/(?:admin|user))\b"
)
_ASSET_RE = re.compile(r"\.(?:css|js|png|jpe?g|gif|svg|ico|woff2?|ttf|zip)(?:$|\?)", re.I)

_HREF_RE = re.compile(r'href="([^"#?]*)[^"]*"', re.I)
_PDF_A_RE = re.compile(r'<a[^>]+href="([^"]+\.pdf(?:\?[^"]*)?)"[^>]*>', re.I)
_TAG_RE = re.compile(r"<[^>]+>")
_ANO_MES_RE = re.compile(r"/files/(\d{4})-(\d{2})/")


class BloqueadoPelaFonte(SystemExit):
    """403/429/CAPTCHA — regra de parada do projeto: nunca retentar, nunca
    trocar User-Agent, só avisar o operador e sair."""


# ────────────────────────────── HTTP / guarda ───────────────────────────


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    return s


def _guardar_contra_bloqueio(status: int, corpo: str, onde: str) -> None:
    if status in (403, 429):
        raise BloqueadoPelaFonte(
            f"{LOG} HTTP {status} em {onde} — a fonte pode estar bloqueando o "
            "acesso. Pare a coleta e avise o operador; não retentar, não trocar "
            "User-Agent, não contornar."
        )
    corpo_lower = corpo.lower()
    if "captcha" in corpo_lower or "recaptcha" in corpo_lower:
        raise BloqueadoPelaFonte(
            f"{LOG} corpo de {onde} contém desafio de CAPTCHA — pare a coleta e "
            "avise o operador."
        )


def _buscar_pagina(sessao: requests.Session, url: str) -> str | None:
    """Devolve o HTML, ou `None` se a página não é uma página de conteúdo
    válida (404, redirecionamento para fora do host tratado como HTTP não
    disponível aqui, etc.) — `None` faz `_bfs` seguir sem enfileirar
    filhos, nunca levanta por página individual ausente."""
    try:
        r = sessao.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        print(f"{LOG} AVISO: falhou buscar {url!r}: {e} — pulando.")
        return None
    _guardar_contra_bloqueio(r.status_code, r.text, url)
    if r.status_code != 200:
        return None
    ct = r.headers.get("content-type", "")
    if "html" not in ct.lower():
        return None
    return r.text


# ─────────────────────────────── parsing ────────────────────────────────


def _texto_limpo(fragmento_html: str) -> str:
    sem_tag = _TAG_RE.sub(" ", fragmento_html or "")
    return " ".join(html_mod.unescape(sem_tag).split())


def _normalizar_url_pdf(href: str, pagina_url: str) -> str:
    """Resolve caminho relativo/absoluto para uma URL canônica única —
    regra (b): o mesmo PDF aparece como `/sites/default/files/...` E como
    `http://projetobrumadinho.ufmg.br/sites/default/files/...`, e as duas
    formas têm de virar A MESMA chave de deduplicação. `unquote` normaliza
    `%20` etc. também, para não duplicar por escaping diferente."""
    absoluta = urllib.parse.urljoin(pagina_url, html_mod.unescape(href))
    partes = urllib.parse.urlsplit(absoluta)
    caminho = urllib.parse.unquote(partes.path)
    # Normaliza esquema/host para minúsculo; mantém query se houver (rara).
    return urllib.parse.urlunsplit((partes.scheme.lower(), partes.netloc.lower(), caminho, partes.query, ""))


def _ano_mes_do_caminho(url: str) -> str | None:
    m = _ANO_MES_RE.search(url)
    return f"{m.group(1)}-{m.group(2)}" if m else None


def _classificar_secao(caminho_pagina: str) -> str:
    """Classifica pela URL da PÁGINA onde o link foi encontrado — nunca
    pelo conteúdo do PDF (este coletor não abre PDF). `/en/...` conta
    igual ao caminho sem prefixo, e `/node/4` (que É `/chamadasencerradas`
    por espelhamento, medido ao vivo) cai em `chamada` também."""
    c = caminho_pagina
    if c.startswith("/en/"):
        c = c[3:] or "/"
    # Drupal serve o MESMO conteúdo em `/x` e `/index.php/x`. Sem colapsar as
    # duas formas, metade da classificação cai no balaio.
    if c.startswith("/index.php/"):
        c = c[len("/index.php"):]

    if c.startswith(("/chamadasencerradas", "/chamadasabertas")) or c == "/node/4":
        return "chamada"
    if c == "/node/582":
        return "apresentacao_de_resultados"
    if c.startswith("/reuniao-com-partes"):
        return "reuniao_com_partes"
    # ⟲ CORRIGIDO 20/08/2026 contra varredura de 220 páginas: 229 dos 236
    # documentos que caíam em "institucional" vinham de `/processos` — a
    # seção do processo judicial, que o menu chama de "Processos" mas cujo
    # apelido `/integra-dos-processos` é só uma das duas rotas. Sem esta
    # linha, o maior acervo do site fica escondido no balaio.
    if c.startswith(("/processos", "/integra-dos-processos")):
        return "processo"
    # `/subprojeto` (singular) é rota real e diferente de `/subprojetos`.
    if c.startswith(("/subprojetos", "/subprojeto/")):
        return "subprojeto"
    # `/escola/eu-quero-saber/...` são os explicadores que traduzem o laudo
    # para quem não é técnico. Não é institucional: é material didático, e é
    # provavelmente o que mais serve a quem foi atingido.
    if c.startswith("/escola"):
        return "material_didatico"
    if c.startswith(("/materias", "/videos", "/podcasts", "/nucleo-de-comunicacao")):
        return "comunicacao"
    return "institucional"


def _extrair_links_pagina(html: str, pagina_url: str) -> tuple[list[str], list[str]]:
    """`(links_de_pagina, urls_de_pdf_normalizadas)`. `links_de_pagina` são
    caminhos absolutos restritos ao HOST, sem asset e sem os caminhos
    proibidos pelo `robots.txt`; `urls_de_pdf_normalizadas` já passou por
    `_normalizar_url_pdf`."""
    links_pagina: list[str] = []
    for m in _HREF_RE.finditer(html):
        href = html_mod.unescape(m.group(1))
        if not href or href.startswith(("mailto:", "tel:", "javascript:")):
            continue
        absoluta = urllib.parse.urljoin(pagina_url, href)
        partes = urllib.parse.urlsplit(absoluta)
        if partes.netloc.lower() not in (HOST, f"dev.{HOST}", ""):
            continue
        caminho = partes.path or "/"
        if _ASSET_RE.search(caminho):
            continue
        if _CAMINHOS_PROIBIDOS_RE.match(caminho):
            continue
        links_pagina.append(caminho)

    pdfs = [_normalizar_url_pdf(m.group(1), pagina_url) for m in _PDF_A_RE.finditer(html)]
    return links_pagina, pdfs


# ─────────────────────────────────── BFS ─────────────────────────────────


def _bfs(
    sessao: requests.Session, sementes: tuple[str, ...], teto: int
) -> tuple[dict[str, dict], int, int]:
    """Devolve `(documentos_por_url, paginas_visitadas, paginas_na_fila_ao_parar)`.
    `documentos_por_url` é `{url_pdf_normalizada: {"nome_arquivo",
    "secao", "citado_em": set[str], "ano_mes_do_caminho"}}` — `citado_em`
    acumula TODAS as páginas (por caminho) que citam o PDF, mesmo entre
    espelhos `/en/` e node/alias (regra (b))."""
    fila: deque[str] = deque(sementes)
    visitadas: set[str] = set()
    documentos: dict[str, dict] = {}
    paginas_visitadas = 0

    while fila and paginas_visitadas < teto:
        caminho = fila.popleft()
        if caminho in visitadas:
            continue
        visitadas.add(caminho)

        url_pagina = urllib.parse.urljoin(BASE + "/", caminho)
        html = _buscar_pagina(sessao, url_pagina)
        paginas_visitadas += 1
        time.sleep(ATRASO_ENTRE_REQUISICOES)

        if html is None:
            continue

        secao = _classificar_secao(caminho)
        links_pagina, urls_pdf = _extrair_links_pagina(html, url_pagina)

        for url_pdf in urls_pdf:
            nome_arquivo = urllib.parse.unquote(url_pdf.rsplit("/", 1)[-1])
            registro = documentos.setdefault(url_pdf, {
                "url": url_pdf,
                "nome_arquivo": nome_arquivo,
                "secao": secao,
                "citado_em": set(),
                "ano_mes_do_caminho": _ano_mes_do_caminho(url_pdf),
            })
            registro["citado_em"].add(caminho)
            # Regra do projeto: seção não pode ficar "institucional" só
            # porque a segunda citação veio de uma página genérica quando
            # a primeira já era uma seção nomeada — mantém a primeira
            # classificação não-institucional encontrada.
            if registro["secao"] == "institucional" and secao != "institucional":
                registro["secao"] = secao

        for filho in links_pagina:
            if filho not in visitadas:
                fila.append(filho)

        if paginas_visitadas % 20 == 0:
            print(f"{LOG} {paginas_visitadas} página(s) visitada(s), "
                  f"{len(documentos)} PDF(s) distinto(s) até agora, "
                  f"{len(fila)} na fila.", flush=True)

    paginas_na_fila_ao_parar = len(fila)
    return documentos, paginas_visitadas, paginas_na_fila_ao_parar


def _documentos_para_lista(documentos: dict[str, dict]) -> list[dict]:
    saida = []
    for url in sorted(documentos):
        d = documentos[url]
        saida.append({
            "url": d["url"],
            "nome_arquivo": d["nome_arquivo"],
            "secao": d["secao"],
            "citado_em": sorted(d["citado_em"]),
            "ano_mes_do_caminho": d["ano_mes_do_caminho"],
        })
    return saida


# ─────────────────────────────── sondar ────────────────────────────────


def sondar(teto: int = TETO_PADRAO) -> None:
    sessao = _sessao()
    documentos, paginas_visitadas, na_fila = _bfs(sessao, SEMENTES, teto)
    lista = _documentos_para_lista(documentos)

    print(f"{LOG} {BASE}")
    print(f"{LOG} {paginas_visitadas} página(s) visitada(s) (teto={teto}), "
          f"{na_fila} página(s) na fila ao parar.")
    if na_fila:
        print(f"{LOG} ATENÇÃO: fila não esvaziou — {na_fila} página(s) NÃO visitada(s) "
              "por causa do teto. Acervo pode estar incompleto; rode com --teto maior.")
    print(f"{LOG} {len(lista)} PDF(s) distinto(s).")

    contagem: dict[str, int] = {}
    for d in lista:
        contagem[d["secao"]] = contagem.get(d["secao"], 0) + 1
    print(f"{LOG} contagem por seção:")
    for secao, n in sorted(contagem.items(), key=lambda kv: -kv[1]):
        print(f"{LOG}   {secao}: {n}")

    multi_citados = [d for d in lista if len(d["citado_em"]) > 1]
    print(f"{LOG} {len(multi_citados)} PDF(s) citado(s) em mais de uma página (espelho /en/ ou node/alias).")
    if multi_citados:
        exemplo = multi_citados[0]
        print(f"{LOG} exemplo de espelho: {json.dumps(exemplo, ensure_ascii=False)}")


# ─────────────────────────────── sync ───────────────────────────────────


def sync(saida: Path, teto: int = TETO_PADRAO) -> dict:
    sessao = _sessao()
    documentos, paginas_visitadas, na_fila = _bfs(sessao, SEMENTES, teto)
    lista = _documentos_para_lista(documentos)

    if na_fila:
        print(f"{LOG} ATENÇÃO: {na_fila} página(s) ficaram na fila ao parar "
              f"(teto={teto}) — acervo pode estar incompleto.")

    pacote = {
        "coletado_em": dt.datetime.now(dt.timezone.utc).isoformat(),
        "fonte": BASE,
        "paginas_visitadas": paginas_visitadas,
        "paginas_na_fila_ao_parar": na_fila,
        "documentos": lista,
    }
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(json.dumps(pacote, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{LOG} {len(lista)} documento(s) gravado(s) em {saida}.")
    return pacote


# ─────────────────────────────── baixar ─────────────────────────────────


def _carregar_manifesto(pasta: Path) -> dict:
    caminho = pasta / "manifesto.json"
    if not caminho.exists():
        return {}
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def _gravar_manifesto(pasta: Path, manifesto: dict) -> None:
    (pasta / "manifesto.json").write_text(
        json.dumps(manifesto, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def _resolver_nome_local(pasta: Path, nome_arquivo: str, url: str, manifesto: dict) -> str:
    """Nunca sobrescreve um arquivo de nome igual quando a URL registrada
    para esse nome é diferente (o acervo tem nomes de arquivo que se
    repetem entre seções, ex. editais de anos distintos com mesmo nome
    curto) — acrescenta sufixo de hash curto da URL nesse caso."""
    nomes_em_uso = {info["nome_arquivo"]: u for u, info in manifesto.items()}
    if nome_arquivo in nomes_em_uso and nomes_em_uso[nome_arquivo] != url:
        sufixo = hashlib.sha1(url.encode("utf-8")).hexdigest()[:8]
        p = Path(nome_arquivo)
        return f"{p.stem}__{sufixo}{p.suffix}"
    return nome_arquivo


def baixar(documentos: list[dict], pasta: Path) -> None:
    pasta.mkdir(parents=True, exist_ok=True)
    sessao = _sessao()
    manifesto = _carregar_manifesto(pasta)

    ja_ok = 0
    baixados_agora = 0
    for i, doc in enumerate(documentos, 1):
        url = doc["url"]
        registro = manifesto.get(url)
        nome_local = _resolver_nome_local(pasta, doc["nome_arquivo"], url, manifesto)
        destino = pasta / nome_local

        if registro and registro.get("nome_arquivo") == nome_local and destino.exists():
            ja_ok += 1
            continue

        # Ate' 3 tentativas so' para falha de CONEXAO (timeout, reset) -- nao
        # para erro HTTP, que costuma ser estavel (404 nao vira 200 tentando
        # de novo). Medido num acervo irmao: falha de conexao caiu de 92 para
        # 7 casos so' com a segunda tentativa.
        r = None
        for tentativa in range(3):
            try:
                r = sessao.get(url, timeout=TIMEOUT)
                break
            except requests.RequestException as e:
                if tentativa == 2:
                    print(f"{LOG} AVISO: falhou baixar {url!r} apos 3 tentativas: {e} — pulando.")
                else:
                    time.sleep(3 * (tentativa + 1))
        if r is None:
            time.sleep(ATRASO_ENTRE_REQUISICOES)
            continue
        _guardar_contra_bloqueio(r.status_code, "", url)
        if r.status_code != 200:
            print(f"{LOG} AVISO: falhou baixar {url!r} (HTTP {r.status_code}) — pulando.")
            time.sleep(ATRASO_ENTRE_REQUISICOES)
            continue

        destino.write_bytes(r.content)
        sha256 = hashlib.sha256(r.content).hexdigest()
        manifesto[url] = {
            "nome_arquivo": nome_local,
            "sha256": sha256,
            "bytes": len(r.content),
            "secao": doc["secao"],
            "baixado_em": dt.datetime.now(dt.timezone.utc).isoformat(),
        }
        _gravar_manifesto(pasta, manifesto)
        baixados_agora += 1
        if i % 10 == 0 or i == len(documentos):
            print(f"{LOG} baixado {i}/{len(documentos)}: {nome_local}", flush=True)
        time.sleep(ATRASO_ENTRE_REQUISICOES)

    print(f"{LOG} fim do download: {baixados_agora} novo(s), {ja_ok} já presente(s) "
          f"(retomada), manifesto em {pasta / 'manifesto.json'}.")


# ─────────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--sondar", action="store_true", help="BFS ao vivo, imprime contagem por seção, não grava")
    parser.add_argument("--saida", type=Path, default=SAIDA_PADRAO, help="caminho do JSON de saída")
    parser.add_argument("--teto", type=int, default=TETO_PADRAO, help="teto de páginas do BFS (reportado se a fila não esvaziar)")
    parser.add_argument("--baixar", type=Path, help="pasta onde baixar os PDFs (opcional), com manifesto sha256")
    args = parser.parse_args()

    try:
        if args.sondar:
            sondar(teto=args.teto)
            return 0

        pacote = sync(args.saida, teto=args.teto)
        if args.baixar:
            baixar(pacote["documentos"], args.baixar)
        return 0
    except BloqueadoPelaFonte as e:
        print(str(e), file=sys.stderr)
        return 1
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
