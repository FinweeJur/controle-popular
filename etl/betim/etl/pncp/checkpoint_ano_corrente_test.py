"""Prova do checkpoint PNCP: ano corrente é relido e falha de coleta vira `parcial`.

Sem rede e sem banco: `contratos.sync` recebe stubs de banco e de coleta.
"""
from __future__ import annotations

import datetime as dt
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # etl/betim

import etl.pncp.checkpoint as ck  # noqa: E402
import etl.pncp.contratos as contratos  # noqa: E402

MUNICIPIO = "3106705"
CNPJ = "123"


def _rodar_sync_com_falha(monkeypatch, estado: dict) -> list[dict]:
    """Roda `contratos.sync` num único ano com banco e coleta substituídos."""
    chamadas: list[dict] = []

    def coleta_que_falha(*args, **kwargs):
        chamadas.append(kwargs)
        raise RuntimeError("PNCP 500")

    monkeypatch.setattr(contratos, "get_db", lambda: object())
    monkeypatch.setattr(
        contratos,
        "carregar_municipio",
        lambda _id: {
            "nome": "Município Teste",
            "cnpj_prefeitura": CNPJ,
            "fontes": {"contratos_fonte": None, "cnpjs_orgao": [CNPJ]},
        },
    )
    monkeypatch.setattr(contratos, "iter_contratos", coleta_que_falha)
    monkeypatch.setattr(
        contratos, "upsert_com_colunas_opcionais", lambda *a, **k: None
    )
    monkeypatch.setattr(ck, "carregar", lambda _nome: estado)
    monkeypatch.setattr(ck, "salvar", lambda _nome, _estado: None)

    contratos.sync(MUNICIPIO, None, dt.date.today().year)
    return chamadas


def test_ano_corrente_com_ok_e_relido():
    """`ok` do ano corrente não vale para sempre: o PNCP publica durante o ano."""
    ano = dt.date.today().year
    chave = f"{MUNICIPIO}:{CNPJ}:{ano}"
    assert not ck.unidade_pronta({chave: {"status": "ok"}}, chave)


def test_ano_passado_com_ok_continua_pulado():
    """Ano fechado não precisa ser refeito: a correção não pode desligar o skip."""
    ano = dt.date.today().year - 1
    chave = f"{MUNICIPIO}:{CNPJ}:{ano}"
    assert ck.unidade_pronta({chave: {"status": "ok"}}, chave)


def test_contratos_rele_ano_corrente_com_ok(monkeypatch):
    """Checkpoint `ok` do ano corrente não pode impedir a coleta."""
    ano = dt.date.today().year
    chave = f"{MUNICIPIO}:{CNPJ}:{ano}"
    estado = {chave: {"status": "ok", "pagina": 0, "registros": 99}}

    chamadas = _rodar_sync_com_falha(monkeypatch, estado)

    assert chamadas, "ano corrente com checkpoint ok foi pulado"


def test_contratos_falha_na_coleta_grava_parcial(monkeypatch):
    """Coleta interrompida por erro não pode fechar a unidade como `ok`."""
    ano = dt.date.today().year
    chave = f"{MUNICIPIO}:{CNPJ}:{ano}"
    estado: dict = {}

    _rodar_sync_com_falha(monkeypatch, estado)

    assert estado[chave]["status"] == "parcial"
    assert ck.pagina_retomar(estado, chave) == 1
