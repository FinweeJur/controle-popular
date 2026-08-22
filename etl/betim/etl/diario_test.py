r"""etl.diario_test — calibração de `classificar_ato` contra os MESMOS 70
títulos reais que `apps/web/lib/diario/classificarAto.test.ts` usa.

Lê `apps/web/lib/diario/fixtures/diamantina-70-titulos.json` DIRETO da
origem (não uma cópia): o port em `etl/diario.py` tem de bater com a
calibração original título por título, e duplicar a fixture criaria duas
fontes de verdade que podem divergir em silêncio na próxima vez que alguém
editar só uma das duas.

Roda de dois jeitos (o repo ainda não tem suíte Python instalada):

    python -m pytest etl/diario_test.py
    python etl/diario_test.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from etl.diario import classificar_ato, normalizar_titulo_ato  # noqa: E402

# `parents[3]`: etl/betim/etl/diario_test.py -> etl/betim/etl -> etl/betim ->
# etl -> <raiz do worktree> -> apps/web/lib/diario/fixtures/...
FIXTURE = (
    Path(__file__).resolve().parents[3]
    / "apps"
    / "web"
    / "lib"
    / "diario"
    / "fixtures"
    / "diamantina-70-titulos.json"
)


def _amostra() -> list[dict]:
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


# ─────────────────────── amostra real de Diamantina ──────────────────────


def test_toda_amostra_bate_com_o_esperado():
    amostra = _amostra()
    erros = []
    for item in amostra:
        obtido = classificar_ato(item["titulo"])
        if obtido != item["esperado"]:
            erros.append(
                f"[{item['data']} {item['entidade']}] esperado {item['esperado']}, "
                f"obtido {obtido}: {item['titulo']}"
            )
    assert erros == []


def test_95_por_cento_ou_mais_recebe_tipo_distinto_de_outro():
    amostra = _amostra()
    com_tipo = sum(1 for item in amostra if classificar_ato(item["titulo"]) != "outro")
    assert com_tipo / len(amostra) >= 0.95


def test_fixture_tem_pelo_menos_70_titulos():
    # Guarda contra fixture truncada por engano — a calibração citada no
    # cabeçalho do classificador TS e no coletor SIGPub é "70 títulos".
    assert len(_amostra()) >= 70


# ───────────────────────── casos de borda das regras ─────────────────────


def test_homologacao_de_contrato_e_contrato_nao_edital():
    assert classificar_ato("TERMO DE HOMOLOGAÇÃO AO CONTRATO Nº 08/2025") == "contrato"
    assert classificar_ato("EXTRATO DE CONTRATO AO PROCESSO LICITATÓRIO Nº 14/2025") == "contrato"


def test_homologacao_de_processo_licitatorio_e_edital():
    assert classificar_ato("TERMO DE HOMOLOGAÇÃO AO PROCESSO LICITATÓRIO 08/2026") == "edital"


def test_aditivo_de_convenio_e_convenio_mesmo_sem_a_palavra_convenio():
    assert classificar_ato("2º TERMO ADITIVO AO TERMO DE COLABORAÇÃO Nº 002/2025") == "convenio"
    assert classificar_ato("TERMO DE FOMENTO Nº 010/2026") == "convenio"


def test_acento_e_caixa_nao_importam():
    assert classificar_ato("aviso de licitação") == "edital"
    assert classificar_ato("DECRETO Nº 338, DE 30 DE JUNHO DE 2026.") == "decreto"
    assert classificar_ato("EXTRATO DO TERMO DE RATIFICAÇÃO DE DISPENSA DE LICITAÇÃO") == "edital"


def test_lei_e_reconhecida_no_comeco_do_titulo():
    assert classificar_ato("LEI Nº 1.234, DE 05 DE MAIO DE 2026.") == "lei"
    assert classificar_ato("LEI COMPLEMENTAR Nº 10/2026") == "lei"


def test_projeto_de_lei_nao_vira_lei_por_engano():
    assert classificar_ato("PROJETO DE LEI Nº 05/2026") == "outro"


def test_titulo_sem_pista_nenhuma_e_outro():
    assert classificar_ato("ORDEM DE SERVIÇO Nº 02/2026") == "outro"
    assert classificar_ato("AQUISIÇÃO DE GÊNEROS ALIMENTÍCIOS") == "outro"
    assert classificar_ato("RESULTADO DA ANÁLISE DE RECURSO") == "outro"


def test_titulo_vazio_e_none_sao_outro_e_nunca_lancam():
    assert classificar_ato("") == "outro"
    assert classificar_ato(None) == "outro"


def test_normalizar_titulo_ato_caixa_alta_sem_acento():
    assert normalizar_titulo_ato("Convênio de Colaboração") == "CONVENIO DE COLABORACAO"


def _main() -> int:
    # Console do Windows abre em cp1252 e engasga em acento no print de um
    # nome de teste ou de um título com erro — mesmo ajuste de
    # `etl/apis/_powerbi_dsr_test.py`.
    for fluxo in (sys.stdout, sys.stderr):
        try:
            fluxo.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]
        except (AttributeError, ValueError):
            pass

    testes = [(n, o) for n, o in sorted(globals().items()) if n.startswith("test_") and callable(o)]
    falhas = 0
    for nome, fn in testes:
        try:
            fn()
            print(f"  ok   {nome}")
        except Exception as e:  # noqa: BLE001
            falhas += 1
            print(f"  FALHA {nome}: {type(e).__name__}: {e}")
    print(f"\n{len(testes) - falhas}/{len(testes)} passaram.")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(_main())
