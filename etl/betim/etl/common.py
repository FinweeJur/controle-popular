import os
from dotenv import load_dotenv

load_dotenv()

ID_MUNICIPIO_DEFAULT = "3106705"
CITY_HALL_CNPJ = "18715391000196"
CITY_LAT = float(os.environ.get("CITY_LAT", "-19.9681"))
CITY_LNG = float(os.environ.get("CITY_LNG", "-44.1983"))

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")


def get_supabase_client():
    from supabase import create_client

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados no .env — "
            "crie o projeto Supabase (F0.2) antes de rodar upserts."
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


PAGE_SIZE = 1000


def fetch_all(query_factory, page_size: int = PAGE_SIZE) -> list[dict]:
    """Runs a supabase-py query across as many `.range()` pages as needed.

    PostgREST caps `.execute()` at 1000 rows by default — any select on a
    table that can grow past that silently truncates instead of erroring.
    Found live 2026-07-21 in `etl/alertas.py`'s `_check_regra_10` (despesas
    has 4263+ rows; whole years were silently missing) and the same
    unpaginated pattern was still present in `sync()`'s `contratos` select
    (576 rows today, under the limit, but not for long).

    `query_factory` is a zero-arg callable that returns a **fresh** query
    builder each time it's called (e.g.
    `lambda: client.table("contratos").select("id, valor").eq("id_municipio", x)`)
    — NOT a pre-built builder. supabase-py/postgrest-py builders aren't
    guaranteed safe to `.execute()` more than once, so each page gets its
    own builder with `.range()` applied fresh rather than reusing one
    across the loop.
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


def upsert_com_colunas_opcionais(
    client, table: str, rows: list[dict], colunas_opcionais: list[str], **upsert_kwargs
):
    """`client.table(table).upsert(rows, **upsert_kwargs)`, mas tolera
    colunas em `colunas_opcionais` que ainda não existem no banco.

    Pra colunas novas cujo código de escrita já foi commitado mas cuja
    migration ainda não foi rodada pelo usuário (padrão recorrente deste
    projeto -- `caixa_disponivel`/0011 é o mesmo caso, só que lá é uma
    TABELA nova então a query inteira falha isolada; aqui é uma COLUNA
    nova numa tabela que o ETL já escreve toda vez, então incluir a
    coluna sem essa rede de segurança quebraria o upsert INTEIRO —
    inclusive as colunas que já existiam — até a migration rodar).

    Tenta o upsert completo primeiro; se o Postgres devolver 42703
    (undefined_column), remove as `colunas_opcionais` de cada linha e
    tenta de novo, uma vez, com aviso impresso. Qualquer outro erro
    propaga normalmente -- só esse código específico é tratado como
    "coluna ainda não existe", não como "engolir erro genérico"."""
    from postgrest.exceptions import APIError

    try:
        return client.table(table).upsert(rows, **upsert_kwargs).execute()
    except APIError as e:
        # 42703 = Postgres undefined_column (quando o erro vem cru do banco);
        # PGRST204 = PostgREST não achou a coluna no cache de schema (é o que
        # o upsert/insert via REST devolve quando a migration ainda não
        # rodou). Os dois significam "coluna ainda não existe".
        if e.code not in ("42703", "PGRST204"):
            raise
        print(
            f"[etl.common] upsert em '{table}': coluna opcional ainda não existe "
            f"({e.message}) -- gravando sem {colunas_opcionais} até a migration rodar."
        )
        rows_sem_opcionais = [
            {k: v for k, v in row.items() if k not in colunas_opcionais} for row in rows
        ]
        return client.table(table).upsert(rows_sem_opcionais, **upsert_kwargs).execute()
