r"""etl.apis._powerbi_dsr_test — teste do decodificador DSR contra a fixture
CONGELADA da resposta real de 2026-08-20.

Roda de dois jeitos (o repo ainda não tem suíte Python instalada):

    python -m pytest etl/apis/_powerbi_dsr_test.py
    python etl/apis/_powerbi_dsr_test.py

═══ POR QUE OS VALORES SÃO CONCRETOS, E NÃO "assert len(t) > 0" ═══

Um decodificador DSR quase certo devolve tabela **plausível e errada** — é
o modo de falha inteiro desta tarefa. Teste de forma ("tem 50 linhas", "tem
5 colunas") passa alegremente com as máscaras invertidas, porque a CONTAGEM
não muda: o que muda é o CONTEÚDO das células. Por isso aqui se afirma
string por string:

  - a primeira linha (única totalmente literal, sem herança);
  - a última (que o `RT` do próprio servidor corrobora, por caminho
    independente);
  - a herança por `R` (linha 1 herda 4 colunas da linha 0 — se `R` for
    ignorado, estas 4 vêm vazias/deslocadas);
  - a troca de grupo (linha 8, `R:13` = herda 0,2,3 mas NÃO a coluna 1:
    a Mineradora muda de "CSN Mineração" para "Minérios Nacional S/A". É o
    caso que pega máscara lida com os bits ao contrário, porque um `R`
    invertido herdaria justo a coluna que devia mudar);
  - o nulo por `Ø`, em fixture sintética — a resposta real de 2026-08-20 não
    tem nulo nenhum (medido: 0 células), e testar só com ela deixaria o
    caminho de nulo sem cobertura até o dia em que a fonte mandasse um.

Os valores esperados abaixo foram conferidos contra o `RT` do servidor, não
contra a saída do próprio decodificador (isso seria testar que o código faz
o que faz).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from etl.apis._powerbi_dsr import (  # noqa: E402
    ErroDSR,
    Tabela,
    conferir,
    conferir_contra_restart_token,
    decodificar_resposta,
)

FIXTURE = Path(__file__).parent / "_fixtures" / "powerbi-querydata-resposta.json"

COLUNAS = ["e.Projeto", "e.Mineradora", "e.Órgão/Instituição", "e.Status", "e.Ano"]

PRIMEIRA = [
    "Adequação e Modernização do SLA à modernização da regularização ambiental",
    "CSN Mineração", "SUTAF", "Em execução", 2022,
]
ULTIMA = [
    "Auditoria/Consultoria Técnica em Desenvolvimento de sistemas",
    "Samarco Mineração S.A.", "SUTAF", "Em execução", 2023,
]


def _fixture() -> dict:
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


def _tabela() -> Tabela:
    return decodificar_resposta(_fixture())


# ─────────────────────────────── forma básica ───────────────────────────


def test_colunas_vem_do_descriptor_e_nao_da_posicao():
    # `S` nomeia G0..G4; os nomes reais só existem no descriptor.
    assert _tabela().colunas == COLUNAS


def test_contagem_de_linhas():
    assert len(_tabela()) == 50


# ─────────────────── valores concretos: as duas pontas ──────────────────


def test_primeira_linha_literal():
    """A única linha sem herança: todos os 5 valores vêm de `C`, sendo 4
    índices de ValueDicts (0,0,0,0) e o Ano cru (2022). Se os índices
    fossem lidos como literais, viriam quatro zeros."""
    t = _tabela()
    assert [t.linhas[0][c] for c in COLUNAS] == PRIMEIRA


def test_ultima_linha():
    t = _tabela()
    assert [t.linhas[-1][c] for c in COLUNAS] == ULTIMA


def test_ultima_linha_bate_com_o_restart_token_do_servidor():
    """Testemunha INDEPENDENTE: o `RT` é serializado pelo servidor por outro
    caminho que não o `DM0` comprimido."""
    assert conferir_contra_restart_token(_tabela()) == {"conferido": True, "colunas": 5}


# ────────────────────────── herança por `R` ─────────────────────────────


def test_heranca_por_R_linha_1_herda_quatro_colunas():
    """`{"C": [2023], "R": 15}` — 15 = 0b01111: as 4 primeiras colunas
    repetem a linha 0 e só o Ano é novo. Sem tratar `R`, estas 4 viriam
    vazias e pareceriam 'dado faltando na origem'."""
    t = _tabela()
    linha = t.linhas[1]
    assert [linha[c] for c in COLUNAS[:4]] == PRIMEIRA[:4]
    assert linha["e.Ano"] == 2023
    assert t.linhas[0]["e.Ano"] == 2022  # a de cima não foi contaminada


def test_R_parcial_troca_de_grupo_na_linha_8():
    """`{"C": [1, 2022], "R": 13}` — 13 = 0b01101: herda as colunas 0, 2 e 3,
    mas a coluna 1 (Mineradora) vem NOVA (índice 1 = "Minérios Nacional
    S/A"). É o caso que denuncia bits lidos ao contrário: um `R` invertido
    herdaria justo a coluna que tinha de mudar."""
    linha = _tabela().linhas[8]
    assert linha["e.Mineradora"] == "Minérios Nacional S/A"
    assert linha["e.Projeto"] == PRIMEIRA[0]      # herdado
    assert linha["e.Órgão/Instituição"] == "SUTAF"  # herdado
    assert linha["e.Ano"] == 2022                  # novo


def test_indices_de_dicionario_viram_texto_em_todas_as_linhas():
    """Nenhuma célula de coluna com `DN` pode ter sobrado como inteiro."""
    t = _tabela()
    for linha in t.linhas:
        for coluna in COLUNAS[:4]:
            assert isinstance(linha[coluna], str), (coluna, linha[coluna])
        assert isinstance(linha["e.Ano"], int)


def test_diagnostico_conta_as_celulas_herdadas():
    diag = conferir(_tabela())
    assert diag["linhas"] == 50
    # Medido na fixture: 179 células vêm por herança, não do `C`. O número
    # exato trava a leitura da máscara — qualquer bit lido a mais ou a menos
    # em qualquer linha muda esta soma.
    assert diag["celulas_herdadas_por_R"] == 179
    assert diag["celulas_nulas_por_Ø"] == 0  # a fixture real não tem nulo
    assert diag["conferido"] is True


# ──────────────────────────── nulo por `Ø` ──────────────────────────────


def _resposta_sintetica(linhas: list[dict]) -> dict:
    """Envelope mínimo com 2 colunas: uma de dicionário, uma crua."""
    return {"results": [{"result": {"data": {
        "descriptor": {"Select": [
            {"Value": "G0", "Name": "x.Nome"},
            {"Value": "G1", "Name": "x.Valor"},
        ]},
        "dsr": {"DS": [{
            "PH": [{"DM0": linhas}],
            "ValueDicts": {"D0": ["alfa", "beta"]},
        }]},
    }}}]}


def test_nulo_por_Ø_nao_herda_o_valor_de_cima():
    """Ø e R são coisas DIFERENTES. Aqui a linha 1 declara `Ø: 1`: a coluna 0
    é NULA, e não 'alfa' repetido. Confundir os dois inventaria dado que a
    fonte nunca afirmou."""
    t = decodificar_resposta(_resposta_sintetica([
        {"S": [{"N": "G0", "T": 1, "DN": "D0"}, {"N": "G1", "T": 4}], "C": [0, 10]},
        {"C": [20], "\u00d8": 1},
        {"C": [1], "\u00d8": 2},
    ]))
    assert [l["x.Nome"] for l in t.linhas] == ["alfa", None, "beta"]
    assert [l["x.Valor"] for l in t.linhas] == [10, 20, None]
    assert conferir(t)["celulas_nulas_por_Ø"] == 2


def test_chave_null_equivale_a_Ø():
    t = decodificar_resposta(_resposta_sintetica([
        {"S": [{"N": "G0", "T": 1, "DN": "D0"}, {"N": "G1", "T": 4}], "C": [0, 10]},
        {"C": [20], "null": 1},
    ]))
    assert t.linhas[1]["x.Nome"] is None


# ────────────────────────────── as guardas ──────────────────────────────


def _ergue(fn, trecho: str) -> None:
    try:
        fn()
    except ErroDSR as e:
        assert trecho in str(e), f"mensagem inesperada: {e}"
        return
    raise AssertionError(f"esperava ErroDSR contendo {trecho!r}, não ergueu")


def test_guarda_R_na_primeira_linha():
    """Não há linha anterior de quem herdar: é o sintoma de máscara lida ao
    contrário, e tem de estourar em vez de decodificar."""
    _ergue(
        lambda: decodificar_resposta(_resposta_sintetica([
            {"S": [{"N": "G0", "T": 1, "DN": "D0"}, {"N": "G1", "T": 4}], "C": [0, 10], "R": 1},
        ])),
        "invertida",
    )


def test_guarda_mais_colunas_que_o_descriptor():
    _ergue(
        lambda: decodificar_resposta(_resposta_sintetica([
            {"S": [{"N": "G0", "T": 1, "DN": "D0"}, {"N": "G1", "T": 4}], "C": [0, 10, 99]},
        ])),
        "mais colunas que o esquema",
    )


def test_guarda_indice_fora_do_dicionario():
    _ergue(
        lambda: decodificar_resposta(_resposta_sintetica([
            {"S": [{"N": "G0", "T": 1, "DN": "D0"}, {"N": "G1", "T": 4}], "C": [7, 10]},
        ])),
        "fora do dicionário",
    )


def test_guarda_indice_grande_sugere_confusao_indice_x_literal():
    _ergue(
        lambda: decodificar_resposta(_resposta_sintetica([
            {"S": [{"N": "G0", "T": 1, "DN": "D0"}, {"N": "G1", "T": 4}], "C": [2022, 10]},
        ])),
        "confusão índice×literal",
    )


def test_guarda_R_e_Ø_no_mesmo_bit():
    _ergue(
        lambda: decodificar_resposta(_resposta_sintetica([
            {"S": [{"N": "G0", "T": 1, "DN": "D0"}, {"N": "G1", "T": 4}], "C": [0, 10]},
            {"C": [20], "R": 1, "\u00d8": 1},
        ])),
        "se contradizem",
    )


def test_guarda_sobra_de_valores_em_C():
    """R diz que 1 coluna herda, mas `C` traz as 2: sobra = máscara errada."""
    _ergue(
        lambda: decodificar_resposta(_resposta_sintetica([
            {"S": [{"N": "G0", "T": 1, "DN": "D0"}, {"N": "G1", "T": 4}], "C": [0, 10]},
            {"C": [1, 20], "R": 1},
        ])),
        "sobraram",
    )


def test_conferir_ergue_com_esperado_diferente():
    _ergue(lambda: conferir(_tabela(), esperado=300), "esperava 300 linha(s)")


def test_conferir_avisa_janela_cheia_em_vez_de_subcontar():
    """50 linhas numa janela de 50 não prova fim de tabela."""
    diag = conferir(_tabela(), janela=50)
    assert diag["janela_cheia"] is True
    assert "subcontar" in diag["aviso"]
    assert "janela_cheia" not in conferir(_tabela(), janela=500)


def test_erro_da_api_dentro_do_200():
    _ergue(
        lambda: decodificar_resposta({"results": [{"error": {"code": "rsUserNotFound"}}]}),
        "erro dentro do 200 OK",
    )


# ─────────────── o PEDIDO, contra a fixture do que funcionou ────────────


def test_montar_pedido_reproduz_o_pedido_que_funcionou_ao_vivo():
    """O endpoint é exigente com a FORMA do envelope, e um pedido torto
    devolve 400 sem explicação (ou, pior, esqueleto vazio que parece "a
    fonte não tem esse dado"). Este teste trava `montar_pedido` contra o
    corpo exato que funcionou em 2026-08-20 — inclusive os nomes de entidade
    e campo COM acento e espaço, que não podem ser normalizados.

    Fica aqui, e não num arquivo à parte, porque é a mesma fixture congelada
    do resto: pedido e resposta são as duas metades do mesmo contrato."""
    from etl.apis.tacs_mineradoras import montar_pedido

    esperado = json.loads(
        (Path(__file__).parent / "_fixtures" / "powerbi-querydata-pedido.json").read_text(
            encoding="utf-8"
        )
    )
    obtido = montar_pedido(
        "Execução_Projetos_Completa",
        ["Projeto", "Mineradora", "Órgão/Instituição", "Status", "Ano"],
        50,
    )
    assert obtido == esperado


def test_descriptor_ausente_ergue_em_vez_de_usar_posicao():
    _ergue(
        lambda: decodificar_resposta({"results": [{"result": {"data": {
            "dsr": {"DS": [{"PH": [{"DM0": []}]}]},
        }}}]}),
        "descriptor",
    )


def _main() -> int:
    # O console do Windows abre em cp1252 e engasga no "Ø" dos nomes de teste
    # (UnicodeEncodeError no print, que mataria a corrida com exit 1 sem
    # nenhum teste ter falhado). Forçar UTF-8 aqui é o que torna este arquivo
    # executável direto no ambiente do repo.
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
