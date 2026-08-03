"""etl.psp.legislacao — leis, decretos, resoluções e instruções normativas de
São Paulo, para `atos_oficiais`.

    python -m etl.psp.legislacao --id-municipio 3550308
    python -m etl.psp.legislacao --id-municipio 3550308 --desde-ano 2015
    python -m etl.psp.legislacao --id-municipio 3550308 --tipos "LEI,DECRETO"

FONTE: **Catálogo de Legislação Municipal**
(`legislacao.prefeitura.sp.gov.br`), da Casa Civil do Gabinete do Prefeito,
hospedado pela PRODAM. É um buscador server-rendered (não SPA, não API):
`/busca` devolve HTML já com TÍTULO (tipo + órgão + número + data), EMENTA
e situação de cada ato. Toda a descoberta abaixo foi verificada ao vivo em
2026-08-03.

**NÃO É O MESMO PRODUTO DO DIÁRIO DE BH — `etl/pbh/legislacao.py` NÃO SERVE
PARA SÃO PAULO.** Esta era a hipótese de partida e ela é falsa, então fica
registrada para ninguém tentar de novo: `municipios.fontes.diario_oficial`
de SP aponta para `https://diariooficial.prefeitura.sp.gov.br/`, que
redireciona para `md_epubli_controlador.php?acao=inicio` — o módulo de
Publicação Eletrônica do SEI, em PHP, que serve a EDIÇÃO do diário. Não há
SPA em Vue, não há `VUE_APP_URL_API`: `/env.json` e `/docs/api-docs.json`
respondem **404**. O sistema de prateleira que a PBH usa (DOM-web + API
REST ato a ato) simplesmente não é o que São Paulo roda.

POR QUE NÃO AS OUTRAS FONTES (o caminho percorrido antes de chegar aqui):

- **CKAN de SP** (`dados.prefeitura.sp.gov.br`): o dataset
  `diario-oficial-da-cidade-de-sao-paulo` existe e está **descontinuado** —
  o próprio `notes` diz que a última versão é de 2015, e os recursos são
  `.7z` de texto integral hospedados em `devcolab.each.usp.br` (2003-2016).
  Texto corrido de edição inteira, sem ementa por ato. `package_search`
  para `legislacao`/`decreto`/`lei` devolve 29/43/66 datasets e nenhum é
  acervo normativo: são LOA/LDO/PPA, zoneamento, catálogos de bases (CMBD)
  e planos de transparência (PSTDA).
- **SPLegis** (já usado por `etl/camaras/sp.py`): é PROPOSIÇÃO, não ato
  sancionado — projeto de lei em tramitação, que este projeto já grava em
  `proposicoes`. `LeisAprovadasPorPromoventeJSON` dá o número da lei que
  saiu de cada projeto, mas o registro continua sendo o do PROJETO, e o
  Executivo (decreto, resolução, instrução normativa) não existe lá.

ARMADILHAS MEDIDAS — cada uma destas custa uma rodada silenciosamente
errada, não uma exceção:

1. **`limite` só vale por POST.** Na query string ele é ignorado e a página
   fica em 10 itens (2026 sozinho tem 2.469 resultados = 247 páginas). O
   formulário `#form-filtro` posta `limite`, então a chamada certa é
   `POST /busca?<filtros>` com o corpo `limite=100`. O teto é 100:
   `limite=500` também devolve 100.

2. **O contador para em 10.000.** Buscar 1892-2026 anuncia exatamente
   `10000` para DECRETO, para LEI e para PORTARIA — é corte de exibição,
   não o acervo. Por isso a varredura é ANO A ANO
   (`ano-inicial == ano-final`), faixa em que o total é real e serve de
   conferência da coleta.

3. **O SLUG NÃO IDENTIFICA O ATO.** Deduplicar pela URL PERDE ato:
   `/leis/resolucao-...-smul-fundurb-41-de-7-de-outubro-de-2025` é a URL
   das resoluções **41 e 40** do FUNDURB (o gerador de slug da fonte
   colidiu). Medido: DECRETO/2026 devolve 508 itens em 507 URLs distintas;
   RESOLUÇÃO/2025, 272 em 270. A identidade tem de sair do TÍTULO.

4. **O ano do título não é o ano da busca.** O filtro é pela publicação no
   DOC; o título estampa a data de ASSINATURA. 10 dos 2.221 itens de
   2025+2026 (0,45%) têm ano de título anterior ao da busca — ex.:
   "RESOLUÇÃO ... SMC Nº 21 de 12 de Dezembro de 2024" aparece na busca de
   2025. `ano` sai do TÍTULO, porque é assim que o ato é citado; a
   consequência aceita é que uma rodada de 2025-2026 grava também um punhado
   de atos de 2024, e que um ato assinado em dezembro só entra quando o ano
   seguinte for coletado.

5. **Número sozinho não é chave — e número + órgão TAMBÉM não.** Sem o
   órgão, (tipo, número, ano) colide 74 vezes em 2025+2026 (só de
   "Resolução nº 1 de 2026" são 16, uma por conselho). Com a sigla do órgão
   ainda colidem 19, e essas **não são duplicatas**: SP Regula, SP Urbanismo
   e a FTMSP mantêm DUAS séries paralelas de resolução — uma orçamentária
   ("Abre Crédito Adicional...") e uma normativa — e as duas numeram do 1.
   Colapsar por (tipo, número, ano) apagaria ato real. Daí a chave de
   dedupe incluir a EMENTA normalizada (ver `_chave`): caem 3 linhas
   (DECRETO 64.991/2026 publicado duas vezes idêntico; SMC 21/2024
   republicada só com a caixa do título trocada; SMUL/CEUSO 159/2025
   republicada 7 dias depois) e as 16 homônimas de verdade ficam.

6. **A sigla do órgão vai para `numero`, não para `tipo`** — mesma decisão
   de `etl/pbh/legislacao.py`, pelo mesmo motivo (senão o filtro de
   categoria da página vira uma lista de dezenas de órgãos). Usar o nome
   por extenso em vez da sigla resolveria UMA colisão a mais (2.201 chaves
   distintas contra 2.200) ao custo de um `numero` de 80 caracteres.

7. **`data_publicacao` recebe a data do TÍTULO, que é a data do ATO.** Nos
   dois atos conferidos por dentro (decreto 65.397/2026 e lei 18.377/2025)
   o texto traz "Publicado(a) ... em <a mesma data>"; nos ~0,5% em que
   difere, o ato foi assinado no fim de dezembro e publicado em janeiro.
   Buscar a data real de publicação custaria uma requisição POR ATO (+2.200
   por rodada) para ganhar um dia em 0,5% dos registros — não compensa, mas
   fica dito em vez de escondido.

8. **O filtro `tipo[]` é exato, e isso não era óbvio**: o catálogo tem
   DECRETO **e** "DECRETO LEI"/"DECRETO LEGISLATIVO", RESOLUÇÃO **e**
   "RESOLUÇÃO CONJUNTA"/"RESOLUÇÃO INTERSECRETARIAL". Medido: os 1.395
   decretos e as 302 leis de 2025+2026 vêm todos com qualificador VAZIO, ou
   seja, nada vaza de um rótulo para o outro. Por isso o tipo do banco pode
   sair do filtro pedido, sem reparsear o título.

9. **`requests` puro basta** — nada de `curl_cffi`. O host responde 200 até
   com o User-Agent padrão do `python-requests`, como o resto de `etl/psp`
   (ver `etl/psp/__init__.py`); quem precisa de fingerprint de TLS é a PBH.
   O corpo é UTF-8 de verdade, declarado e válido.

RECORTE — TIPOS. `TIPOS_PADRAO` fica no núcleo normativo. PORTARIA está
FORA de propósito, pela mesma razão de BH: são 1.505 em 2026 e 2.756 em
2025, mais que todos os outros tipos somados, e o grosso é designação de
servidor e de comissão — entraria como ruído sobre leis e decretos e
afundaria o ranking por tema da página. Os outros 39 rótulos do catálogo
são expediente (DESPACHO, COMUNICADO, OFÍCIO, MEMORANDO, PUBLICAÇÃO) ou
pertencem a outro eixo: PROJETO DE LEI (9.919) e RAZÕES DO VETO (1.845) são
tramitação, e já entram em `proposicoes` por `etl/camaras/sp.py`. Todos
continuam alcançáveis por `--tipos`.

RECORTE — ANOS. O catálogo vai até 1892 e tem ~1.300 atos/ano só dos quatro
tipos escolhidos desde 1997: a série inteira passa de 45 mil linhas. A
página `/prefeitura/legislacao` carrega TODOS os atos do município e filtra
no cliente (`atosOficiais()` em `apps/web/lib/db/queries/betim.ts`, sem
LIMIT), então despejar o acervo inteiro quebraria a página em vez de
enchê-la. O default é o MANDATO EM CURSO, lido de
`municipios.fontes.legislatura.inicio` (2025 em São Paulo) — ~2,2 mil atos,
mesma ordem de grandeza dos ~3,7 mil de BH. Nada de ano fica escrito aqui;
`--desde-ano` abre a janela para quem aceitar o custo.

Alvo: `atos_oficiais` (tipo, numero, ano, ementa, data_publicacao,
link_fonte, temas). Ementa classificada por `etl/temas.py`, a mesma regra
das proposições e dos contratos. Escrita por `refresh_completo_seguro` —
refresh total do município que se recusa a encolher a tabela. O host sai de
`municipios.fontes.legislacao_municipal_host` (migration
0034_sp_legislacao_fonte.sql), não do código. Cron: semanal.
"""

import argparse
import datetime as dt
import re
import sys
import time
import unicodedata
from collections import Counter

import requests
from lxml import html as LH
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    refresh_completo_seguro,
)
from etl.temas import classificar_texto

LOG = "[etl.psp.legislacao]"

# Rótulos como o próprio catálogo os escreve nos checkboxes `tipo[]` de
# `/busca`. Ficam por NOME e não por id porque a fonte não expõe id nenhum;
# um rótulo que suma faz a rodada abortar com a lista do que existe, em vez
# de coletar zero em silêncio.
TIPOS_PADRAO = ("DECRETO", "LEI", "RESOLUÇÃO", "INSTRUÇÃO NORMATIVA")

# Rótulo na fonte -> valor de `atos_oficiais.tipo`. Caixa alta é como o
# catálogo grava; Betim já usa Title Case ("Decreto", "Lei Ordinária") e a
# página monta o filtro de categoria a partir DESTA coluna — deixar
# "DECRETO" gritando ao lado de "Decreto" racharia o filtro. Mesmo mapa (e
# mesmos valores) de `etl/pbh/legislacao.py`, para que as três cidades
# falem a mesma língua.
TIPO_NO_BANCO = {
    "DECRETO": "Decreto",
    "LEI": "Lei",
    "RESOLUÇÃO": "Resolução",
    "INSTRUÇÃO NORMATIVA": "Instrução Normativa",
    "PORTARIA": "Portaria",
    "DECRETO LEI": "Decreto-Lei",
    "DECRETO LEGISLATIVO": "Decreto Legislativo",
    "ORDEM INTERNA": "Ordem Interna",
    "ORIENTAÇÃO NORMATIVA": "Orientação Normativa",
    "PARECER NORMATIVO": "Parecer Normativo",
    "REGIMENTO INTERNO": "Regimento Interno",
}

# Teto medido do `limite` (armadilha 1): pedir mais devolve 100 mesmo.
POR_PAGINA = 100
PAUSA_PAGINA = 0.2

# Trava contra laço infinito, não início de série de cidade nenhuma: o
# catálogo alcança 1892 e a varredura anda para trás até um ano vazio.
ANO_PISO = 1892

_MESES = {
    "janeiro": 1, "fevereiro": 2, "marco": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12,
}

# "1 - 100 de 156" quando pagina, "82" quando o resultado cabe numa página.
# O que interessa é sempre o ÚLTIMO número.
_RE_CONTADOR = re.compile(r'id="number-results">(.*?)</strong>', re.S)

# O que sobra depois de tirar o nome do tipo do começo do título:
#   ""                                          + "Nº 65.397 de 31 de Julho de 2026"
#   "SECRETARIA ... - SMUL/FUNDURB "            + "Nº 56 de 23 de Dezembro de 2025"
#
# O marcador "Nº" é OBRIGATÓRIO de propósito. Torná-lo opcional deixaria o
# `.*?` do órgão comer texto até casar com qualquer coisa parecida com um
# número seguido de data — e um título fora do padrão sairia com número
# errado em vez de sair como falha visível. Conferido contra 4.436 títulos
# reais (2025-2026 e amostras de 1990, 1997, 2000, 2005 e 2015): nenhum
# deixa de ter o marcador, e nenhum falha em casar.
#
# `\b` antes do N é o que impede o "N" de INOVAÇÃO/SMSUB de ser lido como
# marcador; o `[\s.]*` cobre "Nº", "N.º", "N°" e "N " na mesma expressão.
_TITULO = re.compile(
    r"^(?P<orgao>.*?)"
    r"\bN[º°o]?[\s.]*"
    r"(?P<numero>\d[\d.]*?)"
    r"\s+de\s+(?P<dia>\d{1,2})[ºo°]?\s+de\s+(?P<mes>\S+)\s+de\s+(?P<ano>\d{4})\b",
    re.I,
)


def _sem_acento(texto: str) -> str:
    n = unicodedata.normalize("NFD", texto or "")
    return "".join(c for c in n if unicodedata.category(c) != "Mn")


def _espremer(texto: str) -> str:
    return " ".join((texto or "").replace("\xa0", " ").split())


# --------------------------------------------------------------------------
# Transporte
# --------------------------------------------------------------------------


class ClienteCatalogo:
    """Cliente do Catálogo de Legislação Municipal.

    Guarda a sessão (o host é lento: uma página de 100 itens leva alguns
    segundos) e concentra as duas coisas que a fonte cobra e não estão na
    URL: o `limite` tem de ir no CORPO do POST (armadilha 1) e o corpo da
    resposta tem de ser lido como UTF-8 explícito.
    """

    def __init__(self, host: str):
        self.base = (host or "").rstrip("/")
        self.sessao = requests.Session()

    @retry(stop=stop_after_attempt(4), wait=wait_exponential(multiplier=1, min=3, max=45))
    def _buscar(self, tipo: str, ano: int, pagina: int) -> str:
        caminho = "/busca" if pagina == 1 else f"/busca/pg/{pagina}"
        resp = self.sessao.post(
            f"{self.base}{caminho}",
            params={"ano-inicial": str(ano), "ano-final": str(ano), "tipo[]": tipo},
            data={"limite": str(POR_PAGINA)},
            timeout=300,
        )
        resp.raise_for_status()
        try:
            return resp.content.decode("utf-8")
        except UnicodeDecodeError:
            # A fonte declara e entrega UTF-8 válido hoje. Se um dia entregar
            # byte inválido, é melhor seguir com o caractere de substituição
            # (e dizer) do que perder a rodada inteira por causa de um acento.
            print(f"{LOG} AVISO: {caminho} não decodifica em UTF-8 estrito — "
                  "usando substituição; confira os acentos das ementas.")
            return resp.content.decode("utf-8", "replace")

    def pagina(self, tipo: str, ano: int, pagina: int) -> tuple[list[tuple[str, str, str]], int]:
        """`([(href, titulo, ementa)], total_anunciado)` de uma página."""
        bruto = self._buscar(tipo, ano, pagina)
        doc = LH.fromstring(bruto)

        m = _RE_CONTADOR.search(bruto)
        numeros = re.findall(r"\d+", _espremer(m.group(1))) if m else []
        total = int(numeros[-1]) if numeros else 0

        itens: list[tuple[str, str, str]] = []
        caixas = doc.xpath(
            "//div[contains(concat(' ', normalize-space(@class), ' '), ' bx-resultado ')]"
        )
        for caixa in caixas:
            ancoras = caixa.xpath("./a[h4]")
            if not ancoras:
                continue
            a = ancoras[0]
            titulo = _espremer(" ".join(x.text_content() for x in a.xpath("./h4")))
            # A ementa é o <p> DENTRO da âncora do resultado. Os outros <p>
            # da caixa são a tabela de situação ("SEM REVOGAÇÃO EXPRESSA") —
            # pegar `.//p` traria a situação como ementa nos atos sem ementa.
            ementa = _espremer(" ".join(x.text_content() for x in a.xpath("./p")))
            itens.append((a.get("href") or "", titulo, ementa))

        if caixas and not itens:
            raise RuntimeError(
                f"{self.base}/busca devolveu {len(caixas)} resultado(s) mas nenhum no formato "
                "esperado (<a><h4>título</h4><p>ementa</p></a>) — o HTML do catálogo mudou."
            )
        return itens, total

    def coletar_ano(self, tipo: str, ano: int) -> tuple[list[tuple[str, str, str]], int]:
        """Todas as páginas de um (tipo, ano). Devolve os itens BRUTOS.

        Sem deduplicar por URL, de propósito — ver armadilha 3: o slug é
        reaproveitado entre atos diferentes e a dedupe por URL perde ato.
        A dedupe acontece depois, sobre o título já parseado.
        """
        brutos: list[tuple[str, str, str]] = []
        total = None
        pagina = 1
        while True:
            itens, anunciado = self.pagina(tipo, ano, pagina)
            if total is None:
                total = anunciado
            if not itens:
                break
            brutos.extend(itens)
            if len(itens) < POR_PAGINA or len(brutos) >= total:
                break
            pagina += 1
            time.sleep(PAUSA_PAGINA)
        return brutos, (total or 0)

    def tipos_disponiveis(self, ano: int) -> list[str]:
        """Os rótulos de `tipo[]` que o formulário oferece — usados só para
        a mensagem de erro quando alguém pede um tipo que não existe."""
        bruto = self._buscar(TIPOS_PADRAO[0], ano, 1)
        return re.findall(r'name="tipo\[\]"[^>]*value="([^"]+)"', bruto)


# --------------------------------------------------------------------------
# Extração
# --------------------------------------------------------------------------


def _sigla(orgao: str) -> str:
    """"SECRETARIA MUNICIPAL DE EDUCAÇÃO - SME" -> "SME".

    A sigla é como o próprio ato é citado, e cabe no `numero` (armadilha 6).
    Órgão sem travessão ("SÃO PAULO URBANISMO") volta inteiro: é curto, e
    inventar uma abreviação seria pior que repetir o nome.
    """
    limpo = _espremer(orgao).strip(" -–—")
    if not limpo:
        return ""
    for separador in ("–", "—", "-"):
        if separador in limpo:
            limpo = limpo.rsplit(separador, 1)[-1]
    return _espremer(limpo)


def _identificar(titulo: str, tipo_fonte: str) -> tuple[str, int, str] | None:
    """`titulo_do_resultado` -> (numero, ano, data_iso). `None` se não casar.

    O nome do tipo é retirado do começo antes de parsear porque ele já é
    conhecido (veio do filtro `tipo[]`, que é exato — armadilha 8); o que
    sobra é órgão + número + data.
    """
    resto = _espremer(titulo)
    cabeca = _sem_acento(tipo_fonte).upper()
    if _sem_acento(resto).upper().startswith(cabeca):
        resto = resto[len(tipo_fonte):].strip()

    m = _TITULO.match(resto)
    if not m:
        return None
    mes = _MESES.get(_sem_acento(m.group("mes")).lower())
    if not mes:
        return None

    ano = int(m.group("ano"))
    # O ponto de milhar é mantido ("65.397"): é como São Paulo cita os
    # próprios atos e como a fonte os escreve. Betim grava sem ponto porque
    # a fonte DELE não usa — as duas cidades nunca dividem a mesma listagem.
    numero = m.group("numero").strip(".")
    sigla = _sigla(m.group("orgao"))
    return (
        f"{sigla} {numero}".strip() if sigla else numero,
        ano,
        f"{ano:04d}-{mes:02d}-{int(m.group('dia')):02d}",
    )


def _chave(linha: dict) -> tuple:
    """Identidade de um ato para dedupe (armadilha 5).

    (tipo, número, ano) NÃO basta: órgãos como SP Regula mantêm uma série
    orçamentária e uma normativa numerando do 1, e colapsá-las apagaria ato
    real. A ementa normalizada é o que separa "duas séries do mesmo órgão"
    (ementas diferentes, ficam as duas) de "o mesmo ato republicado"
    (ementa igual, fica um).
    """
    ementa = _espremer(_sem_acento(linha["ementa"] or "")).lower()
    return (linha["tipo"], linha["numero"], linha["ano"], ementa)


# --------------------------------------------------------------------------
# Sync
# --------------------------------------------------------------------------


def _coletar(cliente: ClienteCatalogo, tipos: tuple[str, ...], desde: int, ate: int,
             id_municipio: str) -> list[dict]:
    linhas: dict[tuple, dict] = {}
    sem_numero: list[str] = []
    brutos_total = 0

    for ano in range(ate, desde - 1, -1):
        no_ano = 0
        for tipo_fonte in tipos:
            brutos, anunciado = cliente.coletar_ano(tipo_fonte, ano)
            brutos_total += len(brutos)
            no_ano += len(brutos)
            # A fonte publica quantos resultados tem a busca; comparar é a
            # única forma de saber se a paginação pegou tudo. Sem isso, uma
            # mudança no `limite` ou no seletor vira subcoleta silenciosa.
            if len(brutos) < anunciado:
                print(f"{LOG} AVISO: {tipo_fonte} {ano} — página(s) renderam "
                      f"{len(brutos)} de {anunciado} anunciados.")

            for href, titulo, ementa in brutos:
                identificado = _identificar(titulo, tipo_fonte)
                if not identificado:
                    sem_numero.append(f"{tipo_fonte} {ano}: {titulo[:70]}")
                    continue
                numero, ano_ato, data = identificado
                ementa = ementa or None
                linha = {
                    "id_municipio": id_municipio,
                    "tipo": TIPO_NO_BANCO.get(tipo_fonte, tipo_fonte.title()),
                    "numero": numero,
                    "ano": ano_ato,
                    "ementa": ementa,
                    "data_publicacao": data,
                    "link_fonte": f"{cliente.base}{href}" if href else None,
                    "temas": classificar_texto(ementa or ""),
                }
                chave = _chave(linha)
                anterior = linhas.get(chave)
                # Republicação/retificação: fica a publicação MAIS ANTIGA, que
                # é a original e a data que o cidadão procura.
                if anterior is None or (linha["data_publicacao"] or "9999") < (
                    anterior["data_publicacao"] or "9999"
                ):
                    linhas[chave] = linha
        print(f"{LOG} {ano}: {no_ano} resultados (linhas únicas acumuladas {len(linhas)})",
              flush=True)

    if sem_numero:
        print(f"{LOG} {len(sem_numero)} título(s) sem número reconhecível — fora do acervo. "
              f"Ex.: {sem_numero[:4]}")
    print(f"{LOG} {brutos_total} resultados brutos -> {len(linhas)} atos distintos "
          f"({brutos_total - len(linhas) - len(sem_numero)} republicações colapsadas).")
    return list(linhas.values())


def _corrigir_links_colididos(linhas: list[dict], base: str) -> int:
    """Zera o link do ato cujo slug a fonte deu a mais de um ato (armadilha 3).

    Guardar um `link_fonte` que abre OUTRO decreto é pior que não guardar
    link: o leitor clica em "volte à fonte" e lê a norma errada. Quando o
    slug é disputado, todos os disputantes caem para a busca do catálogo
    filtrada por tipo e ano — que lista o ato certo, só com um clique a mais.
    """
    contagem = Counter(x["link_fonte"] for x in linhas if x["link_fonte"])
    disputados = {url for url, n in contagem.items() if n > 1}
    if not disputados:
        return 0
    for linha in linhas:
        if linha["link_fonte"] in disputados:
            linha["link_fonte"] = (
                f"{base}/busca?ano-inicial={linha['ano']}&ano-final={linha['ano']}"
            )
    return len(disputados)


def sync(
    id_municipio: str,
    desde_ano: int | None = None,
    ate_ano: int | None = None,
    tipos: tuple[str, ...] = TIPOS_PADRAO,
    permitir_reducao: bool = False,
) -> int:
    municipio = carregar_municipio(id_municipio)
    fontes = municipio["fontes"] or {}
    host = fontes.get("legislacao_municipal_host")
    if not host:
        raise RuntimeError(
            f"`municipios.fontes.legislacao_municipal_host` está vazio para {id_municipio} "
            f"({municipio['nome']}-{municipio['uf']}). O host do catálogo sai do banco, não "
            "do código — rode supabase/betim/migrations/0034_sp_legislacao_fonte.sql "
            "(ou semeie a fonte da cidade) antes."
        )
    print(f"{LOG} {municipio['nome']}-{municipio['uf']} ({id_municipio}) em {host}")

    ate = ate_ano or dt.date.today().year
    if desde_ano is None:
        # Mandato em curso, lido do banco (ver RECORTE — ANOS na docstring).
        # Sem chute: se a cidade não declara a legislatura, o operador tem de
        # dizer o ano — nenhum default de cidade entra por aqui.
        inicio = (fontes.get("legislatura") or {}).get("inicio")
        if not inicio:
            raise RuntimeError(
                f"{municipio['nome']} não declara `fontes.legislatura.inicio`, que é de onde "
                "sai o recorte padrão (mandato em curso). Passe --desde-ano explicitamente."
            )
        desde = int(inicio)
    else:
        desde = int(desde_ano)

    if desde < ANO_PISO:
        raise RuntimeError(f"--desde-ano {desde} é anterior a {ANO_PISO}, o início do catálogo.")
    if ate < desde:
        raise RuntimeError(f"--ate-ano ({ate}) é menor que --desde-ano ({desde}).")

    cliente = ClienteCatalogo(host)
    disponiveis = cliente.tipos_disponiveis(ate)
    if not disponiveis:
        raise RuntimeError(
            f"{host}/busca não expõe os checkboxes `tipo[]` — ou o host não é o Catálogo de "
            "Legislação Municipal, ou o HTML mudou. Confira `fontes.legislacao_municipal_host`."
        )
    faltando = [t for t in tipos if t not in disponiveis]
    if faltando:
        raise RuntimeError(
            f"tipo(s) {faltando} não existem neste catálogo. Disponíveis: {sorted(disponiveis)}"
        )
    print(f"{LOG} anos {desde}-{ate} | tipos: {', '.join(tipos)}")

    linhas = _coletar(cliente, tipos, desde, ate, id_municipio)
    if not linhas:
        raise RuntimeError(
            "a busca não devolveu nenhum ato em nenhum ano do recorte. Antes de concluir que o "
            "catálogo está vazio, confira se o `limite` continua indo no CORPO do POST: em GET "
            "ele é ignorado, mas a busca segue respondendo 200."
        )

    colididos = _corrigir_links_colididos(linhas, cliente.base)
    if colididos:
        print(f"{LOG} {colididos} slug(s) disputados por mais de um ato — link trocado pela "
              "busca do catálogo (armadilha 3).")

    client = get_supabase_client()
    gravou = refresh_completo_seguro(
        client,
        "atos_oficiais",
        {"id_municipio": id_municipio},
        linhas,
        permitir_reducao=permitir_reducao,
        rotulo="etl.psp.legislacao",
    )
    por_tipo = Counter(x["tipo"] for x in linhas)
    com_ementa = sum(1 for x in linhas if x["ementa"])
    com_tema = sum(1 for x in linhas if x["temas"])
    print(f"{LOG} atos={len(linhas)} com_ementa={com_ementa} com_tema={com_tema} "
          f"gravado={gravou} | {dict(por_tipo)}")
    return len(linhas) if gravou else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--desde-ano",
        type=int,
        default=None,
        help="Primeiro ano do recorte. Sem isto: o início do mandato em curso, lido de "
        "`municipios.fontes.legislatura.inicio`. Leia o bloco RECORTE — ANOS antes de "
        "abrir muito: a página carrega todos os atos do município de uma vez.",
    )
    parser.add_argument("--ate-ano", type=int, default=None, help="Último ano (padrão: ano atual).")
    parser.add_argument(
        "--tipos",
        default=None,
        help="Tipos normativos separados por vírgula, como aparecem nos checkboxes de /busca. "
        f"Sem isto: {', '.join(TIPOS_PADRAO)}. Acrescentar PORTARIA é possível — leia o "
        "bloco RECORTE — TIPOS na docstring antes.",
    )
    parser.add_argument(
        "--permitir-reducao",
        action="store_true",
        help="grava mesmo trazendo menos atos que o banco já tem (use só depois de confirmar "
        "na fonte que os atos sumiram)",
    )
    args = parser.parse_args()

    escolha = TIPOS_PADRAO
    if args.tipos:
        escolha = tuple(t.strip().upper() for t in args.tipos.split(",") if t.strip())

    try:
        sync(
            args.id_municipio,
            desde_ano=args.desde_ano,
            ate_ano=args.ate_ano,
            tipos=escolha,
            permitir_reducao=args.permitir_reducao,
        )
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
