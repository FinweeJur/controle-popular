"""Testes do checkpoint namespaced `{ibge}:{…}` e da fila (cidade completa)."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # etl/betim

from etl.pncp import checkpoint as ck  # noqa: E402
from etl.pncp.fila import (  # noqa: E402
    chaves_ibge,
    cidade_completa,
    proximas_prontas,
    resumo_ibge,
)
from etl.pncp.manifesto import montar_manifesto  # noqa: E402


def test_unidade_pronta_ano_anterior_pula_e_ano_corrente_rele():
    estado = {
        "3106705:123:2024": {"status": "ok", "registros": 10},
        "3106705:123:2026": {"status": "ok", "registros": 10},
    }
    assert ck.unidade_pronta(estado, "3106705:123:2024", ano_atual=2026)
    assert not ck.unidade_pronta(estado, "3106705:123:2026", ano_atual=2026)


def test_unidade_pronta_parcial_nunca_esta_pronta():
    estado = {"3106705:123:2024": {"status": "parcial", "pagina": 3}}
    assert not ck.unidade_pronta(estado, "3106705:123:2024", ano_atual=2026)


def test_unidade_pronta_chave_sem_ano_mantem_comportamento_antigo():
    estado = {"3106705:123": {"status": "ok"}}
    assert ck.unidade_pronta(estado, "3106705:123", ano_atual=2026)


def test_registros_parciais_so_conta_unidade_parcial():
    estado = {
        "parcial": {"status": "parcial", "registros": 42},
        "ok": {"status": "ok", "registros": 99},
        "vazio": {"status": "parcial"},
    }
    assert ck.registros_parciais(estado, "parcial") == 42
    assert ck.registros_parciais(estado, "ok") == 0
    assert ck.registros_parciais(estado, "vazio") == 0
    assert ck.registros_parciais(estado, "ausente") == 0


def test_chaves_ibge_namespace():
    estado = {
        "3106705:123:2024": {"status": "ok"},
        "3106705:456:2024": {"status": "parcial"},
        "3550308:123:2024": {"status": "ok"},
        "3106705": {"status": "ok"},  # sem dois níveis — não counts
    }
    chaves = chaves_ibge(estado, "3106705")
    assert set(chaves) == {"3106705:123:2024", "3106705:456:2024"}


def test_resumo_ibge():
    estado = {
        "3106705:123:2024": {"status": "ok"},
        "3106705:456:2024": {"status": "parcial"},
    }
    total, ok, nao = resumo_ibge(estado, "3106705")
    assert (total, ok, nao) == (2, 1, 1)


def test_cidade_completa_varios_casos():
    c_ok = {"3106705:123:2024": {"status": "ok"}}
    l_ok = {"3106705:1:2024": {"status": "ok"}}
    assert cidade_completa(c_ok, l_ok, "3106705")

    # Uma chave parcial → não completa
    c_par = {"3106705:123:2024": {"status": "parcial"}}
    assert not cidade_completa(c_par, l_ok, "3106705")

    # Zero chaves nos dois → não rodou
    assert not cidade_completa({}, {}, "3106705")

    # Só contratos → não completa
    assert not cidade_completa(c_ok, {}, "3106705")

    # Só licitações → não completa
    assert not cidade_completa({}, l_ok, "3106705")


def test_proximas_prontas_pula_completas_e_nao_prontas():
    cidades = [
        {"id_municipio": "3106705", "uf": "MG", "tipo": "polo-interior",
         "cnpj_prefeitura": "123", "nome": "Betim", "regiao": "Sudeste"},
        {"id_municipio": "1100049", "uf": "RR", "tipo": "polo-interior",
         "cnpj_prefeitura": "", "nome": "Boa Vista", "regiao": "Norte"},
        {"id_municipio": "3165200", "uf": "MG", "tipo": "polo-interior",
         "cnpj_prefeitura": "456", "nome": "Sabara", "regiao": "Sudeste"},
    ]
    manifesto = montar_manifesto(cidades)
    # 3106705 = principal (excluída); 1100049 = bloqueada; 3165200 = pronta
    estado_c = {"3165200:123:2024": {"status": "ok"}}
    estado_l = {"3165200:1:2024": {"status": "ok"}}
    fila = proximas_prontas(manifesto, estado_c, estado_l, pular_completas=True)
    assert fila == []  # Sabará completa → pula

    fila2 = proximas_prontas(manifesto, {}, {}, pular_completas=True)
    assert [x["ibge"] for x in fila2] == ["3165200"]
    # bloqueada e principal nunca entram
    assert all(x["status"] == "pronta" for x in fila2)
