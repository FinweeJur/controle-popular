"""etl.pncp.licitacoes — sync PNCP /v1/contratacoes/publicacao into `licitacoes`.

Usage: python -m etl.pncp.licitacoes --id-municipio 3106705 [--ano-inicio 2021]

Iterates codigoModalidadeContratacao 1..13 (PNCP modality codes) per year,
since the endpoint requires a modality filter.

FILTRO DE ESFERA — a diferença entre "licitações do município" e "licitações
que acontecem no município". `codigoMunicipioIbge` recorta por onde o órgão
está SEDIADO, não por quem ele é. Em Betim a distinção quase não aparece; em
São Paulo a mesma consulta devolve USP, Metrô, CPTM, TJ-SP, Tribunal de
Contas do Estado, ministérios e conselhos profissionais — só a modalidade 6
teve 8.647 registros em meio ano de 2025, a maioria de esfera federal ou
estadual. Publicá-los como licitação da prefeitura seria inventar gasto
municipal.

A resposta já traz `orgaoEntidade.esferaId`; `M` é o que sobra depois do
filtro. Betim não perde nada (a prefeitura é municipal por definição) e São
Paulo passa a mostrar o que é dela.
"""
import argparse
import datetime as dt
import sys
import time

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client
from etl.pncp.client import INTER_REQUEST_SLEEP, iter_contratacoes

MODALIDADES = range(1, 14)


def _map_row(raw: dict, id_municipio: str) -> dict:
    orgao = raw.get("orgaoEntidade") or {}
    unidade = raw.get("unidadeOrgao") or {}
    modalidade = raw.get("modalidadeNome") or ""
    return {
        "id_municipio": id_municipio,
        "numero_controle_pncp": raw.get("numeroControlePNCP"),
        "orgao_cnpj": orgao.get("cnpj"),
        "orgao_nome": orgao.get("razaoSocial"),
        "unidade_nome": unidade.get("nomeUnidade"),
        "modalidade_id": raw.get("modalidadeId"),
        "modalidade_nome": modalidade,
        "objeto": raw.get("objetoCompra"),
        "processo": raw.get("processo"),
        "srp": raw.get("srp"),
        "valor_estimado": raw.get("valorTotalEstimado"),
        "valor_homologado": raw.get("valorTotalHomologado"),
        "situacao": raw.get("situacaoCompraNome"),
        "data_publicacao_pncp": raw.get("dataPublicacaoPncp"),
        "data_abertura": raw.get("dataAberturaProposta"),
        "data_encerramento": raw.get("dataEncerramentoProposta"),
        "link_sistema_origem": raw.get("linkSistemaOrigem"),
        "raw": raw,
    }


def sync(id_municipio: str, ano_inicio: int, incluir_outras_esferas: bool = False):
    client = get_supabase_client()
    ano_atual = dt.date.today().year
    total = 0
    descartados = 0
    for ano in range(ano_inicio, ano_atual + 1):
        data_inicial = f"{ano}0101"
        data_final = f"{ano}1231"
        rows_by_pncp: dict[str, dict] = {}
        for modalidade in MODALIDADES:
            for raw in iter_contratacoes(id_municipio, data_inicial, data_final, modalidade):
                esfera = (raw.get("orgaoEntidade") or {}).get("esferaId")
                if not incluir_outras_esferas and esfera != "M":
                    descartados += 1
                    continue
                row = _map_row(raw, id_municipio)
                # Dedupe by numero_controle_pncp -- Postgres' ON CONFLICT DO
                # UPDATE errors ("cannot affect row a second time") if the
                # same key appears twice in one upsert batch, and PNCP can
                # return the same contratação again across modalidade/page
                # boundaries. Last occurrence wins (same key = same record).
                rows_by_pncp[row["numero_controle_pncp"]] = row
            time.sleep(INTER_REQUEST_SLEEP)
        rows = list(rows_by_pncp.values())
        if rows:
            client.table("licitacoes").upsert(rows, on_conflict="numero_controle_pncp").execute()
        print(f"[etl.pncp.licitacoes] ano={ano} registros={len(rows)}", flush=True)
        total += len(rows)
    # O descarte é ANUNCIADO: um número muito maior que o mantido significa
    # que a cidade sedia muito órgão de outra esfera, não que a coleta falhou.
    print(
        f"[etl.pncp.licitacoes] total={total} "
        f"(descartados por esfera != M: {descartados})"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--ano-inicio", type=int, default=2021)
    parser.add_argument(
        "--incluir-outras-esferas",
        action="store_true",
        help="Mantém órgãos federais/estaduais sediados na cidade (padrão: descarta).",
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.ano_inicio, args.incluir_outras_esferas)
    except RuntimeError as e:
        print(f"[etl.pncp.licitacoes] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
