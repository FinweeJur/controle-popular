"""etl.camaras.sp — vereadores, comissões, produção legislativa e verba de
gabinete da Câmara Municipal de São Paulo (id_municipio 3550308).

    python -m etl.camaras.sp --id-municipio 3550308
    python -m etl.camaras.sp --id-municipio 3550308 --partes proposicoes
    python -m etl.camaras.sp --id-municipio 3550308 --partes comissoes
    python -m etl.camaras.sp --id-municipio 3550308 --desde-ano 2025 --ate-ano 2026

FONTES (todas verificadas ao vivo em 2026-08-03):

1. WordPress REST da CMSP — https://www.saopaulo.sp.leg.br/wp-json/wp/v2/vereador
   Cadastro do vereador. 191 posts (X-WP-Total), 2 páginas de 100.
1b. WordPress REST da CMSP — .../wp-json/wp/v2/comissao
   Catálogo E composição das comissões. 62 posts, uma página. Ver o bloco
   COMISSÕES abaixo.
2. SPLegis — https://splegisws.saopaulo.sp.leg.br/ws/ws2.asmx/{Operacao}
   Produção legislativa. 50 operações; as `*JSON` respondem a **GET puro**
   com `application/json` — não monte envelope SOAP.
3. XML do Auxílio-Encargos Gerais (verba de gabinete) —
   https://sisgvarmazenamento.blob.core.windows.net/prd/PublicacaoPortal/Arquivos/YYYYMM.xml
4. Deep link público de cada proposição —
   https://splegisconsulta.saopaulo.sp.leg.br/Pesquisa/DetailsDetalhado

O QUE COSTURA OS DOIS SISTEMAS. O WordPress e o SPLegis não compartilham
nome nem slug ("Zoe Martínez" x "ZOE MARTINEZ", e há SILVINHO LEITE ao lado
de SILVÃO LEITE). O que liga é o meta `_cmsp_vereador_consulta_splegis_id`
— a chave de *promovente* do SPLegis —, guardado em `vereadores.id_externo`
(migration 0028_vereador_id_externo, escrita para a CMBH e reaproveitada
aqui). Toda a ligação proposição→vereador é feita por essa chave numérica,
nunca por heurística de nome.

MIGRATIONS NECESSÁRIAS: 0028 (`vereadores.id_externo`), 0029 (chave natural
de `proposicoes`, que a 0007 descrevia e nunca rodou) e 0030
(`verbas_indenizatorias.cnpj_fornecedor`).

ARMADILHAS MEDIDAS (cada uma custou uma rodada errada antes de virar código):

* **Encoding.** `requests` adivinha o charset do SPLegis errado e devolve
  mojibake mesmo com `Content-Type: application/json; charset=utf-8`.
  `_ws()` força `r.encoding = "utf-8"` sempre.
* **403 no WordPress.** `/wp-json/` responde 403 para o User-Agent padrão do
  `requests` e 200 para um UA de navegador. Não é fingerprint de TLS (ao
  contrário da PBH, ver `etl/pbh/cliente.py`) — trocar o UA basta.
* **Os 191 vereadores incluem legislaturas passadas.** O recorte correto é
  `meta_all._cmsp_vereador_ativo == "on"`, que dá exatamente 55 (51
  titulares + 4 suplentes convocados). Os metas do WP vêm sempre como
  LISTA (`{"_cmsp_vereador_ativo": ["on"]}`) — comparar o campo direto com
  `"on"` filtra zero e passa despercebido.
* **O XML da verba é ANUAL, não mensal.** O nome do arquivo é `YYYYMM.xml`,
  mas `202605`, `202606`, `202607` e `202608` devolvem BYTE A BYTE o mesmo
  conteúdo: os 2.985 itens do ano de 2026 inteiro (jan–jun). O `MM` só muda
  o cabeçalho `<MesReferencia>`. Baixar "os últimos 12 meses" seria baixar
  12 vezes o mesmo arquivo de 2,3 MB — este módulo baixa **um por ano**.
* **`ProjetoResumoJSON` usa PascalCase** (`Ementa`, `Numero`, `Autores`)
  enquanto todo o resto do SPLegis usa camelCase. Este módulo não o usa
  (seriam 2.500 requisições); fica o registro para quem for estender.
* **`chave` vem `null`** em todos os endpoints por promovente. A chave
  natural utilizável é (tipo, numero, ano), e é ela que a migration 0029
  finalmente transformou em `proposicoes_id_municipio_tipo_numero_ano_key`.

RECORTE: legislatura 19 (2025–2028), começada em 2025 → coleta 2025 e 2026.
O limite é a ementa: ela só existe em bloco no índice `ProjetosPorAnoJSON`,
que custa 10,5 MB / 36 s por ano (51.342 registros em 2025). Voltar até 2013
para cobrir os projetos antigos que ainda tramitam seriam ~13 downloads
desses. `--desde-ano` abre esse recorte para quem aceitar o custo.

POR QUE `ProjetosEmTramitacaoPorPromoventeJSON` NÃO É CHAMADO: seriam 55
requisições para descobrir o que já se sabe — dentro do recorte, o índice
por ano é completo, e "em tramitação" é exatamente o complemento de
encerrados ∪ leis ∪ vetados. Fora do recorte, ele traria projetos (de 2013,
2017...) cuja ementa não temos como preencher.

COBERTURA MEDIDA: 2.541 proposições em 2025+2026, das quais 2.363 (93%)
têm ao menos um dos 55 vereadores ativos como autor. Os 7% restantes são
Executivo (RICARDO NUNES), Tribunal de Contas do Município, Mesa da Câmara,
comissões e 4 titulares hoje licenciados/afastados (SILVINHO LEITE, SILVÃO
LEITE, PASTORA SANDRA ALVES, PAULO FRANGE — não estão entre os 55 porque o
WP os marca com `_cmsp_vereador_licenciado: on` e `ativo` ausente). Esses
ficam com `vereador_id` nulo, mas o nome do autor é preservado em `autores`.

COMISSÕES — QUAL DAS DUAS FONTES, E POR QUÊ. Há dois caminhos, os dois
medidos ao vivo em 2026-08-03:

1. **SPLegis `VereadoresCMSPJSON`** (1,6 MB). Cada vereador traz
   `cargos: [{nome, inicio, fim, ente:{chave, nome}}]`, e o `ente` é a
   comissão — casável com `ComissoesCMSPJSON` (58 comissões) pela `chave`.
   É a base histórica desde 1992: 3.555 cargos de comissão.
2. **WordPress `wp/v2/comissao`** (62 posts, UM GET). O ACF de cada post
   traz `presidente`, `vice_presidente`, `relator` e `membros[]` — todos
   **IDs de post do tipo `vereador`** —, e o campo `parent` põe a comissão
   num dos ramos do menu público (`comissoes-do-processo-legislativo`,
   `comissoes-extraordinarias`, `comissoes-parlamentares-de-inquerito-cpis`,
   `comissoes-encerradas`).

ESCOLHIDO O 2, e o 1 fica como CONFERÊNCIA — mesma divisão de papéis que
`etl/camaras/comissoes_bh.py`. O que decidiu:

(a) **O catálogo do SPLegis está desatualizado.** `ComissoesCMSPJSON` não
    lista as duas CPIs instaladas em 2026 (CPI do Jockey Club e CPI do
    Metanol) — 16 participações que só existem no WP. E lista com `fim`
    nulo (= "em vigor") a CPI dos Fios e a CPI da Poluição Petroquímica,
    que o WP já move para `comissoes-encerradas`.
(b) **O `fim` do CARGO no SPLegis não fecha quando a comissão acaba.** Os
    12 membros do "Comitê Ext. das Chuvas e Enchentes" têm `fim` nulo
    embora a comissão tenha `fim` 2020-12-31; a "Comissão de Estudos SP
    Smart City" (encerrada em 2022) tem 11. Filtrar só por cargo aberto
    listaria gente de 2019 como membro atual — exatamente o dano que se
    quer evitar.
(c) **Identidade sem heurística de nome nos dois lados.** No WP a pessoa é
    um ID de post, e `vereadores.slug` NASCEU desse mesmo post (ver
    `_linha_vereador`) — o join é o próprio identificador da fonte.

O CRITÉRIO DE "EM VIGOR" é, portanto, ESTRUTURAL: comissão em vigor é a que
está pendurada num dos três ramos vivos do menu; o resto (34 filhos de
`comissoes-encerradas` + 2 órfãos de um nó de menu apagado) entra como
histórico, com `ativo=false` e `comissao_id` nulo, como em BH. Não se usa
data nenhuma porque a fonte não publica período: os ACF
`data_de_criacao_da_comissao` e `data_de_encerramento_da_comissao` estão
nulos nos 62 posts.

A CONFERÊNCIA contra o SPLegis usa o recorte que o SPLegis permite —
comissão com `fim` nulo/futuro, cargo aberto E iniciado dentro da
legislatura 19 (o corte por legislatura é o que descarta os resíduos do
item (b), inclusive dois cargos de 1995 em comissões-fantasma "CPI 1" e
"COMISSAO ESPECIAL DE ESTUDOS 1"). Casa comissão do WP com comissão do
SPLegis pelo ACF `cod_prvm_cmi`, que É a `chave` do SPLegis (preenchido em
8 dos 62 posts) e, na falta dele, por nome normalizado exato. Medido em
2026-08-03: das 18 comissões em vigor, 14 casaram e 11 bateram
participação por participação. As 3 divergências são de UMA pessoa cada:
em Finanças e em Saúde o WP mantém o titular licenciado (SILVINHO LEITE,
PASTORA SANDRA ALVES) onde o SPLegis já registra quem assumiu; na CPI dos
Devedores o WP lista ISAC FÉLIX e o SPLegis, DRA. SANDRA TADEU (cargo
aberto em 2026-05-25, depois da última edição do post). Nos três casos as
duas fontes discordam de UM nome em 7–9, e nenhuma delas é obviamente a
errada — por isso a conferência só imprime.

Duas comissões em vigor ficam SEM PAR na conferência e isso não é lacuna
de dado: "Comissão Extraordinária Inovação" e "EXTRA. RELAÇÕES
INTERNACIONAIS" são abreviações do SPLegis que não casam com o título do
WP nem têm `cod_prvm_cmi` — os membros delas estão gravados, só não foram
conferidos.

LACUNA CONHECIDA DE VERDADE: a "SUBCOMISSÃO DE CALÇADAS E MOBILIDADE A PÉ"
(3 membros, instalada em 2026-03) existe no SPLegis e NÃO tem post no WP —
o tipo `comissao` não publica subcomissão. Fica de fora, nomeada aqui e no
log, em vez de ser costurada por nome (o que exigiria casar "SUBCOMISSÃO DE
CALÇADAS..." com um título que não existe do outro lado).

ARMADILHA DO ACF: campo não preenchido volta como `False`, não como `None`
— e `isinstance(False, int)` é True em Python. Um teste ingênuo de inteiro
aceitaria `False` e criaria participação para o "post 0". Ver `_id_post`.
Também: `tipo_da_comissao` diz "Permanente" até para as três CPIs em vigor
(campo copiado, não classificação) — quem classifica é o `parent`.

NÃO COLETÁVEL: o subsídio individual do vereador. `/transparencia/
salarios-abertos/` exige CPF real num portão de autenticação — `subsidios`
fica vazia para São Paulo. Também confirmados mortos:
`/wp-json/custom/v1/agenda` (HTTP 500) e `/wp-json/v1/destaques` (401).

Cron: mensal (o cadastro muda pouco; proposições e verba podem ir a semanal
se o custo dos 45 s de índice por ano for aceitável).
"""

import argparse
import datetime as dt
import html
import re
import sys
import time
import unicodedata
from collections import defaultdict

import requests
from lxml import etree

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    PgAPIError,
    carregar_municipio,
    get_supabase_client,
    refresh_completo_seguro,
    upsert_com_colunas_opcionais,
)

TAG = "etl.camaras.sp"

WP_VEREADOR = "https://www.saopaulo.sp.leg.br/wp-json/wp/v2/vereador"
WP_COMISSAO = "https://www.saopaulo.sp.leg.br/wp-json/wp/v2/comissao"
WS = "https://splegisws.saopaulo.sp.leg.br/ws/ws2.asmx/"
VERBA_XML = "https://sisgvarmazenamento.blob.core.windows.net/prd/PublicacaoPortal/Arquivos/{ano}01.xml"
DETALHE = (
    "https://splegisconsulta.saopaulo.sp.leg.br/Pesquisa/DetailsDetalhado"
    "?COD_MTRA_LEGL={cod_tipo}&COD_PCSS_CMSP={numero}&ANO_PCSS_CMSP={ano}"
)

# Legislatura 19 da CMSP. Não é default de cidade (é o mandato em curso da
# câmara cuja fonte este módulo lê), mas também não é chute: a data de posse
# aparece em toda deliberação do SPLegis ("Legislatura 19 em 07/05/2026").
LEGISLATURA = {"numero": 19, "inicio": 2025, "fim": 2028, "ano_eleicao": 2024}

# `_tipo` de todo endpoint do SPLegis é FK para `TiposDeMateriaJSON`
# (1=PL, 2=PDL, 3=PR, 4=PLO). Os outros 40+ tipos são ruído administrativo:
# em 2025, DSP sozinho é 30.196 dos 51.342 registros do ano.
# O valor é o slug de `tipo` usado pelo app (ver TIPO_PROPOSICAO_LABELS em
# apps/web/lib/betim/vereadores.ts) — `projeto_decreto_legislativo` e
# `emenda_lei_organica` são novos, não existem em Betim.
TIPOS = {
    "PL": ("projeto_lei", 1),
    "PDL": ("projeto_decreto_legislativo", 2),
    "PR": ("projeto_resolucao", 3),
    "PLO": ("emenda_lei_organica", 4),
}

# O WP grava o partido como o usuário digitou. Betim já normaliza para a
# sigla oficial do TSE, e misturar "PARTIDO LIBERAL" com "PL" quebraria
# qualquer agregação por partido entre as duas cidades.
PARTIDO = {
    "PARTIDO LIBERAL": "PL",
    "UNIAO": "UNIÃO BRASIL",
    "UNIÃO": "UNIÃO BRASIL",
    "REDE": "REDE",
}

# `motivo` de `ProjetosEncerradosJSON` vem prefixado ("Encerrado-ARQUIVADO"),
# mas nem sempre ("APENSADO", "Devolução de Regularização"). Vocabulário real
# medido em 2025+2026; o fallback cobre valores novos sem perder o dado.
ENCERRAMENTO = {
    "PROMULGADO": "Promulgado",
    "ARQUIVADO": "Arquivado",
    "RETIRADO PELO AUTOR": "Retirado pelo autor",
    "REJEITADO": "Rejeitado",
    "APENSADO": "Apensado",
    "ILEGALIDADE (ART. 79 REG. INT.)": "Arquivado por ilegalidade",
    "RELATÓRIO FINAL PUBLICADO": "Relatório final publicado",
    "ENCERRAMENTO DE COMISSÕES TEMPORÁRIAS": "Comissão temporária encerrada",
}

YOUTUBE = {
    "canal": "TV Câmara São Paulo",
    "channel_id": "UCaMgnZ7WNHF5TYBuK0skD4w",
    "url": "https://www.youtube.com/@camarasaopaulo",
}
SESSOES = {
    "ordinarias": {"dias_semana": ["terca", "quarta", "quinta"], "hora": "15:00"},
    "fonte": "https://www.saopaulo.sp.leg.br/",
}

# Os três nós do menu de comissões do WP cujos FILHOS estão em vigor, e o
# `comissoes.especial` que cada ramo produz. Identificados por SLUG, não pelo
# id numérico do post: o slug é o caminho público (/comissao/<slug>/) e
# sobrevive a um nó recriado. Só a CPI é `especial` — as extraordinárias são
# permanentes no Regimento, e a tela reserva o bloco "Comissões especiais"
# para o que é "temporário e com propósito específico".
RAMOS_EM_VIGOR = {
    "comissoes-do-processo-legislativo": False,
    "comissoes-extraordinarias": False,
    "comissoes-parlamentares-de-inquerito-cpis": True,
}

# Campo do ACF -> `papel` gravado. A caixa é escolhida aqui porque a coluna
# vai CRUA para a tela (/[municipio]/camara/comissoes imprime `papel`), e as
# três cidades precisam escrever o mesmo rótulo.
# `coodernador` é typo do próprio ACF (não é `coordenador`); nunca veio
# preenchido nos 62 posts, mas ignorá-lo perderia a linha em silêncio no dia
# em que a Casa usar o campo.
PAPEIS_ACF = (
    ("presidente", "Presidente"),
    ("vice_presidente", "Vice-Presidente"),
    ("relator", "Relator"),
    ("coodernador", "Coordenador"),
)

# O SPLegis escreve "Vice-presidente"; o resto ("Presidente", "Relator",
# "Membro") já coincide. Só existe para a conferência não acusar divergência
# onde só há diferença de caixa.
PAPEL_SPLEGIS = {"Vice-presidente": "Vice-Presidente"}

PARTES_VALIDAS = ("vereadores", "comissoes", "proposicoes", "verbas", "fontes")

_SESSAO = requests.Session()
# 403 sem isto (ver docstring). Um UA de navegador basta — o WAF da CMSP não
# olha o handshake TLS.
_SESSAO.headers["User-Agent"] = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)


def _tentar(fn, tentativas: int = 4, espera: float = 3.0):
    """Retry linear. O SPLegis devolve 502/timeout esporádico nas operações
    grandes (o índice de 2025 são 10,5 MB gerados na hora)."""
    ultimo = None
    for i in range(tentativas):
        try:
            resp = fn()
            if resp.status_code == 200:
                return resp
            ultimo = RuntimeError(f"HTTP {resp.status_code}: {resp.text[:200]}")
        except Exception as e:  # timeout, reset de conexão
            ultimo = e
        time.sleep(espera * (i + 1))
    raise RuntimeError(f"falhou apos {tentativas} tentativas: {ultimo}")


def _ws(operacao: str, **params):
    """Uma operação do SPLegis por GET.

    Timeout de 300 s porque várias operações não paginam e montam o ano
    inteiro na resposta. `encoding = "utf-8"` é obrigatório: sem ele o
    `requests` adivinha e todo acento vira mojibake — silenciosamente,
    porque o JSON continua parseando.
    """
    resp = _tentar(lambda: _SESSAO.get(WS + operacao, params=params, timeout=300))
    resp.encoding = "utf-8"
    return resp.json()


def _sem_acento(texto: str) -> str:
    base = unicodedata.normalize("NFD", texto or "")
    base = "".join(c for c in base if unicodedata.category(c) != "Mn")
    return " ".join(base.upper().split())


def _meta(post: dict, chave: str) -> str | None:
    """Um meta do WP. Todos vêm como lista de um elemento."""
    valor = (post.get("meta_all") or {}).get(chave)
    if isinstance(valor, list):
        valor = valor[0] if valor else None
    valor = (valor or "").strip()
    # "null"/"Null" é como o CMSP grava campo não preenchido em vários metas
    # (bloco, posição na mesa). Tratar como texto criaria vereador do partido
    # "null".
    return None if not valor or valor.lower() == "null" else valor


# ---------------------------------------------------------------- vereadores


def _baixar_wp(url: str, campos: str | None = None) -> list[dict]:
    """Todas as páginas de um custom post type do WP da CMSP.

    `campos` vira `_fields`, que o WP honra inclusive para `meta_all`: o
    cadastro completo dos 191 vereadores são 2,1 MB, e `id,slug,meta_all`
    derruba para 0,6 MB — vale para `sync_comissoes`, que só precisa do
    mapa post→slug.
    """
    posts: list[dict] = []
    pagina = 1
    while True:
        params = {"per_page": 100, "page": pagina}
        if campos:
            params["_fields"] = campos
        resp = _tentar(lambda p=dict(params): _SESSAO.get(url, params=p, timeout=180))
        resp.encoding = "utf-8"
        lote = resp.json()
        if not lote:
            break
        posts.extend(lote)
        total_paginas = int(resp.headers.get("X-WP-TotalPages") or 0)
        if (total_paginas and pagina >= total_paginas) or len(lote) < 100:
            break
        pagina += 1
    return posts


def _baixar_vereadores(campos: str | None = None) -> list[dict]:
    return _baixar_wp(WP_VEREADOR, campos)


def _linha_vereador(id_municipio: str, post: dict) -> dict:
    titulo = html.unescape((post.get("title") or {}).get("rendered") or "").strip()
    biografia = _meta(post, "_cmsp_vereador_biografia") or _meta(post, "_cmsp_vereador_biography")
    if biografia:
        biografia = html.unescape(biografia).replace("\r\n", "\n").strip()
    partido = (_meta(post, "_cmsp_vereador_party") or "").upper()
    return {
        "id_municipio": id_municipio,
        # O slug do WP já é o mesmo da URL pública do vereador na CMSP
        # (`/vereador/keit-lima/`), então `/vereadores/[slug]` no nosso portal
        # aponta para a mesma pessoa que o site oficial — melhor do que
        # re-derivar do nome como em Betim, onde não havia slug na fonte.
        "slug": post["slug"],
        "nome": _meta(post, "_cmsp_vereador_nome_completo") or titulo,
        "nome_urna": _meta(post, "_cmsp_vereador_name") or titulo,
        "partido": PARTIDO.get(partido, partido) or None,
        "cargo_mesa": _meta(post, "_cmsp_vereador_mesa-diretora-posicao"),
        "foto_url": _meta(post, "_cmsp_vereador_image"),
        "email": _meta(post, "_cmsp_vereador_contato_email"),
        "biografia": biografia,
        # Em São Paulo o caminho da fonte e o slug do portal coincidem (o WP
        # já publica ASCII sem acento), ao contrário da CMBH, onde a coluna
        # nasceu — mas gravar mesmo assim mantém "volte à fonte" uniforme
        # entre as cidades em vez de virar um caso especial no app.
        "slug_fonte": post["slug"],
        "ativo": True,
        "mandato_inicio": f"{LEGISLATURA['inicio']}-01-01",
        "mandato_fim": f"{LEGISLATURA['fim']}-12-31",
        "ano_eleicao": LEGISLATURA["ano_eleicao"],
        "id_externo": _meta(post, "_cmsp_vereador_consulta_splegis_id"),
    }


def sync_vereadores(client, id_municipio: str) -> list[dict]:
    posts = _baixar_vereadores()
    ativos = [p for p in posts if _meta(p, "_cmsp_vereador_ativo") == "on"]
    print(f"[{TAG}] wp_posts={len(posts)} ativos={len(ativos)}")
    if not ativos:
        raise RuntimeError(
            "nenhum vereador com _cmsp_vereador_ativo=on — o WP mudou o nome do "
            "meta ou o filtro parou de casar; abortando para nao desativar a "
            "camara inteira em silencio"
        )

    linhas = [_linha_vereador(id_municipio, p) for p in ativos]
    sem_chave = [x["slug"] for x in linhas if not x["id_externo"]]
    if sem_chave:
        # Sem a chave do SPLegis o vereador existe mas fica órfão de
        # produção legislativa. Avisar alto em vez de deixar a contagem de
        # proposições parecer "esse vereador não propôs nada".
        print(f"[{TAG}] AVISO: sem _cmsp_vereador_consulta_splegis_id: {sem_chave}")

    # `id_externo`/`slug_fonte` chegaram na 0028; se a migration ainda não
    # rodou, o helper regrava sem elas em vez de derrubar o cadastro inteiro
    # (e `sync_proposicoes` aborta depois, com mensagem própria).
    upsert_com_colunas_opcionais(
        client,
        "vereadores",
        linhas,
        ["id_externo", "slug_fonte"],
        on_conflict="id_municipio,slug",
    )
    print(f"[{TAG}] vereadores gravados={len(linhas)}")
    return linhas


def _mapa_promovente(client, id_municipio: str) -> dict[int, str]:
    """{chave do promovente no SPLegis -> uuid do vereador}."""
    linhas = (
        client.table("vereadores")
        .select("id, id_externo")
        .eq("id_municipio", id_municipio)
        .execute()
        .data
        or []
    )
    mapa = {}
    for linha in linhas:
        bruto = (linha.get("id_externo") or "").strip()
        if bruto.isdigit():
            mapa[int(bruto)] = linha["id"]
    return mapa


# ---------------------------------------------------------------- comissoes


def _id_post(valor) -> int | None:
    """O ID de post que um campo do ACF aponta, ou None.

    ARMADILHA: campo não preenchido volta como `False` (não `None`, não
    `''` — os três aparecem, a depender do post), e em Python
    `isinstance(False, int)` é True. Um teste ingênuo de inteiro aceitaria
    `False`, que vale 0, e o módulo criaria participação para o "post 0" —
    sem erro, porque 0 simplesmente não casa com vereador nenhum e a linha
    sumiria no contador de "sem vereador".
    """
    return valor if isinstance(valor, int) and not isinstance(valor, bool) and valor > 0 else None


def _titulo_comissao(post: dict) -> str:
    bruto = html.unescape((post.get("title") or {}).get("rendered") or "")
    return " ".join(bruto.split())


def _composicao_wp(post: dict) -> list[tuple[int, str]]:
    """[(id do post do vereador, papel)] de um post de comissão.

    Os cargos nomeados vêm antes de `membros[]`: a mesma pessoa pode
    aparecer nos dois (medido: em "CPI da Condição de Vulnerabilidade das
    Mulheres" o post 47618 é vice-presidente E relator), e a ordem fixa
    torna a saída determinística.
    """
    acf = post.get("acf") or {}
    saida: list[tuple[int, str]] = []
    for campo, papel in PAPEIS_ACF:
        alvo = _id_post(acf.get(campo))
        if alvo:
            saida.append((alvo, papel))
    membros = acf.get("membros")
    if isinstance(membros, list):
        for alvo in membros:
            if _id_post(alvo):
                saida.append((alvo, "Membro"))
    elif membros:
        # `membros` só deveria ser lista (relationship do ACF) ou vazio.
        # Qualquer outra coisa é mudança de configuração do campo: avisar
        # alto, porque ignorar calado apagaria a comissão inteira do card.
        print(f"[{TAG}] AVISO: `membros` de '{_titulo_comissao(post)}' nao e lista: {membros!r}")
    return saida


def _ramos_e_containers(posts: list[dict]) -> tuple[dict[int, bool], set[int]]:
    """({id do nó em vigor: especial}, {ids que são nó de menu}).

    Nó de menu é quem tem filho — regra estrutural, não lista fixa. Importa
    porque esses nós têm ACF sujo: `:: Comissões Extraordinárias` traz um
    `presidente` de legislatura passada, e gravá-lo criaria uma "comissão"
    chamada ":: Comissões Extraordinárias" no catálogo.
    """
    por_id = {p["id"]: p for p in posts}
    containers = {p["parent"] for p in posts if p.get("parent") and p["parent"] in por_id}
    ramos: dict[int, bool] = {}
    for slug, especial in RAMOS_EM_VIGOR.items():
        alvo = next((p for p in posts if p.get("slug") == slug), None)
        if alvo is None:
            raise RuntimeError(
                f"o no de menu '{slug}' nao existe mais em {WP_COMISSAO} — o ramo que "
                "define o que esta EM VIGOR sumiu. Abortando: sem ele o modulo marcaria "
                "como encerradas todas as comissoes daquele ramo."
            )
        if alvo["id"] not in containers:
            raise RuntimeError(
                f"o no '{slug}' (post {alvo['id']}) nao tem nenhuma comissao pendurada. "
                "Ou a Casa esvaziou o ramo, ou o `parent` mudou de significado — confira "
                "antes de gravar, porque seguir zeraria a composicao dessas comissoes."
            )
        ramos[alvo["id"]] = especial
    return ramos, containers


def _participacoes_splegis(hoje: str) -> dict[int, tuple[str, set[tuple[int, str]]]]:
    """{chave da comissão: (nome, {(chave do vereador, papel)})} — só o que o
    SPLegis considera em vigor HOJE. Usado apenas para conferir.

    Três filtros, cada um por um motivo medido (ver o bloco COMISSÕES no
    docstring do módulo):
    - comissão com `fim` nulo ou futuro (a comissão acabou? acabou tudo);
    - cargo já iniciado e com `fim` nulo ou futuro;
    - cargo iniciado DENTRO da legislatura em curso — sem isto entram os
      cargos que a Casa nunca fechou, inclusive dois de 1995.
    """
    comissoes = {c["chave"]: c for c in _ws("ComissoesCMSPJSON") if c.get("chave")}
    vivas = {k: c for k, c in comissoes.items() if not c.get("fim") or c["fim"][:10] >= hoje}
    inicio_legislatura = f"{LEGISLATURA['inicio']}-01-01"

    saida: dict[int, tuple[str, set[tuple[int, str]]]] = {}
    for pessoa in _ws("VereadoresCMSPJSON"):
        for cargo in pessoa.get("cargos") or []:
            ente = cargo.get("ente") or {}
            comissao = vivas.get(ente.get("chave"))
            if comissao is None:
                continue  # comissão morta, ou o ente é a Mesa da Câmara
            inicio = (cargo.get("inicio") or "")[:10]
            fim = (cargo.get("fim") or "")[:10]
            if not inicio or inicio > hoje or inicio < inicio_legislatura:
                continue
            if fim and fim < hoje:
                continue
            papel = PAPEL_SPLEGIS.get(cargo.get("nome") or "", cargo.get("nome") or "")
            saida.setdefault(ente["chave"], (comissao["nome"], set()))[1].add(
                (pessoa["chave"], papel)
            )
    return saida


def _conferir_comissoes(em_vigor_wp: list[tuple[dict, set[tuple[int, str]]]]) -> None:
    """Compara a composição do WP com a do SPLegis e IMPRIME o resultado.

    Nunca grava nem aborta: as duas fontes divergem por motivo legítimo (o
    WP mantém o titular licenciado onde o SPLegis já pôs o suplente), e
    transformar isso em erro pararia a carga toda por causa de uma linha.
    O que se quer é que a divergência apareça — se um dia crescer, o log
    mostra qual comissão e qual pessoa.
    """
    try:
        splegis = _participacoes_splegis(dt.date.today().isoformat())
    except RuntimeError as e:
        print(f"[{TAG}] AVISO: conferencia com o SPLegis nao rodou ({e})")
        return

    por_nome = {_sem_acento(nome): chave for chave, (nome, _) in splegis.items()}
    casadas, iguais, usadas = 0, 0, set()
    for post, participacoes in em_vigor_wp:
        acf_codigo = str((post.get("acf") or {}).get("cod_prvm_cmi") or "").strip()
        # `cod_prvm_cmi` É a `chave` do SPLegis (conferido nos 8 posts em que
        # a Casa preencheu). O nome normalizado é o plano B, e só bate
        # EXATO: o SPLegis abrevia ("COM. EXT. DO IDOSO E DE ASSIST.
        # SOCIAL") e casar por prefixo/semelhança inventaria par.
        chave = int(acf_codigo) if acf_codigo.isdigit() else por_nome.get(
            _sem_acento(_titulo_comissao(post))
        )
        if chave not in splegis:
            continue
        usadas.add(chave)
        casadas += 1
        esperado = splegis[chave][1]
        if esperado == participacoes:
            iguais += 1
            continue
        print(
            f"[{TAG}] conferencia: '{_titulo_comissao(post)}' difere do SPLegis — "
            f"so no WP {sorted(participacoes - esperado)}, so no SPLegis "
            f"{sorted(esperado - participacoes)} (chave do vereador no SPLegis)"
        )
    print(
        f"[{TAG}] conferencia SPLegis: {casadas}/{len(em_vigor_wp)} comissoes casadas, "
        f"{iguais} identicas participacao a participacao"
    )
    orfas = [f"{nome} ({chave})" for chave, (nome, _) in splegis.items() if chave not in usadas]
    if orfas:
        # Esperado: o SPLegis publica subcomissão (que o tipo `comissao` do
        # WP não tem) e nomeia as extraordinárias de forma abreviada demais
        # para casar por nome. Não é lacuna de dado por si só — é o que
        # ficou sem par.
        print(f"[{TAG}] conferencia: {len(orfas)} comissao(oes) do SPLegis sem par no WP: {orfas}")


def sync_comissoes(client, id_municipio: str, permitir_reducao: bool = False) -> int:
    # `meta_all` entra só por causa da conferência: o WP identifica a pessoa
    # pelo id do post e o SPLegis pela `chave` de promovente, e o meta
    # `_cmsp_vereador_consulta_splegis_id` é a única coisa que liga as duas
    # (é o mesmo valor que `sync_vereadores` grava em `vereadores.id_externo`).
    posts_vereador = _baixar_vereadores(campos="id,slug,meta_all")
    slug_por_post = {p["id"]: p["slug"] for p in posts_vereador}
    chave_por_post: dict[int, int] = {}
    for p in posts_vereador:
        bruto = _meta(p, "_cmsp_vereador_consulta_splegis_id") or ""
        if bruto.isdigit():
            chave_por_post[p["id"]] = int(bruto)

    vereadores = (
        client.table("vereadores")
        .select("id, slug")
        .eq("id_municipio", id_municipio)
        .execute()
        .data
        or []
    )
    if not vereadores:
        raise RuntimeError(
            "nenhum vereador gravado para este municipio — rode "
            "`--partes vereadores` antes (a composicao e ligada por post do "
            "WordPress, e o slug do post e o mesmo `vereadores.slug`)"
        )
    uuid_por_slug = {v["slug"]: v["id"] for v in vereadores}

    posts = _baixar_wp(WP_COMISSAO, campos="id,slug,parent,title,acf")
    ramos, containers = _ramos_e_containers(posts)
    em_vigor = [p for p in posts if p.get("parent") in ramos and p["id"] not in containers]
    historico = [p for p in posts if p.get("parent") not in ramos and p["id"] not in containers]
    print(
        f"[{TAG}] comissoes no WP: {len(posts)} posts, {len(containers)} nos de menu, "
        f"{len(em_vigor)} em vigor, {len(historico)} fora dos ramos vivos"
    )
    if not em_vigor:
        raise RuntimeError(
            "nenhuma comissao pendurada nos ramos em vigor — nao vou reescrever o "
            "catalogo com nada, isso zeraria /sp/camara/comissoes."
        )

    # Por vereador, e não por comissão: a gravação é um refresh total por
    # pessoa (ver mais abaixo o porquê), então o conjunto precisa nascer
    # agrupado assim. A chave interna (nome, papel) deduplica — sem data, duas
    # linhas iguais são indistinguíveis e o índice único não pega (NULL nunca
    # colide com NULL no Postgres).
    por_vereador: dict[str, dict[tuple[str, str], dict]] = defaultdict(dict)
    catalogo: dict[str, bool] = {}
    perdidas_em_vigor: dict[str, list[str]] = defaultdict(list)
    perdidas_historico = 0
    conferencia: list[tuple[dict, set[tuple[int, str]]]] = []

    for post, ativo in [(p, True) for p in em_vigor] + [(p, False) for p in historico]:
        nome = _titulo_comissao(post)
        composicao = _composicao_wp(post)
        if ativo:
            # A conferência fala a língua do SPLegis (chave de promovente).
            # Post sem essa chave vira `("post", id)` de propósito: aparece
            # como divergência em vez de sumir do conjunto e fingir acordo.
            conferencia.append(
                (post, {(chave_por_post.get(pid, ("post", pid)), papel) for pid, papel in composicao})
            )
        for post_vereador, papel in composicao:
            uuid = uuid_por_slug.get(slug_por_post.get(post_vereador, ""))
            if not uuid:
                if ativo:
                    perdidas_em_vigor[
                        slug_por_post.get(post_vereador) or f"post {post_vereador}"
                    ].append(f"{nome} ({papel})")
                else:
                    perdidas_historico += 1
                continue
            if ativo:
                # Comissão em vigor só entra no catálogo se tem membro que
                # sabemos quem é — um card "Nenhum membro registrado" afirma
                # menos que a ausência (mesma regra de `comissoes_bh.py`).
                catalogo.setdefault(nome, ramos[post["parent"]])
            por_vereador[uuid][(nome, papel)] = {
                "id_municipio": id_municipio,
                "comissao_id": None,  # preenchido depois do upsert do catálogo
                "nome_comissao_bruto": nome,
                "vereador_id": uuid,
                "papel": papel,
                # A fonte não publica período nenhum (os dois ACF de data
                # vêm nulos nos 62 posts). Inventar `data_inicio` a partir
                # da data do post seria datar a comissão pela hora em que o
                # site foi atualizado.
                "data_inicio": None,
                "data_fim": None,
                "ativo": ativo,
            }

    if perdidas_historico:
        # Esperado e sem remédio: o histórico do WP alcança CPIs de 2016 e a
        # tabela só conhece os 55 vereadores em exercício. Uma linha só, para
        # a ordem de grandeza ficar visível sem poluir o log.
        print(
            f"[{TAG}] historico: {perdidas_historico} participacao(oes) de vereadores de "
            "legislaturas passadas ignoradas (nao estao no cadastro desta legislatura)"
        )
    if perdidas_em_vigor:
        # Este é o que dói: são os titulares LICENCIADOS. O WP os mantém na
        # comissão, mas eles não estão entre os 55 com
        # `_cmsp_vereador_ativo=on` e `comissao_membros.vereador_id` é NOT
        # NULL — a participação se perde. Nomear comissão e papel é o que
        # impede a perda de virar invisível (uma delas é uma vice-presidência).
        print(
            f"[{TAG}] AVISO: {sum(len(v) for v in perdidas_em_vigor.values())} participacao(oes) "
            f"EM VIGOR nao gravadas — titular licenciado, fora do cadastro de ativos:"
        )
        for slug, ondes in sorted(perdidas_em_vigor.items()):
            print(f"[{TAG}]   {slug}: {ondes}")

    if not catalogo:
        raise RuntimeError(
            "nenhuma comissao em vigor com membro conhecido — abortando para nao "
            "esvaziar o catalogo da cidade."
        )
    client.table("comissoes").upsert(
        [
            {"id_municipio": id_municipio, "nome": nome, "especial": especial}
            for nome, especial in sorted(catalogo.items())
        ],
        on_conflict="id_municipio,nome",
    ).execute()
    id_por_nome = {
        r["nome"]: r["id"]
        for r in (
            client.table("comissoes")
            .select("id, nome")
            .eq("id_municipio", id_municipio)
            .execute()
            .data
            or []
        )
    }
    print(
        f"[{TAG}] comissoes no catalogo={len(catalogo)} "
        f"(permanentes={sum(1 for e in catalogo.values() if not e)}, "
        f"cpis={sum(1 for e in catalogo.values() if e)})"
    )

    gravadas = puladas = 0
    for uuid, linhas_por_chave in por_vereador.items():
        linhas = list(linhas_por_chave.values())
        for linha in linhas:
            if linha["ativo"]:
                linha["comissao_id"] = id_por_nome.get(linha["nome_comissao_bruto"])
        # Refresh total POR VEREADOR, não upsert: `data_inicio`/`data_fim`
        # são nulos em toda linha e o índice único da tabela inclui os dois,
        # então o `ON CONFLICT` não deduplicaria nada e cada rodada
        # duplicaria a composição inteira. Um GET traz a composição de todas
        # as comissões de uma vez, então o conjunto de cada pessoa é
        # recomputável. `ao_reduzir="skip"` para que uma pessoa que saiu de
        # tudo não derrube a carga das outras 54.
        gravou = refresh_completo_seguro(
            client,
            "comissao_membros",
            {"id_municipio": id_municipio, "vereador_id": uuid},
            linhas,
            permitir_reducao=permitir_reducao,
            ao_reduzir="skip",
            rotulo=f"{TAG}/comissoes",
        )
        if gravou:
            gravadas += len(linhas)
        else:
            puladas += 1

    ativas = sum(1 for d in por_vereador.values() for r in d.values() if r["ativo"])
    print(
        f"[{TAG}] participacoes={gravadas} (em vigor={ativas}, historico={gravadas - ativas}) "
        f"vereadores={len(por_vereador)} pulados={puladas}"
    )

    # Comissão que sai de um ramo vivo deixa a linha do catálogo órfã — um
    # card permanente e vazio na tela. Some só quem saiu E não é referenciado
    # por ninguém; se um refresh foi pulado e ainda há referência, a linha
    # fica (conservador de propósito). Mesma limpeza de `comissoes_bh.py`.
    removidas = []
    for nome, comissao_id in id_por_nome.items():
        if nome in catalogo:
            continue
        referencias = (
            client.table("comissao_membros")
            .select("id", count="exact")
            .eq("comissao_id", comissao_id)
            .limit(1)
            .execute()
            .count
            or 0
        )
        if referencias:
            print(f"[{TAG}] '{nome}' saiu do ramo em vigor mas tem {referencias} membro(s) — mantida.")
            continue
        client.table("comissoes").delete().eq("id", comissao_id).execute()
        removidas.append(nome)
    if removidas:
        print(f"[{TAG}] comissoes removidas do catalogo={len(removidas)}: {removidas}")

    _conferir_comissoes(conferencia)
    return gravadas


# --------------------------------------------------------------- proposicoes


def _indice_do_ano(ano: int) -> dict[tuple[str, int], dict]:
    """(sigla, numero) -> registro com ementa e data, só dos 4 tipos que
    importam. Esta é a chamada cara do módulo (10,5 MB em 2025)."""
    bruto = _ws("ProjetosPorAnoJSON", Ano=ano)
    indice = {}
    for p in bruto:
        if p.get("tipo") in TIPOS:
            indice[(p["tipo"], p["numero"])] = p
    print(f"[{TAG}] indice {ano}: {len(bruto)} registros, {len(indice)} dos tipos relevantes")
    return indice


def _encerramentos_do_ano(ano: int) -> dict[tuple[str, int], str]:
    """(sigla, numero) -> situação normalizada.

    `ano` aqui é o ano do PROJETO, não o do encerramento: medido, os 257
    projetos de 2025 nesta lista têm 112 encerramentos já em 2026. Ou seja,
    consultar os anos do recorte cobre o recorte inteiro.
    """
    saida = {}
    for p in _ws("ProjetosEncerradosJSON", ano=ano):
        if p.get("tipo") not in TIPOS:
            continue
        motivo = (p.get("motivo") or "").strip()
        chave = motivo.split("Encerrado-", 1)[-1].strip()
        saida[(p["tipo"], p["numero"])] = ENCERRAMENTO.get(chave) or (chave.capitalize() or None)
    return saida


_DATA_DELIBERACAO = re.compile(r"em (\d{2}/\d{2}/\d{4})")


def _deliberacoes_do_ano(ano: int) -> dict[tuple[str, int], str]:
    """(sigla, numero) -> resultado da última deliberação.

    O `resultado` é uma frase corrida: "Aprovado com emendas em 2ª Discussão
    - Sessão Ordinária 91, Legislatura 19 em 04/12/2025." Guardamos só a
    parte antes do " - ".

    POR QUE NÃO COLAPSAR PARA "Aprovado": "Aprovado em 1ª Discussão" é o
    resultado mais comum (256 de 402 em 2025) e o projeto continua tramitando
    depois dele — marcar isso como "Aprovado" diria que virou norma. A frase
    inteira continua começando por "Aprovado"/"Rejeitado", então agrupar por
    prefixo segue funcionando para quem quiser o binário.
    """
    saida = {}
    for p in _ws("FasesDeDeliberacaoJSON", ano=ano):
        if p.get("tipo") not in TIPOS:
            continue
        melhor, melhor_data = None, None
        for d in p.get("deliberacoes") or []:
            frase = (d.get("resultado") or "").split(" - ")[0].strip().rstrip(".")
            if not frase:
                # Existem deliberações com o resultado em branco (" - Sessão
                # Extraordinária 52..."). Ignorar em vez de gravar vazio.
                continue
            m = _DATA_DELIBERACAO.search(d.get("resultado") or "")
            data = m.group(1)[::-1] if m else ""  # ordenável sem parsear
            if melhor is None or data >= (melhor_data or ""):
                melhor, melhor_data = frase, data
        if melhor:
            saida[(p["tipo"], p["numero"])] = melhor
    return saida


def _autorias(ano: int) -> dict[tuple[str, int], dict]:
    """(sigla, numero) -> registro com `autores[{chave, nome}]` e `leitura`.

    `ProjetosAutoresJSON` aceita `numero` VAZIO e devolve o par (ano, tipo)
    inteiro numa chamada — 8 requisições cobrem 2025+2026 nos 4 tipos, em vez
    de uma por projeto.
    """
    saida = {}
    for sigla in TIPOS:
        for p in _ws("ProjetosAutoresJSON", ano=ano, tipo=sigla, numero=""):
            saida[(p["tipo"], p["numero"])] = p
    return saida


def _leis_e_vetos(codigos: list[int]) -> tuple[set, dict]:
    """Percorre os 55 promoventes: (tipo, numero, ano) que viraram lei, e os
    vetados com o tipo de veto. São as duas únicas informações de situação que
    o SPLegis só publica por promovente — não há operação equivalente por ano.
    """
    leis: set[tuple[str, int, int]] = set()
    vetos: dict[tuple[str, int, int], str] = {}
    for codigo in codigos:
        for lei in _ws("LeisAprovadasPorPromoventeJSON", Codigo=codigo):
            pj = lei.get("projeto") or {}
            if pj.get("tipo") and pj.get("numero") and pj.get("ano"):
                leis.add((pj["tipo"], pj["numero"], pj["ano"]))
        for vetado in _ws("ProjetosVetadosPorPromoventeJSON", Codigo=codigo):
            nome = ((vetado.get("veto") or {}).get("nome") or "").strip()
            vetos[(vetado["tipo"], vetado["numero"], vetado["ano"])] = nome
    return leis, vetos


def _situacao(chave3, chave2, leis, vetos, encerrados, deliberacoes) -> str:
    """Precedência: virou lei > encerrado formalmente > vetado > última
    deliberação > tramitando. A lei vem primeiro porque é terminal; o veto,
    depois do encerramento, porque veto derrubado ainda gera lei."""
    veto = vetos.get(chave3)
    if chave3 in leis:
        return "Sancionado com veto parcial" if veto == "Veto Parcial" else "Sancionado"
    if chave2 in encerrados and encerrados[chave2]:
        return encerrados[chave2]
    if veto:
        return "Vetado" if veto != "Veto Parcial" else "Vetado parcialmente"
    if chave2 in deliberacoes:
        return deliberacoes[chave2]
    return "Em Trâmite"


def sync_proposicoes(client, id_municipio: str, anos: list[int]) -> int:
    uuid_por_promovente = _mapa_promovente(client, id_municipio)
    if not uuid_por_promovente:
        raise RuntimeError(
            "nenhum vereador com id_externo em `vereadores` — rode "
            "`--partes vereadores` antes (ou aplique a migration "
            "0028_vereador_id_externo.sql)"
        )
    leis, vetos = _leis_e_vetos(sorted(uuid_por_promovente))
    print(f"[{TAG}] leis_aprovadas={len(leis)} vetados={len(vetos)} (todos os anos)")

    linhas: dict[tuple, dict] = {}
    for ano in anos:
        indice = _indice_do_ano(ano)
        autorias = _autorias(ano)
        encerrados = _encerramentos_do_ano(ano)
        deliberacoes = _deliberacoes_do_ano(ano)

        # A união é de propósito: o índice do ano traz a ementa, o de autores
        # traz quem assina, e nem sempre um projeto aparece nos dois.
        for chave2 in set(indice) | set(autorias):
            sigla, numero = chave2
            slug_tipo, cod_tipo = TIPOS[sigla]
            registro = indice.get(chave2) or {}
            autoria = autorias.get(chave2) or {}
            autores = autoria.get("autores") or []
            vereador_id = None
            for autor in autores:
                vereador_id = uuid_por_promovente.get(autor.get("chave"))
                if vereador_id:
                    break
            # `data` (índice do ano) é a apresentação; `leitura` (autores) é a
            # leitura em plenário. Quase sempre iguais; a segunda é o fallback
            # para o projeto que aparece só num dos dois endpoints.
            data = registro.get("data") or autoria.get("leitura")
            linhas[(slug_tipo, numero, ano)] = {
                "id_municipio": id_municipio,
                "vereador_id": vereador_id,
                "tipo": slug_tipo,
                "numero": numero,
                "ano": ano,
                "ementa": (registro.get("ementa") or "").strip() or None,
                "situacao": _situacao(
                    (sigla, numero, ano), chave2, leis, vetos, encerrados, deliberacoes
                ),
                "data_apresentacao": (data or "")[:10] or None,
                "autores": [a.get("nome") for a in autores if a.get("nome")],
                "link_fonte": DETALHE.format(cod_tipo=cod_tipo, numero=numero, ano=ano),
            }

    valores = list(linhas.values())
    com_autor = sum(1 for x in valores if x["vereador_id"])
    sem_ementa = sum(1 for x in valores if not x["ementa"])
    print(
        f"[{TAG}] proposicoes={len(valores)} com_vereador={com_autor} sem_ementa={sem_ementa}"
    )

    # 11 colunas x 3000 linhas = 33 mil placeholders, dentro do teto de 65535
    # do Postgres. A dedupe já veio de graça pelo dict acima — ON CONFLICT não
    # pode tocar a mesma linha duas vezes na mesma instrução.
    LOTE = 3000
    for i in range(0, len(valores), LOTE):
        client.table("proposicoes").upsert(
            valores[i : i + LOTE], on_conflict="id_municipio,tipo,numero,ano"
        ).execute()
    return len(valores)


# -------------------------------------------------------------------- verbas


def _tem_coluna(client, tabela: str, coluna: str) -> bool:
    """`SELECT col FROM t LIMIT 1` estoura 42703 se a coluna não existe —
    funciona mesmo com a tabela vazia, ao contrário de olhar uma linha."""
    try:
        client.table(tabela).select(coluna).limit(1).execute()
        return True
    except PgAPIError as e:
        if e.code != "42703":
            raise
        return False


def _itens_verba(ano: int) -> list[dict]:
    resp = _tentar(lambda: _SESSAO.get(VERBA_XML.format(ano=ano), timeout=300))
    raiz = etree.fromstring(resp.content)
    itens = []
    for e in raiz.findall(".//TabelaPortalITEMREEMBOLSO"):
        itens.append({c.tag: (c.text or "").strip() for c in e})
    return itens


def sync_verbas(client, id_municipio: str, anos: list[int], permitir_reducao: bool) -> int:
    vereadores = (
        client.table("vereadores")
        .select("id, nome, nome_urna")
        .eq("id_municipio", id_municipio)
        .execute()
        .data
        or []
    )
    # O XML escreve o nome em caixa alta e sem padronizar acento; casar por
    # nome é aceitável AQUI (e só aqui) porque o arquivo não traz nenhum id.
    # Medido: 53 dos 70 nomes distintos casam; os 17 restantes são as 13
    # lideranças partidárias (que não são pessoa) e 4 titulares licenciados.
    uuid_por_nome = {}
    for v in vereadores:
        for candidato in (v.get("nome_urna"), v.get("nome")):
            if candidato:
                uuid_por_nome.setdefault(_sem_acento(candidato), v["id"])

    guarda_cnpj = _tem_coluna(client, "verbas_indenizatorias", "cnpj_fornecedor")
    if not guarda_cnpj:
        print(
            f"[{TAG}] AVISO: verbas_indenizatorias.cnpj_fornecedor nao existe "
            "(rode a migration 0030_verba_cnpj_fornecedor.sql) — gravando sem o CNPJ"
        )

    linhas: list[dict] = []
    nao_casaram: set[str] = set()
    for ano in anos:
        itens = _itens_verba(ano)
        print(f"[{TAG}] verba {ano}: {len(itens)} itens")
        for it in itens:
            beneficiario = it.get("VEREADOR") or ""
            vereador_id = uuid_por_nome.get(_sem_acento(beneficiario))
            if beneficiario and not vereador_id:
                nao_casaram.add(beneficiario)
            mes = int(it.get("MES") or 0) or 1
            linha = {
                "id_municipio": id_municipio,
                "vereador_id": vereador_id,
                "beneficiario": beneficiario or None,
                # O XML não tem dia, só ANO/MES — a competência vira o dia 1.
                "data": f"{int(it.get('ANO') or ano):04d}-{mes:02d}-01",
                "grupo_verba": it.get("DESPESA") or None,
                "fornecedor": it.get("FORNECEDOR") or None,
                "valor": float(it.get("VALOR") or 0),
                # URLMENSAL aponta para os comprovantes digitalizados daquele
                # gabinete naquele mês — o documento que sustenta o valor.
                "link_fonte": it.get("URLMENSAL") or None,
            }
            if guarda_cnpj:
                linha["cnpj_fornecedor"] = it.get("CNPJ") or None
            linhas.append(linha)

    if nao_casaram:
        print(f"[{TAG}] verba sem vereador_id: {len(nao_casaram)} nome(s) distintos")
    if not linhas:
        raise RuntimeError("XML da verba devolveu zero itens")

    # Refresh total protegido em vez de upsert: a unique da tabela é
    # (id_municipio, vereador_id, data, grupo_verba, fornecedor, valor) e
    # `vereador_id` é NULO em toda linha de liderança partidária — com NULL a
    # unique não casa nunca, então o upsert duplicaria essas linhas a cada
    # rodada. `refresh_completo_seguro` ainda se recusa a apagar se a fonte
    # encolher (ver o incidente de 2026-07-29 em etl/camaras/verbas.py).
    refresh_completo_seguro(
        client,
        "verbas_indenizatorias",
        {"id_municipio": id_municipio},
        linhas,
        chunk=2000,
        permitir_reducao=permitir_reducao,
        rotulo=TAG,
    )
    return len(linhas)


# -------------------------------------------------------------------- fontes


def sync_fontes(client, id_municipio: str, cidade: dict) -> None:
    """Grava canal do YouTube e horário das sessões em `municipios.fontes`.

    Read-modify-write do jsonb inteiro porque o adapter de `etl.common` não
    expõe o operador `||` do Postgres. Só duas chaves são tocadas; as demais
    são reescritas idênticas.
    """
    fontes = dict(cidade.get("fontes") or {})
    fontes["camara_youtube"] = YOUTUBE
    fontes["camara_sessoes"] = SESSOES
    client.table("municipios").update({"fontes": fontes}).eq(
        "id_municipio", id_municipio
    ).execute()
    print(f"[{TAG}] fontes atualizadas: camara_youtube, camara_sessoes")


# ---------------------------------------------------------------------- sync


def sync(
    id_municipio: str,
    desde_ano: int | None = None,
    ate_ano: int | None = None,
    partes: tuple[str, ...] = PARTES_VALIDAS,
    permitir_reducao: bool = False,
) -> None:
    cidade = carregar_municipio(id_municipio)
    host = str((cidade.get("fontes") or {}).get("camara_host") or "")
    if "saopaulo.sp.leg.br" not in host:
        # Mesma classe de defeito que `scripts/conferir_defaults_de_cidade.py`
        # existe para impedir: sem esta trava, `--id-municipio 3106705`
        # coletaria São Paulo e gravaria tudo sob Betim, sem erro nenhum.
        raise RuntimeError(
            f"id_municipio={id_municipio} ({cidade['nome']}) nao aponta para a CMSP "
            f"(fontes.camara_host={host!r}). Este modulo so serve Sao Paulo."
        )

    inicio = desde_ano or LEGISLATURA["inicio"]
    fim = ate_ano or min(dt.date.today().year, LEGISLATURA["fim"])
    if fim < inicio:
        raise RuntimeError(f"--ate-ano ({fim}) menor que --desde-ano ({inicio})")
    anos = list(range(inicio, fim + 1))
    print(f"[{TAG}] id_municipio={id_municipio} anos={anos} partes={list(partes)}")

    client = get_supabase_client()
    if "vereadores" in partes:
        sync_vereadores(client, id_municipio)
    if "comissoes" in partes:
        total = sync_comissoes(client, id_municipio, permitir_reducao)
        print(f"[{TAG}] participacoes em comissoes gravadas={total}")
    if "proposicoes" in partes:
        total = sync_proposicoes(client, id_municipio, anos)
        print(f"[{TAG}] proposicoes gravadas={total}")
    if "verbas" in partes:
        total = sync_verbas(client, id_municipio, anos, permitir_reducao)
        print(f"[{TAG}] verbas gravadas={total}")
    if "fontes" in partes:
        sync_fontes(client, id_municipio, cidade)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--desde-ano",
        type=int,
        default=None,
        help=f"Primeiro ano de proposicoes/verba (padrao: {LEGISLATURA['inicio']}, "
        "inicio da legislatura 19). Anos anteriores custam ~10 MB de indice cada.",
    )
    parser.add_argument("--ate-ano", type=int, default=None, help="Ultimo ano (padrao: ano atual).")
    parser.add_argument(
        "--partes",
        default=",".join(PARTES_VALIDAS),
        help="Subconjunto de " + "|".join(PARTES_VALIDAS) + " separado por virgula.",
    )
    parser.add_argument(
        "--permitir-reducao",
        action="store_true",
        help="grava mesmo que a fonte tenha menos itens que o banco (vale para a verba "
        "e para a composicao das comissoes; use so depois de conferir na fonte)",
    )
    args = parser.parse_args()
    escolhidas = tuple(p.strip() for p in args.partes.split(",") if p.strip())
    desconhecidas = [p for p in escolhidas if p not in PARTES_VALIDAS]
    if desconhecidas:
        print(f"[{TAG}] ABORT: parte desconhecida {desconhecidas}", file=sys.stderr)
        sys.exit(1)
    try:
        sync(
            args.id_municipio,
            desde_ano=args.desde_ano,
            ate_ano=args.ate_ano,
            partes=escolhidas,
            permitir_reducao=args.permitir_reducao,
        )
    except RuntimeError as e:
        print(f"[{TAG}] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
