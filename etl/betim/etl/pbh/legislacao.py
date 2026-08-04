"""etl.pbh.legislacao — leis, decretos e resoluções de Belo Horizonte a partir
do Diário Oficial do Município, para `atos_oficiais`.

    python -m etl.pbh.legislacao --id-municipio 3106200

FONTE: o DOM de BH (`https://dom-web.pbh.gov.br`) NÃO é só o PDF da edição.
Por trás do SPA em Vue existe uma API REST pública, sem autenticação, com
Elasticsearch por baixo, que expõe o diário **ato a ato**. Toda a
descoberta abaixo foi verificada ao vivo em 2026-08-03.

POR QUE NÃO AS OUTRAS FONTES (o caminho percorrido antes de chegar aqui):

- O **CKAN** da PBH (`ckan.pbh.gov.br`) responde 15 datasets para
  `q=decreto` e 60 para `q=legislacao`, mas nenhum é o acervo de leis e
  decretos: são receita/despesa (decretos citados como fundamento legal) e
  legislação urbanística (zoneamento). Não há dataset de legislação geral.
- O **GRP** (`grp.pbh.gov.br`) lista 13 procedimentos, todos de execução
  administrativa (contrato, licitação, folha, empenho...). Nenhum de ato
  normativo.
- A **CMBH** publica proposições (já em `etl/camaras/bh.py`), que são
  projetos em tramitação — coisa diferente de lei sancionada.

COMO A API É DESCOBERTA (e por que isto não amarra o módulo a BH). O host
do diário sai de `municipios.fontes.diario_oficial`; desse host se lê
`/env.json`, que é onde o SPA guarda `VUE_APP_URL_API`. Nada de BH fica
escrito aqui: outra cidade que rode o mesmo produto (é um sistema de
prateleira, com Swagger em `/docs/api-docs.json`) passa a funcionar só
semeando a fonte no banco.

ARMADILHAS MEDIDAS — cada uma destas custa uma rodada silenciosamente
errada, não uma exceção:

1. **A base da API é `{VUE_APP_URL_API}/api`, não a raiz.** Pedir
   `https://api-dom.pbh.gov.br/v1/categoriasato` devolve **HTTP 200** com o
   HTML da página do Swagger UI. Quem só checar o status code conclui que o
   endpoint existe e depois quebra no `.json()` — ou pior, trata como
   "sem dados".

2. **Os dois hosts estão atrás do mesmo WAF (GoCache) dos outros portais da
   PBH**: `requests` leva 403 "Acesso Bloqueado" tanto em
   `dom-web.pbh.gov.br/env.json` quanto em `api-dom.pbh.gov.br`. Daí este
   módulo viver em `etl/pbh/` e usar o transporte de `cliente.py`
   (`curl_cffi`, que reproduz o ClientHello do Chrome). Ver a docstring de
   `etl/pbh/cliente.py`.

3. **`termo` é obrigatório na busca e não aceita curinga.** `*`, `n` e `a`
   sozinhos devolvem `total: 0` — não erro. O termo que recupera o acervo
   inteiro é `"de"`, que está no conteúdo de qualquer ato em português.
   Conferido contra o contador oficial da própria API
   (`/v1/categoriasato` traz `qtd_atos`): 2.040/2.040 decretos,
   743/743 resoluções, 70/70 proposições de lei, 813/814 leis.

4. **`local_pesquisa=T` (título) subconta feio em algumas categorias.**
   Para RESOLUÇÃO devolve 77 dos 743 atos, porque o título de resolução de
   conselho ("RESOLUÇÃO CMAS-BH 054/2021") não tem a palavra "de". A busca
   tem de ser por CONTEÚDO (`C`). Uma rodada com `T` "termina bem" com 10%
   do acervo.

5. **`data_inicio`/`data_fim` exigem o formato `Y-m-d H:i`** (só a data dá
   HTTP 400) **e `data_fim` não pode estar no futuro** — pedir
   `2026-12-31 23:59` hoje é 400. Por isso a janela do ano corrente é
   fechada em `agora`.

6. **O `total` do Elasticsearch conta mais do que existe**: para LEI a
   busca anuncia 893 e há 813 atos distintos (o índice casa o mesmo ato por
   mais de um campo). Paginar até `len(coletados) >= total` roda páginas
   vazias para sempre; paginar até a página vir vazia é o certo.

7. **A EMENTA NÃO ESTÁ NA BUSCA.** O `_source` do hit traz só
   `titulo_ato`, órgão, categoria e edição. A ementa é o parágrafo que vem
   depois do título e antes da fórmula de promulgação, dentro do
   `conteudo_html` do ato — uma requisição a mais POR ATO
   (`/v1/edicoes/atos/{id}/publicado`, ~0,4s, ~20 KB). É o custo da
   rodada: ~3.700 atos, ~30 min.

8. **O recuo `margin-left: 2.36in` PARECE marcar a ementa e não marca.**
   Metade dos atos usa o mesmo `text-indent: 0.49in` do corpo. A extração
   é por POSIÇÃO (1º parágrafo que não é o título nem a fórmula de
   promulgação), não por estilo — ver `_extrair_ementa`.

RECORTE. `CATEGORIAS_PADRAO` fica nas categorias normativas. PORTARIA está
FORA de propósito: são 20.294 atos, cinco vezes tudo o mais somado, e o
grosso é "designa fiscal de contrato"/"designa gestor de parceria" — entraria
como ruído 5:1 sobre leis e decretos e afundaria o ranking por tema da
página. DELIBERAÇÃO também fica fora: 11% dos títulos não têm número
("DELIBERAÇÕES DECISÓRIAS CFCM") e o conteúdo é ata de sessão, não ato com
ementa. As duas entram por `--categorias` para quem quiser.

COBERTURA: o DOM eletrônico começa em 29/07/2021 — antes disso o diário era
só o PDF encadernado, sem ato a ato. O módulo não tem esse ano escrito no
código: ele anda para trás ano a ano até achar um ano inteiro vazio.
Portanto BH fica com 2021-2026, contra 1952-2026 de Betim; é o que a fonte
tem em forma estruturada, e é honesto dizer isso na página em vez de
inventar histórico.

Alvo: `atos_oficiais` (tipo, numero, ano, ementa, data_publicacao,
link_fonte, temas). Ementa classificada por `etl/temas.py`, a mesma regra
das proposições e dos contratos. Escrita por `refresh_completo_seguro` —
refresh total do município que se recusa a encolher a tabela. Cron: semanal.
"""

import argparse
import datetime as dt
import json
import re
import sys
import time
import unicodedata
from collections import Counter

from curl_cffi import requests as creq
from lxml import html as LH

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    refresh_completo_seguro,
)
from etl.pbh.cliente import _tentar
from etl.temas import classificar_texto

LOG = "[etl.pbh.legislacao]"

# Nomes como a própria API os escreve em `/v1/categoriasato`. Ficam por NOME
# e não por id: o id é interno do sistema e um mapa de ids congelado aqui
# silenciaria uma renumeração (a rodada seguiria "com sucesso" coletando
# outra categoria). Por nome, um rótulo que suma aborta com mensagem.
CATEGORIAS_PADRAO = ("DECRETO", "LEI", "PROPOSIÇÃO DE LEI", "RESOLUÇÃO")

# Rótulo da categoria na fonte -> valor de `atos_oficiais.tipo`.
# Caixa alta é como o DOM grava; o resto do projeto (Betim) usa Title Case
# ("Decreto", "Lei Ordinária"), e a página monta o filtro de categoria a
# partir DESTA coluna — deixar "DECRETO" gritando ao lado de "Decreto"
# racharia o filtro se as duas cidades algum dia dividirem a mesma listagem.
TIPO_NO_BANCO = {
    "DECRETO": "Decreto",
    "LEI": "Lei",
    "PROPOSIÇÃO DE LEI": "Proposição de Lei",
    "RESOLUÇÃO": "Resolução",
    "PORTARIA": "Portaria",
    "DELIBERAÇÃO": "Deliberação",
    "ATO ADMINISTRATIVO": "Ato Administrativo",
    "INSTRUÇÃO NORMATIVA": "Instrução Normativa",
}

# Piso absoluto da varredura para trás. Não é a data de início de nenhuma
# cidade: é só a trava que impede um laço infinito se a fonte passar a
# responder algo não-vazio para qualquer ano.
ANO_PISO = 1980

PAUSA_BUSCA = 0.2
PAUSA_ATO = 0.1
POR_PAGINA = 100

# Fórmulas de promulgação e de corpo do ato. Se o candidato a ementa começa
# com uma destas, o ato NÃO tem ementa — é o caso dos decretos de crédito
# suplementar, cujo HTML começa direto no "Art. 1º". Devolver None ali é o
# comportamento certo: ementa inventada num portal de transparência é pior
# que ementa ausente.
_PREAMBULO = re.compile(
    r"^(?:"
    r"(?:o|a)\s+(?:prefeit|vice-prefeit|povo|camara|secretari|president|conselh|"
    r"diretor|subsecretari|controlador|procurador|chefe|coordenador|gerent|"
    r"superintendent|comiss|junta|administrador|assembleia)"
    r"|considerando|decreta|resolve|resolvem|promulga|faco saber|faz saber|"
    r"no uso|nos termos|no exercicio|art\s*\.|artigo\s|em cumprimento|"
    r"pelo presente|a camara municipal|o povo do municipio"
    r")",
    re.I,
)

# Ruído que a Casa põe como primeiro parágrafo quando reedita um ato.
_REEDICAO = re.compile(r"^(republicacao|retificacao|reedicao|errata)\b", re.I)

# "DECRETO Nº 19.679, DE 31 DE JULHO DE 2026." / "RESOLUÇÃO CMAS-BH Nº 088/2024"
# / "PROPOSIÇÃO DE LEI Nº 129/26 - RAZÕES DO VETO".
#
# `qualificador` é a sigla do colegiado que assina (CMAS-BH, CMDCA/BH, CAE/BH,
# SMASDH...). Ela NÃO é decoração: 61 pares (número, ano) de resolução se
# repetem em BH porque cada conselho numera a sua série do zero — sem a sigla,
# "Resolução 001/2021" seriam três atos diferentes com a mesma identidade na
# página. Por isso a sigla entra no `numero` gravado, não no `tipo` (que
# viraria uma lista de dezenas de rótulos no filtro).
# SEM `re.IGNORECASE`, de propósito. Com ele, o "Nº" do título — que o
# `_sem_acento` transforma em "No", porque NFKD decompõe o indicador ordinal
# "º" em "o" minúsculo — casava como sigla de colegiado, e o número gravado
# saía "CMDCA/BH No 256" em vez de "CMDCA/BH 256". Nenhum erro, só um número
# de ato com lixo dentro. A distinção maiúscula/minúscula é justamente o que
# separa a sigla ("CMDCA/BH") do resto da pontuação.
_TITULO = re.compile(
    r"^(?P<qualificador>(?:[A-ZÀ-Ý][A-ZÀ-Ý\-/\.]{1,19}\s+){0,3}?)"
    # "Nº", "N.º", "N°", "N" — e nada. O separador tem de aceitar ponto E
    # espaço em qualquer ordem: "CMI N.º 02/2021" existe.
    r"(?:[Nn][\s.]*[º°o]?[\s.]*)?"
    # Travessão solto entre o marcador e o número ("CMS/BH – 462/20",
    # "CMAS-BH Nº - 20/2023"): seis resoluções escrevem assim.
    r"[-–—]?\s*"
    r"(?P<numero>\d{1,3}(?:\.\d{3})+|\d+)"
    r"\s*(?:/\s*(?P<ano_barra>\d{2,4}))?"
)
_ANO_POR_EXTENSO = re.compile(r"\bde\s+(?:\d{1,2}[ºo°]?\s+de\s+)?[a-zç]+\s+de\s+(\d{4})", re.I)

# ESPÉCIE ESCONDIDA DENTRO DA CATEGORIA. A API classifica o ato pela categoria
# do Diário, e "Lei Ordinária" recebe também a Emenda à Lei Orgânica — que não
# é lei ordinária: altera a Lei Orgânica do Município, exige quórum
# qualificado e está acima da lei comum na hierarquia municipal. O parser
# genérico achava a palavra "LEI" no MEIO do título ("EMENDA À LEI ORGÂNICA Nº
# 43"), consumia só ela e deixava "ORGANICA" ser lida como sigla de colegiado:
# o ato entrou como `Lei` de número `ORGANICA 43`. Uma linha em 3.577 de BH — e
# a única em que o portal afirmava a espécie errada de uma norma, que é um
# defeito de outra ordem que um número feio.
#
# Casa por `search`, não `match`, porque o carimbo de reedição vem antes
# ("RETIFICAÇÃO* - EMENDA À LEI ORGÂNICA...").
ESPECIES_ESCONDIDAS: tuple[tuple[re.Pattern, str], ...] = (
    (re.compile(r"EMENDA\s+A\s+LEI\s+ORGANICA\b", re.I), "Emenda à Lei Orgânica"),
)


def _sem_acento(texto: str) -> str:
    t = unicodedata.normalize("NFKD", texto or "")
    return "".join(c for c in t if not unicodedata.combining(c))


def _espremer(texto: str) -> str:
    return re.sub(r"\s+", " ", (texto or "").replace("\xa0", " ")).strip()


# --------------------------------------------------------------------------
# Transporte
# --------------------------------------------------------------------------


class ClienteDOM:
    """Cliente da API do Diário Oficial, descoberto a partir do host do SPA.

    Guarda a base para não reler `env.json` a cada chamada e centraliza os
    cabeçalhos que o WAF cobra (`Referer`/`Origin` do próprio SPA).
    """

    def __init__(self, host_spa: str):
        self.host_spa = host_spa.rstrip("/")
        self.cabecalhos = {
            "Accept": "application/json, text/plain, */*",
            "Referer": f"{self.host_spa}/",
            "Origin": self.host_spa,
        }
        env = self._json_bruto(f"{self.host_spa}/env.json")
        api = (env.get("VUE_APP_URL_API") or "").rstrip("/")
        if not api:
            raise RuntimeError(
                f"{self.host_spa}/env.json não traz `VUE_APP_URL_API` — este host não é "
                "um DOM-web do mesmo produto. Confira `municipios.fontes.diario_oficial`."
            )
        # Armadilha 1 do docstring: a raiz devolve 200 com o Swagger UI.
        self.base = f"{api}/api"

    def _json_bruto(self, url: str, params=None) -> dict:
        resp = _tentar(
            lambda: creq.get(
                url, params=params, headers=self.cabecalhos, impersonate="chrome", timeout=120
            )
        )
        try:
            return resp.json()
        except Exception as e:  # noqa: BLE001
            raise RuntimeError(
                f"{url} respondeu 200 mas não é JSON ({e}). Se o corpo for HTML de Swagger, "
                "a base da API está sem o sufixo `/api`."
            ) from e

    def get(self, caminho: str, params=None) -> dict:
        corpo = self._json_bruto(f"{self.base}{caminho}", params)
        if not corpo.get("success"):
            raise RuntimeError(f"{caminho} devolveu success=false: {str(corpo)[:300]}")
        return corpo.get("data")

    def categorias(self) -> dict[str, dict]:
        return {c["nome_categoria"]: c for c in (self.get("/v1/categoriasato") or [])}

    def buscar_atos(self, categoria_id: int, inicio: str, fim: str) -> dict[int, dict]:
        """Todos os atos publicados de uma categoria numa janela de datas.

        Devolve `{ato_id: _source}` — o dicionário já deduplica os hits
        repetidos que inflam o `total` (armadilha 6).
        """
        achados: dict[int, dict] = {}
        pagina = 1
        while True:
            params = [
                ("termo", "de"),  # armadilha 3
                ("pesquisa_exata", "false"),
                ("documentos[]", "A"),
                ("local_pesquisa[]", "C"),  # armadilha 4
                ("categoria_ato_id", str(categoria_id)),
                ("data_inicio", inicio),
                ("data_fim", fim),
                ("paginacao", json.dumps({"pagina": pagina, "itens_por_pagina": POR_PAGINA})),
            ]
            dados = self.get("/v1/edicoes/atos/pesquisar", params)
            hits = ((dados or {}).get("hits") or {}).get("hits") or []
            if not hits:
                return achados
            for h in hits:
                fonte = h.get("_source") or {}
                ato = fonte.get("ato") or {}
                if ato.get("id"):
                    achados[ato["id"]] = fonte
            pagina += 1
            time.sleep(PAUSA_BUSCA)

    def conteudo_do_ato(self, ato_id: int) -> str | None:
        dados = self.get(f"/v1/edicoes/atos/{ato_id}/publicado") or {}
        return dados.get("conteudo_html")


# --------------------------------------------------------------------------
# Extração
# --------------------------------------------------------------------------


def _paragrafos(conteudo_html: str) -> list[str]:
    doc = LH.fromstring(conteudo_html)
    saida = [t for t in (_espremer(p.text_content()) for p in doc.xpath("//p")) if t]
    if not saida:
        # Ato montado só com tabela ou <div> — raro, mas existe.
        inteiro = _espremer(doc.text_content())
        if inteiro:
            saida = [inteiro]
    return [t for t in saida if t not in ("*", "-", ".", "**")]


def _extrair_ementa(conteudo_html: str, nome_categoria: str) -> str | None:
    """A ementa é o 1º parágrafo que não é o título nem a promulgação.

    Extração por POSIÇÃO, não por estilo — ver armadilha 8. Só os três
    primeiros parágrafos são considerados: passar disso já é corpo do ato,
    e o que sairia dali seria um "Art. 1º" travestido de ementa.
    """
    cabeca = _sem_acento(nome_categoria).split()[0].upper()
    for bruto in _paragrafos(conteudo_html)[:3]:
        texto = _sem_acento(bruto)
        if _REEDICAO.match(texto) and len(texto) < 90:
            continue
        # Linha de título: começa com a palavra da categoria e traz número.
        if texto.upper().startswith(cabeca) and re.search(r"\d", texto[:80]):
            continue
        if _PREAMBULO.match(texto):
            return None
        return bruto
    return None


def _ano_do_titulo(m: re.Match, linha_sem_acento: str, ano_edicao: int) -> int:
    """Ano do ato: por extenso no título, senão o `/AA` do número, senão a
    edição. Ano absurdo cai para a edição — é o melhor que a fonte dá."""
    m_ext = _ANO_POR_EXTENSO.search(linha_sem_acento)
    if m_ext:
        ano = int(m_ext.group(1))
    elif m.group("ano_barra"):
        bruto = m.group("ano_barra")
        ano = int(bruto) if len(bruto) == 4 else 2000 + int(bruto)
    else:
        return ano_edicao
    return ano if ANO_PISO <= ano <= ano_edicao + 1 else ano_edicao


def _identificar(
    titulo_bruto: str, nome_categoria: str, ano_edicao: int
) -> tuple[str, int, str | None] | None:
    """`titulo_ato` -> (numero, ano, espécie). `None` quando não há número.

    A `espécie` é o `tipo` a gravar quando o título contradiz a categoria da
    fonte (ver `ESPECIES_ESCONDIDAS`); `None` quando a categoria vale.

    O TÍTULO PODE TER VÁRIAS LINHAS, E O LIXO CAI DOS DOIS LADOS. Há
    "RETIFICAÇÃO*\\n\\nLEI Nº 11.632, DE ..." (carimbo na frente) e
    "LEI Nº 11.812, DE 7 DE JANEIRO DE 2025.\\n\\nRAZÕES DO VETO PARCIAL"
    (carimbo atrás). Pegar sempre a primeira linha perde 9 leis; pegar
    sempre a última perde 10 proposições de lei e 2 resoluções. O critério
    que serve para os dois é a linha que CONTÉM o nome da categoria.

    Devolver `None` (em vez de gravar um ato sem número) é decisão: quem cai
    aqui são anexos publicados como ato próprio — "RAZÕES DO VETO",
    "HOMOLOGAÇÃO", "DESPACHOS" — documentos COMPANHEIROS de um ato que já
    está no acervo, não atos novos. Entrariam na página como "Lei (sem
    número)".
    """
    cabeca = _sem_acento(nome_categoria).split()[0].upper()
    palavras_cat = _sem_acento(nome_categoria).split()

    for linha in re.split(r"[\r\n]+", titulo_bruto or ""):
        sem_acento = _sem_acento(_espremer(linha))

        # Antes de tudo: o título pode nomear uma espécie que CONTÉM a
        # palavra da categoria sem ser ela.
        for padrao, especie in ESPECIES_ESCONDIDAS:
            m_esp = padrao.search(sem_acento)
            if not m_esp:
                continue
            m = _TITULO.match(sem_acento[m_esp.end():].strip())
            if m:
                return m.group("numero"), _ano_do_titulo(m, sem_acento, ano_edicao), especie

        # "REPUBLICAÇÃO * - DECRETO Nº 19.266, DE ..." — corta o carimbo que
        # vem antes do nome da categoria na MESMA linha.
        pos = sem_acento.upper().find(cabeca)
        if pos < 0:
            continue
        sem_acento = sem_acento[pos:]

        # Consome o nome da categoria, que pode ter mais de uma palavra
        # ("PROPOSIÇÃO DE LEI"), e sobra o que identifica o ato.
        resto = sem_acento
        for palavra in palavras_cat:
            m = re.match(rf"\s*{re.escape(palavra)}S?\b", resto, re.I)
            if not m:
                break
            resto = resto[m.end():]

        m = _TITULO.match(resto.strip())
        if not m:
            continue

        numero = m.group("numero")
        qualificador = _espremer(m.group("qualificador") or "")
        ano = _ano_do_titulo(m, sem_acento, ano_edicao)

        return (
            (f"{qualificador} {numero}".strip() if qualificador else numero),
            ano,
            None,
        )

    return None


# --------------------------------------------------------------------------
# Sync
# --------------------------------------------------------------------------


def _janelas(ano: int, agora: str) -> tuple[str, str]:
    """Janela do ano no formato que a API exige, sem invadir o futuro
    (armadilha 5)."""
    return f"{ano}-01-01 00:00", min(f"{ano}-12-31 23:59", agora)


def _coletar_indice(cliente: ClienteDOM, categorias: dict[str, dict], agora: str,
                    ano_ate: int) -> dict[int, tuple[str, dict]]:
    """`{ato_id: (nome_categoria, _source)}` de todos os anos com publicação.

    Anda para trás ano a ano e para no primeiro ano em que NENHUMA categoria
    tem ato — é assim que o início da série sai da fonte em vez de virar
    constante no código (o DOM eletrônico de BH começa em 2021, mas isso é
    fato da cidade, não deste módulo).
    """
    indice: dict[int, tuple[str, dict]] = {}
    ano = ano_ate
    while ano >= ANO_PISO:
        inicio, fim = _janelas(ano, agora)
        no_ano = 0
        for nome, cat in categorias.items():
            achados = cliente.buscar_atos(cat["id"], inicio, fim)
            no_ano += len(achados)
            for ato_id, fonte in achados.items():
                indice[ato_id] = (nome, fonte)
        print(f"{LOG} {ano}: {no_ano} atos (acumulado {len(indice)})", flush=True)
        if no_ano == 0:
            print(f"{LOG} {ano} vazio em todas as categorias — fim da série da fonte.")
            break
        ano -= 1
    return indice


def _linhas(cliente: ClienteDOM, indice: dict, id_municipio: str) -> list[dict]:
    por_chave: dict[tuple, dict] = {}
    sem_numero: list[str] = []
    sem_conteudo = 0
    sem_ementa = 0
    total = len(indice)

    for i, (ato_id, (nome_categoria, fonte)) in enumerate(sorted(indice.items()), 1):
        ato = fonte.get("ato") or {}
        edicao = fonte.get("edicao") or {}
        publicado_em = (edicao.get("dt_hr_publicacao") or "")[:10] or None
        ano_edicao = int(publicado_em[:4]) if publicado_em else dt.date.today().year

        identificado = _identificar(ato.get("titulo_ato") or "", nome_categoria, ano_edicao)
        if not identificado:
            sem_numero.append(f"{ato_id}:{_espremer(ato.get('titulo_ato') or '')[:60]}")
            continue
        numero, ano, especie = identificado

        try:
            conteudo = cliente.conteudo_do_ato(ato_id)
        except Exception as e:  # noqa: BLE001
            # Um ato que não abriu não pode derrubar a rodada inteira: a
            # gravação é refresh total, então perder o lote custaria o
            # acervo todo por causa de um GET de 20 KB.
            print(f"{LOG} AVISO: conteúdo do ato {ato_id} falhou ({type(e).__name__}) — sem ementa.")
            conteudo = None
        time.sleep(PAUSA_ATO)

        ementa = _extrair_ementa(conteudo, nome_categoria) if conteudo else None
        if not conteudo:
            sem_conteudo += 1
        if not ementa:
            sem_ementa += 1

        linha = {
            "id_municipio": id_municipio,
            "tipo": especie or TIPO_NO_BANCO.get(nome_categoria, nome_categoria.title()),
            "numero": numero,
            "ano": ano,
            "ementa": ementa,
            "data_publicacao": publicado_em,
            "link_fonte": f"{cliente.host_spa}/visualizacao/ato/{ato_id}",
            "temas": classificar_texto(ementa or ""),
        }

        # Retificação e republicação reeditam o MESMO ato dias depois, com o
        # mesmo número e ano (31 casos em decreto, 12 em lei). Fica a versão
        # mais antiga que tenha ementa: é a publicação original, e é a data
        # dela que o cidadão procura. Sem isto a página mostraria o mesmo
        # decreto duas vezes com datas diferentes.
        chave = (linha["tipo"], linha["numero"], linha["ano"])
        anterior = por_chave.get(chave)
        if anterior is None or _melhor(linha, anterior):
            por_chave[chave] = linha

        if i % 200 == 0:
            print(f"{LOG} conteúdos lidos: {i}/{total} (linhas únicas {len(por_chave)})", flush=True)

    if sem_numero:
        print(f"{LOG} {len(sem_numero)} atos sem número no título (anexos publicados como ato "
              f"próprio) — fora do acervo. Ex.: {sem_numero[:4]}")
    if sem_conteudo:
        print(f"{LOG} {sem_conteudo} atos sem `conteudo_html` na fonte.")
    print(f"{LOG} sem ementa extraível: {sem_ementa} de {total} atos lidos.")
    return list(por_chave.values())


def _melhor(candidato: dict, atual: dict) -> bool:
    """Entre duas publicações do mesmo (tipo, número, ano): quem tem ementa
    ganha; empatado, a mais antiga (a original, não a retificação)."""
    if bool(candidato["ementa"]) != bool(atual["ementa"]):
        return bool(candidato["ementa"])
    return (candidato["data_publicacao"] or "9999") < (atual["data_publicacao"] or "9999")


def sync(
    id_municipio: str,
    categorias: tuple[str, ...] = CATEGORIAS_PADRAO,
    permitir_reducao: bool = False,
) -> int:
    municipio = carregar_municipio(id_municipio)
    host = (municipio["fontes"] or {}).get("diario_oficial")
    if not host:
        raise RuntimeError(
            f"`municipios.fontes.diario_oficial` está vazio para {id_municipio} "
            f"({municipio['nome']}-{municipio['uf']}). O host do diário sai do banco, "
            "não do código — semeie a fonte antes de rodar."
        )
    print(f"{LOG} {municipio['nome']}-{municipio['uf']} ({id_municipio}) em {host}")

    cliente = ClienteDOM(host)
    print(f"{LOG} API do diário: {cliente.base}")

    catalogo = cliente.categorias()
    escolhidas = {}
    for nome in categorias:
        if nome not in catalogo:
            raise RuntimeError(
                f"categoria {nome!r} não existe em /v1/categoriasato neste diário. "
                f"Disponíveis (top 10 por volume): "
                f"{[c['nome_categoria'] for c in sorted(catalogo.values(), key=lambda x: -(x.get('qtd_atos') or 0))[:10]]}"
            )
        escolhidas[nome] = catalogo[nome]
    print(f"{LOG} categorias: "
          + ", ".join(f"{n} (fonte anuncia {c.get('qtd_atos')})" for n, c in escolhidas.items()))

    agora = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    indice = _coletar_indice(cliente, escolhidas, agora, dt.date.today().year)
    if not indice:
        raise RuntimeError(
            "a busca não devolveu nenhum ato em nenhum ano. Antes de concluir que o "
            "diário está vazio, confira o `termo` da busca: a API exige um e devolve "
            "`total: 0` (não erro) para curinga."
        )

    # A própria API publica quantos atos tem cada categoria. Comparar é a
    # única forma de saber se a varredura coletou tudo — sem isso uma
    # mudança na busca vira subcoleta silenciosa.
    coletados = Counter(nome for nome, _ in indice.values())
    for nome, cat in escolhidas.items():
        anunciado = cat.get("qtd_atos")
        obtido = coletados.get(nome, 0)
        marca = "ok" if anunciado and obtido >= anunciado else "DIVERGE"
        print(f"{LOG} {nome}: coletados {obtido} / anunciados {anunciado} [{marca}]")

    linhas = _linhas(cliente, indice, id_municipio)
    if not linhas:
        raise RuntimeError("nenhuma linha montada — nada a gravar (não apago o que já existe).")

    # Conexão nova para escrever: a coleta acima leva ~30 min e nesse tempo
    # a sessão da Neon é derrubada por inatividade. Mesmo motivo (e mesmo
    # prejuízo já observado) do custeio em `etl/camaras/bh.py`.
    client = get_supabase_client()
    gravou = refresh_completo_seguro(
        client,
        "atos_oficiais",
        {"id_municipio": id_municipio},
        linhas,
        permitir_reducao=permitir_reducao,
        rotulo="etl.pbh.legislacao",
    )
    com_tema = sum(1 for r in linhas if r["temas"])
    com_ementa = sum(1 for r in linhas if r["ementa"])
    print(f"{LOG} atos={len(linhas)} com_ementa={com_ementa} com_tema={com_tema} "
          f"gravado={gravou}")
    return len(linhas) if gravou else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--categorias",
        default=None,
        help="categorias do diário, separadas por vírgula, como aparecem em "
        f"/v1/categoriasato. Sem isso: {', '.join(CATEGORIAS_PADRAO)}. Acrescentar "
        "PORTARIA ou DELIBERAÇÃO é possível — leia o bloco RECORTE na docstring antes.",
    )
    parser.add_argument(
        "--permitir-reducao",
        action="store_true",
        help="grava mesmo trazendo menos atos que o banco já tem (use só depois de "
        "confirmar na fonte que os atos sumiram)",
    )
    args = parser.parse_args()

    escolha = CATEGORIAS_PADRAO
    if args.categorias:
        escolha = tuple(c.strip().upper() for c in args.categorias.split(",") if c.strip())

    try:
        sync(args.id_municipio, categorias=escolha, permitir_reducao=args.permitir_reducao)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
