"""etl.prefeitura.obras — sync Betim city-hall public works into `obras`.

Fonte: `http://servicos.betim.mg.gov.br/transparencia/rest/APIObraPublica/ListarResultados`
— mesma API REST pública sem auth que backa a SPA Angular do portal (a
mesma de `etl.prefeitura.b3106705` pros servidores). Descoberto ao vivo
2026-07-24 sondando os endpoints `API*` do portal (#12 do review do
usuário: "da prefeitura falta ... obras").

Target: `obras`. Cron: weekly.

Volume real: ~59 obras (2026). Como é pequeno e a API devolve TODA a lista
a cada consulta, o sync é FULL-REFRESH (apaga as obras do município e
reinsere) — a tabela `obras` não tem constraint única pra upsert
idempotente, e delete+insert de 59 linhas é trivial e sempre consistente.
`obras` só é populada por esta fonte, então o delete-por-município não
afeta nenhum outro dado.

Mapeamento pro schema atual de `obras` (nome/situacao/valor/percentual_
execucao/bairro/lat/lng/link_fonte): o objeto vira `nome`, a situação e o
valor/percentual mapeiam direto. Campos que a API traz e não têm coluna
hoje (empresa contratada, ano, modalidade, licitação) ficam de fora desta
v1 — adicionar colunas depois se valer o detalhe.
"""
import argparse
import sys

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

BASE_URL = "http://servicos.betim.mg.gov.br/transparencia/rest"
REGISTROS_POR_PAGINA = 200


def _num_br(valor: str | None) -> float | None:
    """'1.985,24' -> 1985.24 ; '0,00' -> 0.0 ; '' -> None."""
    if not valor:
        return None
    limpo = valor.strip().replace(".", "").replace(",", ".")
    try:
        return float(limpo)
    except ValueError:
        return None


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=15))
def _get_pagina(pagina: int) -> list[dict]:
    url = f"{BASE_URL}/APIObraPublica/ListarResultados"
    resp = requests.get(
        url,
        params={"pagina": pagina, "registros": REGISTROS_POR_PAGINA},
        headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    chave = next((k for k in data if k.startswith("SDT")), None)
    return data.get(chave, []) if chave else []


def _map_obra(raw: dict, id_municipio: str) -> dict:
    return {
        "id_municipio": id_municipio,
        "nome": (raw.get("ObraPublicaObjeto") or "").strip() or "(sem descrição)",
        "situacao": raw.get("ObraPublicaSituacaoNome") or None,
        "valor": _num_br(raw.get("ObraPublicaValorTotal")),
        "percentual_execucao": _num_br(raw.get("ObraPublicaPercentualExecutado")),
    }


def sync(id_municipio: str) -> int:
    client = get_supabase_client()

    todas: list[dict] = []
    pagina = 1
    while True:
        lote = _get_pagina(pagina)
        todas.extend(lote)
        if len(lote) < REGISTROS_POR_PAGINA:
            break
        pagina += 1

    rows = [_map_obra(r, id_municipio) for r in todas]

    # Full-refresh: apaga as obras deste município e reinsere.
    client.table("obras").delete().eq("id_municipio", id_municipio).execute()
    if rows:
        client.table("obras").insert(rows).execute()

    print(f"[etl.prefeitura.obras] id_municipio={id_municipio} obras={len(rows)}")
    return len(rows)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except Exception as e:  # noqa: BLE001
        print(f"[etl.prefeitura.obras] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
