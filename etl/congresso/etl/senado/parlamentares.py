"""etl.senado.parlamentares — senadores em exercício.

Rodar: `python -m etl.senado.parlamentares`

FONTE: `legis.senado.leg.br/dadosabertos/senador/lista/atual` — a API
**legada** (XML convertido pro Senado pra JSON). Isto contradiz
`docs/congresso/F0-discovery.md` §2, que registrou esta MESMA rota como
bloqueada por desafio anti-bot em 2026-07-22 ("Verificação de segurança —
Senado Federal"). Retestado ao vivo em 2026-08-09: **200, JSON limpo, 81
senadores** — sem User-Agent especial, sem header extra. Ou o bloqueio era
por reputação de IP (e mudou) ou foi liberado do lado do Senado; de
qualquer forma, HOJE funciona, e é medido, não suposto. Se voltar a
bloquear, o sintoma é "Verificação de segurança" no corpo com status 200
(soft-block, não 403) ou timeout — não confundir com um 4xx de parâmetro
errado.

ARMADILHA DE PARÂMETRO: **NÃO** acrescentar `?v=1` nesta rota. Esse
parâmetro é da API *nova* (`/dadosabertos/processo`, ver `senado/processos.py`)
— nesta rota legada ele devolve 400 `"Serviço/versão indisponível"`. Duas
APIs do mesmo domínio, convenções diferentes; confirmado ao vivo tentando
os dois jeitos.

MAPEAMENTO (verificado no JSON cru, não documentação):
  `ListaParlamentarEmExercicio.Parlamentares.Parlamentar[]` — cada item tem
  `IdentificacaoParlamentar` (nome, partido, uf, e-mail, foto, página) e
  `Mandato` (legislatura, suplentes). SEM CPF e SEM data de nascimento no
  payload — mesma checagem de LGPD que `camara/parlamentares.py` já faz
  para a Câmara, aqui não há nada a excluir.

FOTO: `UrlFotoParlamentar` vem em `http://` (ex.
`http://www.senado.leg.br/senadores/img/fotos-oficiais/senador5672.jpg`,
que devolve 301 pra https). Normalizado pra `https://` na gravação --
evita o hop de redirect e mixed-content se a página um dia embutir a
imagem direto. Confirmado baixando uma: JPEG real, 480x600, 241 KB.

Medido em 2026-08-09: 81 de 81 senadores com `UrlFotoParlamentar`
preenchida; 80 de 81 com e-mail (`EmailParlamentar` nulo em 1 caso --
gravado como null, não inventado).
"""
import argparse

import requests
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

from etl.common import get_supabase_client, registrar_fonte, upsert_em_lotes

BASE = "https://legis.senado.leg.br/dadosabertos"
CASA_ID = "senado"

_session = requests.Session()
_session.headers.update(
    {
        "Accept": "application/json",
        "User-Agent": "ControlePopular-Congresso/0.1 (+https://controlepopular.br)",
    }
)


def _vale_retry(e: BaseException) -> bool:
    """Mesmo critério do cliente da Câmara (`camara/client.py`): só insiste
    em rede/5xx/429, não em 4xx (erro permanente de requisição)."""
    if isinstance(e, requests.HTTPError) and e.response is not None:
        return e.response.status_code == 429 or e.response.status_code >= 500
    return True


@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=3, max=60),
    retry=retry_if_exception(_vale_retry),
)
def _listar_atual() -> list[dict]:
    # SEM `v=1` -- ver docstring do módulo.
    resp = _session.get(f"{BASE}/senador/lista/atual", timeout=60)
    resp.raise_for_status()
    dados = resp.json()
    return dados["ListaParlamentarEmExercicio"]["Parlamentares"]["Parlamentar"]


def _https(url: str | None) -> str | None:
    if not url:
        return None
    return url.replace("http://", "https://", 1) if url.startswith("http://") else url


def coletar() -> list[dict]:
    linhas: list[dict] = []
    for p in _listar_atual():
        ident = p.get("IdentificacaoParlamentar") or {}
        mandato = p.get("Mandato") or {}
        primeira_legislatura = mandato.get("PrimeiraLegislaturaDoMandato") or {}
        codigo = ident.get("CodigoParlamentar")
        if not codigo:
            continue
        legislatura = primeira_legislatura.get("NumeroLegislatura")
        linhas.append(
            {
                "casa_id": CASA_ID,
                "id_externo": str(codigo),
                "nome": ident.get("NomeCompletoParlamentar") or ident.get("NomeParlamentar"),
                "nome_eleitoral": ident.get("NomeParlamentar"),
                "partido": ident.get("SiglaPartidoParlamentar"),
                "uf": ident.get("UfParlamentar"),
                "email": ident.get("EmailParlamentar"),
                "url_foto": _https(ident.get("UrlFotoParlamentar")),
                "url_perfil": _https(ident.get("UrlPaginaParlamentar")),
                "legislatura": int(legislatura) if legislatura else None,
                "ativo": True,
                # `raw` guarda o objeto inteiro -- sem CPF/nascimento neste
                # payload (ver docstring do módulo), então nada a podar.
                "raw": p,
            }
        )
    return linhas


def sync() -> int:
    linhas = coletar()
    client_sb = get_supabase_client()
    total = upsert_em_lotes(client_sb, "parlamentares", linhas, on_conflict="casa_id,id_externo")
    sem_foto = sum(1 for x in linhas if not x["url_foto"])
    sem_email = sum(1 for x in linhas if not x["email"])
    print(
        f"[senado.parlamentares] {total} senadores sincronizados "
        f"({sem_foto} sem foto, {sem_email} sem e-mail)"
    )
    registrar_fonte(
        client_sb,
        "senado_parlamentares",
        f"{BASE}/senador/lista/atual",
        "parlamentares",
    )
    return total


if __name__ == "__main__":
    argparse.ArgumentParser().parse_args()  # sem flags hoje; mantém o padrão dos outros módulos
    sync()
