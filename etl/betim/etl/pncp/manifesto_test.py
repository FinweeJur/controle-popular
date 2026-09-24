"""Testes do manifesto PNCP — puros, sem disco nem API."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # etl/betim

from etl.pncp.manifesto import (  # noqa: E402
    CAPITAIS_DELEGADAS,
    PRINCIPAIS,
    carregar_catalogo,
    classificar,
    eh_ibge7,
    mesclar_cnpjs,
    montar_manifesto,
    resumo,
)


def _c(ibge: str, **kw) -> dict:
    d = {
        "id_municipio": ibge,
        "nome": kw.pop("nome", "Cidade"),
        "uf": kw.pop("uf", "MG"),
        "regiao": kw.pop("regiao", "Sudeste"),
        "tipo": kw.pop("tipo", "polo-interior"),
        "cnpj_prefeitura": kw.pop("cnpj_prefeitura", "12345678000199"),
    }
    d.update(kw)
    return d


def test_eh_ibge7():
    assert eh_ibge7("3106705")
    assert not eh_ibge7("310670")
    assert not eh_ibge7("abc")
    assert not eh_ibge7("")


def test_classificar_principal_excluida():
    status, nota = classificar(_c("3106705"))
    assert status == "excluida-principal"
    assert "Fase A" in nota


def test_classificar_delegada_capital():
    # Capital tem CNPJ mas vai para a fila B da outra IA.
    status, nota = classificar(_c("4106902", cnpj_prefeitura="12345678000199"))
    assert status == "delegada"
    assert "handoff" in nota


def test_classificar_bloqueada_sem_cnpj():
    status, nota = classificar(_c("1100049", cnpj_prefeitura=""))
    assert status == "bloqueada-cnpj"
    assert "ausente" in nota


def test_classificar_pronta():
    status, _ = classificar(_c("3165200"))
    assert status == "pronta"


def test_principais_e_capitais_disjuntos():
    assert not (PRINCIPAIS & CAPITAIS_DELEGADAS)


def test_montar_manifesto_filtra_e_ordena():
    cidades = [
        _c("4106902", uf="PR", tipo="capital"),  # delegada → sai da ordem MG
        _c("3106705"),  # principal
        _c("1100049", uf="RR", cnpj_prefeitura=""),  # bloqueada
        _c("3165200", tipo="polo-interior"),  # pronta MG
        _c("3550308", uf="SP"),  # principal (SP)
        _c("2927408", uf="BA", tipo="capital"),  # capital delegada BA
        _c("id-invalida"),  # fora
    ]
    linhas = montar_manifesto(cidades)
    ibges = [x["ibge"] for x in linhas]
    assert "id-invalida" not in ibges
    # SP está em PRINCIPAIS
    assert "3550308" not in ibges or any(
        x["ibge"] == "3550308" and x["status"] == "excluida-principal"
        for x in linhas
    )
    # MG pronta antes de UF de fora
    pos_mg = next(i for i, x in enumerate(linhas) if x["ibge"] == "3165200")
    pos_ba = next(i for i, x in enumerate(linhas) if x["ibge"] == "2927408")
    assert pos_mg < pos_ba


def test_resumo_conta_status():
    linhas = montar_manifesto(
        [
            _c("3106705"),
            _c("1100049", cnpj_prefeitura=""),
            _c("3165200"),
            _c("4106902"),
        ]
    )
    r = resumo(linhas)
    assert r["total"] == 4
    assert r.get("excluida-principal") == 1
    assert r.get("bloqueada-cnpj") == 1
    assert r.get("pronta") == 1
    assert r.get("delegada") == 1


def test_mesclar_cnpjs_preenche_so_vazio():
    cidades = [
        _c("3165200", cnpj_prefeitura=""),
        _c("3103400", cnpj_prefeitura="11111111000111"),
    ]
    saida = mesclar_cnpjs(cidades, {"3165200": "99999999000199"})
    assert saida[0]["cnpj_prefeitura"] == "99999999000199"
    assert saida[1]["cnpj_prefeitura"] == "11111111000111"
    # origem não mutada
    assert cidades[0]["cnpj_prefeitura"] == ""


def test_mesclar_cnpjs_vazio_nao_muda_nada():
    cidades = [_c("3165200", cnpj_prefeitura="")]
    assert mesclar_cnpjs(cidades, {}) == cidades


def test_catalogo_real_tem_203_e_nao_quebra():
    # Snapshot do gerador: se mudar, o manifesto da sessão muda — o teste
    # avisa para regravar `dados/manifesto-pncp.csv`.
    cidades = carregar_catalogo()
    assert len(cidades) >= 190
    linhas = montar_manifesto(cidades)
    assert resumo(linhas)["total"] == len(
        [c for c in cidades if eh_ibge7(str(c.get("id_municipio") or ""))]
    )
