"""etl.apis.beneficios_sociais — sync Novo Bolsa Família + BPC por
município, mês a mês, para `beneficios_sociais` (tabela já existia desde a
migration 0001, sem dado até agora — sem migration nova).

Fonte: Portal da Transparência, mesma chave (`TRANSPARENCIA_API_KEY`) já
usada por `etl.apis.transparencia_gov`.

ARMADILHA achada ao vivo: o parâmetro certo é `mesAno`, não `anoMes`
(intuitivo ao contrário) — `anoMes` devolve 400 "Required parameter
'mesAno' is not present" em vez de simplesmente ignorar o parâmetro
errado. `/bolsa-familia-por-municipio` (nome antigo do programa,
2004-2021) devolveu vazio em toda amostra testada — o programa mudou de
nome duas vezes (Bolsa Família → Auxílio Brasil, nov/2021 → Novo Bolsa
Família, mar/2023) e cada nome tem seu próprio endpoint, sem unificação
histórica pela API. Este módulo sincroniza só `/novo-bolsa-familia-por-
municipio` (o programa atual, mar/2023 em diante) e `/bpc-por-municipio`
(nome estável desde sempre) — a série de Bolsa Família **não é contínua
desde 2004** na página resultante, e a página precisa avisar isso.

Cada chamada devolve já agregado por município e mês (não paginado, não
por beneficiário individual) — muito mais barato que `/convenios`.
"""
import argparse
import datetime as dt
import os
import sys
import time

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

API_BASE = "https://api.portaldatransparencia.gov.br/api-de-dados"

# (endpoint, rótulo gravado em `beneficios_sociais.programa`)
PROGRAMAS = [
    ("novo-bolsa-familia-por-municipio", "Novo Bolsa Família"),
    ("bpc-por-municipio", "BPC"),
]

# Novo Bolsa Família começou em março/2023 (substituiu o Auxílio Brasil) --
# não adianta pedir meses antes disso pra esse endpoint específico.
INICIO_PADRAO = (2023, 3)


def _headers() -> dict:
    chave = os.environ.get("TRANSPARENCIA_API_KEY")
    if not chave:
        raise RuntimeError(
            "TRANSPARENCIA_API_KEY não configurada no .env — chave gratuita em "
            "https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email"
        )
    return {"chave-api-dados": chave, "Accept": "application/json"}


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=30))
def _get_mes(endpoint: str, codigo_ibge: str, mes_ano: str) -> dict | None:
    resp = requests.get(
        f"{API_BASE}/{endpoint}",
        headers=_headers(),
        params={"codigoIbge": codigo_ibge, "mesAno": mes_ano},
        timeout=30,
    )
    resp.raise_for_status()
    dados = resp.json()
    return dados[0] if dados else None


def _meses_desde(ano_ini: int, mes_ini: int) -> list[str]:
    """"YYYYMM" de `ano_ini`/`mes_ini` até o mês anterior ao atual (o mês
    corrente costuma vir incompleto/atrasado na fonte)."""
    hoje = dt.date.today()
    fim = dt.date(hoje.year, hoje.month, 1) - dt.timedelta(days=1)  # último dia do mês anterior
    meses = []
    y, m = ano_ini, mes_ini
    while (y, m) <= (fim.year, fim.month):
        meses.append(f"{y}{m:02d}")
        m += 1
        if m > 12:
            m = 1
            y += 1
    return meses


def sync(id_municipio: str, codigo_ibge: str, desde: tuple[int, int] = INICIO_PADRAO) -> None:
    client = get_supabase_client()
    meses = _meses_desde(*desde)

    total_rows = 0
    for endpoint, programa in PROGRAMAS:
        rows = []
        for mes_ano in meses:
            registro = _get_mes(endpoint, codigo_ibge, mes_ano)
            time.sleep(0.3)
            if registro is None:
                continue
            competencia = f"{mes_ano[:4]}-{mes_ano[4:]}-01"
            rows.append(
                {
                    "id_municipio": id_municipio,
                    "programa": programa,
                    "competencia": competencia,
                    "beneficiarios": registro.get("quantidadeBeneficiados"),
                    "valor_total": registro.get("valor"),
                    "fonte": "portal_transparencia",
                }
            )
        if rows:
            client.table("beneficios_sociais").upsert(
                rows, on_conflict="id_municipio,programa,competencia"
            ).execute()
        print(f"[etl.apis.beneficios_sociais] programa={programa} meses_com_dado={len(rows)}")
        total_rows += len(rows)

    print(f"[etl.apis.beneficios_sociais] id_municipio={id_municipio} total={total_rows}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--codigo-ibge", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.codigo_ibge)
    except RuntimeError as e:
        print(f"[etl.apis.beneficios_sociais] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
