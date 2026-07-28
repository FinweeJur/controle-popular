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
    resp = requests.get(f"{BASE_URL}{path}", params=params, timeout=60)
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
    """Yields raw contratação (licitação) dicts from /v1/contratacoes/publicacao."""
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
