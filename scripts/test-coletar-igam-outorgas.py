"""test-coletar-igam-outorgas.py — checagem mínima do parser da grade IGAM.

Rode: python scripts/test-coletar-igam-outorgas.py
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# importa o coletor sem rodar main()


def _carregar():
    import importlib
    return importlib.import_module("coletar-igam-outorgas")


def main() -> None:
    import types
    m = types.ModuleType("coletar_igam")
    src = (Path(__file__).resolve().parent / "coletar-igam-outorgas.py").read_text(
        encoding="utf-8")
    m.__dict__["__file__"] = str(Path(__file__).resolve().parent / "coletar-igam-outorgas.py")
    exec(compile(src, "coletar-igam-outorgas.py", "exec"), m.__dict__)

    assert m.TOTAL_MEDIDO == 55729

    # HTML real (capturado ao vivo em 2026-09-16, windows-1252 já decodificado):
    total, linhas = m._contar_pagina(
        '<div class="summary">A exibir <b>1-20</b> de <b>55,729</b> itens.</div>'
        '<tr data-key="1"><td>1800001/2018</td><td>12/10/2018</td><td>Outubro</td>'
        '<td>2018</td><td>URGA SM</td><td>Acc 123.456.789-48</td>'
        '<td>***.587.111-**</td><td>03 - CAPTAÇÃO</td><td>Deferido</td></tr>')
    assert total == 55729, total
    assert len(linhas) == 1 and len(linhas[0]) == 9, linhas
    r = linhas[0]
    assert r[6] is None, f"CPF mascarado vazou: {r[6]!r}"      # doc:
    assert r[5] == "Acc", f"CPF não removido do nome: {r[5]!r}"  # nome sanitizado
    assert r[8] == "Deferido" and r[0] == "1800001/2018"

    # CNPJ completo de 14 dígitos é preservado
    _, linhas2 = m._contar_pagina(
        '<tr data-key="2"><td>a</td><td>b</td><td>c</td><td>d</td><td>e</td>'
        '<td>Empresa</td><td>12.345.678/0001-05</td><td>f</td><td>g</td></tr>')
    assert linhas2[0][6] == "12345678000105", linhas2

    # _doc_só_cnpj rejeita CPF (11) e máscara
    assert m._doc_só_cnpj("123.456.789-48") is None
    assert m._doc_só_cnpj("463.20******") is None
    assert m._doc_só_cnpj("12345678000105") == "12345678000105"
    assert m._doc_só_cnpj(None) is None

    # URL de paginação
    assert m._url(3).endswith("lista-outorgas?page=3&per-page=50"), m._url(3)

    print("ok — parser da grade IGAM verificado.")


if __name__ == "__main__":
    main()
