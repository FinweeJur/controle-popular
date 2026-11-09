# -*- coding: utf-8 -*-
"""Tabelas de teses que as páginas de análise exibem.

POR QUE EXISTE

As análises têm texto escrito por modelo e tabela montada por código. O texto
explica; a tabela conta. Separar as duas coisas é o que impede o modelo de
escrever número — a regra do projeto desde o começo.

Cada célula de contagem sai no formato `N=4.176;88%`, que o renderizador do
portal transforma em barra proporcional com o N centralizado dentro dela.

FONTE: `temas-gerais-brumadinho.json` e `temas-gerais-riodoce.json`, gerados
por `agregar_temas_gerais.py` a partir dos achados auditados. Nenhum número é
digitado aqui.
"""
from __future__ import annotations

import json
from pathlib import Path

BASE = Path(r"X:\DevCoder\OpenCode\tjmg-jurimetria\relatorios")

# Nome curto da tese dominante, para caber na célula.
TESE_CURTA = {
    "dano_moral_afastado": "Dano moral afastado",
    "pericia_judicial_prevalece": "Laudo do perito do juízo",
    "cerceamento_afastado": "Cerceamento afastado",
    "nexo_causal_afastado": "Nexo causal não provado",
    "legitimidade_ativa_reconhecida": "Legitimidade ativa do atingido",
    "legitimidade_passiva_reconhecida": "Legitimidade passiva da empresa",
    "risco_integral": "Risco integral",
    "responsabilidade_objetiva_reconhecida": "Responsabilidade objetiva",
    "prescricao_interrompida": "Prescrição interrompida",
    "gratuidade_deferida": "Gratuidade deferida",
    "distribuicao_dinamica": "Ônus redistribuído",
    "dano_material_afastado": "Dano material afastado",
}

# Os rótulos da rubrica vieram sem acento; a tela mostra com acento.
TEMA_LABEL = {
    "A1": "Prova pericial",
    "A2": "Ônus da prova",
    "A3": "Prova diabólica",
    "A4": "Cerceamento de defesa",
    "A5": "Ampla defesa e contraditório",
    "A6": "Livre apreciação da prova",
    "B1": "Gratuidade de justiça",
    "B2": "Competência",
    "B3": "Legitimidade",
    "B4": "Tutela coletiva",
    "B5": "Litigância predatória",
    "B6": "Sobrestamento e repetitivo",
    "B7": "Prescrição e decadência",
    "B8": "Coisa julgada",
    "B9": "Valor da causa",
    "C1": "Nexo causal",
    "C2": "Responsabilidade civil",
    "C3": "Dano moral",
    "C4": "Dano material e lucros cessantes",
    "C5": "Honorários e custas",
    "D1": "Auxílio emergencial e PTR",
    "D2": "Acordo de reparação e TAP",
}

# Temas comparados nos dois desastres, na ordem em que aparecem.
TEMAS_COMPARADOS = ["C3", "A1", "A4", "C1", "B3", "C2"]


def carregar(nome: str) -> dict:
    return json.loads((BASE / f"temas-gerais-{nome}.json").read_text(encoding="utf-8"))


def numero(valor: int | None) -> str:
    if valor is None:
        return "—"
    return f"{valor:,}".replace(",", ".")


def celula_barra(n: int | None, fracao: float | None) -> str:
    """Célula que o renderizador transforma em barra com o N dentro.

    `fracao` é o quanto a barra enche (0 a 1). O N é o valor; a barra mostra o
    volume em relação ao maior da tabela — nunca a fatia da tese, que é outra
    medida e fica escrita na coluna ao lado.
    """
    if not n:
        return "—"
    return f"N={numero(n)};{round((fracao or 0) * 100)}%"


def rotulo_tema(dados: dict, tema: str) -> str:
    return TEMA_LABEL.get(tema) or dados["nomes_temas"].get(tema, tema)


def celula_tese(dados: dict, tema: str) -> str:
    info = dados["temas"].get(tema) or {}
    dominancia = info.get("dominancia") or {}
    tese = dominancia.get("tese_id")
    if not tese:
        return "—"
    curta = TESE_CURTA.get(tese, dados["nomes_teses"].get(f"{tema}:{tese}", tese))
    return f"{curta}, {round((dominancia.get('fatia') or 0) * 100)}%"


def diferenca(a: int | None, b: int | None) -> str:
    if not a or not b:
        return "—"
    delta = b - a
    sinal = "+" if delta >= 0 else "−"
    return f"{sinal}{numero(abs(delta))}"


def leitura_sentido(info: dict) -> str:
    sentido = info.get("sentidos") or {}
    empresa = sentido.get("pro_empresa") or 0
    atingido = sentido.get("pro_atingido") or 0
    neutro = sentido.get("neutro") or 0
    total = empresa + atingido + neutro
    if not total:
        return "—"
    if empresa >= 0.75 * total:
        return "Quase só empresa"
    if atingido >= 0.75 * total:
        return "Quase só atingido"
    if empresa >= atingido and empresa >= neutro:
        return "Maioria empresa"
    if atingido >= empresa and atingido >= neutro:
        return "Maioria atingido"
    return "Dividido"


def tabela_comparada(bruma: dict, rio: dict) -> str:
    linhas = [
        "| Tema | Brumadinho N | Tese dominante em Brumadinho | Rio Doce N | Tese dominante no Rio Doce | Diferença (Rio Doce − Brumadinho) |",
        "|---|---|---|---|---|---|",
    ]
    maior_b = max(((bruma["temas"].get(t) or {}).get("n") or 0) for t in TEMAS_COMPARADOS)
    maior_r = max(((rio["temas"].get(t) or {}).get("n") or 0) for t in TEMAS_COMPARADOS)
    for tema in TEMAS_COMPARADOS:
        nome = rio["nomes_temas"].get(tema) or bruma["nomes_temas"].get(tema, tema)
        vb = bruma["temas"].get(tema) or {}
        vr = rio["temas"].get(tema) or {}
        nb, nr = vb.get("n"), vr.get("n")
        linhas.append(
            f"| {nome} | {celula_barra(nb, nb / maior_b if nb and maior_b else 0)} "
            f"| {celula_tese(bruma, tema)} "
            f"| {celula_barra(nr, nr / maior_r if nr and maior_r else 0)} "
            f"| {celula_tese(rio, tema)} "
            f"| {diferenca(nb, nr)} |"
        )
    return "\n".join(linhas)


def tabela_sentido(dados: dict, limite: int = 8) -> str:
    linhas = [
        "| Tema | Achados (N) | Pro empresa | Pro atingido | Neutro | Tese dominante | Leitura do conjunto |",
        "|---|---|---|---|---|---|---|",
    ]
    ordenados = sorted(dados["temas"].items(), key=lambda par: -par[1]["n"])[:limite]
    maior = max((info["n"] for _, info in ordenados), default=0)
    for tema, info in ordenados:
        sentido = info.get("sentidos") or {}
        linhas.append(
            f"| {rotulo_tema(dados, tema)} "
            f"| {celula_barra(info['n'], info['n'] / maior if maior else 0)} "
            f"| {numero(sentido.get('pro_empresa'))} "
            f"| {numero(sentido.get('pro_atingido'))} "
            f"| {numero(sentido.get('neutro'))} "
            f"| {celula_tese(dados, tema)} "
            f"| {leitura_sentido(info)} |"
        )
    return "\n".join(linhas)


def _tese_id(dados: dict, tema: str) -> str | None:
    return ((dados["temas"].get(tema) or {}).get("dominancia") or {}).get("tese_id")


def _fatia(dados: dict, tema: str) -> int:
    return round((((dados["temas"].get(tema) or {}).get("dominancia") or {}).get("fatia") or 0) * 100)


def texto_comparacao(bruma: dict, rio: dict) -> str:
    iguais = sum(1 for tema in TEMAS_COMPARADOS if _tese_id(bruma, tema) == _tese_id(rio, tema))
    n_c3b = (bruma["temas"].get("C3") or {}).get("n")
    n_c3r = (rio["temas"].get("C3") or {}).get("n")
    return f"""## Brumadinho e Rio Doce, lado a lado

A mesma rubrica foi aplicada aos dois acervos: 22 temas e 79 teses, só em 2ª
instância do TJMG. Brumadinho tem {numero(bruma['casos'])} processos e
{numero(bruma['total_achados'])} achados; Rio Doce, {numero(rio['casos'])} e
{numero(rio['total_achados'])}. A diferença de tamanho importa: onde o Rio Doce
tem {numero(n_c3r)} achados de dano moral, Brumadinho tem {numero(n_c3b)}. A
tabela compara o que é comparável — a mesma tese, medida do mesmo jeito. Em
{iguais} dos {len(TEMAS_COMPARADOS)} temas, a tese dominante é a mesma nos dois
acervos. [medido — tabela medida]"""


def texto_teses_brumadinho(bruma: dict) -> str:
    return f"""## As teses de Brumadinho, tema por tema

A tabela repete o mesmo desenho do Rio Doce para o acervo de Brumadinho: o N
dentro da barra é a quantidade de achados do tema e a barra mostra o volume
dele em relação ao maior tema da tabela. A fatia da tese dominante fica escrita
na coluna de tese. Leitura curta: dano moral e prova pericial são os temas mais
decisivos, com {_fatia(bruma, 'C3')}% e {_fatia(bruma, 'A1')}% na mesma tese;
nexo causal é o mais dividido, com {_fatia(bruma, 'C1')}%. [medido — tabela
medida]

{tabela_sentido(bruma)}"""


def secao_brumadinho() -> str:
    bruma = carregar("brumadinho")
    return texto_teses_brumadinho(bruma)


def secao_riodoce() -> str:
    bruma = carregar("brumadinho")
    rio = carregar("riodoce")
    c3 = rio["temas"]["C3"]
    sentido_c3 = c3["sentidos"]
    b7 = rio["temas"]["B7"]
    sentido_b7 = b7["sentidos"]
    a1 = rio["temas"]["A1"]
    sentido_a1 = a1["sentidos"]
    return "\n\n".join([
        texto_comparacao(bruma, rio),
        tabela_comparada(bruma, rio),
        f"""Lida em conjunto, a tabela mostra um padrão e uma diferença. A
diferença está na força da tese. O dano moral afastado ocupa {_fatia(bruma, 'C3')}%
dos achados em Brumadinho e {_fatia(rio, 'C3')}% no Rio Doce — e, no Rio Doce,
{numero(sentido_c3.get('neutro'))} dos {numero(c3['n'])} achados ficaram no
neutro. O cerceamento de defesa, tema mais frequente no Rio Doce, também é
menos hegemônico lá ({_fatia(rio, 'A4')}% contra {_fatia(bruma, 'A4')}%).
[medido — tabela medida]""",
        "## As teses do Rio Doce por sentido",
        f"""A tabela abaixo mostra os oito temas mais frequentes do Rio Doce e como
os achados se distribuem entre os três sentidos. Ela serve para ver onde a
jurisprudência é de mão única e onde é dividida: legitimidade e gratuidade
puxam para o atingido; cerceamento, dano material e prova pericial puxam para
a empresa; dano moral e prescrição são os menos concentrados. [medido — tabela
medida]""",
        tabela_sentido(rio),
        f"""Leitura curta: prova pericial é o tema mais desequilibrado
({numero(sentido_a1.get('pro_empresa'))} achados a favor da empresa contra
{numero(sentido_a1.get('pro_atingido'))} a favor do atingido, com
{_fatia(rio, 'A1')}% na tese do laudo do perito do juízo), enquanto a
prescrição é o mais disputado — {numero(sentido_b7.get('pro_atingido'))}
achados a favor do atingido, {numero(sentido_b7.get('pro_empresa'))} a favor da
empresa e {numero(sentido_b7.get('neutro'))} neutros, com a tese dominante ("a
prescrição foi interrompida") em apenas {_fatia(rio, 'B7')}%. [medido — tabela
medida]""",
    ])
