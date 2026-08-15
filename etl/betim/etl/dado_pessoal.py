"""Máscara de dado pessoal em texto livre coletado de fonte oficial.

Criado em 2026-08-15 por um vazamento real, e o caso explica a forma do
módulo: a ementa da **Portaria IBAMA 2080/2012**, publicada pelo próprio MMA,
cita o CPF de uma pessoa nomeada. Ela entrou no repositório PÚBLICO dentro de
`etl/betim/dados/legislacao-mma.json`, e de lá teria ido para o site — a página
de legislação renderiza a ementa como a fonte escreve.

═══ POR QUE MASCARAR E NÃO APAGAR ═══

`_sanitizar_nome`, em `apis/ambiental_licenciamento.py`, **remove** o número: lá
o campo é o nome de um empreendimento, e um CPF colado nele é sujeira, não
conteúdo. Aqui é diferente. A ementa é o texto de um ato normativo, e apagar um
pedaço dela deixaria uma frase truncada com cara de erro de coleta. A regra
escrita em `docs/ANTES-DO-PUSH.md` — *"troque por 000.000.000-00"* — preserva a
frase, deixa visível que houve substituição e não é o CPF de ninguém.

═══ POR QUE mod-11 E NÃO "11 DÍGITOS" ═══

Mesma disciplina do guarda em `scripts/checar-dado-pessoal.py`, e pela mesma
razão: ementa de norma ambiental é cheia de número comprido que NÃO é CPF —
número de processo (`2008.39.00.011777-1`), código IBGE, protocolo, número de
lei com pontuação. Mascarar por formato pegaria todos eles e corromperia o
texto oficial em nome de uma proteção que não estava em jogo. Só se o dígito
verificador fecha é que se trata de um CPF de verdade.

CNPJ fica de fora de propósito: é dado público de empresa, e o portal o publica
com intenção (`docs/ANTES-DO-PUSH.md`).
"""

from __future__ import annotations

import re

CPF_SINTETICO = "000.000.000-00"

# Pega 11 dígitos com ou sem pontuação. A validação mod-11 abaixo é que decide
# se aquilo é um CPF — este padrão só delimita o candidato.
_RE_CPF_CANDIDATO = re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")


def _digito_verificador(digitos: list[int], pesos: list[int]) -> int:
    resto = sum(d * p for d, p in zip(digitos, pesos)) % 11
    return 0 if resto < 2 else 11 - resto


def cpf_valido(cpf: str) -> bool:
    """mod-11. `111.111.111-11` e afins são rejeitados: repetição de um dígito
    só passa na conta e nunca é CPF emitido."""
    so_digitos = re.sub(r"\D", "", cpf)
    if len(so_digitos) != 11 or len(set(so_digitos)) == 1:
        return False
    n = [int(c) for c in so_digitos]
    return n[9] == _digito_verificador(n[:9], list(range(10, 1, -1))) and n[
        10
    ] == _digito_verificador(n[:10], list(range(11, 1, -1)))


def mascarar_cpf(texto):
    """Troca todo CPF **válido** por `000.000.000-00`, preservando o resto do
    texto. Devolve a entrada intocada quando não há nenhum — inclusive o mesmo
    objeto, para que `None` continue `None` e o chamador não precise checar."""
    if not texto:
        return texto
    return _RE_CPF_CANDIDATO.sub(
        lambda m: CPF_SINTETICO if cpf_valido(m.group(0)) else m.group(0),
        str(texto),
    )


def mascarar_linha(linha: dict, campos: tuple[str, ...] = ("ementa", "indexacao")) -> dict:
    """Aplica `mascarar_cpf` nos campos de texto livre de uma linha coletada.

    Os campos padrão são os dois que recebem prosa da fonte. `tipo`, `numero`,
    `ano`, `orgao` e `link_pdf` ficam de fora porque são estruturados — se um
    CPF aparecesse num deles, o problema seria de parsing, e mascarar
    esconderia o defeito em vez de mostrá-lo.
    """
    for campo in campos:
        if campo in linha:
            linha[campo] = mascarar_cpf(linha[campo])
    return linha


# ─────────────────────────────── regressão ──────────────────────────────
#
# Convenção do repo: módulo de extração carrega a própria suíte atrás de
# `--testar` e ela vira passo de workflow, como `etl.normas --testar` e
# `etl.cota --testar`. Aqui isso vale dobrado, porque
# `docs/ANTES-DO-PUSH.md` conta que a PRIMEIRA versão do guarda de CPF
# passava verde com CPF real no repositório — usava `\d` num `grep -E`
# POSIX, que não conhece `\d`, e casava zero. **Guarda cego é pior que
# guarda nenhum: dá a sensação de estar protegido.**
#
# Por isso os casos abaixo incluem os dois lados: o que TEM de ser
# mascarado e o que NÃO PODE ser tocado. O segundo grupo é o que impede
# esta função de "consertar" o vazamento corrompendo texto oficial.

_CASOS = [
    ("CPF nº 008.600.342-91, proprietário", "CPF nº 000.000.000-00, proprietário",
     "o CPF real da Portaria IBAMA 2080/2012, que originou este módulo"),
    ("Ação Civil Pública nº 2008.39.00.011777-1", "Ação Civil Pública nº 2008.39.00.011777-1",
     "número de processo na MESMA ementa — mascarar isto corromperia o ato"),
    ("CPF 000.000.000-00", "CPF 000.000.000-00", "sintético já mascarado é idempotente"),
    ("111.111.111-11", "111.111.111-11", "dígito repetido passa no mod-11 e nunca é CPF emitido"),
    ("CNPJ 33.000.167/0001-01", "CNPJ 33.000.167/0001-01", "CNPJ é dado público de empresa"),
    ("município 3106705", "município 3106705", "código IBGE"),
    ("00860034291 sem pontuação", "000.000.000-00 sem pontuação", "pega sem pontuação também"),
    ("dois: 008.600.342-91 e 529.982.247-25", "dois: 000.000.000-00 e 000.000.000-00",
     "mascara todos, não só o primeiro"),
    (None, None, "None continua None"),
    ("", "", "vazio continua vazio"),
]


def testar() -> bool:
    ok = True
    for entrada, esperado, porque in _CASOS:
        obtido = mascarar_cpf(entrada)
        if obtido != esperado:
            ok = False
            print(f"  FALHA  {porque}\n         esperado={esperado!r}\n         obtido  ={obtido!r}")
    # Sabotagem deliberada do próprio guarda: um CPF válido inserido de
    # propósito TEM de ser pego, e um com dígito verificador errado NÃO.
    if not cpf_valido("529.982.247-25"):
        ok = False
        print("  FALHA  mod-11 rejeitou um CPF válido — o guarda está cego")
    if cpf_valido("529.982.247-26"):
        ok = False
        print("  FALHA  mod-11 aceitou dígito verificador errado")
    print(f"[etl.dado_pessoal] {len(_CASOS)} caso(s) + 2 de sabotagem: {'OK' if ok else 'FALHOU'}")
    return ok


if __name__ == "__main__":
    import argparse
    import sys

    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--testar", action="store_true", help="roda a suíte de regressão")
    args = p.parse_args()
    if args.testar:
        sys.exit(0 if testar() else 1)
    p.print_help()
