"""etl.apis.crimes_mg — sync "Crimes Violentos" (Sejusp-MG) into
`seguranca_ocorrencias` (tabela já existia desde a migration 0001, sem
dado até agora -- sem migration nova).

Fonte: Portal de Dados Abertos do Estado de Minas Gerais (CKAN),
`dados.mg.gov.br/dataset/crimes-violentos` — um CSV por ano (2019-2026),
mantido pela Sejusp. Ocorrências violentas (estupro, roubo, extorsão,
homicídio tentado, feminicídio tentado, sequestro) por município, mês e
natureza do crime.

ARMADILHAS achadas ao vivo 2026-07-23:
1. **A API CKAN devolve 403 sem `User-Agent` de navegador** — mesmo padrão
   de outros portais .gov.br que já bloquearam este ambiente (Senado,
   LexML no projeto irmão `/congresso`). Diferente daqueles, aqui um
   `User-Agent` falso resolve; não precisou de Playwright.
2. **`dados.mj.gov.br`** (a fonte federal do SINESP, prevista no plano
   original) **não resolve DNS** — domínio parece fora do ar neste momento,
   confirmado por dois caminhos de rede diferentes (não é bloqueio deste
   ambiente específico). Substituído pela fonte estadual, que cobre Betim
   igual de bem e está viva.
3. **`cod_municipio` no CSV é de 6 dígitos** (`310670`), não os 7 do IBGE
   (`3106705`) — mesmo padrão já visto no DATASUS (ver `docs/F0-discovery`
   do app). Em vez de mapear o código (risco de errar o dígito
   verificador), o filtro usa o nome `município == "BETIM"` — igual à ANP,
   mesma convenção de nome maiúsculo sem acento.

Cron: mensal (o ano corrente é atualizado mês a mês pela Sejusp).
"""
import argparse
import sys
import time

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

CKAN_BASE = "https://dados.mg.gov.br"
DATASET_ID = "crimes-violentos"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "application/json",
}


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=30))
def _listar_recursos_csv() -> list[dict]:
    resp = requests.get(
        f"{CKAN_BASE}/api/3/action/package_show",
        params={"id": DATASET_ID},
        headers=HEADERS,
        timeout=30,
    )
    resp.raise_for_status()
    return [
        r
        for r in resp.json()["result"]["resources"]
        if (r.get("format") or "").upper() == "CSV"
    ]


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=30))
def _baixar_csv(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=90)
    resp.raise_for_status()
    return resp.content.decode("utf-8-sig")


def _linhas_do_municipio(texto_csv: str, nome_municipio: str) -> list[dict]:
    linhas = texto_csv.splitlines()
    colunas = linhas[0].split(";")
    idx = {c: i for i, c in enumerate(colunas)}
    resultado = []
    for linha in linhas[1:]:
        campos = linha.split(";")
        if len(campos) < len(colunas):
            continue
        if campos[idx["municipio"]].strip().upper() != nome_municipio:
            continue
        resultado.append(
            {
                "natureza": campos[idx["natureza"]].strip(),
                "mes": int(campos[idx["mes"]]),
                "ano": int(campos[idx["ano"]]),
                "registros": int(campos[idx["registros"]]),
            }
        )
    return resultado


MAX_TENTATIVAS_UPSERT = 4


def _upsert_verificado(client, id_municipio: str, ano: int, rows: list[dict], rotulo: str) -> int:
    """Upsert de um ano + confere contra o banco depois -- NÃO confia que
    `.execute()` sem exceção significa "gravou tudo".

    Achado ao vivo 2026-07-23: rodar 8 upserts sequenciais (um por ano,
    150-180 linhas cada) contra este projeto Supabase corrompeu 2-3 deles
    de forma intermitente e SEM lançar erro nenhum -- cada upsert isolado,
    rodado sozinho, sempre gravou 100% certo; a falha só aparecia rodando
    vários em sequência rápida, e pulava de ano em ano a cada rodada
    (2025+2026 numa rodada, 2022+2023 na seguinte) -- não é peculiaridade
    de nenhum arquivo específico, é uma falha intermitente do lado
    servidor/rede. Mesmo princípio de `_scrape_lista_materias` em
    `etl/camaras/betim.py`: nunca confiar que "não lançou exceção" ==
    "gravou certo" quando a fonte já mostrou que pode falhar em silêncio.
    """
    esperado = len(rows)
    for tentativa in range(1, MAX_TENTATIVAS_UPSERT + 1):
        client.table("seguranca_ocorrencias").upsert(
            rows, on_conflict="id_municipio,ano,mes,natureza"
        ).execute()
        resp = (
            client.table("seguranca_ocorrencias")
            .select("id", count="exact")
            .eq("id_municipio", id_municipio)
            .eq("ano", ano)
            .execute()
        )
        if resp.count == esperado:
            return esperado
        print(
            f"[etl.apis.crimes_mg] {rotulo}: esperava {esperado} linhas no banco, achou {resp.count} "
            f"(tentativa {tentativa}/{MAX_TENTATIVAS_UPSERT}) -- regravando"
        )
        time.sleep(1.5)
    print(
        f"[etl.apis.crimes_mg] AVISO: {rotulo} ficou com {resp.count}/{esperado} linhas mesmo após "
        f"{MAX_TENTATIVAS_UPSERT} tentativas -- confira manualmente antes de confiar neste ano na página."
    )
    return resp.count


def sync(id_municipio: str, nome_municipio: str = "BETIM") -> None:
    client = get_supabase_client()
    recursos = _listar_recursos_csv()
    print(f"[etl.apis.crimes_mg] {len(recursos)} CSVs anuais encontrados")

    total = 0
    for recurso in recursos:
        texto = _baixar_csv(recurso["url"])
        ocorrencias = _linhas_do_municipio(texto, nome_municipio)
        if not ocorrencias:
            print(f"[etl.apis.crimes_mg] {recurso['name']}: 0 registros de {nome_municipio}")
            continue
        ano = ocorrencias[0]["ano"]
        rows = [
            {
                "id_municipio": id_municipio,
                "ano": o["ano"],
                "mes": o["mes"],
                "natureza": o["natureza"],
                "qtd": o["registros"],
                "fonte": "sejusp_mg_crimes_violentos",
            }
            for o in ocorrencias
        ]
        gravado = _upsert_verificado(client, id_municipio, ano, rows, recurso["name"])
        total += gravado
        print(f"[etl.apis.crimes_mg] {recurso['name']}: {gravado}/{len(rows)} registros de {nome_municipio} confirmados no banco")
        time.sleep(0.5)  # espaça as chamadas -- não elimina a falha intermitente, mas reduz a frequência

    print(f"[etl.apis.crimes_mg] id_municipio={id_municipio} total={total}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--municipio", default="BETIM", help="Maiúsculo sem acento, convenção da fonte")
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.municipio)
    except RuntimeError as e:
        print(f"[etl.apis.crimes_mg] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
