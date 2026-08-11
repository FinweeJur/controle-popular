r"""etl.apis.copam_reunioes — reuniões do COPAM (Conselho Estadual de Política
Ambiental de MG) e os itens de pauta de cada uma, com o município que cada
item trata.

Fonte: `sistemas.meioambiente.mg.gov.br/reunioes/reuniao-copam/index-externo`
(listagem, 454 reuniões, 20 por página) e `.../view-externo?id=<id>` (detalhe
de cada uma). Sem chave, sem login, sem `robots.txt` (§14.4 do F0-discovery).

MÉTODO JÁ TESTADO AO VIVO ANTES DESTE MÓDULO EXISTIR — ler antes de mexer:
`docs/ambiental/F0-discovery.md` §14 e o commit `2de85af` ("Registra teste de
viabilidade do COPAM"). Este módulo implementa exatamente o método que a §14
mediu como o melhor, não o que o §4 tinha previsto (ler âncora de anexo por
anexo). Resumo do que já estava medido, para não redescobrir:

  * A página de detalhe traz um fieldset "Documento(s) inerente(s) à pauta"
    com uma `<table>` de 3 colunas (Nome do Arquivo · Município · Ações) —
    **campo estruturado**, não texto livre. Sozinho resolve 78,4% dos itens
    substantivos na amostra de 21 reuniões.
  * Nas reuniões onde esse campo vem "Não selecionado" para tudo, o PDF da
    Pauta CONSOLIDADA (1 por reunião, com camada de texto) traz o padrão
    "<Município>/MG" perto de cada item e resolveu 33 das 38 lacunas
    restantes; as outras 5 são itens sem local de verdade (minuta normativa,
    apresentação de programa, ata mal-rotulada) — não falha de extração.
  * Chave de junção entre a tabela (granularidade por DOCUMENTO — "Item
    06.1.1", pode ter vários PDFs por item) e a Pauta (granularidade por
    ITEM — "6.1") é o PREFIXO numérico (major.minor), não string exata.
  * Um item pode ter mais de um município (plano de compensação da Vale,
    id=1979: "Itabirito, Nova Lima e Rio Acima/MG" num item só).

O QUE ESTE MÓDULO MEDIU DE NOVO (não estava na §14, registrado aqui em vez de
reabrir o F0 porque é achado de implementação, não de viabilidade):

  1. **A "Retificação da Pauta" pode ser PDF sem camada de texto** (medido:
     reunião id=1991, 586 KB, 1 página, `fitz.get_text()` devolve string
     vazia — provavelmente exportado de imagem escaneada). O método "pega o
     último link da Pauta" quebra sozinho. Este módulo tenta os links da
     pauta em ordem REVERSA (mais recente primeiro — retificação supera
     original) e cai para o anterior sempre que o texto extraído vier vazio
     ou curto demais (`_MIN_CHARS_PAUTA_VALIDA`).
  2. **pymupdf quebra linha NO MEIO de "Rio Pardo de Minas/MG" e "Montes
     Claros/MG"** quando o nome ocupa a largura da coluna (cada palavra em
     sua própria linha). Regex sobre o texto cru erra por causa disso — a
     extração de município junta as linhas do PARÁGRAFO DO ITEM antes de
     comparar contra o catálogo, nunca casa regex linha a linha.
  3. **Município por regex genérica (`[A-ZÀ-Ý][\w ]+/MG`) é ambíguo** para o
     caso de vários municípios com um `/MG` só no fim ("Manga e
     Montalvânia/MG"). Este módulo casa contra a lista REAL das 853 cidades
     de `ref_municipios_mg` (substring exata pós-normalização, mais o bloco
     inteiro dividido por vírgula/" e " para pegar todas as cidades de uma
     lista) — nunca aceita nome que não está no catálogo, então falso
     positivo é estruturalmente impossível (o preço é falso negativo em
     grafia muito diferente do catálogo, que fica de fora em vez de errar).
  4. **O texto da Decisão usa a MESMA numeração de item que a Pauta**,
     inline num parágrafo corrido (não uma linha por item, diferente da
     Pauta). "decisão" é extraída procurando cada `numero_item` já
     conhecido (da Pauta) como delimitador dentro do texto da Decisão, e
     pegando a ÚLTIMA palavra-veredito conhecida (APROVADO, INDEFERIDO,
     PEDIDO DE VISTAS etc., `_PALAVRAS_DECISAO`) antes do próximo
     delimitador. Best-effort: o texto bruto da Pauta (`texto_pauta`) fica
     sempre gravado, então uma decisão não reconhecida não perde o item.

O QUE ESTE MÓDULO NÃO FAZ: não abre os PDFs individuais de parecer/recurso
da tabela (só o nome do arquivo e o `<td>Município</td>` — abrir cada um
seria uma ordem de grandeza mais requisições sem ganho medido, §14.1).

Uso:

    python -m etl.apis.copam_reunioes --sondar --id-fonte 1991
    python -m etl.apis.copam_reunioes --sondar --pagina 1     # 20 reuniões, sem gravar
    python -m etl.apis.copam_reunioes                          # sincroniza as 454 (incremental)
    python -m etl.apis.copam_reunioes --pagina-inicial 1 --pagina-final 5
"""
import argparse
import datetime as dt
import io
import re
import sys
import time
import unicodedata

import requests

from etl.common import get_supabase_client

LOG = "[etl.apis.copam_reunioes]"

BASE = "https://sistemas.meioambiente.mg.gov.br"
LISTA_URL = f"{BASE}/reunioes/reuniao-copam/index-externo"
DETALHE_URL = f"{BASE}/reunioes/reuniao-copam/view-externo"
UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"
TIMEOUT = 60
ATRASO_ENTRE_REQUISICOES = 1.0  # mesma cadência medida como segura na §14.4
ITENS_POR_PAGINA = 20

# Achado 1: pauta sem camada de texto existe (retificação escaneada). Abaixo
# disto, o texto não é confiável — tenta o link anterior da lista.
_MIN_CHARS_PAUTA_VALIDA = 200

_PALAVRAS_DECISAO = [
    "PEDIDO DE VISTAS", "RETORNO DE VISTAS", "RETIRADO DE PAUTA",
    "RETIRADA DE PAUTA", "APROVADA", "APROVADO", "REPROVADA", "REPROVADO",
    "INDEFERIDO", "INDEFERIDA", "DEFERIDO", "DEFERIDA", "HOMOLOGADO",
    "HOMOLOGADA", "ARQUIVADO", "ARQUIVADA", "ADIADO", "ADIADA",
    "REVOGADO", "REVOGADA", "CANCELADO", "CANCELADA", "PREJUDICADO",
    "PREJUDICADA", "APRESENTADO", "APRESENTADA",
]
# "DEFERIDO" é substring de "INDEFERIDO" — sem fronteira de palavra (`\b`),
# `str.find`/`rfind` acham "DEFERIDO" DENTRO de "INDEFERIDO" e trocam o
# veredito pelo oposto (medido ao vivo: id_fonte=1991 item 7.1, decisão real
# "INDEFERIDO", a busca ingênua devolvia "Deferido"). `\b` não ajuda aqui
# sozinho porque não há fronteira entre "IN" e "DEFERIDO" (mesma palavra) —
# a correção é buscar a lista ORDENADA DA MAIS LONGA PARA A MAIS CURTA num
# regex único, então "INDEFERIDO" é tentado (e vence) antes de "DEFERIDO".
_PALAVRAS_DECISAO_RE = re.compile(
    r"\b(" + "|".join(sorted((re.escape(p) for p in _PALAVRAS_DECISAO), key=len, reverse=True)) + r")\b"
)

_PROCESSO_RE = re.compile(
    r"\b(?:PA|AI|CAP|SLA|SEI|N[ºo°])(?:\s*/\s*(?:PA|AI|CAP|SLA|SEI|N[ºo°]))*"
    r"\.?\s+\d[\d./-]*"
    r"|ANM\s*n[ºo°]\.?\s*\d[\d./-]*"
)

# Item de pauta de verdade: "6.1 Fulano..." ou "7.1. Fulano..." no início da
# linha (a Pauta formata um item por linha visual — achado medido: quebra
# quando o padrão vira "Item 06.1.1" da TABELA, granularidade diferente, por
# isso este regex só roda contra o texto da Pauta, nunca contra nomes de
# arquivo). Exige letra maiúscula logo depois para não casar número de
# processo/data que caiu no início de uma linha por quebra de PDF.
_MARCADOR_ITEM_RE = re.compile(
    r"^(\d{1,2})\.(?:(\d{1,2})\.?)?[ \t]+(?=[A-ZÀ-ÖØ-Þ])", re.MULTILINE
)

_RODAPE_LINHA_RE = re.compile(
    r"^(Pauta|Decis[ãa]o|Ata)\b.*\bSEI\b.*(pg\.|/)\s*\d+\s*$"
    r"|^\d+/\d+$"
    r"|^SEI/GOVMG\b"
    r"|^https://www\.sei\.mg\.gov\.br"
    r"|^Documento assinado eletronicamente"
    r"|^A autenticidade deste documento"
    r"|^Refer[êe]ncia: Processo"
    r"|^SEI n[ºo°]",
    re.IGNORECASE,
)


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    return s


def _normalizar(s: str) -> str:
    base = unicodedata.normalize("NFD", s or "")
    sem_acento = "".join(c for c in base if unicodedata.category(c) != "Mn")
    return " ".join(sem_acento.upper().replace("\xa0", " ").split())


def _limpar_rodape(texto: str) -> str:
    linhas = [l for l in texto.split("\n") if not _RODAPE_LINHA_RE.match(l.strip())]
    return "\n".join(linhas)


def _achatar(texto: str) -> str:
    """Uma linha só, espaços únicos — só para comparar contra o catálogo.
    Achado 2: pymupdf quebra "Rio Pardo de Minas/MG" em 4 linhas quando o
    nome ocupa a largura da coluna; comparar linha a linha erra por isso."""
    return " ".join(texto.split())


# ─────────────────────── catálogo de município (MG) ────────────────────────


def _carregar_catalogo(client) -> list[tuple[str, str, str]]:
    """`[(id_ibge, nome_oficial, nome_normalizado)]`, do mais longo para o
    mais curto — ordem importa para o casamento de bloco (§ abaixo prefere
    "São Gonçalo do Rio Abaixo" inteiro a bater com pedaços)."""
    linhas = client.table("ref_municipios_mg").select("id_ibge, nome").execute().data
    catalogo = [(r["id_ibge"], r["nome"], _normalizar(r["nome"])) for r in linhas]
    catalogo.sort(key=lambda t: -len(t[2]))
    return catalogo


# Achado ao vivo (1ª rodada de gravação real, 454 reuniões): a versão
# original deste regex (`[A-ZÀ-Ý][^/]{0,80}?/MG`, sem âncora) capturava o
# ITEM INTEIRO como bloco sempre que o trecho entre o início do item e o
# "/MG" coubesse nos 80 caracteres do teto — o que faz o bloco virar "Ator -
# Ação - Município" em vez de só "Município", e o casamento contra o
# catálogo falha (medido: "Adilson Venâncio - Central Geradora Hidrelétrica
# - CGH - Astolfo Dutra/MG" perdia "Astolfo Dutra" porque o bloco capturado
# era a string inteira, não reduzida). Funcionava por ACASO nos itens
# testados no F0 §14 porque a descrição antes do município excedia 80
# caracteres lá, forçando o motor a desistir da posição 0 e recuar até achar
# uma posição mais próxima do "/MG" — não porque o regex estivesse certo.
#
# A correção ancora a captura em " - " (o separador de campo real do
# formato "Ator - Ação - Município/MG - Processo") ou no início da string, e
# proíbe " - " (com espaços) DENTRO do bloco capturado — sem impedir hífen
# sem espaço, que 5 municípios de MG têm no próprio nome (Sapucaí-Mirim,
# Olhos-d'Água, Pingo-d'Água, Guarda-Mor, Sem-Peixe; medido contra o
# catálogo completo de `ref_municipios_mg`).
#
# Teto de 500, não 80: medido ao vivo na 1ª rodada completa (454 reuniões) —
# linhas de transmissão de energia citam dezenas de municípios num item só
# ("Grande Sertão II ... Ninheira, São João do Paraíso, ... e Itabira/MG",
# 29 cidades, ~470 caracteres). Um teto de 80 perdia a lista inteira; 500
# cobre a maior lista medida com folga, sem abrir mão da âncora em " - " que
# evita cruzar para o campo anterior.
#
# ":\s" também é âncora válida: o mesmo item introduz a lista com
# "Municípios de Minas Gerais: Ninheira, ..." — dois-pontos, não travessão
# — e o travessão que vem ANTES disso ("comum -Municípios", sem espaço
# depois do "-") nem bate com `\s-\s`, então sem esta âncora extra a busca
# tinha de voltar até o travessão válido mais distante e estourava o teto.
_MG_SUFIXO_RE = re.compile(r"(?:^|\s-\s|:\s)((?:(?!\s-\s)[^/]){1,500}?)/MG\b")


def _municipios_do_texto(texto_achatado: str, catalogo: list[tuple[str, str, str]]) -> list[tuple[str, str]]:
    """Casa `<Nome>/MG` (achado 3, camada 2) contra o catálogo REAL — nunca
    aceita nome fora dele. Trata o caso "A, B e C/MG" (vários municípios,
    um `/MG` só no fim): tenta o bloco inteiro primeiro, senão divide por
    vírgula/" e "."""
    catalogo_por_norma = {norma: (id_ibge, nome) for id_ibge, nome, norma in catalogo}
    achados: dict[str, tuple[str, str]] = {}
    for m in _MG_SUFIXO_RE.finditer(texto_achatado):
        bloco = m.group(1).strip()
        candidatos = [bloco] + [p.strip() for p in re.split(r",| e ", bloco)]
        for cand in candidatos:
            chave = _normalizar(cand)
            resolvido = catalogo_por_norma.get(chave)
            if resolvido:
                achados[resolvido[0]] = resolvido
    return sorted(achados.values(), key=lambda t: t[1])


def _municipio_estruturado(valor: str | None, catalogo: list[tuple[str, str, str]]) -> tuple[str, str] | None:
    """Camada 1: `<td>Município</td>` já vem com o nome oficial — só precisa
    achar o `id_ibge`. "Não selecionado" e vazio não são município."""
    if not valor:
        return None
    alvo = _normalizar(valor)
    if alvo in ("", "NAO SELECIONADO", "NAO DEFINIDO"):
        return None
    for id_ibge, nome, norma in catalogo:
        if norma == alvo:
            return (id_ibge, nome)
    return None


# ───────────────────────────── listagem ─────────────────────────────────


_LINHA_LISTA_RE = re.compile(
    r'<tr data-key="(\d+)"><td[^>]*>.*?</td>'
    r"<td[^>]*>(.*?)</td>"          # data
    r"<td[^>]*>(.*?)</td>"          # titulo
    r"<td[^>]*>(.*?)</td>"          # camara tecnica (sede/regional na fonte)
    r"<td[^>]*>(.*?)</td>"          # regional (unidade colegiada na fonte)
    r'<td[^>]*><a[^>]*href="([^"]+)"',
    re.DOTALL,
)


def _total_reunioes(html: str) -> int | None:
    m = re.search(r"de <b>(\d+)</b> itens", html)
    return int(m.group(1)) if m else None


def _limpar_html_texto(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def buscar_pagina_lista(sessao: requests.Session, pagina: int) -> tuple[list[dict], int | None]:
    """Uma página da listagem (20 reuniões). `pagina` é 1-based."""
    r = sessao.get(LISTA_URL, params={"page": pagina}, timeout=TIMEOUT)
    r.raise_for_status()
    html = r.text
    total = _total_reunioes(html)
    linhas = []
    for m in _LINHA_LISTA_RE.finditer(html):
        id_fonte, data_str, titulo, camara, regional, href = m.groups()
        try:
            data = dt.datetime.strptime(data_str.strip(), "%d/%m/%Y").date()
        except ValueError:
            continue
        linhas.append({
            "id_fonte": int(id_fonte),
            "data": data,
            "titulo": _limpar_html_texto(titulo),
            "camara_tecnica": _limpar_html_texto(camara),
            "regional": _limpar_html_texto(regional),
            "link_detalhe": f"{DETALHE_URL}?id={id_fonte}",
        })
    return linhas, total


# ─────────────────────────── detalhe da reunião ─────────────────────────


def _extrair_fieldset(html: str, legenda: str) -> str | None:
    m = re.search(
        rf"<legend>{re.escape(legenda)}</legend>(.*?)</fieldset>", html, re.DOTALL
    )
    return m.group(1) if m else None


def _extrair_links(fieldset_html: str | None) -> list[tuple[str, str]]:
    """`[(url, rótulo_do_arquivo)]`, na ORDEM em que a fonte lista — o
    rótulo mora no texto da âncora, não no nome do arquivo (achado do F0
    §4, ainda vale aqui)."""
    if not fieldset_html:
        return []
    return [
        (BASE + href if href.startswith("/") else href, _limpar_html_texto(rotulo))
        for href, rotulo in re.findall(
            r'<a href="([^"]+)"[^>]*target="_blank">(.*?)</a>', fieldset_html
        )
    ]


_LINHA_DOC_RE = re.compile(
    r"<tr>\s*<td>(.*?)</td>\s*<td>(.*?)</td>\s*<td><a[^>]*href=\"([^\"]+)\"",
    re.DOTALL,
)


def _extrair_tabela_documentos(html: str) -> list[dict]:
    """A tabela "Documento(s) inerente(s) à pauta": nome do arquivo,
    município estruturado (camada 1), link para baixar."""
    fieldset = _extrair_fieldset(html, "Documento(s) inerente(s) à pauta")
    if not fieldset:
        return []
    docs = []
    for nome, municipio, href in _LINHA_DOC_RE.findall(fieldset):
        docs.append({
            "nome_arquivo": _limpar_html_texto(nome),
            "municipio_bruto": _limpar_html_texto(municipio),
            "url": BASE + href if href.startswith("/") else href,
        })
    return docs


_PREFIXO_ITEM_RE = re.compile(r"Item\s+0*(\d{1,2})(?:\.0*(\d{1,2}))?(?:\.0*(\d{1,2}))?")


def _chave_item(nome_arquivo: str) -> str | None:
    """Achado documentado no F0 §14.4: a chave de junção entre a tabela
    (granularidade por documento — "Item 06.1.1") e a Pauta (granularidade
    por item — "6.1") é o PREFIXO numérico maior.menor, ignorando o 3º
    nível e os zeros à esquerda. "Item 05" e "Item 05.0" viram "5" (sem
    minor de verdade), casando com o item bruto "5." da Pauta."""
    m = _PREFIXO_ITEM_RE.match(nome_arquivo)
    if not m:
        return None
    major = int(m.group(1))
    minor = int(m.group(2)) if m.group(2) else 0
    return f"{major}.{minor}" if minor else str(major)


def buscar_detalhe(sessao: requests.Session, id_fonte: int) -> dict:
    r = sessao.get(DETALHE_URL, params={"id": id_fonte}, timeout=TIMEOUT)
    r.raise_for_status()
    html = r.text

    convocacao = _extrair_links(_extrair_fieldset(html, "Convocação"))
    pauta = _extrair_links(_extrair_fieldset(html, "Pauta"))
    decisao = _extrair_links(_extrair_fieldset(html, "Decisão"))
    ata = _extrair_links(_extrair_fieldset(html, "Ata aprovada"))
    documentos = _extrair_tabela_documentos(html)

    return {
        "convocacao_links": convocacao,
        "pauta_links": pauta,
        "decisao_links": decisao,
        "ata_links": ata,
        "documentos": documentos,
    }


# ────────────────────────── PDF: pauta e decisão ─────────────────────────


def _baixar_texto_pdf(sessao: requests.Session, url: str) -> str:
    import fitz  # pymupdf

    r = sessao.get(url, timeout=TIMEOUT)
    r.raise_for_status()
    doc = fitz.open(stream=io.BytesIO(r.content), filetype="pdf")
    try:
        return "".join(p.get_text() for p in doc)
    finally:
        doc.close()


def _texto_pauta_valido(sessao: requests.Session, pauta_links: list[tuple[str, str]]) -> tuple[str, str] | None:
    """Achado 1: a Retificação da Pauta pode não ter camada de texto (PDF de
    imagem). Tenta do link MAIS RECENTE (último da lista) para o mais
    antigo, e usa o primeiro que renderizar texto de verdade."""
    for url, rotulo in reversed(pauta_links):
        try:
            texto = _baixar_texto_pdf(sessao, url)
        except Exception as e:
            print(f"{LOG} AVISO: falhou baixar/ler pauta {url!r}: {e}")
            continue
        if len(texto.strip()) >= _MIN_CHARS_PAUTA_VALIDA:
            return url, _limpar_rodape(texto)
        print(f"{LOG} AVISO: {rotulo!r} rendeu {len(texto.strip())} caractere(s) "
              "de texto (< limiar) — provável PDF sem camada de texto, tentando o anterior.")
    return None


# ─────────────────────────── divisão em itens ────────────────────────────


def _dividir_pauta_em_itens(texto: str) -> dict[str, str]:
    """`{numero_item: parágrafo bruto}`. Um marcador "N." só vira item se
    NÃO tiver filho "N.M" na mesma pauta (senão é cabeçalho de seção, ex.
    "6. Processo Administrativo para exame do Recurso..." antes de "6.1")."""
    marcadores = [
        (m.start(), m.end(), int(m.group(1)), int(m.group(2)) if m.group(2) else None)
        for m in _MARCADOR_ITEM_RE.finditer(texto)
    ]
    if not marcadores:
        return {}
    tem_filho = {major for (_, _, major, minor) in marcadores if minor is not None}

    itens: dict[str, str] = {}
    for i, (_, fim_marcador, major, minor) in enumerate(marcadores):
        eh_item = minor is not None or major not in tem_filho
        if not eh_item:
            continue
        chave = f"{major}.{minor}" if minor else str(major)
        fim = marcadores[i + 1][0] if i + 1 < len(marcadores) else len(texto)
        bloco = texto[fim_marcador:fim]
        itens[chave] = _achatar(bloco).strip()
    return itens


def _extrair_processo(texto_item: str) -> str | None:
    achados = _PROCESSO_RE.findall(texto_item)
    if not achados:
        return None
    vistos: list[str] = []
    for a in achados:
        a = a.strip()
        if a and a not in vistos:
            vistos.append(a)
    return "; ".join(vistos) if vistos else None


def _extrair_empreendimento(texto_item: str) -> str | None:
    """Melhor esforço: 1º segmento antes do primeiro " - " isolado. Medido
    contra a amostra real (§14 e este módulo): cobre nome de pessoa física,
    razão social, e razão social com "/" interno ("Flávio Grisi/ Minérios e
    Jazidas Minerais") sem cortar no meio — só quebra se o nome em si tiver
    " - " (não observado na amostra, mas plausível; `texto_pauta` fica
    gravado inteiro para conferência quando isso acontecer)."""
    partes = texto_item.split(" - ", 1)
    primeiro = partes[0].strip().rstrip(".")
    return primeiro or None


# Achado ao vivo (1ª rodada de gravação real, 20 reuniões): o classificador
# "sem processo E sem município" não basta sozinho. Duas reuniões tinham
# "Item 05. Exame da Ata..." com o campo estruturado `<td>Município</td>`
# preenchido (com a mesma cidade nas duas vezes — "Unaí" — hábito de quem
# lança o dado naquela regional, não deliberação sobre a cidade) e uma
# "Indicação de representante..." com SEI e município citados no corpo,
# mas que é nomeação de comissão, não licenciamento. O F0 §14.4 já cunhava
# isso: "o classificador de administrativo precisa de mais de uma grafia".
_PADRAO_ADMINISTRATIVO_RE = re.compile(
    r"^(EXAME DA ATA|ATA\b|INDICA[CÇ][AÃ]O DE REPRESENTANTE)"
)


def _eh_administrativo(texto_item: str, processo: str | None, municipios: list) -> bool:
    """Achado do F0 §14.3: item sem processo formal E sem município é
    procedimento de reunião (abertura, hino, comunicados, assuntos gerais,
    encerramento) ou apresentação sem deliberação — não é pauta de decisão
    sobre um lugar. `municipios` vazio sozinho NÃO basta (minuta normativa
    tem processo e não tem município — fica dentro).

    A checagem por padrão de texto roda SEMPRE, mesmo quando há processo ou
    município: "Exame da Ata" e "Indicação de representante" são
    procedimento de toda reunião, não decisão sobre um empreendimento — e
    o achado acima mostrou que às vezes carregam processo/município de
    qualquer jeito."""
    if _PADRAO_ADMINISTRATIVO_RE.match(_normalizar(texto_item)):
        return True
    return not processo and not municipios


def _decisoes_por_item(texto_decisao: str, chaves_item: list[str]) -> dict[str, str]:
    """Acha, para cada `numero_item` já conhecido pela Pauta, o veredito
    mais provável no texto (achatado) da Decisão. Achado 4: a Decisão não
    quebra linha por item como a Pauta — os marcadores "N.M." ficam dentro
    do mesmo parágrafo corrido, por isso a busca usa os números JÁ
    CONHECIDOS como delimitador em vez de tentar redescobri-los."""
    achatado = _achatar(texto_decisao)
    posicoes: list[tuple[int, int, str]] = []
    for chave in chaves_item:
        # "6.1" -> procura "6.1." ou "6.1 " ladeado por não-dígito, para não
        # casar dentro de "26.10.2026" ou de um número de processo.
        padrao = re.compile(
            rf"(?<!\d)(?<!\.){re.escape(chave)}\.?(?=\s)(?!\d)"
        )
        m = padrao.search(achatado)
        if m:
            posicoes.append((m.start(), m.end(), chave))
    posicoes.sort()

    resultado: dict[str, str] = {}
    for i, (_, fim, chave) in enumerate(posicoes):
        prox_ini = posicoes[i + 1][0] if i + 1 < len(posicoes) else len(achatado)
        trecho = achatado[fim:prox_ini].upper()
        # a palavra-veredito que aparece MAIS TARDE no trecho — o veredito
        # costuma ser a última coisa antes do próximo item (medido em
        # decisao_1991: "... INDEFERIDO. 7.2. ..."). `\b` na regex evita o
        # falso positivo de "DEFERIDO" casar DENTRO de "INDEFERIDO" (medido
        # ao vivo: sem fronteira de palavra, o item 7.1 saía "Deferido"
        # quando a decisão real era "Indeferido").
        ocorrencias = list(_PALAVRAS_DECISAO_RE.finditer(trecho))
        if ocorrencias:
            resultado[chave] = ocorrencias[-1].group(1).capitalize()
    return resultado


# ─────────────────────────────── situação ────────────────────────────────


def _situacao(decisao_links: list, ata_links: list, data: dt.date) -> str:
    if decisao_links or ata_links:
        return "concluida"
    if data < dt.date.today():
        return "aguardando_decisao"
    return "agendada"


# ─────────────────────────────── coleta ──────────────────────────────────


def coletar_reuniao(sessao: requests.Session, client, linha_lista: dict, catalogo) -> tuple[dict, list[dict]]:
    """Coleta 1 reunião (detalhe + pauta + decisão se houver). Devolve
    `(linha_reuniao, itens_substantivos)` prontos para upsert."""
    detalhe = buscar_detalhe(sessao, linha_lista["id_fonte"])
    time.sleep(ATRASO_ENTRE_REQUISICOES)

    situacao = _situacao(detalhe["decisao_links"], detalhe["ata_links"], linha_lista["data"])

    reuniao = {
        **linha_lista,
        "situacao": situacao,
        "link_pauta_pdf": None,
        "link_decisao_pdf": detalhe["decisao_links"][-1][0] if detalhe["decisao_links"] else None,
        "link_ata_pdf": detalhe["ata_links"][-1][0] if detalhe["ata_links"] else None,
        "qtd_itens_pauta": 0,
    }

    if not detalhe["pauta_links"]:
        print(f"{LOG} id_fonte={linha_lista['id_fonte']}: sem PDF de Pauta publicado — só a reunião é gravada.")
        return reuniao, []

    achado = _texto_pauta_valido(sessao, detalhe["pauta_links"])
    time.sleep(ATRASO_ENTRE_REQUISICOES)
    if achado is None:
        print(f"{LOG} id_fonte={linha_lista['id_fonte']}: nenhum link de Pauta rendeu texto — só a reunião é gravada.")
        return reuniao, []
    link_pauta_pdf, texto_pauta = achado
    reuniao["link_pauta_pdf"] = link_pauta_pdf

    itens_texto = _dividir_pauta_em_itens(texto_pauta)

    # camada 1: agrupa a tabela de documentos por prefixo de item.
    doc_por_item: dict[str, list[dict]] = {}
    for doc in detalhe["documentos"]:
        chave = _chave_item(doc["nome_arquivo"])
        if chave:
            doc_por_item.setdefault(chave, []).append(doc)

    itens: list[dict] = []
    for numero_item, texto_item in itens_texto.items():
        processo = _extrair_processo(texto_item)

        resolvidos: dict[str, tuple[str, str]] = {}
        fonte_municipio = None
        docs_do_item = doc_por_item.get(numero_item, [])
        for doc in docs_do_item:
            r = _municipio_estruturado(doc["municipio_bruto"], catalogo)
            if r:
                resolvidos[r[0]] = r
                fonte_municipio = "campo_estruturado"
        if not resolvidos:
            for r in _municipios_do_texto(texto_item, catalogo):
                resolvidos[r[0]] = r
            if resolvidos:
                fonte_municipio = "texto_pauta"

        if _eh_administrativo(texto_item, processo, list(resolvidos.values())):
            continue

        municipios_ordenados = sorted(resolvidos.values(), key=lambda t: t[1])
        itens.append({
            "numero_item": numero_item,
            "processo": processo,
            "empreendimento": _extrair_empreendimento(texto_item),
            "municipios_ids": [m[0] for m in municipios_ordenados],
            "municipios_nomes": [m[1] for m in municipios_ordenados],
            "municipio_fonte": fonte_municipio,
            "decisao": None,
            "texto_pauta": texto_item,
            "link_documento": docs_do_item[0]["url"] if docs_do_item else None,
        })

    # A busca de decisão só roda para as chaves dos itens SUBSTANTIVOS que
    # sobreviveram ao filtro acima — nunca para "1", "2", "3", "4" (Abertura,
    # Hino, Comunicados) nem para itens administrativos em geral. Achado
    # medido ao vivo (id_fonte=1991): números soltos de 1 dígito não têm
    # marcador correspondente na Decisão (que só enumera itens de
    # deliberação) e colidem com QUALQUER dígito solto do documento — data,
    # artigo de lei, trecho de SEI —, produzindo veredito para o item
    # errado. Restringir ao conjunto pequeno de chaves substantivas (em
    # geral pontuadas, "7.1") reduz esse risco a quase zero.
    if itens and detalhe["decisao_links"]:
        try:
            texto_decisao = _achatar(_limpar_rodape(
                _baixar_texto_pdf(sessao, detalhe["decisao_links"][-1][0])
            ))
            time.sleep(ATRASO_ENTRE_REQUISICOES)
            decisoes = _decisoes_por_item(texto_decisao, [it["numero_item"] for it in itens])
            for it in itens:
                it["decisao"] = decisoes.get(it["numero_item"])
        except Exception as e:
            print(f"{LOG} AVISO: falhou ler Decisão de id_fonte={linha_lista['id_fonte']}: {e}")

    reuniao["qtd_itens_pauta"] = len(itens)
    return reuniao, itens


def _gravar(client, reuniao: dict, itens: list[dict]) -> None:
    resp = client.table("copam_reunioes").upsert([reuniao], on_conflict="id_fonte").execute()
    if not resp.data:
        raise RuntimeError(f"upsert de copam_reunioes id_fonte={reuniao['id_fonte']} não devolveu linha")
    id_reuniao = resp.data[0]["id"]
    if not itens:
        return
    linhas = [{**item, "id_reuniao": id_reuniao} for item in itens]
    client.table("copam_pauta_itens").upsert(linhas, on_conflict="id_reuniao,numero_item").execute()


def sync(pagina_inicial: int = 1, pagina_final: int | None = None) -> None:
    client = get_supabase_client()
    catalogo = _carregar_catalogo(client)
    sessao = _sessao()

    primeira_pagina, total = buscar_pagina_lista(sessao, pagina_inicial)
    time.sleep(ATRASO_ENTRE_REQUISICOES)
    if total is None:
        raise RuntimeError("não consegui ler o total de reuniões da listagem — layout mudou?")
    total_paginas = (total + ITENS_POR_PAGINA - 1) // ITENS_POR_PAGINA
    ultima = pagina_final or total_paginas
    print(f"{LOG} {total} reunião(ões) publicadas pela fonte, {total_paginas} página(s); "
          f"processando página {pagina_inicial} a {ultima}.")

    total_reunioes_gravadas = 0
    total_itens_gravados = 0
    for pagina in range(pagina_inicial, ultima + 1):
        if pagina == pagina_inicial:
            linhas = primeira_pagina
        else:
            linhas, _ = buscar_pagina_lista(sessao, pagina)
            time.sleep(ATRASO_ENTRE_REQUISICOES)
        print(f"{LOG} página {pagina}/{total_paginas}: {len(linhas)} reunião(ões).")
        for linha in linhas:
            try:
                reuniao, itens = coletar_reuniao(sessao, client, linha, catalogo)
                _gravar(client, reuniao, itens)
                total_reunioes_gravadas += 1
                total_itens_gravados += len(itens)
                print(f"{LOG}   id_fonte={linha['id_fonte']} {linha['data']} "
                      f"{linha['titulo'][:50]!r}: {len(itens)} item(ns) substantivo(s).")
            except Exception as e:
                print(f"{LOG} ERRO em id_fonte={linha['id_fonte']}: {e} — seguindo para a próxima.")

    print(f"{LOG} fim: {total_reunioes_gravadas} reunião(ões), {total_itens_gravados} item(ns) de pauta gravados.")


def sondar(id_fonte: int | None, pagina: int | None) -> None:
    sessao = _sessao()
    if id_fonte:
        detalhe = buscar_detalhe(sessao, id_fonte)
        print(f"{LOG} id_fonte={id_fonte}")
        print(f"       convocação: {len(detalhe['convocacao_links'])} link(s)")
        print(f"       pauta:      {len(detalhe['pauta_links'])} link(s)")
        print(f"       decisão:    {len(detalhe['decisao_links'])} link(s)")
        print(f"       ata:        {len(detalhe['ata_links'])} link(s)")
        print(f"       documentos: {len(detalhe['documentos'])} linha(s) na tabela")
        for doc in detalhe["documentos"][:10]:
            print(f"         {doc['nome_arquivo'][:55]:<55} município={doc['municipio_bruto']!r}")
        if detalhe["pauta_links"]:
            achado = _texto_pauta_valido(sessao, detalhe["pauta_links"])
            if achado:
                _, texto = achado
                itens = _dividir_pauta_em_itens(texto)
                print(f"       pauta tem {len(itens)} marcador(es) de item numerado:")
                for chave, txt in itens.items():
                    print(f"         {chave:<6} {txt[:90]!r}")
        return

    linhas, total = buscar_pagina_lista(sessao, pagina or 1)
    print(f"{LOG} página {pagina or 1}: {len(linhas)} reunião(ões) (fonte declara {total} no total)")
    for l in linhas:
        print(f"       id_fonte={l['id_fonte']:<6} {l['data']} {l['titulo'][:55]:<55} {l['camara_tecnica']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sondar", action="store_true", help="consulta e relata, NÃO grava")
    parser.add_argument("--id-fonte", type=int, help="só com --sondar: inspeciona uma reunião")
    parser.add_argument("--pagina", type=int, help="só com --sondar: inspeciona uma página da listagem")
    parser.add_argument("--pagina-inicial", type=int, default=1)
    parser.add_argument("--pagina-final", type=int, default=None,
                         help="padrão: até a última página que a fonte declarar")
    args = parser.parse_args()

    try:
        if args.sondar:
            sondar(args.id_fonte, args.pagina)
        else:
            sync(args.pagina_inicial, args.pagina_final)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
