r"""etl.apis.legislacao_cndh — resoluções e recomendações do **CNDH**
(Conselho Nacional dos Direitos Humanos), esfera federal.

Entra no mesmo painel de `/ambiental/legislacao` que a legislação estadual
e a federal do MMA — decisão registrada na migration 0073. O caso de teste
que motivou a fonte já estava medido no plano (`docs/FONTES-CNJ-JUMA.md`
§4.3): o CNDH aprovou uma resolução **dedicada a Brumadinho** 24 dias
depois do rompimento (Resolução nº 1, de 19 de fevereiro de 2019), e a
camada do rompimento já existe no portal.

═══ LICENÇA — CC BY-ND, E O QUE ISSO PROÍBE ═══

Rodapé padrão gov.br, confirmado no HTML da página de Resoluções:
**"Creative Commons Atribuição-SemDerivações 3.0 Não Adaptada"** (CC BY-ND).
Permite citar, linkar e redistribuir **sem modificar**; **proíbe obra
derivada do texto**.

Consequência prática, que este módulo cumpre à risca: a `ementa` gravada é
o texto do CNDH **copiado literalmente** da página, nunca reescrito,
resumido ou "melhorado" — a única transformação é colapsar espaço em
branco (`\s+` -> " "), que não é obra derivada, é normalização de
marcação. Toda linha guarda o `link_pdf` para o documento oficial. Quem
mexer aqui: **não reescreva ementa do CNDH**, nem por IA nem à mão.

A ÚNICA exceção é `redigir_documentos`, que troca CPF de pessoa física por
`[CPF removido]`. É supressão, não obra derivada — nada é reescrito, um dado
sai. E privacidade de pessoa natural não é matéria que uma licença de
conteúdo decida: o CNDH pode dispensar derivação da sua obra, não pode
autorizar este repositório PÚBLICO a republicar o CPF de um terceiro. Medido
em 2026-08-15: **zero** ocorrências nesta fonte — a chamada está aqui para
que uma resolução futura não vaze, não para consertar algo que vazou. (A
fonte irmã, o MMA, teve uma em 8.940.)

(A fonte irmã desta rodada, o MMA, é CC-BY — mais permissiva. As duas
licenças convivem na mesma tabela porque a coluna `fonte` diz de quem é
cada linha; a documentação de licença por fonte está em
`docs/LEGISLACAO-FEDERAL-MMA-CNDH.md`.)

═══ DUAS PLATAFORMAS QUE NÃO SE FALAM ═══

**Recomendações** vivem no Decidim ("Brasil Participativo"), que expõe
API GraphQL de verdade. Assembleia **id 38** (slug `cndh`), componente
**id 3464** (`Pages`), que tem **uma única página, id 769** — o corpo
inteiro é um HTML de ~119 KB com um `<a>` por recomendação.

**Resoluções** NÃO estão no Decidim. Vivem numa página HTML estática do
gov.br/mdh, legado, fora de qualquer API (263.621 bytes medidos).

═══ AS ARMADILHAS MEDIDAS (ao vivo, 2026-08-15) ═══

1. **O HOST DO DECIDIM RECUSA `requests`.** O handshake TLS do `requests`
   é encerrado pelo servidor (`SSLZeroReturnError: TLS/SSL connection has
   been closed (EOF)`) — o mesmo pedido com ClientHello de Chrome real
   responde 200. É a MESMA classe de bloqueio já documentada em
   `etl/pbh/cliente.py` (WAF da GoCache nos portais da PBH): filtro por
   fingerprint de TLS, não por User-Agent. Por isso o Decidim é chamado
   com `curl_cffi` (`impersonate="chrome"`), já dependência do projeto.
   **Não troque por `requests` "para tirar dependência"** — o modo de
   falha é erro de TLS em 100% dos pedidos.

   A página das Resoluções (gov.br/mdh) **não** tem esse filtro: responde
   200 a `requests` com o User-Agent identificável do projeto. Cada
   transporte está onde precisa estar, não por simetria.

2. **A NUMERAÇÃO REINICIA POR GESTÃO DO CONSELHO** — há série 2017 que vai
   até nº 10, série 2022 que reinicia em nº 01, série 2025 que passa de
   nº 26. `ano + número` **não é chave única**: medido, 12 pares (ano,
   número) se repetem entre as recomendações, porque "Recomendação nº 01"
   e "Recomendação Conjunta CIAMP-Rua/CNDH/DPU n. 01" do mesmo ano são
   documentos diferentes. Por isso `id_fonte` é a **URL do documento**
   (única por definição, e é o que a fonte usa para endereçá-lo), e a
   deduplicação por (ano, número) NÃO é aplicada — ela fundiria
   documentos distintos. Medido: 256 links de recomendação apontando para
   248 URLs distintas (8 repetições do mesmo documento na página).

3. **A EMENTA NÃO ESTÁ DENTRO DO `<a>` — ESTÁ NO BLOCO QUE O CONTÉM.**
   Nas Resoluções, o `<a>` traz só "Resolução nº 1, de 19 de fevereiro de
   2019" e o `<p>` que o envolve traz o título MAIS a ementa ("Aprova o
   Relatório da Missão Emergencial a Brumadinho (MG) após o rompimento da
   Barragem da Vale S/A..."). Ler só o `<a>` jogaria fora exatamente a
   informação que faz a busca por "Brumadinho" funcionar. `_bloco_do_link`
   sobe até o `<p>`/`<li>` mais próximo e só aceita o texto se ele
   COMEÇAR pelo texto do link e contiver um único cabeçalho de resolução —
   senão cai de volta para o texto do `<a>` (há um bloco `<div>` antigo
   com seis links grudados: "Resolução 01Resolução 02...").

4. **21 RESOLUÇÕES ANTIGAS NÃO TÊM DATA NO TÍTULO, SÓ NA URL.** As de
   2009, 2012 e 2013 aparecem como "Resolução 01" seco, mas o caminho da
   URL carrega o ano (`.../old/cndh/resolucoes/2012/resolucao-04-atingidos
   -por-barragens-1`). `_ano_da_url` recupera o ano daí — auditável, é
   leitura da própria fonte, não inferência. **Registro do que o plano
   deixou em aberto**: ele dizia que as anteriores a 2016 só existiam em
   `.rar` e não estavam contadas; medido agora, 21 delas estão linkadas
   diretamente em HTML e entram nesta carga. O que continua fora do
   alcance é o conteúdo dos `.rar`, não abertos aqui.

5. **`\xa0` (espaço não separável) NO MEIO DOS TÍTULOS** do Decidim,
   grudando o número na ementa ("...de 2025 -\xa0Recomendar às..."). Todo
   texto passa por `_texto` (troca `\xa0` por espaço e colapsa espaço)
   antes de qualquer regex de número/data — sem isso o parser de data
   falha em parte das recomendações.

═══ O QUE ESTE MÓDULO NÃO FAZ ═══

**Não baixa nem lê os PDFs.** Guarda metadado e link, como as outras
quatro fontes da tabela.

**Não tenta achar o município da norma.** Nenhuma das duas plataformas tem
campo de local (introspecção do tipo `Page` do Decidim: só `id`, `title`,
`body`, `createdAt`, `updatedAt`); o lugar, quando existe, está no texto
("Relatório Brumadinho", "Mariana e Bacia do Rio Doce"). Cruzar texto
contra os 853 municípios de MG exige taxa de erro medida numa amostra real
antes de publicar (§4.4 do plano, mesma regra do acervo da UFMG) — não é
feito aqui, e `id_ibge_municipio` fica `None`, como nas outras fontes.

**Não colhe as outras assembleias do Decidim** (CEMDP tem "Notas e
Moções"; CONFOCO não tem componente normativo) — fora do escopo, mesmo
coletor alcançaria no futuro.

Uso:

    python -m etl.apis.legislacao_cndh --sondar
    python -m etl.apis.legislacao_cndh --sondar --linhas 20
    python -m etl.apis.legislacao_cndh
"""
import argparse
import datetime as dt
import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import urljoin

import requests
from curl_cffi import requests as creq
from lxml import html as LH
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed

from etl.common import get_supabase_client
from etl.apis._legislacao_ambiental import UA, redigir_documentos

LOG = "[etl.apis.legislacao_cndh]"

DECIDIM_API = "https://brasilparticipativo.presidencia.gov.br/api"
DECIDIM_ASSEMBLEIA = 38     # CNDH (slug `cndh`)
DECIDIM_COMPONENTE = 3464   # "Recomendações", tipo Pages
DECIDIM_PAGINA = 769        # única página do componente

URL_RESOLUCOES = (
    "https://www.gov.br/mdh/pt-br/acesso-a-informacao/participacao-social/"
    "conselho-nacional-de-direitos-humanos-cndh/resolucoes"
)

LICENCA = "CC BY-ND 3.0 (Creative Commons Atribuição-SemDerivações 3.0 Não Adaptada)"
TIMEOUT = 120

_MESES = {
    "janeiro": 1, "fevereiro": 2, "marco": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12,
}
_RX_DATA = re.compile(r"\bde\s+(\d{1,2})[ºo]?[,]?\s+de\s+([a-z]+)\s+de\s+(\d{4})")
_RX_NUMERO = re.compile(r"\bn[º°o]?\.?\s*(\d{1,3})\b", re.I)
_RX_ANO_URL = re.compile(r"/((?:19|20)\d{2})/")
_RX_RESOLUCAO = re.compile(r"^(resolu[cç][aã]o|resoluci[oó]n|resolution)\b", re.I)


class FonteMudou(RuntimeError):
    """Contrato do Decidim ou layout da página do MDH mudou — parar."""


def _texto(no) -> str:
    """Armadilha 5: `\\xa0` vira espaço, espaço colapsa. NÃO reescreve
    nada — CC BY-ND (ver docstring do módulo)."""
    bruto = no if isinstance(no, str) else (no.text_content() or "")
    return re.sub(r"\s+", " ", bruto.replace("\xa0", " ")).strip()


def _sem_acento(s: str) -> str:
    base = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in base if unicodedata.category(c) != "Mn")


def _data(titulo: str) -> str | None:
    m = _RX_DATA.search(_sem_acento(titulo).lower())
    if not m:
        return None
    mes = _MESES.get(m.group(2))
    if not mes:
        return None
    try:
        return dt.date(int(m.group(3)), mes, int(m.group(1))).isoformat()
    except ValueError:
        return None


def _numero(titulo: str) -> str | None:
    m = _RX_NUMERO.search(titulo)
    return str(int(m.group(1))) if m else None


def _ano_da_url(url: str) -> int | None:
    """Armadilha 4: as resoluções de 2009/2012/2013 só têm o ano no
    caminho da URL."""
    m = _RX_ANO_URL.search(url or "")
    return int(m.group(1)) if m else None


def _bloco_do_link(a) -> str:
    """Armadilha 3: o texto útil é o do `<p>`/`<li>` que envolve o link,
    não o do próprio `<a>` — mas só quando esse bloco é DESTE link."""
    rotulo = _texto(a)
    pai = a.getparent()
    while pai is not None and pai.tag not in ("p", "li", "td", "dd"):
        pai = pai.getparent()
    if pai is None:
        return rotulo
    bloco = _texto(pai)
    if not bloco.startswith(rotulo):
        return rotulo
    # Um `<p>` que abrigue mais de um ato (o `<div>` legado com seis links
    # grudados) não é bloco deste link — cai para o rótulo.
    if len(pai.xpath(".//a")) > 1:
        return rotulo
    return bloco or rotulo


# ─────────────────────────── Recomendações (Decidim) ──────────────────────

_QUERY_PAGINA = """
{
  component(id: %d) {
    id
    ... on Pages {
      page(id: %d) {
        id
        updatedAt
        body { translation(locale: "pt-BR") }
      }
    }
  }
}
""" % (DECIDIM_COMPONENTE, DECIDIM_PAGINA)


@retry(stop=stop_after_attempt(3), wait=wait_fixed(5))
def _corpo_recomendacoes() -> tuple[str, str | None]:
    """Armadilha 1: `curl_cffi`, não `requests` — o host encerra o
    handshake TLS de qualquer cliente que não pareça um navegador."""
    r = creq.post(DECIDIM_API, json={"query": _QUERY_PAGINA}, impersonate="chrome", timeout=TIMEOUT)
    if r.status_code != 200:
        raise FonteMudou(f"{LOG} Decidim HTTP {r.status_code}: {r.text[:200]}")
    corpo = r.json()
    if corpo.get("errors"):
        raise FonteMudou(f"{LOG} GraphQL devolveu erro: {corpo['errors']}")
    try:
        pagina = corpo["data"]["component"]["page"]
        return pagina["body"]["translation"], pagina.get("updatedAt")
    except (KeyError, TypeError) as e:
        raise FonteMudou(
            f"{LOG} resposta do Decidim sem component.page.body — "
            f"assembleia {DECIDIM_ASSEMBLEIA}/componente {DECIDIM_COMPONENTE} mudou? ({e})"
        )


def _recomendacoes() -> tuple[list[dict], dict]:
    corpo, atualizado_em = _corpo_recomendacoes()
    doc = LH.fromstring(corpo)
    doc.make_links_absolute("https://www.gov.br/participamaisbrasil/")
    linhas: dict[str, dict] = {}
    total_links = 0
    for a in doc.xpath("//a"):
        rotulo = _texto(a)
        if not _sem_acento(rotulo).lower().startswith("recomenda"):
            continue
        href = (a.get("href") or "").strip()
        if not href:
            continue
        total_links += 1
        titulo = _bloco_do_link(a)
        data = _data(titulo)
        # Armadilha 2: a URL é a chave, não (ano, número).
        linhas[href] = {
            "fonte": "cndh",
            "id_fonte": href,
            "esfera": "nacional",
            "tipo": "Recomendação",
            "numero": _numero(titulo),
            "ano": int(data[:4]) if data else _ano_da_url(href),
            "ementa": redigir_documentos(titulo),  # citação literal (CC BY-ND), menos CPF
            "data": data,
            "orgao": "CNDH",
            "link_pdf": href,
            "situacao": None,     # a fonte não publica vigência
            "id_ibge_municipio": None,
            # Armadilha 2: `chave_dedup` fica NULA de propósito. Ela é
            # "TIPO:NÚMERO:ANO" e serve para sinalizar a MESMA norma em
            # duas fontes — premissa que não vale aqui, porque a numeração
            # do CNDH reinicia por gestão e "Recomendação nº 17/2025"
            # designa mais de um documento. Preenchê-la faria a tela
            # anunciar coincidência onde não há.
            "chave_dedup": None,
            "indexacao": None,
        }
    diag = {
        "links": total_links,
        "distintos": len(linhas),
        "pagina_atualizada_em": atualizado_em,
        "corpo_bytes": len(corpo),
    }
    return list(linhas.values()), diag


# ─────────────────────────── Resoluções (gov.br/mdh) ──────────────────────

@retry(
    retry=retry_if_exception_type(requests.exceptions.Timeout),
    stop=stop_after_attempt(3),
    wait=wait_fixed(5),
)
def _html_resolucoes() -> bytes:
    r = requests.get(URL_RESOLUCOES, headers={"User-Agent": UA}, timeout=TIMEOUT)
    r.raise_for_status()
    return r.content


def _resolucoes() -> tuple[list[dict], dict]:
    bruto = _html_resolucoes()
    doc = LH.fromstring(bruto)
    doc.make_links_absolute(URL_RESOLUCOES)
    linhas: dict[str, dict] = {}
    total_links = 0
    for a in doc.xpath("//a"):
        rotulo = _texto(a)
        if not _RX_RESOLUCAO.match(_sem_acento(rotulo)):
            continue
        href = urljoin(URL_RESOLUCOES, (a.get("href") or "").strip())
        if not href:
            continue
        total_links += 1
        titulo = _bloco_do_link(a)
        data = _data(titulo)
        ano = int(data[:4]) if data else _ano_da_url(href)
        linhas[href] = {
            "fonte": "cndh",
            "id_fonte": href,
            "esfera": "nacional",
            "tipo": "Resolução",
            "numero": _numero(titulo),
            "ano": ano,
            "ementa": redigir_documentos(titulo),  # citação literal (CC BY-ND), menos CPF
            "data": data,
            "orgao": "CNDH",
            "link_pdf": href,
            "situacao": None,
            "id_ibge_municipio": None,
            "chave_dedup": None,  # mesma razão das recomendações, acima
            "indexacao": None,
        }
    diag = {"links": total_links, "distintos": len(linhas), "html_bytes": len(bruto)}
    return list(linhas.values()), diag


def coletar(*, verboso: bool = False) -> tuple[list[dict], dict]:
    recomendacoes, diag_rec = _recomendacoes()
    resolucoes, diag_res = _resolucoes()
    if verboso:
        print(f"{LOG} licença da fonte: {LICENCA}")
        print(f"{LOG} recomendações: {diag_rec['links']} link(s) -> {diag_rec['distintos']} "
              f"distinto(s) | página do Decidim atualizada em {diag_rec['pagina_atualizada_em']}")
        print(f"{LOG} resoluções:    {diag_res['links']} link(s) -> {diag_res['distintos']} "
              f"distinto(s) | {diag_res['html_bytes']} bytes de HTML")
    if not recomendacoes:
        raise FonteMudou(f"{LOG} nenhuma recomendação extraída do corpo do Decidim — layout mudou?")
    if not resolucoes:
        raise FonteMudou(f"{LOG} nenhuma resolução extraída da página do MDH — layout mudou?")

    # As duas listas nunca colidem em `id_fonte` (URLs de hosts diferentes),
    # mas a união é feita por dicionário do mesmo jeito — `id_fonte`
    # repetido no MESMO lote quebra o upsert, não só duplica.
    por_id = {l["id_fonte"]: l for l in recomendacoes}
    por_id.update({l["id_fonte"]: l for l in resolucoes})
    diag = {
        "recomendacoes": diag_rec,
        "resolucoes": diag_res,
        "total": len(por_id),
        "licenca": LICENCA,
    }
    return list(por_id.values()), diag


def sondar(max_linhas: int | None) -> None:
    linhas, diag = coletar(verboso=True)
    por_tipo: dict[str, int] = {}
    sem_numero = sem_data = sem_ano = 0
    for l in linhas:
        por_tipo[l["tipo"]] = por_tipo.get(l["tipo"], 0) + 1
        sem_numero += 0 if l["numero"] else 1
        sem_data += 0 if l["data"] else 1
        sem_ano += 0 if l["ano"] else 1
    print(f"\n{LOG} {diag['total']} ato(s) ao todo: "
          + ", ".join(f"{n} {t}" for t, n in sorted(por_tipo.items())))
    print(f"{LOG} sem número: {sem_numero} | sem data completa: {sem_data} | sem ano: {sem_ano}")

    alvo = [l for l in linhas if re.search(r"Brumadinho|Samarco|Mariana|Rio Doce", l["ementa"] or "", re.I)]
    print(f"{LOG} citando Brumadinho/Samarco/Mariana/Rio Doce: {len(alvo)}")
    for l in alvo[:6]:
        print(f"       {l['tipo']} {l['numero']} ({l['ano']}) {l['data']}  {(l['ementa'] or '')[:110]}")

    for l in linhas[: (max_linhas or 4)]:
        print(f"       {l['tipo']:<13} {(l['numero'] or '-'):<5} {l['ano']} {l['data']}  {(l['ementa'] or '')[:70]}")


def exportar_json(caminho: str) -> None:
    """Grava as linhas em arquivo, sem tocar em banco nenhum.

    Mesma razão do gêmeo em `legislacao_mma`: quem coleta é este desktop e quem
    o site lê é o Postgres da máquina de build. Repetir a coleta lá seria
    raspar o site do CNDH de novo — e este coletor depende da estrutura HTML da
    página, que muda sem aviso. O arquivo congela o que já foi conferido.
    """
    linhas, _ = coletar(verboso=True)
    if not linhas:
        print(f"{LOG} ABORT: nada coletado — não sobrescrevo {caminho}.", file=sys.stderr)
        sys.exit(1)
    Path(caminho).parent.mkdir(parents=True, exist_ok=True)
    Path(caminho).write_text(
        json.dumps({"fonte": "cndh", "linhas": linhas}, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )
    print(f"{LOG} {len(linhas)} linha(s) em {caminho}.")


def sync() -> None:
    client = get_supabase_client()
    linhas, diag = coletar(verboso=True)
    print(f"{LOG} {len(linhas)} ato(s) para gravar.")
    if not linhas:
        print(f"{LOG} nada coletado — NÃO apago o que já existe.")
        return
    for i in range(0, len(linhas), 200):
        client.table("ambiental_legislacao").upsert(
            linhas[i : i + 200], on_conflict="fonte,id_fonte"
        ).execute()
    print(f"{LOG} {len(linhas)} linha(s) gravada(s)/atualizada(s) (fonte=cndh, esfera=nacional).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sondar", action="store_true", help="consulta e relata, NÃO grava, NÃO lê o banco")
    parser.add_argument("--linhas", type=int, help="quantas amostras imprimir — só com --sondar")
    parser.add_argument("--json", metavar="ARQUIVO", help="grava as linhas em arquivo, NÃO toca no banco")
    args = parser.parse_args()

    try:
        if args.sondar:
            sondar(args.linhas)
        elif args.json:
            exportar_json(args.json)
        else:
            sync()
    except FonteMudou as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
