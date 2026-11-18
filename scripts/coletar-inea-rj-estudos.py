"""coletar-inea-rj-estudos.py — EIA/RIMA e audiências públicas do INEA-RJ.

Fonte oficial: Instituto Estadual do Ambiente do Rio de Janeiro (INEA-RJ), em
três páginas públicas do site institucional (WordPress, sem login, sem CAPTCHA,
sem token):

    https://www.inea.rj.gov.br/publicacoes/consulta-eia-rima/   página-mãe
    https://www.inea.rj.gov.br/eia-rima-AAAA/                   uma página por ano
    https://www.inea.rj.gov.br/audiencias-publicas/             editais e atas

Medido ao vivo em 17/11/2026 (sondagem em
docs/planos/PLANO-AMBIENTAL-27-UF.md, seção "RJ — sondado ao vivo em
17/11/2026"), remedido em 18/11/2026 ao escrever este coletor:

- a página-mãe linka 19 páginas-ano, **2007 a 2026** (2022 existe e NÃO está
  linkado: responde 200 e entra mesmo assim);
- `/eia-rima-AAAA/` responde **200 de 2007 a 2025** e **404 em 2026** — a
  página-mãe foi atualizada em 04/2024 e o ano corrente ficou sem página;
- cada página-ano lista os arquivos com o **nº de processo** (SEI ou o antigo
  `E-07/...`) e o empreendimento no título, e um parágrafo que às vezes diz o
  município ("localizado no Complexo Portuário de Itaguaí/RJ");
- o arquivo vem em `.pdf`, mas também em `.zip`, `.rar` e `.7z` (o acervo
  antigo é quase todo `.7z`), e **2021 inteiro está no Google Drive** — a
  mesma armadilha do EIA/RIMA de MG registrada em FONTES.md;
- a página de audiências é uma lista única, sem paginação (6 itens em
  18/11/2026), com edital/ata em PDF e o nº SEI no título.

`robots.txt` do host, lido em 18/11/2026:

    User-agent: *
    Disallow: /wp-admin/
    Allow: /wp-admin/admin-ajax.php

    Sitemap: https://www.inea.rj.gov.br/wp-sitemap.xml

Só `/wp-admin/` está vedado e nada daqui passa por lá: a coleta está liberada.
User-Agent honesto `finweejur/github artur colito`, 2 s entre requisições ao
host, 403/429 aborta a rodada sem insistir (regra do repo). Exceção medida em
18/11/2026 e registrada aqui: 403 num ARQUIVO isolado (um `.rar` de 2011,
Apache "You don't have permission") não é bloqueio ao coletor — o mesmo host
seguiu servindo os outros arquivos no mesmo minuto — então vira dado
(`erro: HTTP 403` na amostra) e a rodada continua; 429 e 403 na PÁGINA param
tudo.

Por que HTML e não API: não existe API. O SELCA
(`portallicenciamento.inea.rj.gov.br`) cai em login de requerente com
reCAPTCHA, e a consulta de EIA/RIMA é só esta lista de links.

Por que checkpoint por página-ano: o acervo são 19 páginas-ano; rebaixar tudo a
cada rodada é desperdício e bate no host. Cada página fica em
`scripts/.cache/inea-rj/` e o JSON final sai do cache — rodada interrompida não
perde o que já veio. `--refetch` ignora o cache.

Por que o laço PARA no primeiro 404: 2026 não tem página (a fonte não publica
ano vazio, ela simplesmente não tem o endereço). Continuar pedindo 2027, 2028…
seria varrer o vazio contra o servidor de graça. Se a página de 2026 aparecer
um dia, o laço passa a incluí-la sem mexer no código.

Por que o município é derivado e não lido: o INEA não publica campo de
município. Ele sai do título + do parágrafo de descrição, com o dicionário das
92 cidades do RJ (mesma lição do MPMG). A ordem é: (1) "município de X",
(2) "X/RJ", (3) o único nome de município presente no texto. Se nada casar, ou
se casar mais de um, grava `municipio: null` — **nunca chuta**.

Por que não baixar os arquivos: são EIA/RIMA com centenas de MB cada, vários em
`.zip`/`.rar`/`.7z`. A linha traz a URL direta; o arquivo é validado por
amostra (1 por formato, conferido pelo magic number) só para provar que a rota
serve arquivo, não página de erro.

Rodar:
    python scripts/coletar-inea-rj-estudos.py --dry-run    # só contagens
    python scripts/coletar-inea-rj-estudos.py              # grava o JSON
    python scripts/coletar-inea-rj-estudos.py --refetch    # ignora o cache
    python scripts/coletar-inea-rj-estudos.py --scan-cpf   # + varredor de CPF

## Ética e privacidade

- Só página pública, sem burlar nada; 2 s entre requisições ao mesmo host.
- CPF nunca é gravado: todo campo de texto passa pelo mesmo varredor do repo
  (run de 11 dígitos válido por mod-11 vira `[CPF redigido]`). Aqui o esperado
  é nome de empreendimento (pessoa jurídica), não de pessoa física.

## Ressalva editorial

EIA/RIMA publicado NÃO é licença aprovada, e edital/ata de audiência NÃO é
licença concedida: a fonte publica o estudo apresentado e o registro de que
houve audiência. O rito de licenciamento segue em separado (o INEA não publica
número de licença nesta lista). Vínculo audiência ↔ estudo não é publicado.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import ssl
import subprocess
import sys
import time
import unicodedata
import urllib.error
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows é cp1252
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from urllib.parse import quote

UA = "finweejur/github artur colito"
BASE = "https://www.inea.rj.gov.br"
URL_PAI = BASE + "/publicacoes/consulta-eia-rima/"
URL_ANO = BASE + "/eia-rima-{ano}/"
URL_AUDIENCIAS = BASE + "/audiencias-publicas/"
PAUSA = 2  # s entre QUALQUER par de requisições ao host (regra do repo: 1–2 s)
ANO_MIN = 2007  # medido: 2006 não é linkado pela página-mãe
ANO_TETO = 2100  # trava de segurança do laço
SAIDA = (Path(__file__).resolve().parent.parent
         / "apps" / "web" / "data" / "inea-rj-estudos.json")
CACHE = Path(__file__).resolve().parent / ".cache" / "inea-rj"

FONTES = {
    "pagina_mae": URL_PAI,
    "pagina_por_ano": URL_ANO.format(ano="AAAA"),
    "audiencias": URL_AUDIENCIAS,
    "robots": ("User-agent: * / Disallow: /wp-admin/ / "
               "Allow: /wp-admin/admin-ajax.php (lido 18/11/2026)"),
    "medicao": ("18/11/2026 — páginas-ano 2007 a 2025 respondem 200, 2026 "
                "responde 404; página de audiências sem paginação"),
}

RESSALVA = ("EIA/RIMA publicado NÃO é licença aprovada e edital/ata de audiência "
            "NÃO é licença concedida: a fonte publica o estudo apresentado e o "
            "registro de que houve audiência, e o licenciamento segue em "
            "separado (o INEA não publica número de licença nesta lista). "
            "Vínculo audiência↔estudo não é publicado pela fonte. Consulta "
            "oficial: " + URL_PAI)

COLUNAS = ["id", "tipo", "ano", "data_titulo", "empreendimento",
           "numero_processo", "municipio", "municipio_base", "uf", "formato",
           "url_documento", "pagina", "descricao"]

# Municípios do RJ (92), copiados de `supabase/betim/migrations/
# 0092_ref_municipios_nacional.sql` — a mesma referência que o ETL usa.
MUNICIPIOS_RJ = [
    "Angra dos Reis", "Aperibé", "Araruama", "Areal", "Armação dos Búzios",
    "Arraial do Cabo", "Barra Mansa", "Barra do Piraí", "Belford Roxo",
    "Bom Jardim", "Bom Jesus do Itabapoana", "Cabo Frio",
    "Cachoeiras de Macacu", "Cambuci", "Campos dos Goytacazes", "Cantagalo",
    "Carapebus", "Cardoso Moreira", "Carmo", "Casimiro de Abreu",
    "Comendador Levy Gasparian", "Conceição de Macabu", "Cordeiro",
    "Duas Barras", "Duque de Caxias", "Engenheiro Paulo de Frontin",
    "Guapimirim", "Iguaba Grande", "Itaboraí", "Itaguaí", "Italva", "Itaocara",
    "Itaperuna", "Itatiaia", "Japeri", "Laje do Muriaé", "Macaé", "Macuco",
    "Magé", "Mangaratiba", "Maricá", "Mendes", "Mesquita", "Miguel Pereira",
    "Miracema", "Natividade", "Nilópolis", "Niterói", "Nova Friburgo",
    "Nova Iguaçu", "Paracambi", "Paraty", "Paraíba do Sul", "Paty do Alferes",
    "Petrópolis", "Pinheiral", "Piraí", "Porciúncula", "Porto Real", "Quatis",
    "Queimados", "Quissamã", "Resende", "Rio Bonito", "Rio Claro",
    "Rio das Flores", "Rio das Ostras", "Rio de Janeiro",
    "Santa Maria Madalena", "Santo Antônio de Pádua", "Sapucaia", "Saquarema",
    "Seropédica", "Silva Jardim", "Sumidouro", "São Fidélis",
    "São Francisco de Itabapoana", "São Gonçalo", "São José de Ubá",
    "São José do Vale do Rio Preto", "São João da Barra", "São João de Meriti",
    "São Pedro da Aldeia", "São Sebastião do Alto", "Tanguá", "Teresópolis",
    "Trajano de Moraes", "Três Rios", "Valença", "Varre-Sai", "Vassouras",
    "Volta Redonda",
]

# magic number por formato: é o que prova que a rota serve arquivo, não HTML.
MAGIA = {"pdf": b"%PDF-", "zip": b"PK\x03\x04", "rar": b"Rar!",
         "7z": b"7z\xbc\xaf\x27\x1c"}

_BYTES_LIDOS = 0  # o que de fato trafegou, para relatar honestamente


class BloqueioFonte(RuntimeError):
    """403/429 da fonte: parar, não insistir."""


try:
    import truststore
    _CTX = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
except Exception:
    _CTX = ssl.create_default_context()


def _log(msg: str) -> None:
    print(f"[coletar-inea-rj-estudos] {msg}", flush=True)


def _norm(t) -> str:
    t = unicodedata.normalize("NFKD", str(t or ""))
    t = "".join(ch for ch in t if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", t).upper().strip()


# ---------------------------------------------------------------------------
# HTTP + cache
# ---------------------------------------------------------------------------

def _get(url: str, timeout: int = 90) -> "tuple[bytes | None, int]":
    """GET com UA honesto e pausa. 404 volta como resposta; corpo vazio é erro.

    200 com 0 byte não é sucesso — é a fonte mentindo, e o repo já apanhou disso
    (`transparencia.mpmg.mp.br/buscarTac`). Aqui vira RuntimeError.
    """
    global _BYTES_LIDOS
    time.sleep(PAUSA)
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
    try:
        with urllib.request.urlopen(req, context=_CTX, timeout=timeout) as resp:
            bruto = resp.read()
            status = resp.status
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            raise BloqueioFonte(
                f"HTTP {e.code} em {url} — pare aqui, não insista") from e
        return None, e.code
    _BYTES_LIDOS += len(bruto)
    if not bruto:
        raise RuntimeError(f"HTTP {status} com corpo de 0 byte em {url}")
    return bruto, status


def _pegar(url: str, nome_cache: str, refetch: bool = False) -> dict:
    """Página do cache local, ou baixa e guarda. Re-rodar não rebaixa."""
    destino = CACHE / nome_cache
    if destino.exists() and not refetch:
        bruto = destino.read_bytes()
        _log(f"cache   {nome_cache} ({len(bruto):,} B) — não rebaixa")
        return {"bruto": bruto, "status": 200, "cache": True}
    bruto, status = _get(url)
    if bruto:
        CACHE.mkdir(parents=True, exist_ok=True)
        destino.write_bytes(bruto)
    return {"bruto": bruto, "status": status, "cache": False}


# ---------------------------------------------------------------------------
# parser do HTML (dois layouts medidos: lista nova e parágrafo antigo)
# ---------------------------------------------------------------------------

RE_ARQUIVO = re.compile(r"\.(pdf|zip|rar|7z)(?:$|[?#])", re.I)
RE_GDRIVE = re.compile(
    r"drive\.google\.com/(?:file/d/|drive/(?:u/\d+/)?folders/|open\?id=)", re.I)
RE_HREF = re.compile(r'<a\b[^>]*href="([^"]+)"', re.I)
RE_ANCORA = re.compile(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>', re.S | re.I)
RE_ITEM = re.compile(r'<div class="col-12 d-flex list-item-style-(?:one|four)\b[^>]*>')
RE_P = re.compile(r"<p\b[^>]*>(.*?)</p>", re.S | re.I)
RE_TAG = re.compile(r"<[^>]+>")
RE_ANO_LINK = re.compile(r"/eia-rima-(\d{4})/")


def _eh_arquivo(href: str) -> bool:
    """Arquivo com extensão, ou link do Google Drive (2021 inteiro está lá)."""
    return bool(RE_ARQUIVO.search(href) or RE_GDRIVE.search(href))


def _url_limpa(href: str) -> str:
    """Espaço e acento viram `%20`/`%C3%A9`: o INEA publica href com espaço cru.

    Medido em 2007 e 2011 (`...E_07_203.110_2005 Itaipava ...7z`): o navegador
    codifica sozinho, o `urllib` recusa. Só isso muda; o resto da URL fica.
    """
    return quote(href, safe=":/?#[]@!$&'()*+,;=%~")


def _texto_html(pedaco: str) -> str:
    return re.sub(r"\s+", " ", unescape(RE_TAG.sub(" ", pedaco))).strip()


def _regiao_conteudo(html: str) -> str:
    """Só o miolo entre os comentários `<!-- internal content -->`.

    Fora dele ficam o menu do topo (que linka a "Carta de Serviços" em PDF,
    documento que não é estudo) e o rodapé.
    """
    partes = html.split("<!-- internal content -->")
    miolo = partes[1] if len(partes) >= 2 else html
    return miolo.split("<footer")[0]


def _itens_da_pagina(html: str) -> "list[dict]":
    """(url_documento, titulo, descricao) por arquivo listado na página.

    Três layouts medidos, e uma mesma página pode misturar dois deles: até ~2020
    o conteúdo é uma sequência de `<p>` com um `<a>` para o arquivo (o título às
    vezes parte em dois links, e o nº de processo pode estar FORA do link, num
    `<strong>`); de 2022 em diante é `<div class="... list-item-style-four">`
    com `<h4>` e `<p>`; 2022 mistura os dois (tem `<p>` e um `<div>` da lista).
    Por isso o layout é decidido por bloco, não pela página. O bloco novo ainda
    repete o link num ícone de download: o `href` é deduplicado e o título vem
    do link COM texto.
    """
    regiao = _regiao_conteudo(html)
    partes = RE_ITEM.split(regiao)
    if len(partes) > 1:
        blocos = [(p, False) for p in RE_P.findall(partes[0])]
        blocos += [(b, True) for b in partes[1:]]
    else:
        blocos = [(p, False) for p in RE_P.findall(regiao)]
    itens: list[dict] = []
    vistos: set[str] = set()
    for bloco, novo_layout in blocos:
        hrefs = []
        for bruto in RE_HREF.findall(bloco):
            href = _url_limpa(unescape(bruto).strip())
            if _eh_arquivo(href) and href not in hrefs:
                hrefs.append(href)
        if not hrefs:
            continue
        if novo_layout:
            textos: list[str] = []
            for bruto, corpo in RE_ANCORA.findall(bloco):
                t = _texto_html(corpo)
                if _eh_arquivo(unescape(bruto)) and t and t not in textos:
                    textos.append(t)
            titulo = " ".join(textos) or None
            m = RE_P.search(bloco)
            descricao = _texto_html(m.group(1)) if m else None
        else:
            titulo = _texto_html(bloco) or None  # pega o <strong> de fora do link
            descricao = None
        for href in hrefs:
            if href in vistos:
                continue
            vistos.add(href)
            itens.append({"url_documento": href, "titulo": titulo,
                          "descricao": descricao})
    return itens


def _anos_da_pagina_mae(html: str) -> "list[int]":
    """Anos linkados pela página-mãe (2007..2026 em 18/11/2026), em ordem."""
    anos = {int(a) for a in RE_ANO_LINK.findall(html)}
    anos = {a for a in anos if ANO_MIN <= a <= ANO_TETO}
    return sorted(anos)


# ---------------------------------------------------------------------------
# derivações: tipo, nº de processo, empreendimento, município
# ---------------------------------------------------------------------------

def _tokens(texto: str) -> "set[str]":
    return set(re.sub(r"[^A-Z0-9]+", " ", _norm(texto)).split())


def _tipo(titulo, url_documento, eh_audiencia: bool) -> str:
    """EIA / RIMA / EIA+RIMA pelo TÍTULO e pelo NOME DO ARQUIVO.

    Só o nome do arquivo, não o caminho: `/downloads/EIA-RIMA/2007/` é o nome da
    pasta do acervo e não diz que aquele .7z é EIA ou RIMA (medido em 2007).
    """
    if eh_audiencia:
        return "audiencia"
    arquivo = (url_documento or "").rsplit("/", 1)[-1]
    t = _tokens(f"{titulo or ''} {arquivo}")
    if "RIMA" in t and "EIA" in t:
        return "eia_rima"
    if "RIMA" in t:
        return "rima"
    if "EIA" in t:
        return "eia"
    return "outro"  # estudo da lista cujo nome não diz EIA nem RIMA (ex.: .7z de 2007)


RE_PROTOCOLO = re.compile(
    r"(?:SEI[-\s]?)?\d{6}/[\d.]{5,9}/\d{4}"      # SEI-070002/006718/2025
    r"|E-?07[./-]\s?\d[\d.\-/]{3,20}\d", re.I)   # E-07/002.6314/2019


def _protocolos(texto: str) -> "list[str]":
    achados: list[str] = []
    for m in RE_PROTOCOLO.finditer(texto or ""):
        s = re.sub(r"\s+", "", m.group(0))
        if s and s not in achados:
            achados.append(s)
    return achados


RE_TIPO_INICIAL = re.compile(
    r"^(?:EIA\s*/\s*RIMA|EIA-RIMA|EIA|RIMA|ESTUDO DE IMPACTO AMBIENTAL|"
    r"RELATORIO DE IMPACTO AMBIENTAL|RELATORIOS? DE IMPACTOS? AMBIENTAIS?)\b\s*", re.I)
RE_DATA_FIM = re.compile(r"\s*[-–—]?\s*(?:DIA\s+)?\d{2}/\d{2}/\d{4}\s*$", re.I)
RE_LIXO_PONTA = re.compile(r"^[\s\-–—|:.,;/]+|[\s\-–—|:.,;/]+$")


def _empreendimento(titulo, protocolos: "list[str]") -> "str | None":
    """Nome do empreendimento: o título sem o nº de processo e sem o rótulo.

    Derivado, não publicado — o INEA não tem campo de empreendimento.
    """
    if not titulo:
        return None
    t = titulo
    for p in protocolos:
        t = t.replace(p, " ")
    m = RE_DATA_FIM.search(t)
    data_fim = m.group(0) if m else ""
    if m:
        t = t[:m.start()]
    t = RE_LIXO_PONTA.sub("", t.strip())
    rotulo = RE_TIPO_INICIAL.match(t)
    if rotulo:  # um rótulo só: "EIA - ..."/"RIMA - ..."; o resto do título fica
        t = RE_LIXO_PONTA.sub("", t[rotulo.end():])
    t = re.sub(r"\s+", " ", t).strip(" -–—|:.,;/")
    if data_fim and not t:  # título era só número + data
        return None
    return t or None


_MUNI_NORM = sorted(((_norm(n), n) for n in MUNICIPIOS_RJ),
                    key=lambda par: -len(par[0]))
_MUNI_NOME = dict(_MUNI_NORM)
_MUNI_ALT = "|".join(re.escape(n) for n, _ in _MUNI_NORM)  # mais longo primeiro
RE_MUNICIPIO = re.compile(r"MUNICIPIOS?\s+D[EODA]S?\s+")
RE_MUNI_INICIO = re.compile(r"(" + _MUNI_ALT + r")(?![A-Z])")
RE_BARRA_RJ = re.compile(r"([A-Z][A-Z ]{2,45})/(?:RJ|RIO DE JANEIRO)\b")
RE_MUNI_TODOS = re.compile(r"(?<![A-Z])(" + _MUNI_ALT + r")(?![A-Z])")
# "Rio de Janeiro" é cidade E estado: sozinho no texto não decide nada, então só
# conta nos padrões explícitos ("município do Rio de Janeiro", ".../RJ").
_MUNI_AMBIGUO = {"Rio de Janeiro"}


def _municipio_no_fim(trecho: str) -> "str | None":
    trecho = trecho.strip()
    for norm, nome in _MUNI_NORM:  # do nome mais longo para o mais curto
        if trecho == norm or trecho.endswith(" " + norm):
            return nome
    return None


def _unicos_no_texto(texto: str) -> "set[str]":
    """Nomes de município do RJ no texto, fora o ambíguo cidade/estado."""
    return {_MUNI_NOME[n] for n in RE_MUNI_TODOS.findall(texto)} - _MUNI_AMBIGUO


def _municipio(titulo, descricao) -> "tuple[str | None, str | None]":
    """(município, de onde saiu). Sem certeza, (None, None) — nunca chuta.

    O padrão explícito ("município de X") só vale se for o ÚNICO município do
    texto: "ENTRE OS MUNICÍPIOS DE MACAÉ E CASIMIRO DE ABREU" casa o primeiro e
    não pode virar Macaé.
    """
    texto = _norm(f"{titulo or ''} {descricao or ''}")
    achados = _unicos_no_texto(texto)
    for m in RE_MUNICIPIO.finditer(texto):  # "município de X" / "no município do X"
        m2 = RE_MUNI_INICIO.match(texto[m.end():].lstrip())
        if m2:
            nome = _MUNI_NOME[m2.group(1)]
            return (nome, "explicito") if achados <= {nome} else (None, None)
    for m in RE_BARRA_RJ.finditer(texto):  # "Itaguaí/RJ"
        nome = _municipio_no_fim(m.group(1))
        if nome:
            return (nome, "X/RJ") if achados <= {nome} else (None, None)
    if len(achados) == 1:  # um só nome de município no texto inteiro: serve
        return achados.pop(), "unico_no_texto"
    return None, None  # nenhum ou mais de um: fica null, com ressalva no `obs`


RE_DATA = re.compile(r"(?<!\d)(\d{2})/(\d{2})/(\d{4})(?!\d)")


def _data_do_titulo(titulo) -> "str | None":
    m = RE_DATA.search(titulo or "")
    if not m:
        return None
    dia, mes, ano = m.groups()
    try:
        return datetime(int(ano), int(mes), int(dia)).date().isoformat()
    except ValueError:
        return None


def _formato(url: str) -> str:
    m = RE_ARQUIVO.search(url or "")
    if m:
        return m.group(1).lower()
    if RE_GDRIVE.search(url or ""):
        return "gdrive"  # nuvem do empreendedor: a fonte não hospeda o arquivo
    return "?"


def _id_estavel(url: str) -> str:
    return "inea-rj-" + hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]


def _host_inea(url: str) -> bool:
    return url.startswith(BASE) or url.startswith("http://www.inea.rj.gov.br")


# ---------------------------------------------------------------------------
# sanitização de dado pessoal (mesmo critério do repo: CPF some, CNPJ fica)
# ---------------------------------------------------------------------------

RE_11D = re.compile(r"\d[\d .\-/]{7,24}\d")


def _cpf_valido(dig: str) -> bool:
    """Mod-11 com os pesos 10..2 (o mesmo de `checar-dado-pessoal-em-dado.py`)."""
    if not dig.isdigit() or len(dig) != 11 or len(set(dig)) == 1:
        return False
    for ate in (9, 10):
        soma = sum(int(dig[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        if (0 if resto == 10 else resto) != int(dig[ate]):
            return False
    return True


def _apagar_cpf_em_texto(texto: str) -> str:
    """11 dígitos mod-11 válidos -> '[CPF redigido]'; 14 dígitos (CNPJ) intacto."""
    def _apagar(m):
        s = m.group(0)
        dig = re.sub(r"\D", "", s)
        if len(dig) == 14:
            return s
        if len(dig) == 11:
            return "[CPF redigido]" if _cpf_valido(dig) else s
        if len(dig) in (12, 13) and any(
                _cpf_valido(dig[i:i + 11]) for i in range(len(dig) - 10)):
            return "[CPF redigido]"
        return s
    return RE_11D.sub(_apagar, texto)


# ---------------------------------------------------------------------------
# item -> linha
# ---------------------------------------------------------------------------

def _linha(item: dict, ano_pagina: "int | None", pagina: str) -> dict:
    titulo = item.get("titulo")
    descricao = (item.get("descricao") or "")[:400] or None
    url = item["url_documento"]
    eh_audiencia = pagina == URL_AUDIENCIAS
    protocolos = _protocolos(f"{titulo or ''} {url}")
    municipio, base = _municipio(titulo, descricao)
    data_titulo = _data_do_titulo(titulo)
    tipo = _tipo(titulo, url, eh_audiencia)
    lin = {
        "id": _id_estavel(url),
        "tipo": tipo,
        "ano": (int(data_titulo[:4]) if (eh_audiencia and data_titulo)
                else ano_pagina),
        "data_titulo": data_titulo,
        "empreendimento": _empreendimento(titulo, protocolos),
        "numero_processo": "; ".join(protocolos) or None,
        "municipio": municipio,
        "municipio_base": base,
        "uf": "RJ",  # a fonte é o órgão ambiental do RJ, não há outra UF aqui
        "formato": _formato(url),
        "url_documento": url,
        "pagina": pagina,
        "descricao": descricao,
    }
    for k, v in list(lin.items()):  # todo campo de texto passa pelo varredor
        if isinstance(v, str):
            lin[k] = _apagar_cpf_em_texto(v)
    return lin


def _ano_da_linha(lin: dict) -> str:
    return str(lin["ano"]) if lin.get("ano") else "(sem ano)"


# ---------------------------------------------------------------------------
# laço de anos (para no primeiro 404) e amostra de arquivo
# ---------------------------------------------------------------------------

def _varrer_anos(anos: "list[int]", pegar) -> "tuple[dict, int | None, list]":
    """Baixa (ou lê do cache) as páginas-ano em ordem e PARA no primeiro 404.

    Devolve ({ano: resposta}, ano_que_parou, falhas). Não pede ano adiante do
    404: 2026 não tem página, e 2027 também não vai ter.
    """
    paginas: dict[int, dict] = {}
    falhas: list[str] = []
    for ano in sorted(anos):
        r = pegar(URL_ANO.format(ano=ano), f"eia-rima-{ano}.html")
        if r["status"] == 404:
            _log(f"eia-rima-{ano}: HTTP 404 — fim do acervo; "
                 f"não peço {ano + 1} em diante")
            return paginas, ano, falhas
        if not r["bruto"]:
            falhas.append(f"{ano}: HTTP {r['status']} sem corpo")
            _log(f"eia-rima-{ano}: HTTP {r['status']} sem corpo — página pulada")
            continue
        paginas[ano] = r
        _log(f"eia-rima-{ano}: HTTP {r['status']}, {len(r['bruto']):,} B"
             + (" (cache)" if r["cache"] else ""))
    return paginas, None, falhas


def _linhas_a_validar(linhas: "list[dict]") -> "list[dict]":
    """O que abrir para provar que a rota serve arquivo.

    Um por formato binário, preferindo o host do INEA. Do Drive, TODOS: é ali
    que mora o link morto (FONTES.md mediu 27% de EIA/RIMA que não abrem), e a
    página `/view` custa poucos KB.
    """
    escolhidas = [lin for lin in linhas if lin["formato"] == "gdrive"]
    for formato in sorted({lin["formato"] for lin in linhas} - {"gdrive"}):
        candidatas = [lin for lin in linhas if lin["formato"] == formato]
        escolhidas.append(next((lin for lin in candidatas
                                if _host_inea(lin["url_documento"])),
                               candidatas[0]))
    return sorted(escolhidas, key=lambda lin: (lin["formato"], lin["url_documento"]))


def _validar_arquivo(lin: dict) -> dict:
    """Abaixo só os primeiros bytes: prova que a rota serve arquivo, não erro.

    403 aqui NÃO aborta a rodada: medido em 18/11/2026, um `.rar` de 2011
    responde 403 (Apache "You don't have permission") enquanto o mesmo host
    serve os outros arquivos no mesmo minuto — é permissão do arquivo, não
    bloqueio ao coletor. 429 é sobre o ritmo, e aí sim para tudo.
    """
    global _BYTES_LIDOS
    time.sleep(PAUSA)
    req = urllib.request.Request(lin["url_documento"], headers={"User-Agent": UA})
    prefixo, erro = b"", None
    try:
        with urllib.request.urlopen(req, context=_CTX, timeout=90) as resp:
            prefixo = resp.read(8)
    except urllib.error.HTTPError as e:
        if e.code == 429:
            raise BloqueioFonte(f"HTTP 429 no arquivo {lin['id']}") from e
        erro = f"HTTP {e.code}"
    except Exception as e:  # timeout, DNS, TLS: registra, não derruba a rodada
        erro = f"{type(e).__name__}: {e}"
    _BYTES_LIDOS += len(prefixo)
    if lin["formato"] == "gdrive":
        # O Google Drive não serve magic number na página /view (e responde 500
        # ao HEAD, 416 ao GET com Range — FONTES.md). Aqui só se prova que a
        # página do arquivo responde, não que o arquivo é legível.
        return {"id": lin["id"], "tipo": lin["tipo"], "formato": "gdrive",
                "url": lin["url_documento"], "bytes_baixados": len(prefixo),
                "magic": "(página do Drive)", "erro": erro,
                "ok": erro is None and bool(prefixo)}
    magia = MAGIA.get(lin["formato"], b"")
    return {"id": lin["id"], "tipo": lin["tipo"], "formato": lin["formato"],
            "url": lin["url_documento"], "bytes_baixados": len(prefixo),
            "magic": prefixo[:5].decode("latin-1", "replace"),
            "ok": bool(magia) and prefixo.startswith(magia),
            "erro": erro}


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(
        description="Coleta EIA/RIMA e audiências públicas do INEA-RJ")
    ap.add_argument("--dry-run", action="store_true", help="só conta, não grava")
    ap.add_argument("--refetch", action="store_true", help="ignora o cache local")
    ap.add_argument("--scan-cpf", action="store_true",
                    help="roda o varredor oficial de CPF ao final")
    args = ap.parse_args()

    def pegar(url: str, nome_cache: str) -> dict:
        return _pegar(url, nome_cache, args.refetch)

    _log("=== INEA-RJ: EIA/RIMA por ano + audiências públicas ===")
    _log(f"fonte : {URL_PAI}")
    _log(f"ritmo : {PAUSA}s entre requisições, UA '{UA}', 403/429 aborta")
    _log(f"cache : {CACHE}")
    _log(f"saida : {SAIDA.name}")

    try:
        r_pai = pegar(URL_PAI, "pagina-mae.html")
        linkados = _anos_da_pagina_mae(r_pai["bruto"].decode("utf-8", "replace")) \
            if r_pai["bruto"] else []
        if not linkados:
            _log(f"página-mãe sem link de ano — caindo no laço {ANO_MIN}..")
            anos = list(range(ANO_MIN, ANO_TETO))
            sem_link: list[int] = []
        else:
            # A página-mãe esquece ano que existe: 2022 responde 200 e não está
            # na lista. Por isso o laço cobre 2007..o maior ano linkado, e não
            # só os anos linkados.
            anos = list(range(ANO_MIN, max(linkados) + 1))
            sem_link = [a for a in anos if a not in linkados]
            _log(f"página-mãe linka {len(linkados)} ano(s): "
                 f"{linkados[0]}..{linkados[-1]}; laço cobre {anos[0]}..{anos[-1]}"
                 + (f" (+{sem_link} não linkado pela mãe)" if sem_link else ""))
        paginas, parou_em, falhas = _varrer_anos(anos, pegar)
    except BloqueioFonte as e:
        _log(f"[cancelado] {e} — nada foi gravado")
        sys.exit(3)
    except RuntimeError as e:
        _log(f"[cancelado] {e} — nada foi gravado")
        sys.exit(2)

    if not paginas:
        _log("[cancelado] nenhuma página-ano respondeu com conteúdo")
        sys.exit(2)

    itens: list[dict] = []
    paginas_por_ano: dict[str, dict] = {}
    for ano, resposta in sorted(paginas.items()):
        achados = _itens_da_pagina(resposta["bruto"].decode("utf-8", "replace"))
        itens.extend({**x, "_ano": ano, "_pagina": URL_ANO.format(ano=ano)}
                     for x in achados)
        paginas_por_ano[str(ano)] = {
            "url": URL_ANO.format(ano=ano),
            "status": resposta["status"],
            "do_cache": resposta["cache"],
            "documentos": len(achados),
            "arquivos_por_formato": _contar_formato(achados),
        }
        _log(f"eia-rima-{ano}: {len(achados)} documento(s) "
             f"{paginas_por_ano[str(ano)]['arquivos_por_formato']}")

    try:
        r_aud = pegar(URL_AUDIENCIAS, "audiencias-publicas.html")
    except BloqueioFonte as e:
        _log(f"[cancelado] {e} — nada foi gravado")
        sys.exit(3)
    audiencias = _itens_da_pagina(r_aud["bruto"].decode("utf-8", "replace")) \
        if r_aud["bruto"] else []
    for x in audiencias:
        itens.append({**x, "_ano": None, "_pagina": URL_AUDIENCIAS})
    paginas_por_ano["audiencias"] = {
        "url": URL_AUDIENCIAS, "status": r_aud["status"],
        "documentos": len(audiencias),
        "arquivos_por_formato": _contar_formato(audiencias),
    }
    _log(f"audiências: {len(audiencias)} documento(s)")

    linhas: list[dict] = []
    vistos: set[str] = set()
    duplicados = 0
    for item in itens:
        if item["url_documento"] in vistos:  # mesmo arquivo em duas páginas
            duplicados += 1
            continue
        vistos.add(item["url_documento"])
        linhas.append(_linha({k: v for k, v in item.items()
                              if not k.startswith("_")},
                             item["_ano"], item["_pagina"]))
    total_fonte = len(linhas)

    resumo_por_ano: dict[str, dict[str, int]] = {}
    resumo_por_tipo: dict[str, int] = {}
    for lin in linhas:
        ano = _ano_da_linha(lin)
        resumo_por_ano.setdefault(ano, {})
        resumo_por_ano[ano][lin["tipo"]] = resumo_por_ano[ano].get(lin["tipo"], 0) + 1
        resumo_por_tipo[lin["tipo"]] = resumo_por_tipo.get(lin["tipo"], 0) + 1

    soma_ano = sum(sum(v.values()) for v in resumo_por_ano.values())
    if not (soma_ano == total_fonte == len(linhas)):
        raise RuntimeError(
            f"resumo_por_ano ({soma_ano}) não bate com total_fonte "
            f"({total_fonte}) / linhas ({len(linhas)}) — JSON não gravado")

    if args.dry_run:
        _log("--- dry-run: contagem por ano ---")
        for ano in sorted(paginas_por_ano):
            p = paginas_por_ano[ano]
            _log(f"  {ano}: {p['documentos']} documento(s) {p['arquivos_por_formato']}")
        _log(f"total: {total_fonte} documento(s), {len(linhas)} linha(s); "
             f"por tipo {resumo_por_tipo}; "
             f"{len({l['municipio'] for l in linhas if l['municipio']})} município(s)")
        _log("(dry-run: nada além destas páginas foi pedido)")
        return

    try:
        amostras = [_validar_arquivo(lin) for lin in _linhas_a_validar(linhas)]
    except BloqueioFonte as e:
        _log(f"[cancelado] {e} — nada foi gravado")
        sys.exit(3)

    mortos_drive = [a for a in amostras if a["formato"] == "gdrive" and not a["ok"]]
    protegidos = [a for a in amostras if a["erro"] == "HTTP 403"]

    n_muni = sum(1 for lin in linhas if lin["municipio"])
    n_sem_muni = total_fonte - n_muni
    externos = sorted({u.split("/")[2] for u in (l["url_documento"] for l in linhas)
                       if not _host_inea(u)})
    formatos_total: dict[str, int] = {}
    for lin in linhas:
        formatos_total[lin["formato"]] = formatos_total.get(lin["formato"], 0) + 1

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": URL_PAI,
        "fontes": FONTES,
        "total_fonte": total_fonte,
        "truncado": bool(falhas) or (parou_em is not None and parou_em < max(anos)),
        "colunas": COLUNAS,
        "obs": (
            f"{total_fonte} documento(s) das páginas-ano {min(paginas)}.."
            f"{max(paginas)} do INEA-RJ ({len(paginas)} páginas, HTTP 200) mais "
            f"{len(audiencias)} da página de audiências. A soma de "
            f"`documentos` em `paginas_por_ano` é o bruto; "
            f"{duplicados} arquivo(s) repetido(s) entre páginas foram "
            "descartados, e `total_fonte` é o número de arquivos distintos. "
            f"Formatos: {formatos_total} — o INEA publica EIA/RIMA em `.pdf`, "
            "`.zip`, `.rar` e `.7z` (o acervo antigo é quase todo `.7z`), por "
            "isso o JSON não promete tudo PDF; `gdrive` = o arquivo está na "
            "nuvem do empreendedor, não no host do INEA. "
            "Nenhum arquivo é baixado (são centenas de MB cada): a URL direta "
            "vai na linha e só 1 amostra por formato é conferida pelo magic "
            "number. "
            f"`municipio` é DERIVADO de título+descrição (o INEA não publica "
            f"campo de município): {n_muni} identificado(s), {n_sem_muni} "
            "`null` — `municipio_base` diz de onde saiu ('explicito' = "
            "'município de X'; 'X/RJ'; 'unico_no_texto' = só um nome de "
            "município no texto). Ambíguo ou ausente fica `null`, nunca chute. "
            "`empreendimento` também é derivado (título menos nº de processo e "
            "rótulo). `tipo: outro` = arquivo da lista cujo nome não diz EIA "
            "nem RIMA (ex.: `.7z` de 2007). "
            "`ano: null` = audiência cujo título não traz data. "
            + (f"`truncado` = página-ano que não respondeu: {'; '.join(falhas)}. "
               if falhas else "")
            + (f"Os anos testados e não linkados pela página-mãe foram "
               f"{sem_link}: existem na fonte e entram igual. "
               if sem_link else "")
            + (f"`ano_sem_pagina` = {parou_em}: a varredura de anos parou no "
               "primeiro 404 (a fonte não publica página de ano vazio). "
               if parou_em else "")
            + (f"Arquivo hospedado fora do INEA (nuvem do empreendedor): "
               f"{', '.join(externos)} — mesma armadilha medida em MG. "
               if externos else "")
            + (f"Google Drive: {len(mortos_drive)} de "
               f"{len([a for a in amostras if a['formato'] == 'gdrive'])} "
               "link(s) do Drive conferido(s) NÃO abrem (404) — é link morto "
               "da fonte, não erro de coleta. "
               if mortos_drive else
               "Google Drive: todo link do Drive conferido abre. "
               if any(a["formato"] == "gdrive" for a in amostras) else "")
            + (f"{len(protegidos)} arquivo(s) respondem 403 no servidor do INEA "
               "(permissão do próprio arquivo; o resto do host segue 200) — "
               "está registrado em `amostras_validadas` como erro, não como "
               "bloqueio à coleta. "
               if protegidos else "")
            + "`requisicoes_bytes` é o total trafegado de verdade."
        ),
        "ressalva_editorial": RESSALVA,
        "paginas_por_ano": paginas_por_ano,
        "ano_sem_pagina": parou_em,
        "duplicados_descartados": duplicados,
        "resumo_por_ano": resumo_por_ano,
        "resumo_por_tipo": resumo_por_tipo,
        "resumo_municipio": {"identificado": n_muni, "null": n_sem_muni},
        "amostras_validadas": amostras,
        "requisicoes_bytes": _BYTES_LIDOS,
        "linhas": linhas,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
                     encoding="utf-8")
    tam_kb = SAIDA.stat().st_size / 1024

    _log(f"[ok] {total_fonte} documento(s) -> {SAIDA.name} ({tam_kb:,.0f} KB)")
    for ano in sorted(resumo_por_ano):
        _log(f"  {ano}: {sum(resumo_por_ano[ano].values())} "
             f"{resumo_por_ano[ano]}")
    _log(f"  total {total_fonte} = soma do resumo_por_ano "
         f"{sum(sum(v.values()) for v in resumo_por_ano.values())} = "
         f"len(linhas) {len(linhas)}")
    _log(f"  município: {n_muni} identificado(s), {n_sem_muni} null")
    _log(f"  {_BYTES_LIDOS / 1024:,.0f} KB trafegados, "
         f"{len(amostras)} amostra(s) de arquivo validadas")
    if falhas:
        _log(f"  ⚠ TRUNCADO: página-ano sem resposta: {'; '.join(falhas)}")
    if not all(a["ok"] for a in amostras):
        ruins = [f"{a['formato']} {a['url'].rsplit('/', 1)[-1][:40]} "
                 f"({a['erro'] or 'magic ' + a['magic']})"
                 for a in amostras if not a["ok"]]
        _log(f"  ⚠ {len(ruins)} amostra(s) não abriram: " + "; ".join(ruins))

    if args.scan_cpf:
        _log("rodando o varredor de CPF sobre a saída...")
        r = subprocess.run([sys.executable, "scripts/checar-dado-pessoal-em-dado.py",
                            "--extra", str(SAIDA)])
        if r.returncode != 0:
            _log("[!] CPF achado no JSON — limpar campo no coletor e re-rodar.")
            sys.exit(2)
        _log("scan clean.")


def _contar_formato(itens: "list[dict]") -> dict:
    cont: dict[str, int] = {}
    for x in itens:
        f = _formato(x["url_documento"])
        cont[f] = cont.get(f, 0) + 1
    return cont


if __name__ == "__main__":
    main()
