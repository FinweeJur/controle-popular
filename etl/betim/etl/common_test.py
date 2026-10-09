"""Teste de equivalência do adapter Postgres de etl/common.py.

Roda sem banco: só monta SQL e confere o texto. Protege duas refatorações
de hotspots CodeScene:

  - 08/10/2026 (saúde 6,87): `_executar` virou quatro métodos, um por
    operação; o SQL gerado tem de ser o mesmo.
  - 09/10/2026 (saúde 6,97 -> 7,51): `_executar_insert` perdeu cc 22 e
    virou `_dedup_por_chave` + `_sufixo_on_conflict` + `_inserir_lotes`;
    o SQL e os PARAMETROS têm de ser os mesmos.

O cursor falso grava (sql, params) e devolve lista vazia — suficiente
porque as duas refatorações só mexeram em como as strings são montadas,
e o SQL montado é o único efeito observável.

  python etl/common_test.py
  (ou) python -m pytest etl/common_test.py -q
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from etl.common import _QueryBuilder, PgAPIError  # noqa: E402


class _FakeCursor:
    """Cursor falso: guarda o SQL e devolve linhas vazias."""

    def __init__(self):
        self.sqls = []
        self._rows = []

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def execute(self, sql, params=None):
        self.sqls.append((sql, params or []))

    def fetchall(self):
        return list(self._rows)

    def fetchone(self):
        return {"c": 0}


class _FakeConn:
    def __init__(self):
        self.cursor_obj = _FakeCursor()

    def cursor(self, row_factory=None):
        return self.cursor_obj


class _FakeCliente:
    def __init__(self):
        self._conn = _FakeConn()

    def conexao(self):
        return self._conn

    def reconectar(self):
        return self._conn


def _qb():
    return _QueryBuilder(_FakeCliente(), "public", "tabela")


def test_where_sql_eq_e_in():
    q = _qb().eq("id_municipio", "3106705").in_("uf", ["MG", "SP"])
    params: list = []
    sql = q._where_sql(params)
    assert sql == ' WHERE "id_municipio" = %s AND "uf" = ANY(%s)'
    assert params == ["3106705", ["MG", "SP"]]


def test_where_sql_is_null():
    q = _qb().is_("ato_id", None)
    params: list = []
    assert q._where_sql(params) == ' WHERE "ato_id" IS NULL'
    assert params == []


def test_select_com_count_devolve_where_duplo():
    """select + count monta DUAS queries (dados e count), como o PostgREST."""
    q = _qb().select("*", count="exact").limit(1).eq("id_municipio", "1")
    # sem executar de verdade: só conferir o builder de params do select
    params: list = []
    assert q._where_sql(params) == ' WHERE "id_municipio" = %s'
    assert params == ["1"]


def test_delete_sem_filtro_levanta():
    q = _qb().delete()
    try:
        # sem cursor na mão: desde o refator de 08/10/2026 o método abre
        # o próprio cursor a partir de `self._conn`. (Este teste estava
        # QUEBRADO de 08/10 até 09/10/2026, quando a assinatura mudou e
        # ninguém o atualizou — consertado junto com a saída de
        # `_executar_insert` do Complex Method.)
        q._executar_delete('"public"."tabela"')
        raise AssertionError("devia levantar RuntimeError")
    except RuntimeError as e:
        assert "DELETE sem filtro" in str(e)


def test_update_sem_filtro_levanta():
    q = _qb().update({"a": 1})
    try:
        q._executar_update('"public"."tabela"')
        raise AssertionError("devia levantar RuntimeError")
    except RuntimeError as e:
        assert "UPDATE sem filtro" in str(e)


def test_insert_vazio_devolve_resposta_vazia():
    q = _qb().insert([])
    r = q._executar_insert('"public"."tabela"')
    assert r.data == []


def test_op_desconhecida_levanta():
    q = _qb()
    q._op = "select_into"
    try:
        q._executar()
        raise AssertionError("devia levantar RuntimeError")
    except RuntimeError as e:
        assert "não suportada" in str(e)


def test_pgapierror_carrega_codigo():
    e = PgAPIError("42703", "coluna x")
    assert e.code == "42703"
    assert "coluna x" in str(e)


# ---------------------------------------------------------------------------
# INSERT / UPSERT — o escopo que saiu do Complex Method em 09/10/2026.
#
# Antes de existir teste, a prova era um script temporário que comparava a
# versão antiga com a nova usando um cursor falso. Este arquivo É a prova,
# agora permanente: o cursor falso grava (sql, params) e o que se confere é
# o SQL exato que o adapter mandaria ao banco.
#
# O teto de placeholders é abaixado nos testes de fatiamento para forcar o
# corte sem precisar de 20 mil linhas.
# ---------------------------------------------------------------------------


def _sqls(q):
    """Roda o insert do builder e devolve a lista de (sql, params)."""
    q._executar_insert('"public"."tabela"')
    return q._cliente._conn.cursor_obj.sqls


def test_insert_monta_sql_com_todas_as_linhas():
    q = _qb().insert([{"a": 1, "b": 2}, {"a": 3, "b": 4}])
    sqls = _sqls(q)
    assert len(sqls) == 1
    sql, params = sqls[0]
    assert sql == (
        'INSERT INTO "public"."tabela" ("a", "b") '
        "VALUES (%s, %s), (%s, %s) RETURNING *"
    )
    assert params == [1, 2, 3, 4]
    assert "ON CONFLICT" not in sql


def test_insert_uniao_de_chaves_diferentes():
    """Uma linha pode trazer campo a mais — a coluna vira para TODAS.

    Params são `linha x coluna`, na ordem de `cols`: 3 linhas por 3
    colunas dão 9 placeholders, com `None` onde a linha não traz o campo.
    """
    q = _qb().insert([{"a": 1}, {"a": 2, "b": 3}, {"c": 4}])
    sql, params = _sqls(q)[0]
    assert sql.startswith('INSERT INTO "public"."tabela" ("a", "b", "c")')
    assert params == [1, None, None, 2, 3, None, None, None, 4]


def test_upsert_sem_on_conflict_nao_deduplica():
    q = _qb().upsert([{"id": 1, "v": 2}, {"id": 1, "v": 9}], on_conflict=None)
    sql, params = _sqls(q)[0]
    assert "ON CONFLICT" not in sql
    assert params == [1, 2, 1, 9]


def test_upsert_deduplica_e_a_ultima_vence():
    """Chave repetida no MESMO comando é 21000 no Postgres."""
    q = _qb().upsert(
        [{"id": 1, "v": "primeira"}, {"id": 1, "v": "segunda"}, {"id": 2, "v": "outra"}],
        on_conflict="id",
    )
    sql, params = _sqls(q)[0]
    assert sql.endswith('ON CONFLICT ("id") DO UPDATE SET "v" = EXCLUDED."v" RETURNING *')
    assert params == [1, "segunda", 2, "outra"]


def test_upsert_todas_duplicatas_vira_uma():
    q = _qb().upsert([{"id": 7, "v": 1}, {"id": 7, "v": 2}, {"id": 7, "v": 3}],
                     on_conflict="id")
    sql, params = _sqls(q)[0]
    assert params == [7, 3]


def test_upsert_so_colunas_da_chave_usa_do_nothing():
    """Sem coluna a atualizar, DO UPDATE SET vazio seria erro de sintaxe."""
    q = _qb().upsert([{"id": 1}, {"id": 1}], on_conflict="id")
    sql, _ = _sqls(q)[0]
    assert ' ON CONFLICT ("id") DO NOTHING RETURNING *' in sql


def test_upsert_chave_composta_com_espaco_nos_bras():
    q = _qb().upsert(
        [{"a": 1, "b": 2, "v": 10}, {"a": 1, "b": 2, "v": 20}, {"a": 1, "b": 3, "v": 30}],
        on_conflict=" a , b ",
    )
    sql, params = _sqls(q)[0]
    assert 'ON CONFLICT ("a", "b") DO UPDATE SET "v" = EXCLUDED."v"' in sql
    assert params == [1, 2, 20, 1, 3, 30]


def test_upsert_que_nao_traz_a_chave_continua():
    """Linha sem a chave vira `id = None`; duas delas deduplicam entre si."""
    q = _qb().upsert([{"v": 1}, {"v": 2}, {"id": 1, "v": 3}], on_conflict="id")
    sql, params = _sqls(q)[0]
    # as duas primeiras têm a MESMA chave (None,), então a segunda sobrescreve
    assert params == [None, 2, 1, 3]


def test_insert_fatia_quando_passa_do_teto():
    """O teto por lote sai do número REAL de colunas (tabela larga fatia mais fino)."""
    # o patch tem de ser no modulo que POSSUI a constante: depois que ela
    # saiu de common.py para pg_adapter.py (09/10/2026), rebinding em
    # `etl.common` nao muda nada - cada modulo tem seu proprio namespace.
    import etl.pg_adapter as adapter

    teto_original = adapter._TETO_PLACEHOLDERS
    adapter._TETO_PLACEHOLDERS = 10  # 3 colunas -> lote de 3
    try:
        q = _qb().insert([{"id": i, "x": i, "y": i * 2} for i in range(12)])
        sqls = _sqls(q)
        assert len(sqls) == 4, f"esperava 4 lotes de 3, veio {len(sqls)}"
        assert [len(s[1]) for s in sqls] == [9, 9, 9, 9]
    finally:
        adapter._TETO_PLACEHOLDERS = teto_original


def test_colunas_de_e_deterministico():
    """Mesma entrada, mesma saída — é o que permite calcular duas vezes."""
    from etl.common import _colunas_de

    linhas = [{"b": 1}, {"a": 2}, {"b": 3, "c": 4}]
    assert _colunas_de(linhas) == ["a", "b", "c"]
    assert _colunas_de(linhas) == _colunas_de(linhas)


if __name__ == "__main__":
    for nome, fn in sorted(globals().items()):
        if nome.startswith("test_") and callable(fn):
            fn()
            print("ok", nome)
    print("todos os testes de common_test.py passaram")
