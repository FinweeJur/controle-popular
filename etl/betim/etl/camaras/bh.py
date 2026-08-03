"""etl.camaras.bh — vereadores, proposições, subsídio e custeio parlamentar
da Câmara Municipal de Belo Horizonte (id_municipio 3106200).

Uso: python -m etl.camaras.bh --id-municipio 3106200

Primeira carga de uma cidade nova, em duas passadas (a segunda só preenche o
que faltou, ver `data_apresentacao` abaixo):

    python -m etl.camaras.bh --id-municipio 3106200 --sem-datas   # ~30 min
    python -m etl.camaras.bh --id-municipio 3106200               # datas

FONTE: https://www.cmbh.mg.gov.br — Drupal 7, HTML renderizado no servidor.
Verificado ao vivo em 2026-08-03: NÃO existe API JSON (/wp-json, /api, /rest,
/services devolvem 404). Também não precisa de Playwright, ao contrário de
`etl/camaras/betim.py` (Blazor Server): tudo aqui sai de `requests` + `lxml`,
o que faz esta rodada custar segundos de CPU em vez de um Chromium inteiro.

O que foi conferido ao vivo em 2026-08-03 e vira armadilha se ignorado:

1. HEADER `Origin` NAS BUSCAS. `pesquisar.php` responde HTTP **200** com o
   corpo "Pesquisa de fonte não autorizada." (33 bytes) quando o Origin não
   vem. `Referer` sozinho não basta. É falha silenciosa: sem checar o corpo,
   a rodada "termina bem" com zero proposição.

2. `numero` E `ano` NÃO PODEM IR VAZIOS. O formulário do site manda os
   PLACEHOLDERS literais `[número]` e `[ano]` (é o `value` que está no HTML,
   com `onfocus` limpando na hora de digitar). Mandar `numero=""`/`ano=""`
   devolve "Nenhum resultado encontrado" — de novo HTTP 200, de novo em
   silêncio. Isolado campo a campo: só esses dois têm esse comportamento;
   `autor`, `assunto`, `fase`, `tramitando`, `drupalUsername` e `metodo`
   podem ir vazios sem mudar o total. `stormCodex` não é validado (mandar
   lixo devolve o mesmo resultado) e não é preciso cookie nenhum.

3. SLUG COM ACENTO NA URL. 13 dos 41 vereadores têm acento no caminho
   (`/vereadores/iza-lourença`, `/vereadores/trópia`,
   `/vereadores/cláudio-do-mundo-novo`) e três têm sufixo de desambiguação do
   Drupal (`edmar-branco-0`, `osvaldo-lopes-0`, `uner-augusto-0`). O `slug`
   que gravamos é a URL do NOSSO portal (`/bh/vereadores/<slug>`), então vai
   normalizado em ASCII e sem o sufixo; o caminho original fica em
   `vereadores.slug_fonte` (migration 0028) porque não há regra
   determinística que reconstrua "loíde-gonçalves" a partir de
   "loide-goncalves".

4. GUID DO VEREADOR. A busca de proposições filtra por `idVereador`, um GUID
   de 32 hex do SIL que não aparece em nenhuma listagem: só lendo
   `<input name="idVereador">` em `/vereadores/<slug>/projetos`, um GET por
   vereador. Fica em `vereadores.id_externo` (migration 0028) para as
   rodadas seguintes não repetirem os 41 GETs.

RECORTE DAS PROPOSIÇÕES (a decisão mais consequente deste módulo). A busca
pagina de 7 em 7 — fixo, não há parâmetro de tamanho de página — e cada
requisição de busca leva de 1 a 8 segundos. Então o recorte é literalmente
quanto tempo a rodada dura. Contagens medidas ao vivo em 2026-08-03 para
2025+2026 (a 19ª legislatura, iniciada em 2025):

    Requerimento de Comissão  8.388   <- excluído
    Indicação                 1.075
    Requerimento              1.237
    Projeto de Lei              894
    Moção                       446
    Projeto de Resolução          6
    Proposta de Emenda à LOM      4
    Autorização/Denúncia/
      Prestação de Contas         4
    (Ofício, Recurso, Representação, Projeto de Decreto Legislativo,
     Outros Documentos, Sugestão de Proposição: zero no período)
    TOTAL de todos os tipos  12.054

"Requerimento de Comissão" sozinho é 70% da base e é peça de tramitação
interna de comissão, não atuação individual do parlamentar — entraria como
ruído 3:1 sobre tudo que o portal usa (o ranking de atuação de
`lib/betim/vereadores.ts` pesa projeto de lei 15, resolução 6, requerimento
2, indicação 1). Fica de fora, e é o único tipo excluído: o resto entra
inteiro, ~3.660 proposições. Varrer a base histórica completa está fora de
questão por outro motivo além do tempo — são 9.552 projetos de lei desde a
redemocratização, e o portal fala da legislatura corrente.

Os anos do recorte NÃO são constante: saem do maior "Períodos de Mandatos"
lido nos 41 perfis (hoje 2025 a 2028), então a virada de legislatura se
resolve sozinha. `--anos` força outro intervalo quando se quiser backfill.

`proposicoes.tipo` usa o vocabulário que o app já conhece (`projeto_lei`,
`projeto_resolucao`, `requerimento`, `indicacao`), traduzido em
`TIPO_NO_BANCO` — ver lá por que slugificar o rótulo seria um bug mudo. BH
protocola tipos que Betim não tem (`mocao`, `proposta_emenda_lei_organica`,
`projeto_decreto_legislativo`) e esses ainda NÃO estão em `PESO_PROPOSICAO`
(`apps/web/lib/betim/vereadores.ts`), então hoje entram no ranking com peso
0: aparecem na lista e nos temas, mas não pontuam. É decisão de produto,
não do ETL — fica registrado aqui para não parecer erro de coleta.

`data_apresentacao` vem de `proxy.php` ("publicado em DD/MM/AAAA"), uma
requisição extra por proposição, e é a parte cara da rodada: ~1,3s cada,
medido em série contra itens ainda não vistos. (Uma primeira medição deu
0,06s e era artefato: as sete proposições cronometradas tinham acabado de
ser abertas na mesma sessão, então vieram do cache do site. 20x de erro na
estimativa da rodada inteira — medir latência sempre contra item frio.)
Daí duas defesas:

- a data de uma proposição já publicada não muda, então o módulo lê o que já
  está em `proposicoes` para este município e só pergunta pelas que faltam.
  A primeira carga paga as ~3.660 (perto de 1h30); as rodadas seguintes
  pagam só as novas da semana.
- `--sem-datas` pula a etapa inteira. Sem as datas, a carga completa cai
  para ~30 min — é o modo certo para um primeiro povoamento com pressa, e
  a rodada seguinte preenche as datas que faltarem.

SUBSÍDIO (o dado que faltava em Betim). `subsidios` recebe uma linha por
vereador na competência do mês corrente, com o valor da página
`/transparencia/pessoal/estrutura-remuneratoria/vereadores`: R$ 18.402,02
bruto, fixado pela Lei Municipal 11.016/2016, IGUAL para os 41 (não é por
vereador). Isso é exatamente o que destrava o "custo total do parlamentar
para o contribuinte", que em Betim ficou impossível por falta do dado: com
subsídio + custeio parlamentar na mesma cidade dá para somar as duas pontas.
`verbas_extras` recebe o auxílio-alimentação (R$ 2.374,00, Lei 11.849/2025),
que a mesma página publica em caráter indenizatório.

CUSTEIO PARLAMENTAR -> `verbas_indenizatorias`. É o substituto VIVO da verba
indenizatória: `/transparencia/vereadores/verba-indenizatoria` está congelada
em julho/2017 e não serve para dado atual. O custeio tem série mensal de
02/2017 a 08/2026 (115 meses no `select#data`), e este módulo raspa só os
meses da legislatura corrente. O detalhamento expõe grupo de despesa
("Material de Escritório", "Serviços Postais") e valor, mas NÃO expõe
fornecedor — então `verbas_indenizatorias.fornecedor` fica nulo, e como o
índice único da tabela inclui `fornecedor` (e no Postgres NULL nunca colide
com NULL), `on_conflict` não daria idempotência nenhuma. Por isso a escrita
vai por `refresh_completo_seguro`, que troca o conjunto inteiro do município
e se recusa a encolher a tabela — a mesma trava criada depois da perda de
dados de 2026-07-29 em `etl/camaras/verbas.py`.

VOTAÇÃO: `votos_eleicao` fica NULO, de propósito. A biografia quase sempre
cita uma votação, e uma regex de "com N votos" enche a coluna — só que com o
número ERRADO para quem foi reeleito, porque a prosa começa pela carreira.
Medido nos 41 em 2026-08-03: a primeira ocorrência dá 3.649 para o
Dr. Bruno Pedralva (que fez 10.870 em 2024), 10.741 para a Trópia (que fez
17.878), 3.111 para o José Ferreira (9.946) e 6.049 para a Fernanda Pereira
Altoé. Ancorar no ano da eleição também não salva: a maioria das frases
corretas não cita ano nenhum ("eleito em sua primeira candidatura, com 8.668
votos"). Uma votação errada num portal de transparência é pior do que uma
votação ausente — a fonte certa é o TSE, estruturada, por
`etl/bd/tse.py`/`id_candidato_tse`, e é lá que essa coluna deve ser
preenchida.

NÃO gravado nesta rodada (falta coluna, não falta dado):
- telefone e sala/gabinete do vereador (existem no `aside#sidebar_second` de
  toda subpágina do perfil);
- "Fase Atual" da proposição ("Aguarda Sanção/Veto", "Apreciação pela
  Comissão/Mesa"), que é mais fina que `situacao`;
- enquete "sou a favor / sou contra" do site e o PDF do texto inicial.
Todos ficariam num campo inventado ou concatenados dentro de `situacao`, o
que quebraria agrupamento — melhor faltar do que mentir a forma do dado.

Cron: mensal para vereadores/subsídio/custeio; semanal para proposições.
"""
import argparse
import math
import re
import sys
import time
import unicodedata
import urllib.parse
from datetime import date

import requests
from lxml import html
from tenacity import (
    retry,
    retry_if_not_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    refresh_completo_seguro,
    upsert_com_colunas_opcionais,
)
from etl.temas import classificar_texto

LOG = "[etl.camaras.bh]"

CAMINHO_LISTA = "/vereadores"
CAMINHO_MESA = "/a-camara/mesa-diretora"
CAMINHO_SUBSIDIO = "/transparencia/pessoal/estrutura-remuneratoria/vereadores"
CAMINHO_CUSTEIO = "/transparencia/vereadores/custeio-parlamentar"
BUSCA_PROPOSICOES = "/sites/all/modules/proposicoes/pesquisar.php"
DETALHE_PROPOSICAO = "/sites/all/modules/proposicoes/proxy.php"
BUSCA_CUSTEIO = "/sites/all/modules/execucao_orcamentaria_custeio/pesquisar.php"
DETALHE_CUSTEIO = "/sites/all/modules/execucao_orcamentaria_custeio/detalhar.php"

# A busca devolve 7 itens por página, sempre. Não há parâmetro para mudar
# (testado com `mobile=1`, que só troca o layout). O número entra na conta
# de quantas páginas pedir; ler o total anunciado e dividir é mais seguro
# do que "pedir até vir vazio", porque uma página que falhe encerraria o
# laço cedo fingindo fim de lista.
ITENS_POR_PAGINA = 7

# 70% de tudo que a Casa protocola e nada disso é atuação individual do
# parlamentar — ver o bloco RECORTE no docstring.
TIPOS_IGNORADOS = {"Requerimento de Comissão"}

# Rótulo da CMBH -> valor de `proposicoes.tipo`.
#
# NÃO dá para derivar isto slugificando o rótulo, e a diferença é silenciosa:
# "Projeto de Lei" slugificado vira `projeto_de_lei`, mas o vocabulário que o
# app já usa (vindo de Betim) é `projeto_lei` — e `PESO_PROPOSICAO` em
# `apps/web/lib/betim/vereadores.ts` indexa por essa chave, devolvendo peso
# 0 para qualquer chave desconhecida. O ranking de atuação de BH ficaria
# zerado sem nenhum erro em lugar nenhum. O mapa explícito é a trava: rótulo
# novo na fonte cai no fallback e sai avisado.
TIPO_NO_BANCO = {
    "Projeto de Lei": "projeto_lei",
    "Projeto de Resolução": "projeto_resolucao",
    "Projeto de Decreto Legislativo": "projeto_decreto_legislativo",
    "Proposta de Emenda à Lei Orgânica": "proposta_emenda_lei_organica",
    "Indicação": "indicacao",
    "Moção": "mocao",
    "Requerimento": "requerimento",
    "Requerimento de Comissão": "requerimento_comissao",
    "Autorização": "autorizacao",
    "Denúncia": "denuncia",
    "Prestação de Contas": "prestacao_contas",
    "Ofício": "oficio",
    "Recurso": "recurso",
    "Representação": "representacao",
    "Outros Documentos": "outros_documentos",
    "Sugestão de Proposição": "sugestao_proposicao",
}

# Pausa entre requisições. A busca varre a base inteira (1-8s de resposta) e
# leva a pausa cheia. `proxy.php` e as páginas de perfil são leituras de um
# registro só (~1,3s e ~0,6s) e levam metade: com 3.660 datas a buscar, meio
# segundo de pausa em cada uma acrescentaria 30 minutos de espera pura a uma
# rodada que já é longa por causa da latência da própria fonte.
PAUSA_BUSCA = 0.5
PAUSA_DETALHE = 0.25

ETAPAS_VALIDAS = ("vereadores", "proposicoes", "subsidios", "custeio")

_PERIODO_RE = re.compile(r"(\d{4})\s*a\s*(\d{4})")
_TITULO_RE = re.compile(r"^(.+?)\s*-\s*(\d+)\s*/\s*(\d{4})\s*$")
_GUID_RE = re.compile(r"id=([0-9a-fA-F]{16,})")
_PUBLICADO_RE = re.compile(r"publicado em\s*(\d{2})/(\d{2})/(\d{4})")
_TOTAL_RE = re.compile(r"de um total de\s*([\d.]+)\s*itens")
_DINHEIRO_RE = re.compile(r"R\$\s*([\d.]+,\d{2})")


def _texto(el) -> str:
    return re.sub(r"\s+", " ", el.text_content()).strip()


def _slug_ascii(texto: str) -> str:
    """"Cláudio do Mundo Novo" / "cláudio-do-mundo-novo" -> "claudio-do-mundo-novo"."""
    t = unicodedata.normalize("NFKD", texto or "")
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")
    return t or "vereador"


def _valor_brl(texto: str) -> float | None:
    m = _DINHEIRO_RE.search(texto or "")
    if not m:
        return None
    return float(m.group(1).replace(".", "").replace(",", "."))


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers.update(
        {
            # UA identificável: se a Casa quiser falar com a gente (ou nos
            # bloquear), que saiba quem é. UA de navegador puro esconderia
            # um robô que faz milhares de requisições.
            "User-Agent": "ControlePopular-ETL/1.0 (+https://controlepopular.vercel.app)",
            "Accept-Language": "pt-BR,pt;q=0.9",
        }
    )
    return s


@retry(stop=stop_after_attempt(4), wait=wait_exponential(multiplier=1, min=2, max=20))
def _get(sessao: requests.Session, url: str) -> requests.Response:
    r = sessao.get(url, timeout=90)
    r.raise_for_status()
    return r


class FonteRecusada(RuntimeError):
    """A busca respondeu "Pesquisa de fonte não autorizada.".

    Tipo próprio por dois motivos: o `tenacity` não deve repetir (é recusa
    determinística, não instabilidade — repetir só gasta 4 requisições), e os
    laços que toleram falha de página não devem engoli-la (uma recusa vale
    para TODAS as páginas; engolir daria uma rodada "bem-sucedida" com zero
    proposição)."""


@retry(
    retry=retry_if_not_exception_type(FonteRecusada),
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=1, min=2, max=20),
)
def _post(sessao: requests.Session, base: str, caminho: str, corpo) -> str:
    """POST nos endpoints PHP do site. O header `Origin` é obrigatório: sem
    ele o corpo vira "Pesquisa de fonte não autorizada." com HTTP 200 (ver
    armadilha 1 no docstring), então ele é checado aqui, num lugar só, em vez
    de cada chamador ter de lembrar."""
    r = sessao.post(
        f"{base}{caminho}",
        data=corpo,
        headers={"Content-Type": "application/x-www-form-urlencoded", "Origin": base},
        timeout=120,
    )
    r.raise_for_status()
    if "não autorizada" in r.text:
        raise FonteRecusada(
            f"{caminho} recusou a requisição ('{r.text.strip()[:60]}'). O header Origin "
            "deixou de bastar — reinspecione o formulário antes de confiar em qualquer total."
        )
    return r.text


# --------------------------------------------------------------------------
# 1. Vereadores
# --------------------------------------------------------------------------


def _listar_vereadores(sessao: requests.Session, base: str) -> list[dict]:
    """A página `/vereadores` traz os 41 numa view do Drupal, sem paginação."""
    doc = html.fromstring(_get(sessao, f"{base}{CAMINHO_LISTA}").content)
    linhas = doc.xpath("//div[contains(concat(' ',normalize-space(@class),' '),' vereador ')]")
    if not linhas:
        raise RuntimeError(
            f"{CAMINHO_LISTA} não devolveu nenhum `div.vereador` — o tema do Drupal mudou; "
            "reveja os seletores antes de gravar qualquer coisa."
        )
    saida = []
    for linha in linhas:
        a = linha.xpath(".//div[contains(@class,'views-field-title')]//a")
        if not a:
            continue
        sigla = linha.xpath(
            ".//div[contains(@class,'views-field-field-sigla')]//div[contains(@class,'field-content')]"
        )
        foto = linha.xpath(".//div[contains(@class,'views-field-field-foto')]//img/@src")
        href = a[0].get("href") or ""
        # O href já vem percent-encoded pelo Drupal; guardamos decodificado
        # (legível) e reencodamos na hora de requisitar.
        slug_fonte = urllib.parse.unquote(href.rsplit("/", 1)[-1])
        saida.append(
            {
                "nome_urna": _texto(a[0]),
                "slug_fonte": slug_fonte,
                "partido": _texto(sigla[0]) if sigla else None,
                "foto_url": foto[0] if foto else None,
            }
        )
    return saida


def _url_perfil(base: str, slug_fonte: str, sufixo: str = "") -> str:
    return f"{base}{CAMINHO_LISTA}/{urllib.parse.quote(slug_fonte)}{sufixo}"


def _perfil(sessao: requests.Session, base: str, slug_fonte: str) -> dict:
    doc = html.fromstring(_get(sessao, _url_perfil(base, slug_fonte)).content)

    def campo(classe: str) -> str | None:
        v = doc.xpath(
            f"//div[contains(@class,'{classe}')]//div[contains(@class,'field-item')]"
        )
        return _texto(v[0]) if v else None

    biografia = campo("field-name-field-historico")

    # "Períodos de Mandatos" traz um <span class="date-display-range"> por
    # mandato; quem já foi reeleito tem vários ("2021 a 2024", "2025 a 2028")
    # e o vigente é o de maior ano final. Pegar só o primeiro span daria o
    # mandato ANTIGO justamente para os reeleitos.
    periodos = []
    for span in doc.xpath(
        "//div[contains(@class,'field-name-field-periodo')]//span[contains(@class,'date-display-range')]"
    ):
        m = _PERIODO_RE.search(_texto(span))
        if m:
            periodos.append((int(m.group(1)), int(m.group(2))))
    atual = max(periodos, key=lambda p: p[1]) if periodos else None

    email = doc.xpath(
        "//aside[@id='sidebar_second']//div[contains(@class,'views-field-field-email')]"
        "//a[starts-with(@href,'mailto')]/text()"
    )
    return {
        "nome": campo("field-name-field-nome-civil"),
        # "PCdoB - Partido Comunista do Brasil". Só fallback: a listagem tem
        # campo próprio de sigla e ele é mais confiável. Comparados os 41 em
        # 2026-08-03, dois divergem — o perfil do União Brasil escreve
        # "União Brasil - União Brasil", ou seja, o lado esquerdo nem sempre
        # é sigla. Usar este campo como fonte primária gravaria partido
        # "União Brasil" para dois vereadores e "UNIÃO" para os demais,
        # rachando o agrupamento por bancada sem nenhum erro aparente.
        "partido_composto": campo("field-name-partido-composto"),
        "biografia": biografia,
        "mandato_inicio": f"{atual[0]}-01-01" if atual else None,
        "mandato_fim": f"{atual[1]}-12-31" if atual else None,
        "email": email[0].strip() if email else None,
    }


def _guid_vereador(sessao: requests.Session, base: str, slug_fonte: str) -> str | None:
    html_txt = _get(sessao, _url_perfil(base, slug_fonte, "/projetos")).text
    m = re.search(r'name="idVereador"\s+value="([^"]+)"', html_txt)
    return m.group(1) if m else None


def _tipos_de_proposicao(sessao: requests.Session, base: str, slug_fonte: str) -> dict[str, str]:
    """{rótulo: GUID} lido do `<select name="tipo">` do formulário de busca.

    Raspar em vez de fixar no código: os GUIDs são do SIL e um tipo novo
    (ou renomeado) passaria despercebido numa lista congelada, e a rodada
    seguiria "com sucesso" coletando de menos."""
    doc = html.fromstring(_get(sessao, _url_perfil(base, slug_fonte, "/projetos")).content)
    opcoes = doc.xpath("//form[@id='form_pesquisa_proposicoes']//select[@name='tipo']/option")
    tipos = {_texto(o): o.get("value") for o in opcoes if (o.get("value") or "").strip()}
    if not tipos:
        raise RuntimeError(
            "não achei o <select name='tipo'> do formulário de proposições — "
            "sem os GUIDs de tipo não dá para varrer por categoria."
        )
    return tipos


def _cargos_da_mesa(sessao: requests.Session, base: str) -> dict[str, str]:
    """{slug_fonte: cargo} da Mesa Diretora (6 cadeiras em BH, não 5)."""
    doc = html.fromstring(_get(sessao, f"{base}{CAMINHO_MESA}").content)
    cargos: dict[str, str] = {}
    for bloco in doc.xpath("//div[contains(@class,'cont-mesa')]"):
        rotulo = bloco.xpath(".//a[contains(@class,'mesa_diretora_cargo')]")
        link = bloco.xpath(".//span[contains(@class,'mesa_nome')]/a/@href")
        if rotulo and link:
            slug_fonte = urllib.parse.unquote(link[0].rsplit("/", 1)[-1])
            cargos[slug_fonte] = _texto(rotulo[0])
    return cargos


def _resolver_slugs(vereadores: list[dict]) -> None:
    """Define `slug` (a URL do nosso portal) a partir de `slug_fonte`.

    O Drupal desambigua homônimo histórico com sufixo numérico
    (`edmar-branco-0`); tirar o sufixo deixa a URL do portal apresentável.
    Mas tirar às cegas pode colidir se um dia houver de fato dois
    "edmar-branco" ativos — e colisão em `slug` não daria erro, daria
    upsert de um vereador POR CIMA do outro (a unique é
    id_municipio+slug). Então: tira o sufixo quando o resultado é único e
    mantém o slug da fonte inteiro quando não é."""
    curto: dict[str, list[dict]] = {}
    for v in vereadores:
        base_slug = re.sub(r"-\d+$", "", _slug_ascii(v["slug_fonte"]))
        curto.setdefault(base_slug, []).append(v)
    for base_slug, grupo in curto.items():
        if len(grupo) == 1:
            grupo[0]["slug"] = base_slug
            continue
        print(f"{LOG} AVISO: {len(grupo)} vereadores caem no slug '{base_slug}' — "
              "mantendo o slug completo da fonte para não sobrescrever um com o outro.")
        for v in grupo:
            v["slug"] = _slug_ascii(v["slug_fonte"])


def sincronizar_vereadores(client, sessao, base: str, id_municipio: str) -> list[dict]:
    vereadores = _listar_vereadores(sessao, base)
    print(f"{LOG} vereadores_listados={len(vereadores)}")
    _resolver_slugs(vereadores)

    cargos = _cargos_da_mesa(sessao, base)
    print(f"{LOG} mesa_diretora={len(cargos)}")

    # Já temos os GUIDs de rodadas anteriores? Evita 41 GETs sempre que o
    # módulo roda só para atualizar biografia/partido.
    guids_salvos = {
        r["slug_fonte"]: r["id_externo"]
        for r in (
            client.table("vereadores")
            .select("slug_fonte, id_externo")
            .eq("id_municipio", id_municipio)
            .execute()
            .data
            or []
        )
        if r.get("slug_fonte") and r.get("id_externo")
    }

    linhas = []
    for i, v in enumerate(vereadores, 1):
        perfil = _perfil(sessao, base, v["slug_fonte"])
        guid = guids_salvos.get(v["slug_fonte"]) or _guid_vereador(sessao, base, v["slug_fonte"])
        sigla = v["partido"] or (perfil["partido_composto"] or "").split("-")[0].strip() or None
        inicio = perfil["mandato_inicio"]
        linhas.append(
            {
                "id_municipio": id_municipio,
                "slug": v["slug"],
                "slug_fonte": v["slug_fonte"],
                "id_externo": guid,
                "nome": perfil["nome"] or v["nome_urna"],
                "nome_urna": v["nome_urna"],
                "partido": sigla,
                "cargo_mesa": cargos.get(v["slug_fonte"]),
                "foto_url": v["foto_url"],
                "email": perfil["email"],
                "mandato_inicio": inicio,
                "mandato_fim": perfil["mandato_fim"],
                "biografia": perfil["biografia"],
                # `votos_eleicao` fica de fora DE PROPÓSITO — ver o bloco
                # "VOTAÇÃO" no docstring do módulo.
                #
                # Eleição municipal é sempre no ano anterior ao início do
                # mandato (posse em 1º de janeiro). Derivar é seguro; o site
                # não publica o ano da eleição em campo próprio.
                "ano_eleicao": int(inicio[:4]) - 1 if inicio else None,
                "ativo": True,
            }
        )
        time.sleep(PAUSA_DETALHE)
        if i % 10 == 0:
            print(f"{LOG} perfis lidos: {i}/{len(vereadores)}")

    sem_guid = [l["slug"] for l in linhas if not l["id_externo"]]
    if sem_guid:
        print(f"{LOG} AVISO: sem id_externo (não terão proposições ligadas por GUID): {sem_guid}")

    upsert_com_colunas_opcionais(
        client,
        "vereadores",
        linhas,
        ["slug_fonte", "id_externo"],
        on_conflict="id_municipio,slug",
    )
    print(f"{LOG} vereadores_gravados={len(linhas)}")
    return linhas


# --------------------------------------------------------------------------
# 2. Proposições
# --------------------------------------------------------------------------


def _corpo_busca(**sobrescreve) -> list[tuple[str, str]]:
    """O corpo é o `serialize()` do `#form_pesquisa_proposicoes` — inclusive
    os placeholders `[número]`/`[ano]`, que NÃO podem virar string vazia
    (armadilha 2 do docstring). Lista de pares, não dict, para o corpo sair
    na mesma ordem do formulário."""
    campos = [
        ("metodo", ""),
        ("nomeProposicao", ""),
        ("paginaRequerida", "1"),
        ("urlProposicao", ""),
        ("idProposicao", ""),
        ("buscarEmendas_proposicoes", ""),
        ("idTipoEmenda", ""),
        ("idTipoSubemenda", ""),
        ("idTipoEmendaDeRedacao", ""),
        ("drupalUsername", "deslogado-anonimo"),
        ("drupalEmail", ""),
        ("buscaViaUrl", ""),
        # Não é validado (conferido mandando lixo): é só o valor que o site
        # publica no HTML. Mandamos o mesmo por educação, não por exigência.
        ("stormCodex", "410d41a2a8d879f46dc8675cb1ea8030"),
        ("mobile", "0"),
        ("idVereador", ""),
        ("tipo", ""),
        ("buscarPorProtocolo", "false"),
        ("numero", "[número]"),
        ("ano", "[ano]"),
        ("autor", "[autor]"),
        ("assunto", "[assunto]"),
        ("assunto2", ""),
        ("fase", "[Selecione]"),
        ("tramitando", "Tanto faz"),
    ]
    return [(k, sobrescreve.get(k, v)) for k, v in campos]


def _parsear_itens(fragmento: str) -> tuple[int, list[dict]]:
    doc = html.fromstring(fragmento)
    m = _TOTAL_RE.search(fragmento)
    total = int(m.group(1).replace(".", "")) if m else 0

    itens = []
    for li in doc.xpath("//ul[contains(@class,'lista-pesquisas')]/li"):
        cab = li.xpath(".//h3//span[contains(@class,'vinculavel')]")
        if not cab:
            continue
        titulo = _texto(cab[0])
        mt = _TITULO_RE.match(titulo)
        if not mt:
            print(f"{LOG} AVISO: título fora do padrão '<Tipo> - <n>/<ano>': {titulo!r} — pulando.")
            continue
        rotulo, numero, ano = mt.group(1).strip(), int(mt.group(2)), int(mt.group(3))
        mg = _GUID_RE.search(cab[0].get("data-caminho") or "")

        campos: dict[str, str] = {}
        for p in li.xpath(".//p"):
            forte = p.xpath("./strong/text()")
            if not forte:
                continue
            chave = forte[0].strip().rstrip(":").strip()
            campos[chave] = _texto(p).split(":", 1)[-1].strip()

        # ONDE MORA A DESCRIÇÃO MUDA POR TIPO — conferido ao vivo 2026-08-03:
        #   Projeto de Lei / Resolução / PELO -> "Ementa" (texto normativo) e
        #     "Assunto" é uma LISTA DE DESCRITORES do indexador da Casa
        #     ("Alteração, transporte coletivo, ônibus, remuneração, ...").
        #   Indicação / Moção -> NÃO têm "Ementa". A descrição inteira está em
        #     "Assunto", e aí ela é frase corrida ("indicação a ser encaminhada
        #     ao prefeito ... para que sejam adotadas as providências ...").
        #   Requerimento -> não tem "Ementa" nem "Assunto"; tem "Solicitação"
        #     ("Suspensão da tramitação da(s) seguinte(s) proposição(ões): ...").
        # Ler só "Ementa" deixava 2.480 das 3.667 proposições sem descrição
        # nenhuma no portal (medido) — página de indicação em branco. A ordem
        # do fallback importa: para um PL, "Assunto" é palavra-chave solta e
        # nunca deve virar descrição enquanto houver ementa de verdade.
        ementa = campos.get("Ementa") or campos.get("Solicitação") or campos.get("Assunto")

        itens.append(
            {
                "rotulo": rotulo,
                "numero": numero,
                "ano": ano,
                "guid": mg.group(1) if mg else None,
                "autoria": campos.get("Autoria"),
                "ementa": ementa or None,
                # Tudo que é texto livre do item, para o classificador de temas
                # ter o máximo de sinal — inclusive os descritores do indexador,
                # que são ouro para casar palavra-chave.
                "texto_para_temas": " ".join(
                    v for k, v in campos.items() if k != "Autoria" and v
                ),
                "situacao": campos.get("Situação") or None,
            }
        )
    return total, itens


def _buscar_tipo_ano(sessao, base: str, guid_tipo: str, ano: int) -> list[dict]:
    """Todas as páginas de um par (tipo, ano). Devolve o que conseguiu ler.

    Diferente de `etl/camaras/betim.py`, uma página faltando aqui NÃO faz
    descartar o lote: lá a gravação era delete+insert (lote parcial =
    histórico apagado), aqui é upsert na chave natural
    (id_municipio, tipo, numero, ano), então uma proposição que faltar nesta
    rodada simplesmente entra na próxima, sem apagar nada. O aviso é alto
    para o desvio não passar despercebido."""
    primeira = _post(sessao, base, BUSCA_PROPOSICOES, _corpo_busca(tipo=guid_tipo, ano=str(ano)))
    total, itens = _parsear_itens(primeira)
    if total == 0:
        return []

    paginas = math.ceil(total / ITENS_POR_PAGINA)
    vistos = {(i["rotulo"], i["numero"], i["ano"]) for i in itens}
    for pagina in range(2, paginas + 1):
        time.sleep(PAUSA_BUSCA)
        try:
            fragmento = _post(
                sessao,
                base,
                BUSCA_PROPOSICOES,
                _corpo_busca(tipo=guid_tipo, ano=str(ano), paginaRequerida=str(pagina)),
            )
        except FonteRecusada:
            raise  # vale para todas as páginas; seguir seria fingir sucesso
        except Exception as e:
            # Uma rodada completa são ~530 buscas ao longo de meia hora; um
            # timeout na página 40 de 107 não pode matar as outras 500.
            # `raise` aqui custaria a rodada inteira para ganhar nada: a
            # página que faltou volta na próxima execução (upsert por chave
            # natural), e a divergência aparece no aviso de total logo abaixo.
            print(f"{LOG} AVISO: página {pagina}/{paginas} de {guid_tipo}/{ano} falhou "
                  f"({type(e).__name__}) — seguindo sem ela.")
            continue
        _, novos = _parsear_itens(fragmento)
        for item in novos:
            chave = (item["rotulo"], item["numero"], item["ano"])
            if chave not in vistos:
                vistos.add(chave)
                itens.append(item)

    if len(itens) != total:
        print(
            f"{LOG} AVISO: ano={ano} tipo={itens[0]['rotulo'] if itens else guid_tipo}: "
            f"coletei {len(itens)} itens únicos, a busca anunciou {total}. "
            "Gravando o que veio (upsert por chave natural, nada é apagado)."
        )
    return itens


def _data_publicacao(sessao, base: str, guid_proposicao: str) -> str | None:
    """`proxy.php` devolve o cabeçalho "Tipo N/AAAA publicado em DD/MM/AAAA".

    É a única data que a fonte expõe fora do detalhamento completo, e é a
    data de publicação/protocolo — o mesmo papel que `data_apresentacao`
    cumpre no eixo de Betim."""
    fragmento = _post(
        sessao,
        base,
        DETALHE_PROPOSICAO,
        _corpo_busca(
            urlProposicao=(
                "http://cmbhsilint.cmbh.mg.gov.br/silinternet/servico/proposicao"
                f"?id={guid_proposicao}"
            )
        ),
    )
    m = _PUBLICADO_RE.search(fragmento)
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else None


def _limpar_autores(autoria: str | None) -> list[str]:
    """"Ver.(a) Irlan Melo; Ver.(a) Arruda" -> ["Irlan Melo", "Arruda"].

    Nem todo autor é vereador: aparecem "Executivo: Mensagem nº 31, de
    05/12/2025", "Comissão de Orçamento e Finanças Públicas", "Mesa - Ver.(a)
    Professor Juliano Lopes" e até cidadão (nas Sugestões de Proposição).
    Só o prefixo de cortesia "Ver.(a)" sai; o resto fica como a fonte
    escreveu, porque é informação (quem propôs não foi um vereador)."""
    if not autoria:
        return []
    saida = []
    for parte in autoria.split(";"):
        nome = re.sub(r"^(Mesa\s*-\s*)?Ver\.\(a\)\s*", "", parte.strip()).strip()
        if nome:
            saida.append(nome)
    return saida


def _upsert_em_lotes(client, tabela: str, linhas: list[dict], on_conflict: str, lote: int = 400):
    """Deduplica pela chave de conflito e grava em fatias.

    Os dois motivos são do Postgres, não de gosto: `ON CONFLICT` não pode
    tocar duas vezes a mesma linha na MESMA instrução (erra
    "cannot affect row a second time"), e cada linha consome um placeholder
    por coluna — um lote grande estoura o teto de 65.535 parâmetros."""
    chaves = [c.strip() for c in on_conflict.split(",")]
    unicas: dict[tuple, dict] = {}
    for linha in linhas:
        unicas[tuple(linha.get(c) for c in chaves)] = linha
    valores = list(unicas.values())
    for i in range(0, len(valores), lote):
        client.table(tabela).upsert(valores[i : i + lote], on_conflict=on_conflict).execute()
    return len(valores)


def sincronizar_proposicoes(
    client,
    sessao,
    base: str,
    id_municipio: str,
    anos: list[int],
    slug_fonte_referencia: str,
    com_datas: bool = True,
) -> int:
    tipos = _tipos_de_proposicao(sessao, base, slug_fonte_referencia)
    alvos = {r: g for r, g in tipos.items() if r not in TIPOS_IGNORADOS}
    print(f"{LOG} tipos={len(alvos)} (ignorados: {sorted(TIPOS_IGNORADOS)}) anos={anos}")

    vereadores_db = (
        client.table("vereadores")
        .select("id, nome, nome_urna")
        .eq("id_municipio", id_municipio)
        .execute()
        .data
        or []
    )
    # Casamento por nome normalizado: a autoria vem com o nome parlamentar
    # ("Arruda"), que é o nosso `nome_urna`; o nome civil entra junto porque
    # algumas autorias trazem o nome completo.
    uuid_por_nome: dict[str, str] = {}
    for v in vereadores_db:
        for candidato in (v.get("nome_urna"), v.get("nome")):
            if candidato:
                uuid_por_nome.setdefault(_slug_ascii(candidato), v["id"])

    # Datas já conhecidas. A data de publicação de uma proposição não muda
    # depois de publicada, e cada consulta custa ~1,3s — numa rodada semanal
    # sobre 3.660 proposições, reperguntar tudo seria 1h20 de requisições
    # para reconfirmar o que já está gravado.
    datas_conhecidas: dict[tuple[str, int, int], str] = {}
    if com_datas:
        for r in (
            client.table("proposicoes")
            .select("tipo, numero, ano, data_apresentacao")
            .eq("id_municipio", id_municipio)
            .execute()
            .data
            or []
        ):
            if r.get("data_apresentacao"):
                datas_conhecidas[(r["tipo"], r["numero"], r["ano"])] = r["data_apresentacao"]
        print(f"{LOG} datas já gravadas: {len(datas_conhecidas)} (não serão reconsultadas)")

    gravadas = 0
    for ano in anos:
        for rotulo, guid_tipo in sorted(alvos.items()):
            itens = _buscar_tipo_ano(sessao, base, guid_tipo, ano)
            time.sleep(PAUSA_BUSCA)
            if not itens:
                continue

            tipo_slug = TIPO_NO_BANCO.get(rotulo)
            if tipo_slug is None:
                tipo_slug = _slug_ascii(rotulo).replace("-", "_")
                print(
                    f"{LOG} AVISO: tipo '{rotulo}' não está em TIPO_NO_BANCO — gravando como "
                    f"'{tipo_slug}'. Confira se o app precisa conhecer essa chave "
                    "(PESO_PROPOSICAO trata chave desconhecida como peso 0)."
                )
            # O caminho público da proposição é derivável: o próprio site
            # monta `/atividade-legislativa/pesquisar-proposicoes/<tipo em
            # kebab ASCII>/<numero>/<ano>` (conferido lendo o link canônico
            # que `proxy.php` devolve para PL, Moção, Indicação e
            # Requerimento). Derivar evita uma requisição por proposição só
            # para descobrir a URL. É o kebab do rótulo, não `tipo_slug`:
            # a URL da fonte é "projeto-de-lei", nosso campo é "projeto_lei".
            tipo_url = _slug_ascii(rotulo)

            linhas = []
            for item in itens:
                autores = _limpar_autores(item["autoria"])
                primeiro = _slug_ascii(autores[0]) if autores else None
                data_apresentacao = datas_conhecidas.get(
                    (tipo_slug, item["numero"], item["ano"])
                )
                if com_datas and item["guid"] and not data_apresentacao:
                    try:
                        data_apresentacao = _data_publicacao(sessao, base, item["guid"])
                    except FonteRecusada:
                        raise
                    except Exception as e:
                        # A data é enfeite comparada ao resto da linha: sem
                        # ela a proposição ainda entra completa. Deixar a
                        # exceção subir jogaria fora um lote inteiro já
                        # coletado por causa de um GET de 4 KB.
                        print(f"{LOG} AVISO: data de {item['rotulo']} {item['numero']}/"
                              f"{item['ano']} falhou ({type(e).__name__}) — gravando sem data.")
                    time.sleep(PAUSA_DETALHE)
                linha = {
                    "id_municipio": id_municipio,
                    "vereador_id": uuid_por_nome.get(primeiro) if primeiro else None,
                    "tipo": tipo_slug,
                    "numero": item["numero"],
                    "ano": item["ano"],
                    "ementa": item["ementa"],
                    "situacao": item["situacao"],
                    "autores": autores,
                    "link_fonte": (
                        f"{base}/atividade-legislativa/pesquisar-proposicoes/"
                        f"{tipo_url}/{item['numero']}/{item['ano']}"
                    ),
                    "temas": classificar_texto(item["texto_para_temas"]),
                }
                # A chave só entra quando há data. Se entrasse sempre, uma
                # rodada `--sem-datas` gravaria NULL por cima das datas que
                # a rodada anterior levou uma hora e meia para buscar — o
                # upsert só preserva a coluna que não aparece no INSERT.
                if data_apresentacao:
                    linha["data_apresentacao"] = data_apresentacao
                linhas.append(linha)
            n = _upsert_em_lotes(
                client, "proposicoes", linhas, on_conflict="id_municipio,tipo,numero,ano"
            )
            gravadas += n
            print(f"{LOG} {ano} {rotulo}: {n} gravadas (acumulado {gravadas})")
    return gravadas


# --------------------------------------------------------------------------
# 3. Subsídio
# --------------------------------------------------------------------------


def sincronizar_subsidios(client, sessao, base: str, id_municipio: str) -> int:
    doc = html.fromstring(_get(sessao, f"{base}{CAMINHO_SUBSIDIO}").content)
    bruto = None
    for tr in doc.xpath("//table//tr"):
        celulas = [_texto(c) for c in tr.xpath("./td|./th")]
        if len(celulas) >= 2 and celulas[0].lower().startswith("subsídio mensal bruto"):
            bruto = _valor_brl(celulas[1])
    if bruto is None:
        raise RuntimeError(
            f"{CAMINHO_SUBSIDIO}: não achei a linha 'Subsídio mensal bruto' — "
            "a página mudou de formato; não vou gravar valor adivinhado."
        )

    # Auxílio-alimentação: parcela mensal única em caráter indenizatório,
    # publicada em prosa na mesma página (Lei 11.849/2025). É a parte
    # "verbas extras" do custo do parlamentar — sem ela a conta fica ~11%
    # menor do que é.
    corpos = doc.xpath("//div[contains(@class,'field-name-body')]")
    corpo = _texto(corpos[0]) if corpos else ""
    m = re.search(r"auxílio-alimentação.{0,200}?R\$\s*([\d.]+,\d{2})", corpo, re.IGNORECASE | re.DOTALL)
    extras = float(m.group(1).replace(".", "").replace(",", ".")) if m else None
    if extras is None:
        print(f"{LOG} AVISO: não achei o auxílio-alimentação na página — "
              "`verbas_extras` fica nulo (o custo por parlamentar sai subestimado).")

    competencia = date.today().replace(day=1).isoformat()
    vereadores = (
        client.table("vereadores").select("id").eq("id_municipio", id_municipio).execute().data or []
    )
    if not vereadores:
        raise RuntimeError(
            "nenhum vereador em `vereadores` para este município — rode a etapa "
            "'vereadores' antes de 'subsidios' (o subsídio é gravado por vereador)."
        )
    linhas = [
        {
            "id_municipio": id_municipio,
            "vereador_id": v["id"],
            "competencia": competencia,
            "valor_bruto": bruto,
            "verbas_extras": extras,
            "fonte": f"{base}{CAMINHO_SUBSIDIO}",
        }
        for v in vereadores
    ]
    n = _upsert_em_lotes(client, "subsidios", linhas, on_conflict="vereador_id,competencia")
    print(
        f"{LOG} subsidios={n} competencia={competencia} bruto={bruto} extras={extras}"
    )
    return n


# --------------------------------------------------------------------------
# 4. Custeio parlamentar -> verbas_indenizatorias
# --------------------------------------------------------------------------


def _meses_custeio(sessao, base: str) -> list[str]:
    doc = html.fromstring(_get(sessao, f"{base}{CAMINHO_CUSTEIO}").content)
    opcoes = doc.xpath("//form[@id='form_pesquisa_custeio']//select[@name='data']/option/@value")
    meses = [o for o in opcoes if re.fullmatch(r"\d{2}/\d{4}", o or "")]
    if not meses:
        raise RuntimeError(
            f"{CAMINHO_CUSTEIO}: o `select[name=data]` não trouxe meses — "
            "sem a série não dá para saber o alcance real da fonte."
        )
    return meses


def sincronizar_custeio(
    client, sessao, base: str, id_municipio: str, desde: str, permitir_reducao: bool = False
) -> int:
    """`desde` no formato MM/AAAA: só meses a partir dele são raspados."""
    mes_desde, ano_desde = desde.split("/")
    limite = (int(ano_desde), int(mes_desde))
    meses = [m for m in _meses_custeio(sessao, base) if (int(m[3:]), int(m[:2])) >= limite]
    print(f"{LOG} custeio: {len(meses)} meses de {meses[-1]} a {meses[0]}")

    uuid_por_id_externo = {
        r["id_externo"]: r["id"]
        for r in (
            client.table("vereadores")
            .select("id, id_externo")
            .eq("id_municipio", id_municipio)
            .execute()
            .data
            or []
        )
        if r.get("id_externo")
    }

    linhas = []
    for mes in meses:
        resumo = _post(
            sessao,
            base,
            BUSCA_CUSTEIO,
            {"paginaRequerida": "1", "codVereador": "", "data": mes, "mobile": "0"},
        )
        doc = html.fromstring(resumo)
        # A tabela de resumo é a única lista de QUEM teve despesa no mês, e
        # já traz o GUID do vereador no `data-codvereador` — o mesmo
        # `id_externo` que a busca de proposições usa. Aproveitar isso evita
        # casar por nome, que erraria em acento/apelido.
        alvos = []
        for a in doc.xpath("//table[@id='a']//a[@data-codvereador]"):
            cod = a.get("data-codvereador")
            tr = a.xpath("./ancestor::tr[1]")
            nome = _texto(tr[0].xpath("./td[1]")[0]) if tr else None
            if cod and nome:
                alvos.append((cod, nome))
        time.sleep(PAUSA_DETALHE)

        competencia = f"{mes[3:]}-{mes[:2]}-01"
        for cod, nome in alvos:
            detalhe = _post(
                sessao,
                base,
                DETALHE_CUSTEIO,
                {"paginaRequerida": "1", "codVereador": cod, "data": mes, "mobile": "0"},
            )
            for tr in html.fromstring(detalhe).xpath("//table[@id='a']//tbody/tr"):
                celulas = [_texto(c) for c in tr.xpath("./td")]
                if len(celulas) < 3 or celulas[0].lower() == "total":
                    continue  # a última linha é o somatório do mês, não uma despesa
                valor = _valor_brl(celulas[2])
                if valor is None:
                    continue
                linhas.append(
                    {
                        "id_municipio": id_municipio,
                        "vereador_id": uuid_por_id_externo.get(cod),
                        "beneficiario": nome,
                        # A fonte é mensal, sem dia: a competência vira o
                        # dia 1º. Fingir um dia exato seria inventar.
                        "data": competencia,
                        "grupo_verba": celulas[1] or None,
                        "fornecedor": None,  # não publicado no detalhamento
                        "valor": valor,
                        "link_fonte": f"{base}{CAMINHO_CUSTEIO}",
                    }
                )
            time.sleep(PAUSA_DETALHE)
        print(f"{LOG} custeio {mes}: {len(alvos)} vereadores, {len(linhas)} despesas acumuladas")

    if not linhas:
        print(f"{LOG} custeio: nenhuma despesa no recorte — nada gravado (não apago o que já existe).")
        return 0

    # Conexão NOVA para escrever. A raspagem acima leva ~12 minutos (20 meses
    # × ~25 detalhamentos) e nesse intervalo o `client` recebido fica ocioso —
    # tempo suficiente para a Neon derrubar a sessão. Aconteceu ao vivo em
    # 2026-08-03: as 834 despesas foram todas coletadas e a rodada morreu no
    # primeiro SELECT da gravação com `AdminShutdown: terminating connection
    # due to administrator command`, jogando fora 12 minutos de raspagem.
    # Reconectar aqui custa milissegundos e é o que separa "coletou e gravou"
    # de "coletou e perdeu".
    client = get_supabase_client()
    gravou = refresh_completo_seguro(
        client,
        "verbas_indenizatorias",
        {"id_municipio": id_municipio},
        linhas,
        permitir_reducao=permitir_reducao,
        rotulo="etl.camaras.bh",
    )
    print(f"{LOG} custeio_gravado={len(linhas) if gravou else 0}")
    return len(linhas) if gravou else 0


# --------------------------------------------------------------------------


def sync(
    id_municipio: str,
    etapas: tuple[str, ...] = ETAPAS_VALIDAS,
    anos: list[int] | None = None,
    com_datas: bool = True,
    custeio_desde: str | None = None,
    permitir_reducao: bool = False,
) -> None:
    municipio = carregar_municipio(id_municipio)
    host = (municipio["fontes"] or {}).get("camara_host")
    if not host:
        raise RuntimeError(
            f"`municipios.fontes.camara_host` está vazio para {id_municipio} "
            f"({municipio['nome']}-{municipio['uf']}). O host da Câmara sai do banco, "
            "não do código — semeie a fonte antes de rodar."
        )
    base = host.rstrip("/")
    print(f"{LOG} {municipio['nome']}-{municipio['uf']} ({id_municipio}) em {base}")

    client = get_supabase_client()
    sessao = _sessao()

    if "vereadores" in etapas:
        sincronizar_vereadores(client, sessao, base, id_municipio)

    # `slug_fonte` do banco: as etapas seguintes precisam de um perfil
    # qualquer para ler o formulário de busca, e assim `--etapas proposicoes`
    # roda sozinho sem reraspar a lista.
    salvos = (
        client.table("vereadores")
        .select("slug_fonte, mandato_inicio, mandato_fim")
        .eq("id_municipio", id_municipio)
        .execute()
        .data
        or []
    )
    if not salvos:
        raise RuntimeError(
            "não há vereadores gravados para este município — rode a etapa 'vereadores' primeiro."
        )

    if anos is None:
        # A legislatura corrente é o maior período de mandato entre os 41.
        # Sai do dado, não de constante: na virada de 2028/2029 o recorte se
        # ajusta sozinho em vez de continuar coletando a legislatura velha.
        inicios = [int(s["mandato_inicio"][:4]) for s in salvos if s.get("mandato_inicio")]
        if not inicios:
            raise RuntimeError(
                "nenhum vereador tem `mandato_inicio` — sem isso não dá para deduzir a "
                "legislatura corrente; passe --anos explicitamente."
            )
        anos = list(range(max(inicios), date.today().year + 1))

    if "proposicoes" in etapas:
        referencia = next(s["slug_fonte"] for s in salvos if s.get("slug_fonte"))
        total = sincronizar_proposicoes(
            client, sessao, base, id_municipio, anos, referencia, com_datas=com_datas
        )
        print(f"{LOG} proposicoes_gravadas={total}")

    if "subsidios" in etapas:
        sincronizar_subsidios(client, sessao, base, id_municipio)

    if "custeio" in etapas:
        desde = custeio_desde or f"01/{min(anos)}"
        sincronizar_custeio(
            client, sessao, base, id_municipio, desde, permitir_reducao=permitir_reducao
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--etapas",
        default=",".join(ETAPAS_VALIDAS),
        help=f"quais blocos rodar, separados por vírgula: {', '.join(ETAPAS_VALIDAS)}",
    )
    parser.add_argument(
        "--anos",
        default=None,
        help="anos das proposições (ex.: 2025,2026). Sem isso, usa a legislatura corrente "
        "deduzida dos mandatos gravados.",
    )
    parser.add_argument(
        "--sem-datas",
        action="store_true",
        help="não busca `data_apresentacao` (uma requisição extra por proposição)",
    )
    parser.add_argument(
        "--custeio-desde",
        default=None,
        help="primeiro mês do custeio no formato MM/AAAA. Sem isso, janeiro do primeiro "
        "ano da legislatura corrente.",
    )
    parser.add_argument(
        "--permitir-reducao",
        action="store_true",
        help="grava o custeio mesmo trazendo menos linhas que o banco já tem (use só "
        "depois de confirmar na fonte que os registros sumiram)",
    )
    args = parser.parse_args()

    etapas = tuple(e.strip() for e in args.etapas.split(",") if e.strip())
    invalidas = [e for e in etapas if e not in ETAPAS_VALIDAS]
    if invalidas:
        print(f"{LOG} etapa desconhecida: {invalidas} (válidas: {list(ETAPAS_VALIDAS)})", file=sys.stderr)
        sys.exit(1)

    try:
        sync(
            args.id_municipio,
            etapas=etapas,
            anos=[int(a) for a in args.anos.split(",")] if args.anos else None,
            com_datas=not args.sem_datas,
            custeio_desde=args.custeio_desde,
            permitir_reducao=args.permitir_reducao,
        )
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
