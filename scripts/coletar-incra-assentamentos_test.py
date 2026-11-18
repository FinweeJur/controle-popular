"""Testes de `coletar-incra-assentamentos.py` — sem rede.

Roda sem pytest:  python scripts/coletar-incra-assentamentos_test.py
Protege o que foi medido em 18/11/2026:
  1. O CSV NÃO tem campo de UF e o prefixo do código é da Superintendência
     Regional, não do estado (`MB` = Sul do Pará, `SM`/`AT` = Santarém). Se a
     UF sair do prefixo, 702 projetos do Pará somem — foi o erro da sondagem
     de 17/11/2026 (494 no lugar de 1.196).
  2. Área no padrão brasileiro com 4 decimais (`"4.356,0000"`).
  3. Cache válido não rebaixa; corpo curto não sobrescreve cache bom.
"""
import importlib.util
import tempfile
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "incra", Path(__file__).resolve().parent / "coletar-incra-assentamentos.py")
m = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(m)

CABECALHO = ("MINISTERIO;;;;;Data: 06/03/2026\n\n"
             "Projetos de Reforma Agraria;;\n"
             "CODIGO DO PROJETO;NOME DO PROJETO;MUNICIPIO SEDE;AREA (ha);"
             "NUMERO DE FAMILIAS ASSENTADAS;FAMILIAS ASSENT.;FASE;TIPO;NUMERO;"
             "DATA DE CRIACAO;FORMA OBTENCAO;DATA OBTENCAO;\n")

BLOCO_PA_SUL = "Superintendencia Regional: REGIONAL DO SUL DO PARA - SR (27);;;;;\n"
BLOCO_SANTAREM = "Superintendencia Regional: REGIONAL DE SANTAREM/PA - SR (30);;;;;\n"
BLOCO_MSF = "Superintendencia Regional: REGIONAL DO MEDIO SAO FRANCISCO/MSF - SR (29);;;;;\n"

CSV = (CABECALHO
       + BLOCO_PA_SUL
       + "MB0001000;PA RIBEIRAO DE FOGO;REDENCAO;7.796,9298;72;72;03;1;0557;09/07/1987;Desapropriacao;28/11/1985\n"
       + BLOCO_SANTAREM
       + "SM0001000;PIC MONTE ALEGRE;MONTE ALEGRE;509.753,0000;87;3649;07;14;4296;14/05/1943;Doacao;10/10/1942\n"
       + BLOCO_MSF
       + "MF0003000;PA FEDERACAO;PETROLINA;1.756,9430;23;25;06;1;018;12/09/1989;Adjudicacao;27/02/1989\n"
       + "MF0004000;PA SEM MUNICIPIO CONHECIDO;XIQUE XIQUE DO OESTE;10,0;1;1;05;1;1;01/01/2000;;\n")

MAPA = {"PETROLINA": {"PE"}, "MONTE ALEGRE": {"PA"}, "REDENCAO": {"PA"}}


def _parse() -> list[dict]:
    linhas, _sem_uf = m._parse(CSV, MAPA)
    return linhas


def test_uf_sai_da_superintendencia_nao_do_prefixo():
    linhas = {p["codigo"]: p for p in _parse()}
    assert linhas["MB0001000"]["uf"] == "PA", linhas["MB0001000"]["uf"]
    assert linhas["SM0001000"]["uf"] == "PA", linhas["SM0001000"]["uf"]
    # bloco Médio São Francisco cruza BA/PE: desempata o município sede
    assert linhas["MF0003000"]["uf"] == "PE", linhas["MF0003000"]["uf"]


def test_municipio_desconhecido_fica_sem_uf_em_vez_de_chutar():
    linhas = {p["codigo"]: p for p in _parse()}
    assert linhas["MF0004000"]["uf"] is None


def test_area_familias_e_fase():
    linhas = {p["codigo"]: p for p in _parse()}
    assert linhas["MB0001000"]["area_ha"] == 7796.9298
    assert linhas["SM0001000"]["area_ha"] == 509753.0
    assert linhas["SM0001000"]["familias_capacidade"] == 87
    assert linhas["SM0001000"]["familias_assentadas"] == 3649
    assert linhas["SM0001000"]["fase_nome"] == ""  # código 07 não está no dicionário
    assert linhas["MB0001000"]["fase_nome"] == "Criado"


def test_num_brasileiro_com_quatro_decimais():
    assert m._num("4.356,0000") == 4356.0
    assert m._num("34.709.055,2020") == 34709055.202
    assert m._num("") == 0.0


def test_resumo_por_uf_fecha_com_o_total():
    linhas = _parse()
    por_uf, soma = m._resumo(linhas)
    total = round(sum(p["area_ha"] for p in linhas), 4)
    assert round(soma, 4) == total, (soma, total)
    assert sum(v["projetos"] for v in por_uf.values()) == len(linhas)
    assert por_uf["PA"]["projetos"] == 2


def test_corpo_curto_nao_passa_por_csv():
    antigo_bytes, antigo_linhas = m.MIN_BYTES, m.MIN_LINHAS
    m.MIN_BYTES, m.MIN_LINHAS = 0, 1
    try:
        assert m._parece_csv(CSV.encode("latin-1"))
        assert not m._parece_csv(b"HTTP 200 OK mas isso nao e o CSV")
    finally:
        m.MIN_BYTES, m.MIN_LINHAS = antigo_bytes, antigo_linhas


def test_cache_valido_nao_rebaixa():
    with tempfile.TemporaryDirectory() as tmp:
        antigo = (m.CACHE, m.BRUTO, m.MIN_BYTES, m.MIN_LINHAS)
        m.CACHE = Path(tmp)
        m.BRUTO = m.CACHE / "assentamentos-geral.csv"
        m.MIN_BYTES, m.MIN_LINHAS = 0, 1
        m.BRUTO.write_bytes(CSV.encode("latin-1"))
        m._get = lambda *a, **k: (_ for _ in ()).throw(
            AssertionError("bateu na rede com cache válido"))
        try:
            assert m._baixar() == CSV
        finally:
            m.CACHE, m.BRUTO, m.MIN_BYTES, m.MIN_LINHAS = antigo


if __name__ == "__main__":
    for nome, funcao in list(globals().items()):
        if nome.startswith("test_") and callable(funcao):
            funcao()
            print(f"ok {nome}")
    print("todos os testes passaram")
