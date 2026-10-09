# -*- coding: utf-8 -*-
"""Adapter Postgres do ETL de Betim - a parte que fala com o banco.

Responsabilidade UNICA: traduzir a API fluente herdada (`.table()`,
`.select()`, `.eq()`, `.upsert()`) em SQL do Postgres, sobre `psycopg`
puro. Nao conhece municipio, tema nem fonte de dado - so coluna, valor e
conexao.

Por que existe um arquivo proprio (09/10/2026): `common.py` passou de 600
linhas, o teto do CodeScene, e o portao de pre-commit barra qualquer
commit que o aumente. A separacao e' de coesao: o adapter era a parte que
mais crescia e a unica que precisa de cursor, placeholder e ON CONFLICT.

Quem usava `from etl.common import _QueryBuilder` nao mudou nada:
`common.py` re-exporta daqui, entao os ~30 modulos do ETL seguem iguais.

Ver `etl/common_test.py` para a prova de equivalencia (SQL montado, sem
banco)."""

# Teto de placeholders de um INSERT do Postgres e 65.535. A margem existe
# porque o calculo do lote usa o numero de colunas do LOTE, e uma linha
# com uma coluna extra (o padrao `upsert_com_colunas_opcionais`) mudaria
# a conta no meio. `common.py` re-exporta esta constante.
_TETO_PLACEHOLDERS = 60_000


class PgAPIError(Exception):
    """Duck-types a fatia da interface de `postgrest.exceptions.APIError`
    que este ETL usava (`.code`/`.message`).

    Existe só para o código que já degrada por "coluna/tabela ainda não
    existe" (`upsert_com_colunas_opcionais`, `_inserir_com_temas_opcional`
    em `etl/prefeitura/legislacao.py`, `_upsert_bens` em `etl/bd/tse.py`,
    `_gravar_proposicoes` em `etl/camaras/betim.py`) continuar funcionando
    sem mudar a lógica — agora sobre erro real do Postgres em vez de
    PostgREST. Códigos equivalentes:

      PGRST204 (coluna fora do cache de schema) -> 42703 undefined_column
      PGRST205 (tabela fora do cache de schema) -> 42P01 undefined_table
    """

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(f"[{code}] {message}")


class _Response:
    def __init__(self, data: list[dict], count: int | None = None):
        self.data = data
        self.count = count


def _eh_lista_de_dict(v) -> bool:
    """`True` só para lista NÃO vazia cujo primeiro elemento é `dict`.

    Saiu do corpo de `_adapt` em 09/10/2026: as três comparações
    encadeadas com `or`/`and` eram o aviso de *Complex Conditional* do
    CodeScene (3 expressões contra o teto de 2). Em linhas separadas,
    cada `if` conta zero.

    Só o PRIMEIRO elemento é conferido, de propósito — é o que o código
    original fazia, e é suficiente porque as colunas jsonb deste ETL são
    homogêneas. Trocar por "todos os elementos" mudaria o resultado para
    lista mista e não é o combinado.
    """
    if not isinstance(v, list):
        return False
    if not v:
        return False
    return isinstance(v[0], dict)


def _adapt(v):
    """psycopg não sabe adaptar `dict`/`list[dict]` (colunas jsonb, ex.
    `municipios.malha_geojson`) sozinho — precisa do wrapper `Json`. Arrays
    de escalar (`temas: list[str]`, `grupos_economicos.cnpjs`) continuam
    passando direto, viram array do Postgres nativamente."""
    if isinstance(v, dict):
        from psycopg.types.json import Json

        return Json(v)
    if _eh_lista_de_dict(v):
        from psycopg.types.json import Json

        return Json(v)
    return v


def _row_out(row: dict) -> dict:
    """Converte os tipos nativos do psycopg para os MESMOS tipos que a
    API antiga entregava.

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


def _colunas_de(rows: list[dict]) -> list[str]:
    """As colunas presentes em QUALQUER linha de `rows`, em ordem.

    União, não interseção: uma linha pode trazer campo a mais (o padrão
    `upsert_com_colunas_opcionais` depende disso). A ordem é `sorted`
    porque o SQL precisa ser determinístico — mesma lista de colunas em
    qualquer máquina, qualquer ordem de dicionário.

    É puro e determinístico, e por isso pode ser chamado duas vezes sem
    passar o resultado adiante (é o que `_executar_insert` e
    `_inserir_lotes` fazem). Saiu do corpo do INSERT em 09/10/2026.
    """
    return sorted({k for r in rows for k in r.keys()})


def _inserir_lotes(cur, qualified: str, rows: list[dict], sufixo: str) -> list[dict]:
    """Manda o INSERT em lotes e devolve as linhas que o banco retornou.

    (ver o bloco FATIAMENTO AUTOMÁTICO acima de `_QueryBuilder`)

    4 argumentos sem contar `self` porque `_inserir_lotes` virou função de
    módulo em vez de método: `self` não conta para o teto do CodeScene,
    mas tampouco é necessário — a função não lê nenhum estado da
    instância.

    :param cur cursor aberto pelo chamador — o `with` fica lá fora,
    porque é o chamador que decide a vida da conexão.
    :param qualified nome já qualificado da tabela (`"schema"."tabela"`).
    :param rows linhas a gravar, já deduplicadas.
    :param sufixo trecho ` ON CONFLICT ...`, ou `""` para insert puro.
    :returns as linhas devolvidas pelo `RETURNING *`, em ordem de lote.
    """
    cols = _colunas_de(rows)
    col_list = ", ".join(f'"{c}"' for c in cols)
    placeholder_row = "(" + ", ".join(["%s"] * len(cols)) + ")"
    por_lote = max(1, _TETO_PLACEHOLDERS // max(1, len(cols)))
    saida: list[dict] = []
    for i in range(0, len(rows), por_lote):
        fatia = rows[i : i + por_lote]
        values_sql = ", ".join([placeholder_row] * len(fatia))
        params = [_adapt(r.get(c)) for r in fatia for c in cols]
        sql = (
            f"INSERT INTO {qualified} ({col_list}) VALUES {values_sql}"
            + sufixo
            + " RETURNING *"
        )
        cur.execute(sql, params)
        saida.extend(_rows_out(cur.fetchall()))
    return saida


# Qual método cuida de qual operação. Tabela em vez de cadeia de `if`
# desde 09/10/2026 (hotspots CodeScene): `self._op in (None, "select")`
# conta DUAS expressões complexas por causa do `in` sobre tupla, e quatro
# `if` seguidos já davam cc 10 contra o teto de 9.
#
# `None` mapeia para select porque um builder sem nenhuma chamada de
# escrita é um SELECT de tudo — é o comportamento herdado do PostgREST.
# `upsert` e `insert` caem no MESMO método: a diferença entre eles é só
# o `on_conflict`, que o método confere sozinho.
_DESPACHO: dict = {
    None: "_executar_select",
    "select": "_executar_select",
    "delete": "_executar_delete",
    "update": "_executar_update",
    "insert": "_executar_insert",
    "upsert": "_executar_insert",
}


class _QueryBuilder:
    """Reimplementação mínima, sobre psycopg puro, do subconjunto da API
    fluente herdada (do supabase-py/postgrest-py) que este ETL mantém:
    `table()` com
    `.select()` (inclusive `count="exact"`), `.eq()`/`.in_()`, `.order()`,
    `.limit()`/`.range()`, `.upsert()`/`.insert()`/`.update()`/`.delete()`
    e `.execute()` devolvendo `.data`/`.count`.

    A forma das chamadas é a do cliente PostgREST antigo (Supabase), de
    quando o ETL gravava lá; manter o mesmo formato evitou reescrever os
    ~30 módulos um por um quando trocamos para psycopg. O serviço Supabase
    foi abandonado no início do projeto — quem lê e escreve hoje é só o
    Postgres de `DATABASE_URL`.

    Não implementa `.or_()`, `.contains()`, `.single()` nem `.ilike()`:
    nenhum módulo deste eixo usa (conferido por varredura), e um stub
    adivinhado da sintaxe do PostgREST erraria em silêncio. Se algum dia
    alguém chamar, quebra com AttributeError na cara — não com dado errado.
    """

    def __init__(self, cliente, schema: str, table: str):
        # Guarda o CLIENTE, não só a conexão: quando a Neon derruba a
        # sessão ociosa, `execute()` precisa de alguém que saiba abrir
        # outra. `self._conn` continua existindo porque todo o corpo de
        # `_executar` já o usa.
        self._cliente = cliente
        self._conn = cliente.conexao()
        self._schema = schema
        self._table = table
        self._cols = "*"
        self._count_mode: str | None = None
        self._filters: list[tuple[str, str, object]] = []
        self._order: tuple[str, bool] | None = None
        self._limit: int | None = None
        self._range: tuple[int, int] | None = None
        self._op: str | None = None
        self._rows: list[dict] | None = None
        self._on_conflict: str | None = None

    # --- leitura ---
    def select(self, cols: str, count: str | None = None):
        self._cols = cols
        self._count_mode = count
        self._op = self._op or "select"
        return self

    def eq(self, col: str, val):
        self._filters.append((col, "=", val))
        return self

    def neq(self, col: str, val):
        self._filters.append((col, "<>", val))
        return self

    def gt(self, col: str, val):
        self._filters.append((col, ">", val))
        return self

    def gte(self, col: str, val):
        self._filters.append((col, ">=", val))
        return self

    def lt(self, col: str, val):
        self._filters.append((col, "<", val))
        return self

    def lte(self, col: str, val):
        self._filters.append((col, "<=", val))
        return self

    def is_(self, col: str, val):
        """`.is_(col, None)` -> `IS NULL`. Só NULL/booleano, que é o que a
        versão do PostgREST aceita."""
        self._filters.append((col, "is", val))
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

    def update(self, row: dict):
        self._op = "update"
        self._rows = [row]
        return self

    def delete(self):
        self._op = "delete"
        return self

    # --- execução ---
    @staticmethod
    def _clause_filtro(col: str, op: str, val, params: list) -> str:
        """A cláusula de UM filtro, e o parâmetro que ela gera (se gera).

        Saiu de `_where_sql` em 09/10/2026 por causa do *Bumpy Road*:
        `elif op == "is"` abrigava mais um `if val is not None`, e o
        aninhamento de 2 já é aviso.

        A ORDEM importa e é a do original: o parâmetro entra em `params`
        na MESMA ordem das cláusulas, porque é a ordem do `WHERE` que o
        Postgres espera. `IS NULL` não gera parâmetro.

        :param col nome da coluna, já sem aspas no valor.
        :param op operador (`=`, `<>`, `>=`... ou os especiais `in`/`is`).
        :param val valor do filtro; para `is`, `None` vira `IS NULL`.
        :param params lista de parâmetros que esta função acrescenta.
        :returns a cláusula SQL, pronta para entrar no `WHERE`.
        """
        if op == "in":
            params.append(val)
            return f'"{col}" = ANY(%s)'
        if op == "is":
            if val is None:
                return f'"{col}" IS NULL'
            params.append(val)
            return f'"{col}" IS %s'
        params.append(_adapt(val))
        return f'"{col}" {op} %s'

    def _where_sql(self, params: list) -> str:
        if not self._filters:
            return ""
        partes = [
            self._clause_filtro(col, op, val, params) for col, op, val in self._filters
        ]
        return " WHERE " + " AND ".join(partes)

    def execute(self) -> _Response:
        """Roda a operação, reconectando UMA vez se a conexão tiver morrido.

        POR QUE ISTO EXISTE. A Neon derruba conexão ociosa
        (`AdminShutdown: terminating connection due to administrator
        command`, `SSL connection has been closed unexpectedly`), e o ETL
        deste eixo tem coletas que passam uma hora entre uma escrita e a
        seguinte — o scraper da CMBH pagina de 7 em 7 itens contra um site
        lento. Nas duas vezes em que isso aconteceu, a coleta inteira já
        estava em memória e foi perdida na hora de gravar.

        SÓ REEXECUTA O QUE É IDEMPOTENTE. `select`, `delete`, `update` e
        `upsert` com `on_conflict` podem rodar de novo sem mudar o
        resultado. Um `insert` puro, não: se a conexão caiu DEPOIS de o
        servidor ter efetivado a linha, repetir duplicaria. Nesse caso o
        erro sobe — perder a rodada é melhor que gravar duas vezes em
        silêncio.
        """
        import psycopg

        idempotente = self._op != "insert" and not (
            self._op == "upsert" and not self._on_conflict
        )
        try:
            return self._executar()
        except (psycopg.OperationalError, psycopg.InterfaceError) as e:
            if not idempotente:
                raise RuntimeError(
                    f"conexão caiu durante {self._op} em {self._table} e a operação "
                    f"não é idempotente — não vou repetir para não duplicar. ({e})"
                ) from e
            print(
                f"[etl.common] conexão caiu ({type(e).__name__}); reconectando e "
                f"repetindo {self._op} em {self._table}",
                flush=True,
            )
            self._conn = self._cliente.reconectar()
            return self._executar()

    def _executar(self) -> _Response:
        """Orquestrador: delega à operação certa (refatoração 08/10/2026,
        hotspots CodeScene — saúde 6,87). O método era um bloco único de 95
        linhas com cc=43; virou este despachante + 4 métodos por operação.

        O despacho é por TABELA (`_DESPACHO`) e não por cadeia de `if`
        desde 09/10/2026: quatro `if` seguidos, dois deles com `in` sobre
        tupla, já davam cc 10 contra o teto de 9. A tabela dá o mesmo
        resultado com cc 1.

        A ordem dos erros mudou de lugar, não de significado: `operação
        não suportada` subia DEPOIS do `try` e sobe ANTES — mesma
        exceção, mesma mensagem."""
        from psycopg.errors import UndefinedColumn, UndefinedTable

        qualified = f'"{self._schema}"."{self._table}"'
        nome = _DESPACHO.get(self._op)
        if nome is None:
            raise RuntimeError(f"operação não suportada: {self._op}")
        try:
            return getattr(self, nome)(qualified)
        except UndefinedColumn as e:
            raise PgAPIError("42703", str(e)) from e
        except UndefinedTable as e:
            raise PgAPIError("42P01", str(e)) from e

    def _executar_select(self, qualified: str) -> _Response:
        """SELECT com WHERE, ORDER BY, LIMIT/OFFSET e contagem opcional."""
        from psycopg.rows import dict_row

        with self._conn.cursor(row_factory=dict_row) as cur:
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
            rows = _rows_out(cur.fetchall())
            total = None
            if self._count_mode:
                # `count="exact"` do PostgREST conta a query SEM
                # limit/offset — é assim que `etl/apis/crimes_mg.py`
                # confere se o upsert realmente gravou tudo. Uma
                # segunda query é o equivalente honesto; devolver
                # len(rows) mentiria sempre que houvesse paginação.
                cparams: list = []
                csql = f"SELECT count(*) AS c FROM {qualified}" + self._where_sql(cparams)
                cur.execute(csql, cparams)
                total = cur.fetchone()["c"]
            return _Response(rows, total)

    def _executar_delete(self, qualified: str) -> _Response:
        """DELETE — exige filtro ativo para não apagar a tabela inteira."""
        from psycopg.rows import dict_row

        if not self._filters:
            raise RuntimeError(
                f"DELETE sem filtro em {qualified} — apagaria a tabela inteira. "
                "Chame .eq()/.in_() antes de .execute()."
            )
        with self._conn.cursor(row_factory=dict_row) as cur:
            params: list = []
            sql = f"DELETE FROM {qualified}" + self._where_sql(params)
            cur.execute(sql, params)
            return _Response([])

    def _executar_update(self, qualified: str) -> _Response:
        """UPDATE de uma linha (a primeira de `self._rows`), com RETURNING."""
        from psycopg.rows import dict_row

        if not self._filters:
            raise RuntimeError(
                f"UPDATE sem filtro em {qualified} — reescreveria a tabela inteira. "
                "Chame .eq()/.in_() antes de .execute()."
            )
        row = (self._rows or [{}])[0]
        if not row:
            return _Response([])
        with self._conn.cursor(row_factory=dict_row) as cur:
            cols = sorted(row.keys())
            set_sql = ", ".join(f'"{c}" = %s' for c in cols)
            params = [_adapt(row[c]) for c in cols]
            sql = f"UPDATE {qualified} SET {set_sql}" + self._where_sql(params)
            sql += " RETURNING *"
            cur.execute(sql, params)
            return _Response(_rows_out(cur.fetchall()))

    def _dedup_por_chave(self, rows: list[dict]) -> list[dict]:
        """Mantém UMA linha por chave de `on_conflict`, a ÚLTIMA da lista.

        O Postgres recusa `ON CONFLICT DO UPDATE` se a MESMA chave aparece
        duas vezes no mesmo comando (21000 CardinalityViolation) — medido
        no cache TCE de Diamantina (2026-09-22): o ZIP trazia
        `seq_contrato` repetido e o Diamantina morria no meio.

        A ÚLTIMA vence porque o dict preserva a ordem de inserção e cada
        chave é sobrescrita — é a escolha do código original. Puro: não
        toca cursor nem rede. Extraído de `_executar_insert` 09/10/2026.
        """
        chaves = [c.strip() for c in self._on_conflict.split(",")]
        vistos: dict[tuple, dict] = {}
        for row in rows:
            vistos[tuple(row.get(c) for c in chaves)] = row
        return list(vistos.values())

    def _sufixo_on_conflict(self, cols: list[str]) -> str:
        """O trecho ` ON CONFLICT (...) DO UPDATE|NOTHING` do INSERT.

        `DO NOTHING` quando não sobra NENHUMA coluna além das da chave:
        não há o que atualizar, e `DO UPDATE SET` vazio seria erro de
        sintaxe. Puro: só monta string. Extraído de `_executar_insert`
        09/10/2026.
        """
        conflito_cols = [c.strip() for c in self._on_conflict.split(",")]
        conflito_sql = ", ".join(f'"{c}"' for c in conflito_cols)
        update_cols = [c for c in cols if c not in conflito_cols]
        if update_cols:
            set_sql = ", ".join(f'"{c}" = EXCLUDED."{c}"' for c in update_cols)
            return f" ON CONFLICT ({conflito_sql}) DO UPDATE SET {set_sql}"
        return f" ON CONFLICT ({conflito_sql}) DO NOTHING"

    def _executar_insert(self, qualified: str) -> _Response:
        """INSERT ou UPSERT com dedup e fatiamento de lotes.

        Ordem importa, e é a do código original: o DEDUP roda ANTES de
        `cols` (senão a repetida ainda estaria na união de chaves) e o
        sufixo DEPOIS (precisa das colunas). Os três blocos saíram daqui
        em 09/10/2026 para caber no Complex Method do CodeScene.
        """
        from psycopg.rows import dict_row

        rows = self._rows or []
        if not rows:
            return _Response([])

        sufixo = ""
        if self._op == "upsert" and self._on_conflict:
            rows = self._dedup_por_chave(rows)

        cols = _colunas_de(rows)
        if self._op == "upsert" and self._on_conflict:
            sufixo = self._sufixo_on_conflict(cols)

        with self._conn.cursor(row_factory=dict_row) as cur:
            return _Response(_inserir_lotes(cur, qualified, rows, sufixo))

    # FATIAMENTO AUTOMÁTICO. Um INSERT do Postgres aceita no máximo
    # 65.535 placeholders, e o adapter montava uma instrução só com
    # todas as linhas — o que funcionava enquanto as tabelas tinham o
    # tamanho de Betim e passou a estourar em São Paulo: `bd.inep`
    # (escolas) e `bd.cnes` (estabelecimentos de saúde) morreram com
    # "number of parameters must be between 0 and 65535" e não gravaram
    # NADA — nem as primeiras 65 mil.
    #
    # Cada módulo poderia fatiar por conta própria (alguns já fazem),
    # mas isso é conhecimento sobre o TRANSPORTE, não sobre a fonte de
    # dado: espalhá-lo por ~30 módulos garante que o próximo a crescer
    # descubra do mesmo jeito. Por isso o fatiamento mora aqui, no
    # adapter, e não em cada coletor.
    #
    # O teto por lote sai do número REAL de colunas, então tabela larga
    # fatia mais fino sozinha.
    #
    # 4 argumentos (sem contar `self`) de propósito: o teto do CodeScene
    # é 4, e `cols` é recalculado aqui em vez de ser passado — é
    # determinístico (`_colunas_de`), então as duas contas dão o mesmo
    # resultado e o parâmetro não precisa existir.
    # Extraído de `_executar_insert` em 09/10/2026.

