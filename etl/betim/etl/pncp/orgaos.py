"""etl.pncp.orgaos — descobre os CNPJs de órgão MUNICIPAIS de uma cidade.

    python -m etl.pncp.orgaos --id-municipio 3550308
    python -m etl.pncp.orgaos --id-municipio 3550308 --gravar

O PROBLEMA QUE ISTO RESOLVE. `etl.pncp.contratos` consulta
`/v1/contratos?cnpjOrgao=<CNPJ da prefeitura>`, o que só alcança a
administração direta central. Medido em 2026-08-03: São Paulo devolveu
**114 contratos** de 2024 a 2026 por esse caminho. A cidade contrata por
dezenas de secretarias, subprefeituras e empresas com CNPJ PRÓPRIO
(SP Obras, PRODAM, SPTurismo, Fundo Municipal de Saúde, cada
subprefeitura), e nenhuma delas aparece.

POR QUE NÃO BASTA TROCAR PARA `codigoMunicipioIbge`. Esse parâmetro filtra
por onde o órgão está SEDIADO, não por quem ele é. Em São Paulo a mesma
consulta traz USP, Metrô, CPTM, TJ-SP, Tribunal de Contas do Estado,
ministérios e conselhos profissionais — federais e estaduais que não têm
nada a ver com a prefeitura. Publicá-los como "contratos do município"
seria pior que subcontar.

A SAÍDA: varrer por IBGE (que é abrangente) e filtrar por
`orgaoEntidade.esferaId == "M"`, que a própria resposta traz. Sobram os
órgãos municipais, e a lista de CNPJs vai para
`municipios.fontes.cnpjs_orgao` — de onde `etl.pncp.contratos` a lê.

CADÊNCIA: trimestral. Órgão novo é raro, e a varredura é cara (o PNCP
devolve 429 com facilidade; ver `_PAUSA`).
"""

import argparse
import datetime as dt
import json
import sys
import time

import requests

from etl.common import ID_MUNICIPIO_DEFAULT, carregar_municipio, get_supabase_client

BASE = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao"

# Modalidades da Lei 14.133 usadas na consulta. O parâmetro é obrigatório e
# não aceita "todas", então é um laço. 6 = Pregão Eletrônico concentra a
# maior parte do volume; as outras entram para não perder órgão que só
# contrata por dispensa ou inexigibilidade.
MODALIDADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

# O PNCP devolve 429 ("Limite de requisições excedido") em rajada — atingido
# ao vivo com ~10 chamadas seguidas. Uma pausa entre páginas é mais barata
# que o backoff depois do bloqueio.
_PAUSA = 1.5

_HEADERS = {"User-Agent": "ControlePopular/ETL (portal de transparência)", "Accept": "application/json"}


def _pagina(ibge: str, modalidade: int, ano: int, pagina: int) -> dict | None:
    try:
        r = requests.get(
            BASE,
            params={
                "dataInicial": f"{ano}0101",
                "dataFinal": f"{ano}1231",
                "codigoModalidadeContratacao": modalidade,
                "codigoMunicipioIbge": ibge,
                "pagina": pagina,
                "tamanhoPagina": 50,
            },
            headers=_HEADERS,
            timeout=120,
        )
    except requests.RequestException as e:
        print(f"[etl.pncp.orgaos] rede: {e}", file=sys.stderr)
        return None
    if r.status_code == 429:
        # Não é erro de parâmetro: é cadência. Esperar e seguir vale mais
        # que abortar a varredura inteira.
        print("[etl.pncp.orgaos] 429 — pausando 30s", flush=True)
        time.sleep(30)
        return None
    if r.status_code != 200:
        return None
    return r.json()


def descobrir(ibge: str, anos: list[int]) -> dict[str, dict]:
    """`{cnpj: {razao_social, contagem, esfera, poder}}` só dos municipais."""
    achados: dict[str, dict] = {}
    for ano in anos:
        for mod in MODALIDADES:
            pagina = 1
            while True:
                dados = _pagina(ibge, mod, ano, pagina)
                time.sleep(_PAUSA)
                if not dados:
                    break
                itens = dados.get("data") or []
                if not itens:
                    break
                for it in itens:
                    oe = it.get("orgaoEntidade") or {}
                    cnpj = (oe.get("cnpj") or "").strip()
                    # `esferaId == "M"` é o que separa a prefeitura do resto
                    # do que está SEDIADO na cidade. Sem este filtro a lista
                    # traz universidade federal, metrô estadual e ministério.
                    if not cnpj or oe.get("esferaId") != "M":
                        continue
                    reg = achados.setdefault(
                        cnpj,
                        {
                            "razao_social": oe.get("razaoSocial"),
                            "contagem": 0,
                            "esfera": oe.get("esferaId"),
                            "poder": oe.get("poderId"),
                        },
                    )
                    reg["contagem"] += 1
                total_paginas = dados.get("totalPaginas") or 1
                if pagina >= total_paginas:
                    break
                pagina += 1
    return achados


def sync(id_municipio: str, anos: list[int], gravar: bool) -> None:
    cidade = carregar_municipio(id_municipio)
    achados = descobrir(id_municipio, anos)

    if not achados:
        raise RuntimeError(
            f"nenhum órgão municipal encontrado para {cidade['nome']} nos anos {anos}. "
            "Antes de concluir que a cidade não publica no PNCP, confira se a "
            "varredura não foi cortada por 429."
        )

    print(f"[etl.pncp.orgaos] {cidade['nome']}: {len(achados)} órgãos municipais")
    for cnpj, v in sorted(achados.items(), key=lambda x: -x[1]["contagem"]):
        print(f"  {v['contagem']:5d}  {cnpj}  {v['razao_social']}")

    if not gravar:
        print("[etl.pncp.orgaos] (--gravar não passado; nada foi escrito)")
        return

    # O CNPJ da própria prefeitura entra na frente: é o que já era usado e
    # continua sendo o principal.
    principal = cidade["cnpj_prefeitura"]
    lista = ([principal] if principal else []) + [c for c in achados if c != principal]

    client = get_supabase_client()
    client.table("municipios").update(
        {
            "fontes": {
                **cidade["fontes"],
                "cnpjs_orgao": lista,
                "cnpjs_orgao_atualizado_em": dt.date.today().isoformat(),
                "cnpjs_orgao_detalhe": {c: v["razao_social"] for c, v in achados.items()},
            }
        }
    ).eq("id_municipio", id_municipio).execute()
    print(f"[etl.pncp.orgaos] gravados {len(lista)} CNPJs em municipios.fontes.cnpjs_orgao")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--anos",
        default=None,
        help="Anos separados por vírgula. Padrão: ano corrente e o anterior.",
    )
    parser.add_argument("--gravar", action="store_true", help="Escreve em municipios.fontes.")
    args = parser.parse_args()
    hoje = dt.date.today().year
    anos = (
        [int(a) for a in args.anos.split(",")] if args.anos else [hoje - 1, hoje]
    )
    try:
        sync(args.id_municipio, anos, args.gravar)
    except RuntimeError as e:
        print(f"[etl.pncp.orgaos] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
