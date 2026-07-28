"""Utilitários compartilhados por todos os módulos de ETL."""
import os

from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

PAGE_SIZE = 1000


# Schema Postgres deste app. O projeto Supabase é COMPARTILHADO com o
# /betim e o /congresso, e os três colidem em `documentos`, `envios`,
# `perfis`, `monitoramentos`, `alertas` e `cache_ia`. Sem apontar o
# schema, o ETL gravaria dado do Judiciário dentro da tabela de um app
# irmão que JÁ ESTÁ NO AR — sem erro nenhum, que é o pior modo de falha
# possível.
SCHEMA = "judiciario"


def get_supabase_client():
    from supabase import create_client

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados "
            "no .env — crie o projeto Supabase e rode as migrations (F0/F1) antes "
            "de rodar qualquer upsert."
        )

    # `ClientOptions` mudou de lugar entre versões do supabase-py; tentamos
    # o caminho novo e caímos no antigo em vez de quebrar por import.
    try:
        from supabase import ClientOptions  # type: ignore[attr-defined]
    except ImportError:  # supabase-py < 2.5
        from supabase.lib.client_options import ClientOptions  # type: ignore[no-redef]

    return create_client(
        SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, options=ClientOptions(schema=SCHEMA)
    )


def fetch_all(query_factory, page_size: int = PAGE_SIZE) -> list[dict]:
    """Roda um select do supabase-py por quantas páginas `.range()` forem
    necessárias.

    PostgREST corta em 1000 linhas por padrão SEM erro — qualquer select
    sem paginação numa tabela que cresce trunca em silêncio. No app irmão
    (/betim) isso apagou anos inteiros de despesas de um cálculo de alerta
    e, mais tarde, inverteu um ranking em produção. Aqui o volume é muito
    maior desde o primeiro dia, então paginar é o caminho padrão, não a
    otimização.

    `query_factory` é um callable de zero argumentos que devolve um builder
    NOVO a cada chamada (ex.: `lambda: client.table("proposicoes").select("id")`)
    — não um builder pronto: os builders do postgrest-py não são seguros
    para `.execute()` mais de uma vez.
    """
    rows: list[dict] = []
    page = 0
    while True:
        resp = query_factory().range(page * page_size, page * page_size + page_size - 1).execute()
        batch = resp.data or []
        rows.extend(batch)
        if len(batch) < page_size:
            break
        page += 1
    return rows


def _dedup_por_conflito(rows: list[dict], on_conflict: str) -> list[dict]:
    """Remove linhas com a mesma chave de conflito, mantendo a ÚLTIMA.

    Postgres recusa um upsert cujo lote traga a mesma chave de
    `on_conflict` duas vezes ("ON CONFLICT DO UPDATE command cannot affect
    row a second time", código 21000). Uma API externa pode legitimamente
    devolver a mesma entidade repetida (a da Câmara devolve o mesmo
    deputado uma vez por período de filiação), então deduplicar aqui é a
    correção certa, não um remendo — e manter a última ocorrência espelha a
    semântica de um upsert (a escrita mais recente vence).

    A chave é composta pelos campos de `on_conflict` ("casa_id,id_externo").
    """
    chaves = [c.strip() for c in on_conflict.split(",")]
    vistos: dict[tuple, dict] = {}
    for row in rows:
        k = tuple(row.get(c) for c in chaves)
        vistos[k] = row  # último vence
    return list(vistos.values())


def upsert_em_lotes(client, table: str, rows: list[dict], tamanho: int = 500, **kwargs):
    """Upsert fatiado. Um único upsert com milhares de linhas estoura o
    limite de payload do PostgREST e falha inteiro — perdendo também as
    linhas que teriam passado.

    Quando `on_conflict` é informado, deduplica o conjunto ANTES de fatiar:
    a duplicata pode estar em lotes diferentes, então dedup por lote não
    bastaria. Sem `on_conflict` não há como saber a chave, e o dedup é
    pulado (o upsert falharia com mensagem clara se houvesse colisão)."""
    on_conflict = kwargs.get("on_conflict")
    if on_conflict:
        antes = len(rows)
        rows = _dedup_por_conflito(rows, on_conflict)
        if len(rows) < antes:
            print(
                f"[etl.common] {table}: {antes - len(rows)} linha(s) duplicada(s) por "
                f"'{on_conflict}' removida(s) antes do upsert (mantida a última)."
            )
    total = 0
    for i in range(0, len(rows), tamanho):
        lote = rows[i : i + tamanho]
        client.table(table).upsert(lote, **kwargs).execute()
        total += len(lote)
    return total


def upsert_com_colunas_opcionais(
    client, table: str, rows: list[dict], colunas_opcionais: list[str], **upsert_kwargs
):
    """Upsert que tolera colunas ainda inexistentes no banco.

    O DDL deste projeto é aplicado à mão pelo usuário no SQL Editor do
    Supabase, então código novo quase sempre chega antes da migration.
    Sem esta rede, incluir uma coluna nova quebraria o upsert INTEIRO —
    inclusive as colunas que já existiam — até a migration rodar.

    Só o código 42703 (undefined_column) é tratado; qualquer outro erro
    propaga normalmente.
    """
    from postgrest.exceptions import APIError

    try:
        return client.table(table).upsert(rows, **upsert_kwargs).execute()
    except APIError as e:
        if e.code != "42703":
            raise
        print(
            f"[etl.common] upsert em '{table}': coluna opcional ainda não existe "
            f"({e.message}) — gravando sem {colunas_opcionais} até a migration rodar."
        )
        rows_limpas = [{k: v for k, v in r.items() if k not in colunas_opcionais} for r in rows]
        return client.table(table).upsert(rows_limpas, **upsert_kwargs).execute()


def registrar_fonte(client, nome: str, url: str, tipo_dados: str, status: str = "ok"):
    """Carimba a última execução bem-sucedida de uma fonte externa."""
    from datetime import datetime, timezone

    client.table("fontes_externas").upsert(
        {
            "nome": nome,
            "url": url,
            "tipo_dados": tipo_dados,
            "ultima_atualizacao": datetime.now(timezone.utc).isoformat(),
            "ultimo_status": status,
        },
        on_conflict="nome",
    ).execute()
