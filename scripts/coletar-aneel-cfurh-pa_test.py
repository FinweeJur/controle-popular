"""Teste de `_num` — o parser de dinheiro da ANEEL.

Roda sem rede. Protege o erro medido em 17/11/2026: a primeira rodada do
coletor publicou **R$ 13,4 milhões** no lugar de **R$ 2,83 bilhões** porque
`float("7669,57")` estoura e o `except` transformava todo valor com vírgula em
zero — o total saía menor, sem erro nenhum na tela.

  python scripts/coletar-aneel-cfurh-pa_test.py
  (ou) python -m pytest scripts/coletar-aneel-cfurh-pa_test.py -q
"""
import importlib.util
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "cfurh", Path(__file__).resolve().parent / "coletar-aneel-cfurh-pa.py")
m = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(m)


def _perto(a: float, b: float, tol: float = 0.01) -> bool:
    return abs(a - b) <= tol


def test_virgula_decimal_brasileira():
    # valor real da primeira linha do recurso (Santarém, 1996-11)
    assert _perto(m._num("7669,5704999999998"), 7669.5705), m._num("7669,5704999999998")


def test_ponto_de_milhar_com_virgula_decimal():
    assert _perto(m._num("9.998.949,66"), 9998949.66), m._num("9.998.949,66")


def test_numero_ja_numerico_e_dot_decimal():
    assert _perto(m._num(1234.56), 1234.56)
    assert _perto(m._num("1234.56"), 1234.56)


def test_vazio_none_e_lixo_viram_zero_sem_estourar():
    assert m._num(None) == 0.0
    assert m._num("") == 0.0
    assert m._num("-") == 0.0


if __name__ == "__main__":
    for nome, funcao in list(globals().items()):
        if nome.startswith("test_") and callable(funcao):
            funcao()
            print(f"ok {nome}")
    print("todos os testes passaram")
