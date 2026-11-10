"""etl.pncp.licitacoes — Sincronização de editais e contratações do PNCP para a tabela `licitacoes`.

Uso:
    python -m etl.pncp.licitacoes --id-municipio 3106705 [--ano-inicio 2021]

═══ PAPEL NO PORTAL CÍVICO ═══
Este módulo sincroniza as compras públicas, processos licitatórios, dispensas e inexigibilidades
registradas pelos municípios brasileiros no Portal Nacional de Contratações Públicas (PNCP).
No portal Controle Popular, essas informações alimentam:
1. Painel de licitações abertas para acompanhamento de cidadãos e fornecedores locais;
2. Auditoria de valores estimados versus valores homologados finais;
3. Monitoramento de compras emergenciais ou contratações diretas sem disputa;
4. Identificação de atas de registro de preços (SRP) e termos de referência.

═══ REGRA CRÍTICA: FILTRO DE ESFERA FEDERATIVA ═══
Existe uma distinção fundamental entre "licitações do município" e "licitações que ocorrem no município".
O parâmetro `codigoMunicipioIbge` do PNCP filtra exclusivamente pelo município onde o órgão está SEDIADO.
Em capitais ou cidades universitárias, essa consulta traz editais de Universidades Federais, Metrô estadual,
Tribunais de Justiça, Ministérios e Conselhos Profissionais (que nada têm a ver com os cofres municipais).
Publicá-los como despesa municipal seria inventar gastos públicos inexistentes da prefeitura.

O coletor inspeciona `orgaoEntidade.esferaId`:
- Mantém apenas `esferaId == "M"` (Esfera Municipal), exceto se explicitamente solicitado o contrário
  via flag `--incluir-outras-esferas`.

═══ DECISÕES DE ARQUITETURA E RESILIÊNCIA ═══
- Iteração pelas 13 modalidades legais da Lei 14.133/2021: O endpoint do PNCP não suporta consulta
  global sem modalidade. O coletor itera obrigatoriamente de 1 a 13.
- Checkpoints Transacionais por Página: A sincronização grava e atualiza o checkpoint a cada página
  de 50 itens. Em caso de instabilidade (HTTP 500 comum sob carga no PNCP), o trabalho já feito não se perde.
- Resiliência Parcial: Se uma modalidade específica falhar por timeout do servidor federal, o lote
  coletado é persistido e a esteira prossegue para as demais modalidades daquele ano.
"""

import argparse
import datetime as dt
import sys
import time

from etl.common import ID_MUNICIPIO_DEFAULT, get_db
from etl.pncp import checkpoint as ck
from etl.pncp.client import INTER_REQUEST_SLEEP, iter_contratacoes

# Modalidades de licitação previstas na Lei Federal 14.133/2021 (códigos 1 a 13 do PNCP)
MODALIDADES = range(1, 14)


def _sanitizar_numeric(val: any) -> float | None:
    """Sanitiza valores monetários para evitar estouro do tipo numeric(15, 2) do Postgres.

    O tipo PostgreSQL numeric(15, 2) aceita valores com até 13 dígitos inteiros (menor que 10^13).
    Valores bizarros digitados por erro humano em órgãos públicos (ex.: 43 trilhões de reais em Nanuque)
    estouram o limite da coluna e quebram a transação. O valor bruto original permanece preservado no campo `raw`.

    Args:
        val: Valor numérico ou string retornado pelo PNCP.

    Returns:
        Float seguro para o Postgres, ou None se nulo/inválido/fora de escala.
    """
    if val is None:
        return None
    try:
        f = float(val)
        if abs(f) >= 1e13:
            return None
        return f
    except (ValueError, TypeError):
        return None


def _map_row(raw: dict, id_municipio: str) -> dict:
    """Converte o objeto bruto de licitação retornado pelo PNCP para a estrutura da tabela `licitacoes`.

    Extrai dados do órgão licitante, unidade administrativa compradora, modalidade,
    objeto da compra, valores estimados e homologados, e datas do certame.

    Args:
        raw: Dicionário contendo o JSON de resposta da API para uma licitação.
        id_municipio: Código IBGE de 7 dígitos do município ao qual o registro pertence.

    Returns:
        Dicionário formatado pronto para execução do comando de upsert no Postgres.
    """
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
        "valor_estimado": _sanitizar_numeric(raw.get("valorTotalEstimado")),
        "valor_homologado": _sanitizar_numeric(raw.get("valorTotalHomologado")),
        "situacao": raw.get("situacaoCompraNome"),
        "data_publicacao_pncp": raw.get("dataPublicacaoPncp"),
        "data_abertura": raw.get("dataAberturaProposta"),
        "data_encerramento": raw.get("dataEncerramentoProposta"),
        "link_sistema_origem": raw.get("linkSistemaOrigem"),
        "raw": raw,
    }


def _gravar(client, rows_by_pncp: dict[str, dict]) -> int:
    """Persiste o lote de licitações no Postgres em blocos de até 1.000 registros."""
    rows = list(rows_by_pncp.values())
    for i in range(0, len(rows), 1000):
        client.table("licitacoes").upsert(
            rows[i : i + 1000], on_conflict="numero_controle_pncp"
        ).execute()
    return len(rows)


def _mapear_pagina(
    registros_brutos: list[dict],
    id_municipio: str,
    incluir_outras_esferas: bool,
) -> tuple[dict[str, dict], int]:
    """Mapeia uma página e aplica o filtro de esfera; devolve (lote, descartados)."""
    rows_by_pncp: dict[str, dict] = {}
    descartados = 0
    for raw in registros_brutos:
        # Aplica o filtro estrito de esfera para isolar despesas genuinamente municipais
        esfera = (raw.get("orgaoEntidade") or {}).get("esferaId")
        if not incluir_outras_esferas and esfera != "M":
            descartados += 1
            continue
        row = _map_row(raw, id_municipio)
        rows_by_pncp[row["numero_controle_pncp"]] = row
    return rows_by_pncp, descartados


def _avisar_interrupcao(ano: int, modalidade: int, erro: Exception) -> None:
    """Avisa que a API interrompeu a modalidade e o parcial foi gravado."""
    print(
        f"[etl.pncp.licitacoes] AVISO: ano={ano} modalidade={modalidade} "
        f"interrompida ({type(erro).__name__}); parcial gravado e segue. "
        f"Re-rode para completar.",
        flush=True,
    )


def _avisar_residual(ano: int, modalidade: int, erro: Exception) -> None:
    """Avisa que o lote residual da modalidade não pôde ser gravado."""
    print(
        f"[etl.pncp.licitacoes] AVISO: erro ao gravar lote residual de ano={ano} "
        f"modalidade={modalidade} ({type(erro).__name__}): {erro}",
        flush=True,
    )


def _sync_modalidade(
    client,
    estado: dict,
    alvo: tuple[str, int, int, bool],
    ano_atual: int,
) -> tuple[int, int, list[str]]:
    """Sincroniza um (município, ano, modalidade).

    Devolve (registros gravados, descartados por esfera, nomes dos erros).
    """
    id_municipio, ano, modalidade, incluir_outras_esferas = alvo
    chave = f"{id_municipio}:{ano}-{modalidade}"
    if ck.unidade_pronta(estado, chave, ano_atual=ano_atual):
        print(f"[etl.pncp.licitacoes] {chave} checkpoint=ok, pula", flush=True)
        return 0, 0, []

    pagina_inicio = ck.pagina_retomar(estado, chave)
    if pagina_inicio > 1:
        print(f"[etl.pncp.licitacoes] {chave} retoma na página {pagina_inicio}",
              flush=True)

    rows_by_pncp: dict[str, dict] = {}
    paginas_gravadas = pagina_inicio - 1
    registros_chave = ck.registros_parciais(estado, chave)
    descartados = 0
    erros: list[str] = []

    try:
        for pagina, registros_brutos in iter_contratacoes(
            id_municipio, f"{ano}0101", f"{ano}1231", modalidade,
            pagina_inicio=pagina_inicio,
        ):
            novos, descartados_pagina = _mapear_pagina(
                registros_brutos, id_municipio, incluir_outras_esferas
            )
            descartados += descartados_pagina
            rows_by_pncp.update(novos)

            # Gravação por página: minimiza perda de dados em caso de queda de conexão
            n = _gravar(client, rows_by_pncp)
            registros_chave += n
            rows_by_pncp = {}
            paginas_gravadas = max(paginas_gravadas, pagina)
            ck.marcar_parcela(
                estado, ck.NOME_LICITACOES, chave,
                pagina=paginas_gravadas, registros=registros_chave,
            )
            print(
                f"[etl.pncp.licitacoes] {chave} p={pagina} "
                f"lote={n} acumulado={registros_chave}",
                flush=True,
            )
    except Exception as e:
        # Falhas de gateway HTTP 500 do PNCP registram o parcial coletado e prosseguem
        erros.append(type(e).__name__)
        _avisar_interrupcao(ano, modalidade, e)

    # Grava eventuais registros residuais da modalidade
    try:
        registros_chave += _gravar(client, rows_by_pncp)
    except Exception as e:
        erros.append(type(e).__name__)
        _avisar_residual(ano, modalidade, e)
    if not erros:
        ck.marcar_ok(estado, ck.NOME_LICITACOES, chave, registros=registros_chave)
    return registros_chave, descartados, erros


def sync(id_municipio: str, ano_inicio: int, incluir_outras_esferas: bool = False):
    """Executa a sincronização sistemática das licitações do município no PNCP.

    Varre o período compreendido entre `ano_inicio` e o ano corrente. Para cada ano,
    percorre as 13 modalidades de contratação pública com controle estrito de checkpoint.

    ═══ TRATAMENTO DE CHECKPOINTS E RETOMADA ═══
    - Chave do Checkpoint: `{id_municipio}:{ano}-{modalidade}`.
    - Se a unidade já estiver com status "ok", é pulada sem gasto de requisições de rede,
      exceto no ano corrente, que é sempre relido.
    - Se a unidade tiver sido interrompida, retoma exatamente na página onde parou.
    - Gravação em lotes de 1.000 registros com deduplicação por chave primária (`numero_controle_pncp`).

    Args:
        id_municipio: Código IBGE de 7 dígitos do município alvo.
        ano_inicio: Primeiro ano a ser sincronizado (padrão: 2021).
        incluir_outras_esferas: Se True, preserva órgãos estaduais e federais sediados na cidade.

    Raises:
        RuntimeError: Se houver modalidades que não puderam ser completadas após esgotadas as tentativas.
    """
    client = get_db()
    ano_atual = dt.date.today().year
    total = 0
    descartados = 0
    estado = ck.carregar(ck.NOME_LICITACOES)

    # Lista de tuplas (ano, modalidade, tipo_erro) que falharam por indisponibilidade transitória do PNCP
    incompletos: list[tuple[int, int, str]] = []

    for ano in range(ano_inicio, ano_atual + 1):
        for modalidade in MODALIDADES:
            alvo = (id_municipio, ano, modalidade, incluir_outras_esferas)
            registros, descartados_mod, erros = _sync_modalidade(
                client, estado, alvo, ano_atual
            )
            total += registros
            descartados += descartados_mod
            incompletos.extend((ano, modalidade, nome) for nome in erros)
            time.sleep(INTER_REQUEST_SLEEP)
        print(f"[etl.pncp.licitacoes] ano={ano} acumulado={total}", flush=True)

    # Transparência sobre o filtro de esfera: alerta o operador sobre o volume descartado
    print(
        f"[etl.pncp.licitacoes] Concluído total={total} registros municipais "
        f"(descartados por esfera != M: {descartados})"
    )
    if incompletos:
        # Se houve falhas de API, informa detalhadamente para repescagem na próxima rodada
        detalhe = ", ".join(f"{ano}/mod{mod}" for ano, mod, _ in incompletos)
        raise RuntimeError(
            f"{len(incompletos)} modalidade(s)-ano incompletas por erro do PNCP "
            f"({detalhe}). O dado coletado foi gravado; re-rode para preencher."
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sincronizador de licitações do PNCP para o banco de dados.")
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT, help="Código IBGE do município.")
    parser.add_argument("--ano-inicio", type=int, default=2021, help="Ano inicial da coleta (padrão: 2021).")
    parser.add_argument(
        "--incluir-outras-esferas",
        action="store_true",
        help="Preserva órgãos federais/estaduais sediados na cidade (padrão: descarta esfera != M).",
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.ano_inicio, args.incluir_outras_esferas)
    except RuntimeError as e:
        print(f"[etl.pncp.licitacoes] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
