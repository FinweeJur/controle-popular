"""etl.pncp.orgaos — Descoberta automatizada de CNPJs municipais ativos no PNCP.

Uso:
    python -m etl.pncp.orgaos --id-municipio 3550308
    python -m etl.pncp.orgaos --id-municipio 3550308 --gravar

═══ PAPEL NO PORTAL CÍVICO ═══
Este módulo é o pré-requisito fundamental (Etapa 1 da esteira) para a coleta completa
de contratos e compras públicas de qualquer município no Controle Popular.

═══ O PROBLEMA QUE ESTE MÓDULO RESOLVE ═══
A API de contratos do PNCP (`/v1/contratos`) opera filtrando pelo parâmetro `cnpjOrgao`.
Se consultarmos apenas o CNPJ central da prefeitura, capturamos apenas a administração direta central.
Medição ao vivo em São Paulo/SP (2026-08-03):
- Apenas com o CNPJ da prefeitura: 114 contratos encontrados no período 2024-2026;
- Com todos os órgãos municipais: milhares de contratos distribuídos por dezenas de secretarias,
  subprefeituras, fundos especiais (Fundo Municipal de Saúde) e empresas estatais (SP Obras, PRODAM).

═══ POR QUE NÃO BASTA USAR O CÓDIGO IBGE DO MUNICÍPIO ═══
O parâmetro `codigoMunicipioIbge` filtra os órgãos pela cidade onde estão SEDIADOS fisicamente.
Em qualquer capital ou cidade média, a busca por IBGE retorna USP, Metrô, CPTM, Tribunais de Justiça,
Ministérios Federais e Conselhos Profissionais (CRM, CREA). Publicá-los como despesas do município
seria falsificar as contas públicas locais.

═══ A SOLUÇÃO METODOLÓGICA ═══
1. Realiza uma varredura ampla das publicações pelo código IBGE do município;
2. Filtra rigorosamente pelo atributo `orgaoEntidade.esferaId == "M"` (Esfera Municipal);
3. Extrai e consolida todos os CNPJs municipais identificados e suas respectivas razões sociais;
4. Grava a lista resultante no campo `municipios.fontes.cnpjs_orgao` do banco de dados,
   de onde o coletor `etl.pncp.contratos` a consome automaticamente.
"""

import argparse
import datetime as dt
import json
import sys
import time

import requests

from etl.common import ID_MUNICIPIO_DEFAULT, carregar_municipio, get_supabase_client

# Endpoint oficial de consulta pública de contratações do PNCP
BASE = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao"

# Modalidades de licitação da Lei 14.133/2021 (obrigatórias na requisição da API)
MODALIDADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

# Pausa preventiva entre requisições para evitar esgotamento de taxa (Rate Limit)
_PAUSA = 1.5

# Cabeçalhos HTTP com identificação transparente do projeto de transparência cívica
_HEADERS = {
    "User-Agent": "ControlePopular/ETL (portal de transparencia civica; contato: contato@controlepopular.com.br)",
    "Accept": "application/json",
}


def _pagina(ibge: str, modalidade: int, ano: int, pagina: int) -> dict | None:
    """Requisita uma página de publicações da API do PNCP com tratamento de rate limit.

    ═══ TRATAMENTO DO CÓDIGO HTTP 429 (TOO MANY REQUESTS) ═══
    O PNCP aplica limitação severa de requisições por IP em rajadas curtas.
    Quando recebe o código 429, o coletor não aborta a operação: entra em pausa
    estratégica de 30 segundos para liberação da cota na borda da API e segue a varredura.

    Args:
        ibge: Código IBGE de 7 dígitos do município.
        modalidade: Código numérico da modalidade de contratação (1 a 13).
        ano: Ano de referência das publicações.
        pagina: Número ordinal da página de resultados (1-based).

    Returns:
        Dicionário com o payload JSON da página, ou None em caso de falha persistente.
    """
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
        print(f"[etl.pncp.orgaos] Erro de rede na requisição: {e}", file=sys.stderr)
        return None

    if r.status_code == 429:
        # Pausa para descanso do rate limit da API pública
        print("[etl.pncp.orgaos] HTTP 429 (Rate limit) atingido — aguardando 30s para retomada...", flush=True)
        time.sleep(30)
        return None

    if r.status_code != 200:
        return None

    return r.json()


def descobrir(ibge: str, anos: list[int]) -> dict[str, dict]:
    """Descobre e cataloga todos os órgãos de esfera municipal ativos no território.

    Percorre os anos selecionados e todas as modalidades licitatórias, inspecionando
    cada item retornado para isolar aqueles com `esferaId == "M"`.

    Args:
        ibge: Código IBGE de 7 dígitos do município.
        anos: Lista de anos civis a serem investigados (ex: [2025, 2026]).

    Returns:
        Dicionário mapeando `{ cnpj: { "razao_social": str, "contagem": int, "esfera": str, "poder": str } }`.
    """
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
                    # Filtro de Esfera: Garante que apenas entes da administração municipal sejam catalogados
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
    """Orquestra a descoberta de CNPJs e atualiza as fontes municipais no banco de dados.

    ═══ ATUALIZAÇÃO NO SUPABASE ═══
    Quando o parâmetro `gravar` for True:
    - Posiciona o CNPJ principal da prefeitura no topo da lista;
    - Agrega os demais CNPJs municipais descobertos em `municipios.fontes.cnpjs_orgao`;
    - Salva a data da verificação e o mapa detalhado de nomes em `cnpjs_orgao_detalhe`.

    Args:
        id_municipio: Código IBGE de 7 dígitos do município.
        anos: Anos civis a serem pesquisados.
        gravar: Se True, persiste os achados na tabela `municipios` do Supabase.

    Raises:
        RuntimeError: Caso nenhum órgão municipal seja localizado para o município.
    """
    cidade = carregar_municipio(id_municipio)
    achados = descobrir(id_municipio, anos)

    if not achados:
        raise RuntimeError(
            f"Nenhum órgão municipal encontrado para {cidade['nome']} nos anos {anos}. "
            "Antes de concluir que a cidade não publica no PNCP, confira se a "
            "varredura não foi interrompida por 429 ou bloqueio de IP."
        )

    print(f"\n[etl.pncp.orgaos] {cidade['nome']}: {len(achados)} órgãos municipais identificados:")
    for cnpj, v in sorted(achados.items(), key=lambda x: -x[1]["contagem"]):
        print(f"  {v['contagem']:5d} atos  |  CNPJ: {cnpj}  |  {v['razao_social']}")

    if not gravar:
        print("\n[etl.pncp.orgaos] Parâmetro --gravar não foi passado; nenhum dado foi escrito no banco.")
        return

    # Garante que o CNPJ institucional da prefeitura conste sempre como o primeiro da lista
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
    print(f"\n[etl.pncp.orgaos] Sucesso: {len(lista)} CNPJs gravados em `municipios.fontes.cnpjs_orgao` para {cidade['nome']}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Identifica todos os CNPJs de órgãos municipais no PNCP.")
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT, help="Código IBGE do município.")
    parser.add_argument(
        "--anos",
        default=None,
        help="Anos separados por vírgula (ex: 2024,2025). Padrão: ano corrente e o anterior.",
    )
    parser.add_argument("--gravar", action="store_true", help="Grava os CNPJs descobertos no banco de dados.")
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
