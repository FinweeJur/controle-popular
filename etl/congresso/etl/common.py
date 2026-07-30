"""Utilitários compartilhados por todos os módulos de ETL."""
import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

PAGE_SIZE = 1000


# Schema Postgres deste app. O banco (Neon) é COMPARTILHADO com o /betim e
# o /judiciario, e os três colidem em `proposicoes`, `cache_ia`, `embeddings`
# e `fontes_externas`. Sem apontar o schema, o ETL gravaria proposição
# FEDERAL dentro da tabela de proposições de VEREADOR do app irmão — sem
# erro, corrompendo dado de um projeto que já está no ar.
SCHEMA = "congresso"


class PgAPIError(Exception):
    """Duck-types a fatia da interface de `postgrest.exceptions.APIError`
    que este módulo usava (`.code`/`.message`) — existe só para o código que
    já trata "coluna ainda não existe" (`upsert_com_colunas_opcionais`)
    continuar funcionando sem mudar a lógica, agora sobre erro real do
    Postgres em vez de PostgREST."""

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(f"[{code}] {message}")


class _Response:
    def __init__(self, data: list[dict]):
        self.data = data


def _adapt(v):
    """psycopg não sabe adaptar `dict`/`list[dict]` (colunas jsonb, ex.
    `parlamentares.raw`) sozinho — precisa do wrapper `Json`. Arrays de
    escalar (`temas: list[str]`) continuam passando direto, viram array do
    Postgres nativamente."""
    if isinstance(v, dict) or (isinstance(v, list) and v and isinstance(v[0], dict)):
        from psycopg.types.json import Json

        return Json(v)
    return v


def _row_out(row: dict) -> dict:
    """Converte os tipos nativos do psycopg para os MESMOS tipos que o
    supabase-py entregava.

    O PostgREST devolvia JSON, então toda leitura chegava como primitivo:
    `date`/`timestamptz` viravam string ISO, `numeric` virava número,
    `uuid` virava string. O psycopg devolve os objetos Python de verdade
    (`datetime.date`, `Decimal`, `UUID`) — e aí código que já existia
    quebra ou, pior, compara errado em silêncio.

    Achado ao vivo migrando o /judiciario: `etl/vacancia.py` faz
    `vp <= hoje.isoformat()` sobre `vacancia_projetada` e passou a estourar
    `TypeError: '<=' not supported between 'datetime.date' and 'str'`.
    Um `Decimal` no lugar de `float` não estouraria nada — só somaria
    diferente. Converter aqui, num lugar só, é o que mantém a promessa do
    adapter ("mesma interface") de verdade, em vez de auditar cada uma das
    dezenas de leituras.
    """
    import datetime as _dt
    from decimal import Decimal as _Decimal
    from uuid import UUID as _UUID

    out = {}
    for k, v in row.items():
        if isinstance(v, (_dt.date, _dt.datetime, _dt.time)):
            out[k] = v.isoformat()
        elif isinstance(v, _Decimal):
            out[k] = float(v)
        elif isinstance(v, _UUID):
            out[k] = str(v)
        else:
            out[k] = v
    return out


def _rows_out(rows) -> list[dict]:
    return [_row_out(r) for r in rows]


class _QueryBuilder:
    """Reimplementação mínima, sobre psycopg puro, do subconjunto da API
    fluente do supabase-py/postgrest-py que este ETL usa (`table().select()
    .eq()/.in_()/.order()/.range()`, `.upsert()/.insert()/.delete()`,
    `.execute()` devolvendo `.data`).

    Existe porque, desde a Fase 3 da migração Cloudflare/Neon, o app parou
    de ler o Supabase — mas todo este ETL (~20 módulos) continuava
    escrevendo só nele, sincronizando dado para um banco que nada mais lê.
    Trocar a biblioteca (supabase-py → psycopg) mantendo a MESMA forma de
    chamar evita reescrever cada módulo individualmente.
    """

    def __init__(self, conn, schema: str, table: str):
        self._conn = conn
        self._schema = schema
        self._table = table
        self._cols = "*"
        self._filters: list[tuple[str, str, object]] = []
        self._order: tuple[str, bool] | None = None
        self._limit: int | None = None
        self._range: tuple[int, int] | None = None
        self._op: str | None = None
        self._rows: list[dict] | None = None
        self._on_conflict: str | None = None

    # --- leitura ---
    def select(self, cols: str):
        self._cols = cols
        self._op = self._op or "select"
        return self

    def eq(self, col: str, val):
        self._filters.append((col, "=", val))
        return self

    def in_(self, col: str, vals):
        self._filters.append((col, "in", list(vals)))
        return self

    def order(self, col: str, desc: bool = False):
        self._order = (col, desc)
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def range(self, start: int, end: int):
        self._range = (start, end)
        return self

    # --- escrita ---
    def upsert(self, rows, on_conflict: str | None = None):
        self._op = "upsert"
        self._rows = rows if isinstance(rows, list) else [rows]
        self._on_conflict = on_conflict
        return self

    def insert(self, rows):
        self._op = "insert"
        self._rows = rows if isinstance(rows, list) else [rows]
        return self

    def delete(self):
        self._op = "delete"
        return self

    # --- execução ---
    def _where_sql(self, params: list) -> str:
        if not self._filters:
            return ""
        partes = []
        for col, op, val in self._filters:
            if op == "in":
                partes.append(f'"{col}" = ANY(%s)')
                params.append(val)
            else:
                partes.append(f'"{col}" = %s')
                params.append(_adapt(val))
        return " WHERE " + " AND ".join(partes)

    def execute(self) -> _Response:
        from psycopg.errors import UndefinedColumn
        from psycopg.rows import dict_row

        qualified = f'"{self._schema}"."{self._table}"'
        try:
            with self._conn.cursor(row_factory=dict_row) as cur:
                if self._op in (None, "select"):
                    params: list = []
                    sql = f"SELECT {self._cols} FROM {qualified}"
                    sql += self._where_sql(params)
                    if self._order:
                        col, desc = self._order
                        sql += f' ORDER BY "{col}" {"DESC" if desc else "ASC"}'
                    if self._range:
                        start, end = self._range
                        sql += f" LIMIT {end - start + 1} OFFSET {start}"
                    elif self._limit is not None:
                        sql += f" LIMIT {self._limit}"
                    cur.execute(sql, params)
                    return _Response(_rows_out(cur.fetchall()))

                if self._op == "delete":
                    params: list = []
                    sql = f"DELETE FROM {qualified}"
                    sql += self._where_sql(params)
                    cur.execute(sql, params)
                    return _Response([])

                if self._op in ("insert", "upsert"):
                    rows = self._rows or []
                    if not rows:
                        return _Response([])
                    cols = sorted({k for r in rows for k in r.keys()})
                    col_list = ", ".join(f'"{c}"' for c in cols)
                    placeholder_row = "(" + ", ".join(["%s"] * len(cols)) + ")"
                    values_sql = ", ".join([placeholder_row] * len(rows))
                    params = [_adapt(r.get(c)) for r in rows for c in cols]
                    sql = f"INSERT INTO {qualified} ({col_list}) VALUES {values_sql}"
                    if self._op == "upsert" and self._on_conflict:
                        conflito_cols = [c.strip() for c in self._on_conflict.split(",")]
                        conflito_sql = ", ".join(f'"{c}"' for c in conflito_cols)
                        update_cols = [c for c in cols if c not in conflito_cols]
                        if update_cols:
                            set_sql = ", ".join(f'"{c}" = EXCLUDED."{c}"' for c in update_cols)
                            sql += f" ON CONFLICT ({conflito_sql}) DO UPDATE SET {set_sql}"
                        else:
                            sql += f" ON CONFLICT ({conflito_sql}) DO NOTHING"
                    sql += " RETURNING *"
                    cur.execute(sql, params)
                    return _Response(_rows_out(cur.fetchall()))
        except UndefinedColumn as e:
            raise PgAPIError("42703", str(e)) from e

        raise RuntimeError(f"operação não suportada: {self._op}")


class PgClient:
    """Substitui o client do supabase-py: mesma chamada `.table(x)...`, mas
    fala Postgres direto na Neon em vez de PostgREST no Supabase."""

    def __init__(self, conn, schema: str):
        self._conn = conn
        self._schema = schema

    def table(self, name: str) -> _QueryBuilder:
        return _QueryBuilder(self._conn, self._schema, name)


def get_supabase_client() -> PgClient:
    """Nome mantido por compatibilidade com todo o ETL existente (~20 call
    sites, `sb = get_supabase_client()`) — desde a Fase 3 da migração
    Cloudflare/Neon o app já lê exclusivamente do Neon; sem esta troca o ETL
    continuaria gravando num banco (Supabase) que nada mais lê, apesar de
    "funcionar" sem erro nenhum. `autocommit=True`: cada chamada `.execute()`
    já é sua própria transação — não precisa de commit/rollback manual."""
    import psycopg

    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL não configurado no .env — aponte para o banco Neon "
            "(mesma variável usada por apps/web/.env.local) antes de rodar "
            "qualquer ETL."
        )

    conn = psycopg.connect(DATABASE_URL, autocommit=True)
    conn.execute(f'SET search_path TO "{SCHEMA}", public')
    return PgClient(conn, SCHEMA)


def fetch_all(query_factory, page_size: int = PAGE_SIZE) -> list[dict]:
    """Roda um select por quantas páginas `.range()` forem necessárias.

    Continua existindo depois da troca para Postgres direto porque cada
    query aqui é uma SELECT completa (LIMIT/OFFSET), não uma única
    `.execute()` reaproveitada — paginar em fatias evita uma única página
    gigante numa tabela que cresce muito.

    `query_factory` é um callable de zero argumentos que devolve um builder
    NOVO a cada chamada (ex.: `lambda: client.table("proposicoes").select("id")`)
    — não um builder pronto, para poder rechamar `.range()` a cada página.
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

    Um upsert em lote com a mesma chave de `on_conflict` repetida falha
    (Postgres recusa afetar a mesma linha duas vezes no mesmo comando). Uma
    API externa pode legitimamente devolver a mesma entidade repetida (a da
    Câmara devolve o mesmo deputado uma vez por período de filiação), então
    deduplicar aqui é a correção certa, não um remendo — e manter a última
    ocorrência espelha a semântica de um upsert (a escrita mais recente
    vence).

    A chave é composta pelos campos de `on_conflict` ("casa_id,id_externo").
    """
    chaves = [c.strip() for c in on_conflict.split(",")]
    vistos: dict[tuple, dict] = {}
    for row in rows:
        k = tuple(row.get(c) for c in chaves)
        vistos[k] = row  # último vence
    return list(vistos.values())


def upsert_em_lotes(client, table: str, rows: list[dict], tamanho: int = 500, **kwargs):
    """Upsert fatiado. Um único upsert com milhares de linhas gera um
    comando SQL gigante — fatiar mantém cada lote pequeno e, se um lote
    falhar, os anteriores já commitados não se perdem.

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

    O DDL deste projeto é aplicado à mão pelo usuário (SQL Editor / psql),
    então código novo quase sempre chega antes da migration. Sem esta rede,
    incluir uma coluna nova quebraria o upsert INTEIRO — inclusive as
    colunas que já existiam — até a migration rodar.

    Só o código 42703 (undefined_column) é tratado; qualquer outro erro
    propaga normalmente.
    """
    try:
        return client.table(table).upsert(rows, **upsert_kwargs).execute()
    except PgAPIError as e:
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
