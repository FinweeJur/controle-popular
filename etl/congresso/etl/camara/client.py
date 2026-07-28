"""Cliente da API de Dados Abertos da Câmara dos Deputados (v2).

Verificado ao vivo em 2026-07-22: REST, JSON, SEM autenticação, paginação
por `links[rel=next]`. É a melhor fonte do projeto — traz proposições,
tramitações, autores, votações nominais, comissões, frentes parlamentares
(as "bancadas temáticas"), blocos, e o e-mail institucional de cada
deputado (`dep.nome@camara.leg.br`), que é o destinatário do ofício.

Docs: https://dadosabertos.camara.leg.br/swagger/api.html
"""
from typing import Any, Iterator

import requests
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

BASE = "https://dadosabertos.camara.leg.br/api/v2"
CASA_ID = "camara"
ITENS_POR_PAGINA = 100  # máximo aceito pela API

_session = requests.Session()
_session.headers.update(
    {
        "Accept": "application/json",
        # A Câmara não exige, mas identificar o cliente é boa prática com
        # API pública — e ajuda se algum dia precisarmos falar com eles
        # sobre volume de requisições.
        "User-Agent": "ControlePopular-Congresso/0.1 (+https://controlepopular.br)",
    }
)


# Retry paciente contra o throttle da API da Câmara.
#
# A dados-abertos estrangula IP que dispara em volume (verificado ao vivo
# 2026-07-23: depois de ~15k requisições numa sessão, um lote de member
# fetches começava a falhar por volta da 10ª, e o mesmo endpoint voltava a
# responder 200 assim que a pressão baixava). O throttle é SUSTENTADO —
# dura mais que os ~14s do backoff antigo (4 tentativas), então ele
# desistia no meio. Com 6 tentativas e espera até 120s, um request
# throttlado espera 5→10→20→40→80s, o bastante para a janela de bloqueio
# passar. Só encarece quando de fato há throttle; o caminho feliz não muda.
def _vale_retry(e: BaseException) -> bool:
    """Só insiste no que pode melhorar sozinho: rede, 5xx e 429.

    Um 4xx é erro PERMANENTE de requisição — repetir gasta os 155s do
    backoff e chega no mesmo lugar. Foi exatamente isso que travou
    `etl.camara.bancadas` por horas (2026-07-28): `/frentes/{id}/membros`
    rejeita o parâmetro `itens` com 400, e cada uma das 320 frentes
    consumia o ciclo inteiro de retries — ~14h de trabalho para zero
    linha gravada. O diagnóstico antigo no TODO ("rate limit") era falso;
    o throttle real existe, mas se manifesta como 429/5xx, não como 400.
    """
    if isinstance(e, requests.HTTPError) and e.response is not None:
        return e.response.status_code == 429 or e.response.status_code >= 500
    return True  # timeout, conexão recusada, DNS: tentar de novo faz sentido


@retry(
    stop=stop_after_attempt(6),
    wait=wait_exponential(multiplier=1, min=5, max=120),
    retry=retry_if_exception(_vale_retry),
)
def get(caminho: str, **params) -> dict[str, Any]:
    """GET num caminho da API, com retry exponencial paciente."""
    url = caminho if caminho.startswith("http") else f"{BASE}{caminho}"
    resp = _session.get(url, params=params or None, timeout=60)
    resp.raise_for_status()
    return resp.json()


def paginar(
    caminho: str, itens: int | None = ITENS_POR_PAGINA, **params
) -> Iterator[dict[str, Any]]:
    """Itera todos os itens de um endpoint paginado, seguindo `rel=next`.

    Seguir o link `next` da própria resposta em vez de incrementar `pagina`
    à mão evita a classe de bug que truncou o scraper da Câmara Municipal
    no app irmão: lá o código lia só a primeira página e undercontava
    silenciosamente todo autor prolífico — o resultado não ficava vazio,
    ficava ERRADO, que é bem pior de notar.

    `itens=None` para os endpoints que REJEITAM esse parâmetro com 400 —
    `/frentes/{id}/membros` é um deles (verificado ao vivo 2026-07-28:
    `{"status":400,"instance":"itens"}` com o parâmetro, 200 sem ele).
    Esses endpoints devolvem a lista inteira de uma vez, sem `rel=next`.
    """
    if itens is not None:
        params.setdefault("itens", itens)
    url: str | None = caminho
    primeira = True
    while url:
        dados = get(url, **(params if primeira else {}))
        primeira = False
        yield from dados.get("dados", [])
        url = next(
            (link["href"] for link in dados.get("links", []) if link.get("rel") == "next"),
            None,
        )


def id_externo_da_uri(uri: str | None) -> str | None:
    """Extrai o id numérico do fim de uma URI da API (`.../deputados/74856`)."""
    if not uri:
        return None
    return uri.rstrip("/").rsplit("/", 1)[-1]
