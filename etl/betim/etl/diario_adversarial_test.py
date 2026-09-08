r"""etl.diario_adversarial_test — Testes adversariais e de estresse para classificar_ato e extrair_entidades."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from etl.diario import classificar_ato, extrair_entidades  # noqa: E402


def test_falsos_positivos_licit_em_solicitacao():
    assert classificar_ato("SOLICITAÇÃO DE DIÁRIAS Nº 12/2026") != "edital", "SOLICITACAO virou edital"
    assert classificar_ato("SOLICITAÇÃO DE FÉRIAS") != "edital", "SOLICITACAO virou edital"
    assert classificar_ato("MATERIAL PUBLICITÁRIO") != "edital", "PUBLICITARIO virou edital"
    assert classificar_ato("ILÍCITO ADMINISTRATIVO") != "edital", "ILICITO virou edital"


def test_precedencia_edital_com_citacao_de_lei_ou_decreto():
    assert (
        classificar_ato("AVISO DE LICITAÇÃO - PREGÃO ELETRÔNICO Nº 10/2026 - LEI 14.133/2021") == "edital"
    ), "Aviso de licitação com menção à Lei virou lei"
    assert (
        classificar_ato("EDITAL DE PREGÃO ELETRÔNICO REGULADO PELO DECRETO 10.024") == "edital"
    ), "Edital de pregão com menção a decreto virou decreto"


def test_plurais_em_python():
    # Testa se o motor Python reconhece plurais que a versão TS suporta
    assert classificar_ato("DECRETOS DO EXECUTIVO") == "decreto", "DECRETOS não casou decreto em Python"
    assert classificar_ato("PORTARIAS DA SECRETARIA") == "portaria", "PORTARIAS não casou portaria em Python"
    assert classificar_ato("CONVÊNIOS FIRMADOS") == "convenio", "CONVENIOS não casou convenio em Python"
    assert classificar_ato("PARCERIAS CELEBRADAS") == "convenio", "PARCERIAS não casou convenio em Python"
    assert classificar_ato("TERMOS DE COLABORAÇÕES") == "convenio", "COLABORACOES não casou convenio em Python"
    assert classificar_ato("DISTRATOS CONTRATUAIS") == "contrato", "DISTRATOS não casou contrato em Python"


def test_paridade_extracao_ata_pregao():
    texto = "EXTRATO: ATA DE REGISTRO DE PREÇOS N° 043/2026 referente ao Pregão Presencial 015/2026."
    res = extrair_entidades(texto)
    assert res["numero_edital"] == "043/2026", f"Esperado 043/2026, obtido {res['numero_edital']}"


def _main() -> int:
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
    print(f"\n{len(testes) - falhas}/{len(testes)} passaram ({falhas} falhas).")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(_main())
