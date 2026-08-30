r"""etl.camaras.domweb_test — testes da lógica pura de `etl.camaras.domweb`
(sem rede): a árvore do sumário vira lista plana de atos, e a linha de
`atos_diario` é montada com link_fonte/chave_natural no padrão do projeto.

O coletor em si (requisições à API da PBH) não é testado aqui — mesma
decisão de `sigpub.py`: a validação do mecanismo é o `--sondar` contra a
fonte real, documentado no cabeçalho do módulo. O que ESTE arquivo prende é
a transformação de dados, que não pode depender de rede nem da fonte estar
no ar.

Roda de dois jeitos (mesmo padrão de `etl/diario_test.py`):

    python -m pytest etl/camaras/domweb_test.py
    python etl/camaras/domweb_test.py
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from etl.camaras.domweb import _folhas_ato, _montar_linha  # noqa: E402

EDICAO = {"id": 7753, "numero_edicao": 7572, "tipo_edicao": "P", "dt_publicacao": "2026-08-28"}


def test_folhas_ato_extrai_so_folhas_tipo_A():
    arvore = [
        {
            "id": 1,
            "tipo": "O",
            "descricao": "PMBH",
            "filhos": [
                {
                    "id": 2,
                    "tipo": "O",
                    "descricao": "SMED",
                    "filhos": [
                        {"id": 10, "tipo": "A", "descricao": "PORTARIA Nº 1"},
                        {"id": 11, "tipo": "A", "descricao": "EXTRATO DE CONTRATO"},
                    ],
                }
            ],
        },
        {"id": 3, "tipo": "A", "descricao": "CONVOCAÇÃO"},
        {"id": 4, "tipo": "A", "descricao": "AVISO DE LICITAÇÃO"},
    ]
    atos = []
    for no in arvore:
        _folhas_ato(no, atos)
    assert [a["id"] for a in atos] == [10, 11, 3, 4]


def test_folhas_ato_ignora_no_sem_filhos():
    atos = []
    _folhas_ato({"id": 99, "tipo": "O", "descricao": "órgão vazio"}, atos)
    assert atos == []


def test_montar_linha_sem_detalhe():
    ato = {
        "id": 489409,
        "descricao": "ADJUDICAÇÃO E HOMOLOGAÇÃO - PREGÃO ELETRÔNICO Nº 90025/2025",
        "categoria": {"nome_categoria": "LICITAÇÃO"},
        "orgao": {"sigla_orgao": "CMBH", "nome_orgao": "Câmara Municipal de Belo Horizonte"},
    }
    linha = _montar_linha("3106200", EDICAO, ato, None)
    assert linha["id_municipio"] == "3106200"
    assert linha["data_publicacao"] == "2026-08-28"
    assert linha["edicao"] == "7572"
    assert linha["tipo"] == "edital"
    assert linha["orgao"] == "Câmara Municipal de Belo Horizonte"
    assert linha["ementa"] == ato["descricao"]
    assert linha["texto"] is None
    assert linha["link_fonte"] == "https://dom-web.pbh.gov.br/visualizacao/ato/489409"
    assert linha["chave_natural"] == "dom_web:489409"
    assert linha["raw"]["sigla_orgao"] == "CMBH"


def test_montar_linha_com_detalhe_preenche_texto():
    ato = {"id": 1, "descricao": "DECRETO Nº 338", "categoria": {}, "orgao": {}}
    detalhe = {"conteudo_html": "<p>texto do decreto</p>"}
    linha = _montar_linha("3106200", EDICAO, ato, detalhe)
    assert linha["tipo"] == "decreto"
    assert linha["texto"] == "<p>texto do decreto</p>"


def test_montar_linha_numero_edicao_nulo_vira_none():
    edicao_sem_numero = {"id": 1, "dt_publicacao": "2026-08-28"}
    linha = _montar_linha("3106200", edicao_sem_numero, {"id": 1, "descricao": "", "categoria": {}, "orgao": {}}, None)
    assert linha["edicao"] is None
    assert linha["orgao"] is None


def test_montar_linha_ato_sem_id_aborta():
    try:
        _montar_linha("3106200", EDICAO, {"descricao": "SEM ID"}, None)
    except RuntimeError:
        return
    raise AssertionError("ato sem id deveria abortar (link_fonte não pode ser montado)")


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
    print(f"\n{len(testes) - falhas}/{len(testes)} passaram.")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(_main())
