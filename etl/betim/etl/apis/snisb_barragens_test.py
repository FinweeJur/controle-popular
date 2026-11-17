"""Teste de `coletar_e_resolver_uf` — a barragem repetida no mesmo município.

Roda sem rede e sem banco: `_sessao`, `_consultar_uf` e `resolver_municipio`
são trocados por dublês. Protege o bug medido em 17/11/2026 na rodada de SP:

  o município de Cajobi traz o código SNISB 2488 em DUAS linhas (a mesma
  BARRAGEM FORTALEZA, com empreendedor diferente). A tabela tem chave única
  `(id_municipio, codigo_snisb)`, então as duas linhas estouravam UniqueViolation
  e a UF parava no 33º município, já com metade gravada. A coleta agora colapsa
  a repetição (fica a primeira) e conta quantas colapsou.

  python etl/apis/snisb_barragens_test.py
  (ou) python -m pytest etl/apis/snisb_barragens_test.py -q
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from etl.apis import snisb_barragens as m  # noqa: E402


def _linha(municipio: str, codigo: int, empreendedor: str) -> dict:
    return {"ING_NM_MUNICIPIO": municipio, "BAR_CD_SNISB": codigo,
            "BAR_NM_NOME": "BARRAGEM FORTALEZA", "NM_EMPREENDEDOR": empreendedor,
            "ING_SG_UFMUNICIPIO": "SP"}


def _instalar_dubles(linhas: list[dict], catalogo: dict[str, str]) -> None:
    """`catalogo` é nome -> id_ibge: o que o resolver devolveria naquela UF."""
    m._sessao = lambda: object()
    m._consultar_uf = lambda sessao, uf: linhas
    m.resolver_municipio = lambda client, nome, *, uf: (
        {"id_ibge": catalogo[nome], "nome": nome, "via": "exato", "score": 1.0}
        if nome in catalogo else None
    )


def test_repeticao_no_mesmo_municipio_colapsa_para_uma_linha() -> None:
    _instalar_dubles(
        [_linha("Cajobi", 2488, "Guarani S/A"),
         _linha("Cajobi", 2488, "Aparecido Cláudio Rodrigues")],
        {"Cajobi": "3509403"},
    )
    casadas, sem_match, repetidas = m.coletar_e_resolver_uf(None, "SP")
    assert len(casadas) == 1, casadas
    assert casadas[0]["empreendedor"] == "Guarani S/A", "fica a PRIMEIRA linha"
    assert repetidas == 1, repetidas
    assert sem_match == [], sem_match


def test_mesmo_codigo_em_municipio_diferente_nao_colapsa() -> None:
    """A chave é (id_municipio, codigo_snisb): código igual em outra cidade
    é outra barragem e tem de sobreviver."""
    _instalar_dubles(
        [_linha("Cajobi", 2488, "Guarani S/A"),
         _linha("Olímpia", 2488, "Outro")],
        {"Cajobi": "3509403", "Olímpia": "3533908"},
    )
    casadas, _, repetidas = m.coletar_e_resolver_uf(None, "SP")
    assert len(casadas) == 2, casadas
    assert repetidas == 0, repetidas


def test_municipio_sem_match_nao_entra_e_e_contado() -> None:
    _instalar_dubles([_linha("Cidade Inventada", 1, "X")], {"Cajobi": "3509403"})
    casadas, sem_match, repetidas = m.coletar_e_resolver_uf(None, "SP")
    assert casadas == [], casadas
    assert sem_match == [("Cidade Inventada", 1)], sem_match
    assert repetidas == 0, repetidas


if __name__ == "__main__":
    for nome, funcao in list(globals().items()):
        if nome.startswith("test_") and callable(funcao):
            funcao()
            print(f"ok {nome}")
    print("todos os testes passaram")
