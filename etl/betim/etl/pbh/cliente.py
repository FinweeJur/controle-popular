"""Transporte HTTP para os dois portais da PBH, mais os clientes CKAN e GRP.

POR QUE NÃO É `requests`. Os dois hosts da PBH ficam atrás do WAF da
GoCache, que bloqueia por FINGERPRINT DE TLS/HTTP2, não por User-Agent:

    requests.get("https://ckan.pbh.gov.br/api/3/action/status_show")
      -> HTTP 403, corpo "Acesso Bloqueado", Server: gocache

O mesmo pedido com os MESMOS cabeçalhos via `curl` devolve 200. Não adianta
copiar User-Agent de Chrome nem mandar os `Sec-Fetch-*` — o que o WAF olha é
o handshake. `curl_cffi` resolve porque usa o curl-impersonate por baixo e
reproduz o ClientHello de um Chrome real.

Consequência para quem for mexer aqui: **não troque `curl_cffi` por
`requests` "para tirar uma dependência"**. O modo de falha é 403 em tudo,
imediato e óbvio — o que é a boa notícia; o modo de falha ruim seria
silencioso.
"""

import time

from curl_cffi import requests as creq

CKAN_BASE = "https://ckan.pbh.gov.br/api/3/action"
GRP_URL = "https://grp.pbh.gov.br/bh_prd_transparencia/servlet/app.api.agetapi"

# O WAF também olha Origin/Referer no POST do GRP.
_GRP_HEADERS = {
    "Content-Type": "application/json;charset=UTF-8",
    "Referer": "https://grp.pbh.gov.br/bh_prd_transparencia/",
    "Origin": "https://grp.pbh.gov.br",
}

# Teto por chamada do datastore do CKAN, medido: acima disso a resposta é
# truncada sem aviso.
DATASTORE_MAX = 32_000


def _tentar(fn, tentativas: int = 4, espera: float = 3.0):
    """Retry linear. A PBH devolve 502/503 esporádico sob carga, e o WAF
    responde 403 também quando acha que a cadência está alta demais — nos
    dois casos esperar resolve, então o retry cobre 4xx de WAF junto com
    5xx, ao contrário do padrão de só repetir 5xx."""
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
    raise RuntimeError(f"falhou após {tentativas} tentativas: {ultimo}")


def ckan_action(acao: str, **params):
    """Uma chamada da Action API do CKAN. Devolve o `result`."""
    resp = _tentar(
        lambda: creq.get(
            f"{CKAN_BASE}/{acao}", params=params, impersonate="chrome", timeout=120
        )
    )
    corpo = resp.json()
    if not corpo.get("success"):
        raise RuntimeError(f"CKAN {acao} devolveu success=false: {str(corpo)[:300]}")
    return corpo["result"]


def datastore_todos(resource_id: str, limite_por_pagina: int = 10_000) -> list[dict]:
    """Todas as linhas de um recurso do datastore, paginando por offset.

    Nem todo recurso listado como `datastore_active` está realmente OK: o
    dataset de convênios, por exemplo, foi ingerido pelo xloader com a
    primeira linha de DADOS como cabeçalho. O datastore responde 200 com
    lixo, e quem só olhar daqui conclui "vazio". Quando o volume vier
    absurdamente menor que o CSV, leia o CSV — ver `csv_do_recurso`.
    """
    linhas: list[dict] = []
    offset = 0
    while True:
        r = ckan_action(
            "datastore_search",
            resource_id=resource_id,
            limit=min(limite_por_pagina, DATASTORE_MAX),
            offset=offset,
        )
        lote = r.get("records") or []
        if not lote:
            break
        linhas.extend(lote)
        offset += len(lote)
        if offset >= (r.get("total") or 0):
            break
    return linhas


def csv_do_recurso(url: str) -> tuple[str, str]:
    """Baixa um CSV do CKAN e devolve `(texto, encoding_usado)`.

    **O encoding varia POR ÓRGÃO PUBLICADOR, não por portal.** Medido na
    PBH: SMPOG, SUDECAP e SMFA-despesas publicam UTF-8 (às vezes com BOM);
    SMALOG-licitações, PBH-Ativos e SMFA-arrecadação publicam cp1252.
    Assumir um só encoding derruba metade dos datasets — e derruba com
    acento errado, não com exceção, se o `errors` for permissivo.

    Por isso a ordem é utf-8-sig → utf-8 → cp1252 → **cp850** → latin-1,
    todas em modo ESTRITO: a primeira que decodificar sem erro é a certa.
    `latin-1` fica por último porque aceita QUALQUER byte e portanto nunca
    falha — deixá-la antes das outras faria toda detecção parar nela, com
    mojibake silencioso.

    `cp850` (code page do DOS) entrou depois de aparecer de verdade: os dois
    CSVs de folha da SEGES/São Paulo são cp850, e a cadeia sem ele rejeitava
    cp1252 corretamente (há byte 0x90) e caía em latin-1, gravando "ExceÆo"
    no lugar de "Exceção" — sem exceção, sem aviso, direto no banco. Não foi
    observado na PBH até agora, mas é a mesma classe de portal e o custo de
    tentar é uma linha.
    """
    resp = _tentar(lambda: creq.get(url, impersonate="chrome", timeout=180))
    brutos = resp.content
    for enc in ("utf-8-sig", "utf-8", "cp1252", "cp850", "latin-1"):
        try:
            return brutos.decode(enc), enc
        except UnicodeDecodeError:
            continue
    raise RuntimeError(f"nenhum encoding conhecido decodifica {url}")


def grp(servico: str, filtros: dict | None = None, por_pagina: int = 200) -> list[dict]:
    """Todos os registros de um procedimento do GRP da PBH.

    O servlet é genérico: o corpo diz qual procedimento rodar e a resposta
    nomeia o array de dados no campo `template` (`PContrato` -> `contrato`,
    `PFolhaPagto` -> `folha_pagamento`), então o nome da chave só é
    conhecido em tempo de execução.

    `filtros={}` funciona para quase tudo e devolve a base inteira, MENOS
    para `PFolhaPagto`, onde exercício e mês são obrigatórios — sem eles a
    resposta é `registros: 0`, que é indistinguível de "não há folha".

    POR QUE 200 E NÃO 1000 POR PÁGINA. Cada contrato traz quatro arrays
    aninhados (itens, publicações no DOM, responsáveis, anexos), então uma
    página de 1.000 vira uma resposta de dezenas de MB que o servidor leva
    muitos minutos para montar. Medido: com 1.000 o processo ficou 20 min
    bloqueado em I/O gastando 1,2s de CPU, sem devolver nada e sem estourar
    o timeout — o pior formato de lentidão, porque parece travamento. Com
    200 cada página volta em segundos; são mais requisições e menos espera.
    """
    corpo_base = {
        "servico": servico,
        "formato": "",
        "filtros": filtros or {},
        "totalregistros": 0,
    }

    pagina = 1
    todos: list[dict] = []
    total_anunciado = None
    while True:
        corpo = {**corpo_base, "registros": por_pagina, "pagina": pagina}
        resp = _tentar(
            lambda c=corpo: creq.post(
                GRP_URL, json=c, headers=_GRP_HEADERS, impersonate="chrome", timeout=300
            )
        )
        dados = resp.json()
        if total_anunciado is None:
            total_anunciado = dados.get("registros") or 0
        chave = dados.get("template")
        lote = dados.get(chave) or [] if chave else []
        if not lote:
            break
        todos.extend(lote)
        # Progresso por página: sem isto, uma coleta de 6.832 registros fica
        # silenciosa por minutos e é indistinguível de um processo travado.
        print(
            f"[etl.pbh] {servico}: {len(todos)}/{total_anunciado}", flush=True
        )
        if len(todos) >= total_anunciado:
            break
        pagina += 1

    return todos
