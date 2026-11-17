"""Teste de `_ler_lista` — o parser da grade do SIMLAM (SEMAS-PA).

Roda sem rede: o HTML é um recorte da grade real de
`ListarEmpreendimento.aspx` (17/11/2026), com o "Rondon do Pará" que a
primeira linha traz.

  python scripts/coletar-semas-pa-licencas_test.py
  (ou) python -m pytest scripts/coletar-semas-pa-licencas_test.py -q
"""
import importlib.util
import sys
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "semas_pa", Path(__file__).resolve().parent / "coletar-semas-pa-licencas.py")
m = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(m)

GRADE = """
<table id="ctl00_baseBody_dgListagem">
 <tr class="title-table"><td>Nome/Raz&#227;o Social</td><td>CNPJ</td>
     <td>I.E</td><td>Munic&#237;pio</td><td>A&#231;&#245;es</td></tr>
 <tr>
  <td><span id="ctl00_baseBody_dgListagem_ctl03_fitNomeRazaoSocialDominacao"
       title="." AcaoVisualizar="Inherent">.</span></td>
  <td><span id="ctl00_baseBody_dgListagem_ctl03_fitCnpj"
       AcaoVisualizar="Inherent"></span></td>
  <td><span id="ctl00_baseBody_dgListagem_ctl03_fitInteressado"
       AcaoVisualizar="Inherent"></span></td>
  <td><span id="ctl00_baseBody_dgListagem_ctl03_fitMunicipio"
       title="Rondon do Par&#225;" AcaoVisualizar="Inherent">Rondon do Par&#225;</span></td>
  <td><a onclick="abrirEmpreendimento(124758); return false;"
         id="ctl00_baseBody_dgListagem_ctl03_lkbVisualizar">ver</a></td>
 </tr>
 <tr>
  <td><span id="ctl00_baseBody_dgListagem_ctl04_fitNomeRazaoSocialDominacao">MINERACAO RIO VERDE LTDA</span></td>
  <td><span id="ctl00_baseBody_dgListagem_ctl04_fitCnpj">12.345.678/0001-90</span></td>
  <td><span id="ctl00_baseBody_dgListagem_ctl04_fitInteressado">15.222.333-4</span></td>
  <td><span id="ctl00_baseBody_dgListagem_ctl04_fitMunicipio">Parauapebas</span></td>
  <td><a onclick="abrirEmpreendimento(99); return false;"
         id="ctl00_baseBody_dgListagem_ctl04_lkbVisualizar">ver</a></td>
 </tr>
</table>
"""


def test_le_as_duas_linhas_com_municipio() -> None:
    linhas = m._ler_lista(GRADE)
    assert len(linhas) == 2, linhas
    assert [r["id_simlam"] for r in linhas] == [124758, 99]
    assert linhas[0]["municipio"] == "Rondon do Pará", linhas[0]["municipio"]
    assert linhas[1]["cnpj"] == "12.345.678/0001-90", linhas[1]["cnpj"]
    assert linhas[1]["inscricao_estadual"] == "15.222.333-4", linhas[1]["inscricao_estadual"]
    assert linhas[1]["razao_social"] == "MINERACAO RIO VERDE LTDA", linhas[1]["razao_social"]


def test_celula_vazia_vira_none_e_nao_string_vazia() -> None:
    """A lista real traz razão social "." e CNPJ em branco: gravado como está,
    sem inventar valor."""
    primeira = m._ler_lista(GRADE)[0]
    assert primeira["razao_social"] == "."
    assert primeira["cnpj"] is None, primeira["cnpj"]
    assert primeira["inscricao_estadual"] is None, primeira["inscricao_estadual"]


def test_linha_sem_link_de_empreendimento_e_ignorada() -> None:
    """O cabeçalho da grade é um `<tr>` sem `abrirEmpreendimento` — não é dado."""
    cabecalho = GRADE[GRADE.index("<tr class"):GRADE.index("</tr>") + 5]
    assert m._ler_lista(cabecalho) == []


if __name__ == "__main__":
    for nome, funcao in list(globals().items()):
        if nome.startswith("test_") and callable(funcao):
            funcao()
            print(f"ok {nome}")
    print("todos os testes passaram")
