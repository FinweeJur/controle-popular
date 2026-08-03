"""etl.apis.ceis_cnep — sync CEIS/CNEP (fornecedores sancionados) into
`fornecedores.sancionado_ceis`/`fornecedores.ceis_detalhes` (colunas já
existiam desde a migration 0001 — sem migration nova).

Destrava a Regra 5 de alerta (`regra_5_fornecedor_sancionado_ceis`, ver
`docs/alertas-contratos-revisao-juridica.md`): a regra sempre teve base
legal forte (Art. 14/156-III da Lei 14.133/2021) mas nunca disparava
porque nenhum ETL preenchia essas colunas — resolvido aqui.

Fonte: Portal da Transparência, mesma chave já usada por
`etl.apis.transparencia_gov`. Endpoints e nomes de parâmetro confirmados
contra o **OpenAPI spec real** (`https://api.portaldatransparencia.gov.br/v3/api-docs`)
depois de descobrir ao vivo 2026-07-23 que o nome óbvio (`cnpjSancionado`)
não existe e é **silenciosamente ignorado** — a API devolve 200 com uma
lista qualquer em vez de erro, então testar só pelo status HTTP não pega
esse tipo de bug. O parâmetro certo é `codigoSancionado`; aceita CNPJ com
ou sem máscara.

ACHADO JURÍDICO QUE MOLDA O DESENHO: nem toda sanção no CEIS impede
contratar com Betim especificamente. O Art. 14, III da Lei 14.133/2021
impede contratar com quem estiver "impossibilitado de participar", mas o
próprio impedimento administrativo (diferente da declaração de
inidoneidade por improbidade/Lei Anticorrupção) tem `abrangenciaDefinida
DecisaoJudicial` limitada — no exemplo real que motivou este módulo, uma
sanção aplicada pela Prefeitura de Sapezal/MT contra um fornecedor de
Betim tinha abrangência **"em todos os Poderes da ESFERA do órgão
sancionador"**, ou seja, limitada à esfera municipal de Sapezal, não
automaticamente estendida a Betim (outro município). Por isso:
- `sancionado_ceis` fica **true sempre que existe QUALQUER sanção ativa**
  (CEIS ou CNEP), inclusive as de abrangência restrita — é fato real
  sobre o fornecedor, vale saber mesmo sem efeito jurídico automático
  aqui.
- `ceis_detalhes` grava a lista bruta completa (órgão sancionador, tipo,
  datas, abrangência) — a Regra 5/UI precisa ler `abrangencia` pra não
  alegar impedimento onde a lei não impede.
"""
import argparse
import os
import sys
import time

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

API_BASE = "https://api.portaldatransparencia.gov.br/api-de-dados"
CHUNK_SIZE = 200


def _headers() -> dict:
    chave = os.environ.get("TRANSPARENCIA_API_KEY")
    if not chave:
        raise RuntimeError(
            "TRANSPARENCIA_API_KEY não configurada no .env — chave gratuita em "
            "https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email"
        )
    return {"chave-api-dados": chave, "Accept": "application/json"}


@retry(stop=stop_after_attempt(6), wait=wait_exponential(multiplier=2, min=5, max=90))
def _get_pagina(endpoint: str, cnpj: str, pagina: int) -> list[dict]:
    resp = requests.get(
        f"{API_BASE}/{endpoint}",
        headers=_headers(),
        params={"codigoSancionado": cnpj, "pagina": pagina},
        # 30s bastavam para Betim e estouraram com ReadTimeout em Belo
        # Horizonte e São Paulo: o Portal da Transparência fica mais lento
        # conforme o volume do município cresce, e a gravação só acontece no
        # fim — um timeout no meio descarta a coleta inteira.
        timeout=180,
    )
    resp.raise_for_status()
    dados = resp.json()
    return dados if isinstance(dados, list) else []


def _sancoes_do_cnpj(cnpj: str) -> list[dict]:
    """CEIS + CNEP combinados pra um CNPJ. Ambos endpoints exigem `pagina`
    mas nenhum fornecedor deveria ter mais de uma página (1-15 registros)
    de sanções — segue paginando por segurança até vir vazio."""
    resultado = []
    for endpoint in ("ceis", "cnep"):
        pagina = 1
        while True:
            lote = _get_pagina(endpoint, cnpj, pagina)
            if not lote:
                break
            for item in lote:
                item["_fonte"] = endpoint
            resultado.extend(lote)
            pagina += 1
            if pagina > 5:  # trava de segurança -- nunca deveria chegar aqui
                break
    return resultado


def _resumo_sancao(item: dict) -> dict:
    orgao = item.get("orgaoSancionador") or {}
    tipo = item.get("tipoSancao") or {}
    return {
        "fonte": item.get("_fonte"),
        "tipo": tipo.get("descricaoPortal") or tipo.get("descricaoResumida"),
        "orgao_sancionador": orgao.get("nome"),
        "esfera_orgao_sancionador": orgao.get("esfera"),
        "data_inicio": item.get("dataInicioSancao"),
        "data_fim": item.get("dataFimSancao") or item.get("dataFinalSancao"),
        # Campo que decide se a sanção alcança Betim ou fica restrita à
        # esfera de quem aplicou -- ver docstring do módulo.
        "abrangencia": item.get("abrangenciaDefinidaDecisaoJudicial"),
    }


def sync(id_municipio: str) -> None:
    client = get_supabase_client()

    resp = client.table("fornecedores").select("cnpj").execute()
    cnpjs = [r["cnpj"] for r in (resp.data or []) if r.get("cnpj")]
    print(f"[etl.apis.ceis_cnep] fornecedores_a_checar={len(cnpjs)}")

    total_sancionados = 0
    rows: list[dict] = []
    for i, cnpj in enumerate(cnpjs, start=1):
        sancoes = _sancoes_do_cnpj(cnpj)
        rows.append(
            {
                "cnpj": cnpj,
                "sancionado_ceis": bool(sancoes),
                "ceis_detalhes": [_resumo_sancao(s) for s in sancoes] if sancoes else None,
            }
        )
        if sancoes:
            total_sancionados += 1
            print(f"[etl.apis.ceis_cnep] SANCIONADO: {cnpj} ({len(sancoes)} registro(s))")
        # Grava em lotes conforme avança -- uma queda de rede no meio do
        # loop (já aconteceu: DNS falhou aos ~380/487) não pode apagar o
        # progresso todo, então não dá pra deixar o upsert só pro final.
        if i % CHUNK_SIZE == 0 or i == len(cnpjs):
            client.table("fornecedores").upsert(rows, on_conflict="cnpj").execute()
            rows = []
            print(f"[etl.apis.ceis_cnep] progresso {i}/{len(cnpjs)} (gravado)")
        time.sleep(0.3)

    print(
        f"[etl.apis.ceis_cnep] id_municipio={id_municipio} "
        f"fornecedores_checados={len(cnpjs)} sancionados={total_sancionados}"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.apis.ceis_cnep] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
