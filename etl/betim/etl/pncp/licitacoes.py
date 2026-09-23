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
from etl.pncp import checkpoint as ck
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
    estado = ck.carregar(ck.NOME_LICITACOES)
    # (ano, modalidade) que não completaram — o PNCP devolveu erro no meio e o
    # cliente esgotou as tentativas. Ver o bloco abaixo.
    incompletos: list[tuple[int, int, str]] = []

    def _gravar(rows_by_pncp: dict[str, dict]) -> int:
        rows = list(rows_by_pncp.values())
        for i in range(0, len(rows), 1000):
            client.table("licitacoes").upsert(
                rows[i : i + 1000], on_conflict="numero_controle_pncp"
            ).execute()
        return len(rows)

    for ano in range(ano_inicio, ano_atual + 1):
        data_inicial = f"{ano}0101"
        data_final = f"{ano}1231"
        for modalidade in MODALIDADES:
            # GRAVA POR MODALIDADE, NÃO POR ANO. A versão anterior acumulava o
            # ano inteiro em memória e só gravava no fim — um 500 do PNCP na
            # modalidade 6/2024 (o pregão eletrônico, com centenas de páginas)
            # apagava as modalidades já coletadas E os anos seguintes, sem
            # gravar nada. Medido ao vivo em 2026-08-05. Com a escrita por
            # modalidade, o estrago de uma falha é UMA modalidade de UM ano.
            #
            # Em 23/09/2026 o mesmo padrão evoluiu para PÁGINA: checkpoint
            # por (ano, modalidade) + upsert a cada página, para queda de
            # internet/PC no meio de uma modalidade grande não perder o lote.
            # Prefixo do município: sem ele, rodar outra cidade depois de
            # Betim pularia tudo (checkpoint "ok" de outra cidade).
            chave = f"{id_municipio}:{ano}-{modalidade}"
            if ck.unidade_pronta(estado, chave):
                print(
                    f"[etl.pncp.licitacoes] {chave} checkpoint=ok, pula",
                    flush=True,
                )
                continue

            pagina_inicio = ck.pagina_retomar(estado, chave)
            if pagina_inicio > 1:
                print(
                    f"[etl.pncp.licitacoes] {chave} retoma na página {pagina_inicio}",
                    flush=True,
                )

            rows_by_pncp: dict[str, dict] = {}
            paginas_gravadas = pagina_inicio - 1
            item_ck = estado.get(chave)
            registros_chave = (
                int(item_ck.get("registros") or 0)
                if isinstance(item_ck, dict)
                else 0
            )
            try:
                for pagina, registros_brutos in iter_contratacoes(
                    id_municipio,
                    data_inicial,
                    data_final,
                    modalidade,
                    pagina_inicio=pagina_inicio,
                ):
                    for raw in registros_brutos:
                        esfera = (raw.get("orgaoEntidade") or {}).get("esferaId")
                        if not incluir_outras_esferas and esfera != "M":
                            descartados += 1
                            continue
                        row = _map_row(raw, id_municipio)
                        rows_by_pncp[row["numero_controle_pncp"]] = row
                    n = _gravar(rows_by_pncp)
                    registros_chave += n
                    rows_by_pncp = {}
                    paginas_gravadas = max(paginas_gravadas, pagina)
                    ck.marcar_parcela(
                        estado,
                        ck.NOME_LICITACOES,
                        chave,
                        pagina=paginas_gravadas,
                        registros=registros_chave,
                    )
                    print(
                        f"[etl.pncp.licitacoes] {chave} p={pagina} "
                        f"lote={n} acumulado={registros_chave}",
                        flush=True,
                    )
            except Exception as e:
                # UM ERRO DE UMA MODALIDADE NÃO DERRUBA O RESTO. O PNCP
                # devolve 500 transitório sob carga; o upsert é idempotente
                # (chave `numero_controle_pncp`), então re-rodar preenche a
                # lacuna sem duplicar. O que já passou por página já está no
                # banco e no checkpoint.
                incompletos.append((ano, modalidade, type(e).__name__))
                print(
                    f"[etl.pncp.licitacoes] AVISO: ano={ano} modalidade={modalidade} "
                    f"interrompida ({type(e).__name__}); parcial gravado e segue. "
                    f"Re-rode para completar.",
                    flush=True,
                )

            n = _gravar(rows_by_pncp)
            registros_chave += n
            if not any(a == ano and m == modalidade for a, m, _ in incompletos):
                ck.marcar_ok(
                    estado,
                    ck.NOME_LICITACOES,
                    chave,
                    registros=registros_chave,
                )
            total += registros_chave
            time.sleep(INTER_REQUEST_SLEEP)
        print(f"[etl.pncp.licitacoes] ano={ano} acumulado={total}", flush=True)

    # O descarte é ANUNCIADO: um número muito maior que o mantido significa
    # que a cidade sedia muito órgão de outra esfera, não que a coleta falhou.
    print(
        f"[etl.pncp.licitacoes] total={total} "
        f"(descartados por esfera != M: {descartados})"
    )
    if incompletos:
        # Sai com erro para o cron/operador NOTAR — mas o que foi coletado já
        # está gravado, e re-rodar completa só o que faltou.
        detalhe = ", ".join(f"{ano}/mod{mod}" for ano, mod, _ in incompletos)
        raise RuntimeError(
            f"{len(incompletos)} modalidade(s)-ano incompletas por erro do PNCP "
            f"({detalhe}). O dado coletado foi gravado; re-rode para preencher."
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
