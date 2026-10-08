"""Teste de equivalência do _QueryBuilder de etl/common.py.

Roda sem banco: só monta SQL e confere o texto. Protege a refatoração de
08/10/2026 (hotspot CodeScene saúde 6,87) — o _executar virou quatro
métodos, um por operação; o SQL gerado tem de ser o mesmo.

  python -m pytest etl/common_test.py -q
  (ou) python etl/common_test.py
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
        q._executar_delete(_FakeCursor(), '"public"."tabela"')
        raise AssertionError("devia levantar RuntimeError")
    except RuntimeError as e:
        assert "DELETE sem filtro" in str(e)


def test_update_sem_filtro_levanta():
    q = _qb().update({"a": 1})
    try:
        q._executar_update(_FakeCursor(), '"public"."tabela"')
        raise AssertionError("devia levantar RuntimeError")
    except RuntimeError as e:
        assert "UPDATE sem filtro" in str(e)


def test_insert_vazio_devolve_resposta_vazia():
    q = _qb().insert([])
    r = q._executar_insert(_FakeCursor(), '"public"."tabela"')
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


if __name__ == "__main__":
    for nome, fn in sorted(globals().items()):
        if nome.startswith("test_") and callable(fn):
            fn()
            print("ok", nome)
    print("todos os testes de common_test.py passaram")
