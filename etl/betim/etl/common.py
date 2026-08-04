import os
from dotenv import load_dotenv

load_dotenv()

ID_MUNICIPIO_DEFAULT = "3106705"
CITY_HALL_CNPJ = "18715391000196"
CITY_LAT = float(os.environ.get("CITY_LAT", "-19.9681"))
CITY_LNG = float(os.environ.get("CITY_LNG", "-44.1983"))

DATABASE_URL = os.environ.get("DATABASE_URL")

PAGE_SIZE = 1000

# Teto de placeholders de um INSERT do Postgres é 65.535. A margem existe
# porque o cálculo do lote usa o número de colunas do LOTE, e uma linha com
# uma coluna extra (o padrão `upsert_com_colunas_opcionais`) mudaria a conta
# no meio.
_TETO_PLACEHOLDERS = 60_000


# Schema Postgres deste app. O banco (Neon) é COMPARTILHADO com o
# /congresso e o /judiciario, que vivem em schemas próprios; as tabelas
# deste eixo são as do `public` (61 tabelas), como já eram no Supabase.
SCHEMA = "public"


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


def _adapt(v):
    """psycopg não sabe adaptar `dict`/`list[dict]` (colunas jsonb, ex.
    `municipios.malha_geojson`) sozinho — precisa do wrapper `Json`. Arrays
    de escalar (`temas: list[str]`, `grupos_economicos.cnpjs`) continuam
    passando direto, viram array do Postgres nativamente."""
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
    fluente do supabase-py/postgrest-py que este ETL usa: `table()` com
    `.select()` (inclusive `count="exact"`), `.eq()`/`.in_()`, `.order()`,
    `.limit()`/`.range()`, `.upsert()`/`.insert()`/`.update()`/`.delete()`
    e `.execute()` devolvendo `.data`/`.count`.

    Existe porque, desde a Fase 3 da migração Cloudflare/Neon, o app
    (apps/web) parou de ler o Supabase — mas todo este ETL continuava
    escrevendo só nele, sincronizando dado para um banco que nada mais lê:
    falha silenciosa, sem erro nenhum. Trocar a biblioteca (supabase-py →
    psycopg) mantendo a MESMA forma de chamar evita reescrever os ~30
    módulos um por um.

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
    def _where_sql(self, params: list) -> str:
        if not self._filters:
            return ""
        partes = []
        for col, op, val in self._filters:
            if op == "in":
                partes.append(f'"{col}" = ANY(%s)')
                params.append(val)
            elif op == "is":
                partes.append(f'"{col}" IS NULL' if val is None else f'"{col}" IS %s')
                if val is not None:
                    params.append(val)
            else:
                partes.append(f'"{col}" {op} %s')
                params.append(_adapt(val))
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
        from psycopg.errors import UndefinedColumn, UndefinedTable
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

                if self._op == "delete":
                    if not self._filters:
                        raise RuntimeError(
                            f"DELETE sem filtro em {qualified} — apagaria a tabela inteira. "
                            "Chame .eq()/.in_() antes de .execute()."
                        )
                    params: list = []
                    sql = f"DELETE FROM {qualified}" + self._where_sql(params)
                    cur.execute(sql, params)
                    return _Response([])

                if self._op == "update":
                    if not self._filters:
                        raise RuntimeError(
                            f"UPDATE sem filtro em {qualified} — reescreveria a tabela inteira. "
                            "Chame .eq()/.in_() antes de .execute()."
                        )
                    row = (self._rows or [{}])[0]
                    if not row:
                        return _Response([])
                    cols = sorted(row.keys())
                    set_sql = ", ".join(f'"{c}" = %s' for c in cols)
                    params = [_adapt(row[c]) for c in cols]
                    sql = f"UPDATE {qualified} SET {set_sql}" + self._where_sql(params)
                    sql += " RETURNING *"
                    cur.execute(sql, params)
                    return _Response(_rows_out(cur.fetchall()))

                if self._op in ("insert", "upsert"):
                    rows = self._rows or []
                    if not rows:
                        return _Response([])
                    cols = sorted({k for r in rows for k in r.keys()})
                    col_list = ", ".join(f'"{c}"' for c in cols)
                    placeholder_row = "(" + ", ".join(["%s"] * len(cols)) + ")"

                    sufixo = ""
                    if self._op == "upsert" and self._on_conflict:
                        conflito_cols = [c.strip() for c in self._on_conflict.split(",")]
                        conflito_sql = ", ".join(f'"{c}"' for c in conflito_cols)
                        update_cols = [c for c in cols if c not in conflito_cols]
                        if update_cols:
                            set_sql = ", ".join(f'"{c}" = EXCLUDED."{c}"' for c in update_cols)
                            sufixo = f" ON CONFLICT ({conflito_sql}) DO UPDATE SET {set_sql}"
                        else:
                            sufixo = f" ON CONFLICT ({conflito_sql}) DO NOTHING"

                    # FATIAMENTO AUTOMÁTICO. Um INSERT do Postgres aceita no
                    # máximo 65.535 placeholders, e o adapter montava uma
                    # instrução só com todas as linhas — o que funcionava
                    # enquanto as tabelas tinham o tamanho de Betim e passou a
                    # estourar em São Paulo: `bd.inep` (escolas) e `bd.cnes`
                    # (estabelecimentos de saúde) morreram com "number of
                    # parameters must be between 0 and 65535" e não gravaram
                    # NADA — nem as primeiras 65 mil.
                    #
                    # Cada módulo poderia fatiar por conta própria (alguns já
                    # fazem), mas isso é conhecimento sobre o TRANSPORTE, não
                    # sobre a fonte de dado: espalhá-lo por ~30 módulos
                    # garante que o próximo a crescer descubra do mesmo jeito.
                    # O teto por lote sai do número real de colunas, então
                    # tabela larga fatia mais fino sozinha.
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
                    return _Response(saida)
        except UndefinedColumn as e:
            raise PgAPIError("42703", str(e)) from e
        except UndefinedTable as e:
            raise PgAPIError("42P01", str(e)) from e

        raise RuntimeError(f"operação não suportada: {self._op}")


class PgClient:
    """Substitui o client do supabase-py: mesma chamada `.table(x)...`, mas
    fala Postgres direto na Neon em vez de PostgREST no Supabase.

    Dono da conexão, e por isso o único que pode trocá-la: a Neon encerra
    sessão ociosa e várias coletas deste eixo passam muito tempo entre uma
    escrita e a seguinte. Ver `_QueryBuilder.execute`."""

    def __init__(self, dsn: str, schema: str):
        self._dsn = dsn
        self._schema = schema
        self._conn = None
        self.conexao()

    def conexao(self):
        """A conexão viva. Reabre se estiver fechada — o caso comum é o
        `conn.closed` já verdadeiro depois de o servidor ter derrubado a
        sessão, sem que nada do lado do cliente tenha percebido."""
        import psycopg

        if self._conn is None or self._conn.closed:
            self._conn = psycopg.connect(self._dsn, autocommit=True)
            self._conn.execute(f'SET search_path TO "{self._schema}", public')
        return self._conn

    def reconectar(self):
        """Descarta a conexão atual e abre outra. Chamado por `execute()`
        quando um erro de transporte já aconteceu — aí `closed` pode ainda
        estar falso, então forçar é o único caminho."""
        try:
            if self._conn is not None:
                self._conn.close()
        except Exception:
            # Fechar uma conexão que o servidor já matou pode estourar; o
            # ponto aqui é largar a referência, não fechar com elegância.
            pass
        self._conn = None
        return self.conexao()

    def table(self, name: str) -> _QueryBuilder:
        return _QueryBuilder(self, self._schema, name)


def get_supabase_client() -> PgClient:
    """Nome mantido por compatibilidade com todo o ETL existente (~30 call
    sites, `client = get_supabase_client()`) — desde a Fase 3 da migração
    Cloudflare/Neon o app já lê exclusivamente do Neon; sem esta troca o ETL
    continuaria gravando num banco (Supabase) que nada mais lê, apesar de
    "funcionar" sem erro nenhum. `autocommit=True`: cada chamada
    `.execute()` já é sua própria transação — não precisa de commit/rollback
    manual, e um erro num lote não invalida os anteriores."""
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL não configurado no .env — aponte para o banco Neon "
            "(mesma variável usada por apps/web/.env.local) antes de rodar "
            "qualquer ETL."
        )

    return PgClient(DATABASE_URL, SCHEMA)


def carregar_municipio(id_municipio: str) -> dict:
    """A linha de `municipios`, com `fontes` já desembrulhado.

    POR QUE ISTO EXISTE (bug real, 2026-08-03): vários módulos aceitavam a
    cidade por `--id-municipio` mas mantinham os OUTROS parâmetros da mesma
    cidade como default de argparse — `etl.apis.anp` tinha
    `--uf MG --municipio BETIM`. Rodar `--id-municipio 3550308` sozinho
    coletou os 63 postos de Betim e os gravou com o id de São Paulo; como o
    upsert casa por `cnpj`, os postos de Betim não foram duplicados, foram
    REETIQUETADOS — a página de Betim ficou vazia e a de São Paulo, errada.
    Nenhum erro foi levantado: os dois argumentos são `str` e o comando
    parecia certo.

    A correção estrutural é esta função: o nome, a UF e as configurações da
    cidade saem do BANCO a partir do id, não da linha de comando. O id vira
    a única coisa que o operador escolhe, e escolher errado passa a ser
    impossível de forma silenciosa — ou o id existe e traz tudo consistente,
    ou não existe e o módulo aborta.
    """
    client = get_supabase_client()
    linhas = (
        client.table("municipios")
        .select("id_municipio, nome, uf, cnpj_prefeitura, lat, lng, branding, fontes")
        .eq("id_municipio", id_municipio)
        .execute()
        .data
    )
    if not linhas:
        raise RuntimeError(
            f"id_municipio={id_municipio} não existe em `municipios`. "
            "Semeie a cidade antes de rodar o ETL (supabase/betim/migrations/)."
        )
    m = dict(linhas[0])
    m["fontes"] = m.get("fontes") or {}
    m["branding"] = m.get("branding") or {}
    return m


def nome_para_fonte_externa(nome: str) -> str:
    """"São Paulo" -> "SAO PAULO".

    Convenção compartilhada por várias fontes federais que casam município
    por NOME em vez de código: a ANP devolve `data: []` — sem erro — para
    "São Paulo" ou "Sao Paulo", e só responde a "SAO PAULO". O Portal da
    Transparência escreve o ente como "MUNICIPIO DE SAO PAULO". Centralizar
    a normalização evita que cada módulo reinvente (e erre) o `unicodedata`.
    """
    import unicodedata

    sem_acento = unicodedata.normalize("NFD", nome)
    sem_acento = "".join(c for c in sem_acento if unicodedata.category(c) != "Mn")
    return sem_acento.upper()


def fetch_all(query_factory, page_size: int = PAGE_SIZE) -> list[dict]:
    """Roda um select por quantas páginas `.range()` forem necessárias.

    Continua existindo depois da troca para Postgres direto (onde não há
    mais o corte de 1000 linhas do PostgREST) porque cada query aqui é uma
    SELECT completa com LIMIT/OFFSET — paginar em fatias evita uma única
    página gigante numa tabela que cresce. O bug que motivou o helper foi
    achado ao vivo em 2026-07-21 em `_check_regra_10` de `etl/alertas.py`
    (despesas tem 4263+ linhas; anos inteiros faltavam em silêncio).

    `query_factory` é um callable de zero argumentos que devolve um builder
    NOVO a cada chamada (ex.:
    `lambda: client.table("contratos").select("id, valor").eq("id_municipio", x)`)
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


# `analises.ato_id` e `analises.proposicao_id` são `references ... on delete
# cascade` (migration 0033). Todo refresh total nestas duas tabelas é um
# delete, e o delete leva a análise junto — sem erro, sem log, sem nada.
_COLUNA_DE_ANALISE = {"atos_oficiais": "ato_id", "proposicoes": "proposicao_id"}


def _abortar_se_cascatear_analise(
    client, table: str, filtros: dict, tag: str, permitido: bool
) -> None:
    """Impede que um refresh total apague análise garantista em silêncio.

    O PERIGO É REAL E CARO. `refresh_completo_seguro` é delete+insert, então
    toda linha renasce com uuid novo; e como a 0033 pendurou `analises` em
    `atos_oficiais`/`proposicoes` com `on delete cascade`, refazer a
    legislação de uma cidade apaga as análises DELA. As 245 análises do
    banco custaram uma fila inteira de trabalho de modelo, e some tudo sem
    exceção, sem aviso, sem linha de log — o sintoma seria a tela de alertas
    ficar vazia dias depois e ninguém saber por quê.

    Não basta o guarda de redução: aqui a tabela pode até CRESCER (foi o que
    aconteceu com as proposições de BH, 3.667 -> 3.681) e a análise morrer
    do mesmo jeito.

    O guarda não é esperto: se há análise sob o mesmo recorte, ele para e
    manda quem chamou decidir. Reanalisar é caro, mas é caro e visível — o
    contrário do que acontecia aqui.
    """
    coluna = _COLUNA_DE_ANALISE.get(table)
    if not coluna or permitido:
        return
    id_municipio = filtros.get("id_municipio")
    if not id_municipio:
        return
    # `analises` só tem as duas colunas de objeto, e exatamente uma delas é
    # preenchida por linha (a 0033 garante). Então "aponta para atos" é o
    # mesmo que "proposicao_id IS NULL", e vice-versa — o que evita depender
    # de um `IS NOT NULL` que este cliente não expõe.
    outra = "proposicao_id" if coluna == "ato_id" else "ato_id"
    try:
        n = (
            client.table("analises")
            .select("id", count="exact")
            .limit(1)
            .eq("id_municipio", id_municipio)
            .is_(outra, None)
            .execute()
            .count
            or 0
        )
    except PgAPIError as e:
        # 42P01 = tabela ausente (migration 0033 não rodada neste banco):
        # não há análise para perder, seguir é correto. Qualquer outro erro
        # PROPAGA — um guarda que vira aviso quando a checagem falha não é
        # guarda nenhum, e foi assim que este quase entrou.
        if getattr(e, "code", None) != "42P01":
            raise
        return
    if n == 0:
        return
    raise RuntimeError(
        f"{table}: há {n} análise(s) garantista(s) de id_municipio={id_municipio} "
        f"apontando para esta tabela, e `analises.{coluna}` é ON DELETE CASCADE — "
        "o refresh total apagaria todas elas em silêncio. Exporte/reimporte as "
        "análises depois, ou rode com permitir_perda_de_analise=True se a perda "
        "for aceitável e você for reanalisar."
    )


def refresh_completo_seguro(
    client,
    table: str,
    filtros: dict,
    rows: list[dict],
    *,
    chunk: int = 200,
    permitir_reducao: bool = False,
    permitir_perda_de_analise: bool = False,
    ao_reduzir: str = "abort",
    rotulo: str | None = None,
) -> bool:
    """`delete` + `insert` (refresh total) que se RECUSA a encolher a tabela.

    Existe por causa de um dano real: em 2026-07-29 uma rodada de
    `etl/camaras/verbas.py` levou `verbas_indenizatorias` de 98 para 43
    linhas sem erro nenhum. O módulo apagava tudo do município e reinseria
    só o que a raspagem daquela rodada devolveu -- e a raspagem depende de
    quantas linhas a grid Blazor resolveu renderizar. Fonte rendeu menos,
    banco perdeu histórico.

    Regra: se a raspagem trouxe MENOS linhas do que já existem no banco sob
    os mesmos `filtros`, nada é apagado. O delete só acontece quando
    `len(rows) >= contagem_atual` -- crescimento e reescrita do mesmo
    tamanho seguem normais (é assim que correções de valor entram).

    `ao_reduzir`:
    - "abort" (padrão): levanta RuntimeError, a rodada falha alto.
    - "skip": imprime aviso, devolve False e segue -- para os call sites que
      varrem N entidades e não devem perder as outras N-1 por causa de uma.

    `permitir_reducao=True` é a válvula de escape para quando a redução é
    real (registro removido na fonte): confirme na fonte e rode de novo com
    a flag. Nunca é o default.

    `permitir_perda_de_analise=True` libera o outro guarda, o de
    `_abortar_se_cascatear_analise` — leia a docstring dele antes.

    Devolve True se escreveu, False se pulou.
    """
    if not rows:
        raise ValueError(
            f"refresh_completo_seguro em '{table}': `rows` vazio nunca deve chegar aqui "
            "-- o caller precisa tratar raspagem vazia antes (senão isso é um delete puro)."
        )
    if ao_reduzir not in ("abort", "skip"):
        raise ValueError(f"ao_reduzir inválido: {ao_reduzir!r} (use 'abort' ou 'skip')")

    tag = rotulo or f"etl.common/{table}"

    q = client.table(table).select("*", count="exact").limit(1)
    for col, val in filtros.items():
        q = q.eq(col, val)
    atuais = q.execute().count or 0

    if len(rows) < atuais and not permitir_reducao:
        msg = (
            f"{table}: raspagem trouxe {len(rows)} linha(s) mas o banco já tem {atuais} "
            f"sob {filtros} — refresh total abortado para não apagar histórico. "
            "Se a fonte realmente perdeu registros, confirme e rode com "
            "permitir_reducao=True (--permitir-reducao)."
        )
        if ao_reduzir == "abort":
            raise RuntimeError(msg)
        print(f"[{tag}] AVISO: {msg}")
        return False

    _abortar_se_cascatear_analise(client, table, filtros, tag, permitir_perda_de_analise)

    q = client.table(table).delete()
    for col, val in filtros.items():
        q = q.eq(col, val)
    q.execute()

    for i in range(0, len(rows), chunk):
        client.table(table).insert(rows[i : i + chunk]).execute()

    if len(rows) < atuais:
        print(f"[{tag}] redução aceita explicitamente: {atuais} -> {len(rows)} linha(s).")
    return True


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
    try:
        return client.table(table).upsert(rows, **upsert_kwargs).execute()
    except PgAPIError as e:
        # 42703 = Postgres undefined_column. Antes da troca para psycopg
        # também se tratava PGRST204 (PostgREST não achou a coluna no cache
        # de schema); falando com o banco direto, esse caso não existe mais
        # -- o erro chega cru como 42703.
        if e.code != "42703":
            raise
        print(
            f"[etl.common] upsert em '{table}': coluna opcional ainda não existe "
            f"({e.message}) -- gravando sem {colunas_opcionais} até a migration rodar."
        )
        rows_sem_opcionais = [
            {k: v for k, v in row.items() if k not in colunas_opcionais} for row in rows
        ]
        return client.table(table).upsert(rows_sem_opcionais, **upsert_kwargs).execute()
