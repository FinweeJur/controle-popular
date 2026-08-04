import time
import requests
from tenacity import retry, stop_after_attempt, wait_exponential

BASE_URL = "https://pncp.gov.br/api/consulta/v1"

# PNCP's public API rate-limits harder than a naive 0.3s-between-pages loop
# accounts for -- confirmed live 2026-07-20: iterating licitacoes.py's 13
# modalidades back-to-back (each at least 1 request, ~0.3s apart) tripped a
# 429 within the first year's loop, and it kept 429-ing through all 5 of the
# old retry attempts (2/4/8/16/30s backoff, ~60s total) because nothing
# increased the gap *before* the next request. Longer backoff ceiling +
# honoring `Retry-After` when PNCP sends one fixes the single-request case;
# INTER_REQUEST_SLEEP (used between pages AND between modalidade/year loops
# in the callers) fixes the "many small requests back-to-back" case that
# triggers the 429 in the first place.
INTER_REQUEST_SLEEP = 0.6


@retry(stop=stop_after_attempt(6), wait=wait_exponential(multiplier=2, min=3, max=60))
def _get(path: str, params: dict) -> dict:
    # 60s bastava enquanto a consulta era por UM CNPJ (Betim). Com a lista de
    # órgãos municipais — 57 em São Paulo — a mesma varredura faz dezenas de
    # vezes mais chamadas e o PNCP fica mais lento sob carga; a coleta de SP
    # morreu com ReadTimeout no meio, e como a gravação é por ano, o ano
    # inteiro se perde.
    resp = requests.get(f"{BASE_URL}{path}", params=params, timeout=180)
    if resp.status_code == 204:
        return {"data": [], "totalPaginas": 0}
    if resp.status_code == 429:
        retry_after = resp.headers.get("Retry-After")
        time.sleep(float(retry_after) if retry_after else 10)
    resp.raise_for_status()
    return resp.json()


def iter_contratos(cnpj_orgao: str, data_inicial: str, data_final: str, tamanho_pagina: int = 50):
    """Yields raw contrato dicts from /v1/contratos for the given date window."""
    pagina = 1
    while True:
        payload = _get(
            "/contratos",
            {
                "cnpjOrgao": cnpj_orgao,
                "dataInicial": data_inicial,
                "dataFinal": data_final,
                "pagina": pagina,
                "tamanhoPagina": tamanho_pagina,
            },
        )
        registros = payload.get("data", [])
        if not registros:
            break
        yield from registros
        if pagina >= payload.get("totalPaginas", 0):
            break
        pagina += 1
        time.sleep(INTER_REQUEST_SLEEP)


def iter_contratacoes(codigo_municipio_ibge: str, data_inicial: str, data_final: str,
                       codigo_modalidade: int, tamanho_pagina: int = 50):
    """Yields raw contratação (licitação) dicts from /v1/contratacoes/publicacao.

    DUAS COISAS QUE ESTE ENDPOINT NÃO FAZ, e que parecem que faz (medido em
    2026-08-03 contra São Paulo, modalidade 6, ano 2025 — 18.680 registros):

    1. **Ele IGNORA parâmetro que não conhece, sem erro.** Mandar `cnpjOrgao`
       ou `esferaId` junto devolve HTTP 200 e EXATAMENTE os mesmos 18.680
       registros — o filtro não acontece e nada avisa. Pior: `cnpjOrgao`
       sozinho, sem `codigoMunicipioIbge`, devolve 396.656 (o país inteiro),
       provando que o parâmetro é descartado. Quem "otimizar" a coleta
       passando o CNPJ do órgão vai ver o mesmo dado voltar, concluir que
       funcionou, e — se então tirar o filtro de esfera do lado do cliente
       por achá-lo redundante — publicar licitação do Estado e da União como
       gasto da Prefeitura. **O recorte por esfera TEM de continuar em
       Python** (ver `etl.pncp.licitacoes`).

    2. **Ele não aceita página maior que 50.** `tamanhoPagina=200` responde
       HTTP 400 "Tamanho de página inválido". Diferente de `/contratos`, que
       aceita valores maiores. Não é lugar de economizar requisição.

    E a razão de tudo aqui ser sequencial: o PNCP limita taxa com agressão e
    **não manda `Retry-After`**. Uma sondagem com 8 threads levou 291
    respostas 429 para 80 requisições bem-sucedidas, e depois disso o IP ficou
    tomando 429 até em requisição única por alguns minutos. Paralelizar esta
    coleta a torna MAIS lenta, não mais rápida.
    """
    pagina = 1
    while True:
        payload = _get(
            "/contratacoes/publicacao",
            {
                "dataInicial": data_inicial,
                "dataFinal": data_final,
                "codigoModalidadeContratacao": codigo_modalidade,
                "codigoMunicipioIbge": codigo_municipio_ibge,
                "pagina": pagina,
                "tamanhoPagina": tamanho_pagina,
            },
        )
        registros = payload.get("data", [])
        if not registros:
            break
        yield from registros
        if pagina >= payload.get("totalPaginas", 0):
            break
        pagina += 1
        time.sleep(INTER_REQUEST_SLEEP)
