"""Testes de `coletar-funai-terras-indigenas.py` — sem rede.

Roda sem pytest:  python scripts/coletar-funai-terras-indigenas_test.py
Protege três decisões medidas em 18/11/2026:
  1. `uf_sigla`/`municipio_nome` vêm CONCATENADOS na fonte (`"AM,PA"`,
     `"... e ..."`): a TI que divide UF não pode virar duas linhas, senão a
     contagem nacional e a soma de hectares mentem.
  2. área no padrão brasileiro (`"19.064.417,8"`) — `float()` cru daria 0.
  3. cache válido não rebaixa: re-rodar sem `--refetch` NÃO toca na rede, e
     cache quebrado cai para a rede em vez de publicar lixo.
"""
import csv
import importlib.util
import io
import tempfile
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "funai", Path(__file__).resolve().parent / "coletar-funai-terras-indigenas.py")
m = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(m)

CABECALHO = ",".join(["FID"] + m.CAMPOS)


def _csv(*linhas: dict) -> str:
    """Monta o CSV com `csv.writer`: vírgula dentro do campo (área BR) precisa
    de aspas, e à mão isso erra a coluna em silêncio."""
    saida = io.StringIO()
    w = csv.writer(saida, lineterminator="\n")
    w.writerow(["FID"] + m.CAMPOS)
    for i, linha in enumerate(linhas, 1):
        w.writerow([f"tis_poligonais_portarias.{i}"]
                   + [linha.get(c, "") for c in m.CAMPOS])
    return saida.getvalue()


LINHAS = [
    {"terrai_codigo": "101", "terrai_nome": "Acapuri de Cima", "etnia_nome": "Kokama",
     "municipio_nome": "Fonte Boa,Itacoatiara", "uf_sigla": "AM",
     "superficie_perimetro_ha": "18393,9411", "fase_ti": "Regularizada",
     "modalidade_ti": "Tradicionalmente ocupada"},
    {"terrai_codigo": "201", "terrai_nome": "Acimã", "etnia_nome": "Apurinã",
     "municipio_nome": "Lábrea e Tapauá", "uf_sigla": "AM,PA",
     "superficie_perimetro_ha": "40686,034", "fase_ti": "Declarada",
     "modalidade_ti": "Tradicionalmente ocupada"},
    {"terrai_codigo": "301", "terrai_nome": "Teste", "etnia_nome": "Etnia",
     "municipio_nome": "Alta Floresta", "uf_sigla": "MT",
     "superficie_perimetro_ha": "1000,5", "fase_ti": "Em Estudo",
     "modalidade_ti": "Dominial Indígena"},
]


def test_parser_quebra_listas_e_nao_duplica_ti():
    linhas = m._parse(_csv(*LINHAS))
    assert len(linhas) == 3, len(linhas)
    assert linhas[1]["ufs"] == ["AM", "PA"], linhas[1]["ufs"]
    assert linhas[1]["municipios"] == ["Lábrea", "Tapauá"], linhas[1]["municipios"]
    assert linhas[0]["municipios"] == ["Fonte Boa", "Itacoatiara"], linhas[0]["municipios"]


def test_area_brasileira_vira_numero():
    assert m._num("19.064.417,8") == 19064417.8, m._num("19.064.417,8")
    assert m._num("18393,9411") == 18393.94
    assert m._num("") == 0.0 and m._num("-") == 0.0


def test_soma_por_uf_fecha_com_o_total():
    linhas = m._parse(_csv(*LINHAS))
    por_uf, soma_uf, compartilhadas, compartilhada_ha = m._resumo(linhas)
    total = sum(t["superficie_perimetro_ha"] for t in linhas)
    assert round(soma_uf + compartilhada_ha, 2) == round(total, 2), (soma_uf, compartilhada_ha, total)
    assert sum(v["tis"] for v in por_uf.values()) == len(linhas) - 1
    # a TI "AM,PA" divide UF: não entra em nenhuma das duas, vai para a lista
    assert len(compartilhadas) == 1 and compartilhadas[0]["ufs"] == ["AM", "PA"]
    assert por_uf["AM"]["tis"] == 1 and por_uf["PA"]["tis"] == 0
    assert por_uf["AM"]["compartilhadas"] == 1 and por_uf["PA"]["compartilhadas"] == 1


def test_corpo_xml_com_status_200_nao_e_dado():
    excecao = b'<?xml version="1.0" ?><ServiceExceptionReport></ServiceExceptionReport>'
    assert not m._parece_csv(excecao.decode("utf-8"))
    assert m._parece_csv(_csv(*LINHAS))


def test_cache_valido_nao_rebaixa():
    with tempfile.TemporaryDirectory() as tmp:
        antigo, velho_bruto, velho_meta = m.CACHE, m.BRUTO, m.META
        m.CACHE = Path(tmp)
        m.BRUTO = m.CACHE / "tis_poligonais_portarias-brasil.csv"
        m.META = m.CACHE / "meta.json"
        m.BRUTO.write_text(_csv(*LINHAS), encoding="utf-8")

        def _proibido(*a, **k):
            raise AssertionError("bateu na rede com cache válido")

        m._get = _proibido
        try:
            texto = m._baixar()
            assert texto.startswith(CABECALHO), texto[:40]
        finally:
            m.CACHE, m.BRUTO, m.META = antigo, velho_bruto, velho_meta


def test_cache_quebrado_cai_para_a_rede():
    with tempfile.TemporaryDirectory() as tmp:
        antigo, velho_bruto, velho_meta = m.CACHE, m.BRUTO, m.META
        m.CACHE = Path(tmp)
        m.BRUTO = m.CACHE / "tis_poligonais_portarias-brasil.csv"
        m.META = m.CACHE / "meta.json"
        m.BRUTO.write_text("<html>403</html>", encoding="utf-8")
        chamadas = []

        def _falso(params, nome):
            chamadas.append(nome)
            return _csv(*LINHAS).encode("utf-8")

        m._get = _falso
        try:
            assert m._baixar().startswith(CABECALHO)
            assert chamadas == ["csv"], chamadas
        finally:
            m.CACHE, m.BRUTO, m.META = antigo, velho_bruto, velho_meta


if __name__ == "__main__":
    for nome, funcao in list(globals().items()):
        if nome.startswith("test_") and callable(funcao):
            funcao()
            print(f"ok {nome}")
    print("todos os testes passaram")
