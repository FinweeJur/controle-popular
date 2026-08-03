"""etl.camaras.sp — vereadores, produção legislativa e verba de gabinete da
Câmara Municipal de São Paulo (id_municipio 3550308).

    python -m etl.camaras.sp --id-municipio 3550308
    python -m etl.camaras.sp --id-municipio 3550308 --partes proposicoes
    python -m etl.camaras.sp --id-municipio 3550308 --desde-ano 2025 --ate-ano 2026

FONTES (todas verificadas ao vivo em 2026-08-03):

1. WordPress REST da CMSP — https://www.saopaulo.sp.leg.br/wp-json/wp/v2/vereador
   Cadastro do vereador. 191 posts (X-WP-Total), 2 páginas de 100.
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

PARTES_VALIDAS = ("vereadores", "proposicoes", "verbas", "fontes")

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


def _baixar_vereadores() -> list[dict]:
    posts: list[dict] = []
    pagina = 1
    while True:
        resp = _tentar(
            lambda p=pagina: _SESSAO.get(
                WP_VEREADOR, params={"per_page": 100, "page": p}, timeout=180
            )
        )
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
        help="grava a verba mesmo que a fonte tenha menos itens que o banco",
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
