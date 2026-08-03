"""Prova de que nenhum módulo de ETL carrega uma cidade por dentro.

    python scripts/conferir_defaults_de_cidade.py

O DEFEITO QUE ISTO IMPEDE (encontrado ao vivo em 2026-08-03, seis módulos
afetados). Os módulos aceitam a cidade por `--id-municipio`, mas vários
mantinham os OUTROS parâmetros da MESMA cidade como default de argparse:

    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--municipio", default="BETIM")      # <- aqui
    parser.add_argument("--cnpj-orgao", default=CITY_HALL_CNPJ)
    parser.add_argument("--geocode", default=ID_MUNICIPIO_DEFAULT)

Rodar `python -m etl.apis.anp --id-municipio 3550308` parece correto e é
aceito sem reclamação — mas coleta o dado de BETIM e o grava com o id de São
Paulo. Como os upserts casam por chave natural (`cnpj`,
`numero_controle_pncp`), o efeito não é duplicar: é REETIQUETAR. A cidade de
origem perde as linhas e a cidade nova recebe dado que não é dela. Nenhum
erro é levantado em nenhum ponto do caminho.

A REGRA: todo parâmetro que identifica a cidade na fonte externa (nome, UF,
CNPJ, geocode, código IBGE, lat/lng) tem `default=None` e é derivado da
tabela `municipios` dentro de `sync()`, via `carregar_municipio()`. O
`--id-municipio` é a ÚNICA coisa que o operador escolhe; qualquer outro
default de cidade é um caminho para dado errado em silêncio.

Sai com código 1 se achar violação, para poder entrar na CI.
"""

import ast
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parents[1]
PACOTE = RAIZ / "etl"

# Nomes de constante e literais que amarram um argumento a uma cidade
# específica. `ID_MUNICIPIO_DEFAULT` é legítimo APENAS em `--id-municipio`.
SUSPEITOS_NOME = {
    "ID_MUNICIPIO_DEFAULT",
    "CITY_HALL_CNPJ",
    "CITY_LAT",
    "CITY_LNG",
    "CITY_NAME",
    "CITY_UF",
}
SUSPEITOS_LITERAL = {"BETIM", "Betim", "3106705", "MG", "18715391000196"}

# `--id-municipio` é o argumento que define a cidade; é onde o default de
# cidade é o comportamento correto.
FLAG_PERMITIDA = "--id-municipio"


def _valor_suspeito(no: ast.AST) -> str | None:
    if isinstance(no, ast.Name) and no.id in SUSPEITOS_NOME:
        return no.id
    if isinstance(no, ast.Constant) and isinstance(no.value, str):
        if no.value in SUSPEITOS_LITERAL:
            return repr(no.value)
    return None


def violacoes_do_arquivo(caminho: pathlib.Path) -> list[str]:
    try:
        arvore = ast.parse(caminho.read_text(encoding="utf-8"))
    except SyntaxError as e:
        return [f"{caminho}: não parseia ({e})"]

    achados: list[str] = []
    for no in ast.walk(arvore):
        if not isinstance(no, ast.Call):
            continue
        alvo = no.func
        if not (isinstance(alvo, ast.Attribute) and alvo.attr == "add_argument"):
            continue
        if not no.args:
            continue
        primeiro = no.args[0]
        flag = primeiro.value if isinstance(primeiro, ast.Constant) else "?"
        if flag == FLAG_PERMITIDA:
            continue
        for kw in no.keywords:
            if kw.arg != "default":
                continue
            suspeito = _valor_suspeito(kw.value)
            if suspeito:
                rel = caminho.relative_to(RAIZ)
                achados.append(
                    f"{rel}:{no.lineno}  {flag} tem default={suspeito} — "
                    "derive de `municipios` via carregar_municipio() e use default=None"
                )
    return achados


def main() -> int:
    todas: list[str] = []
    for arquivo in sorted(PACOTE.rglob("*.py")):
        if "__pycache__" in arquivo.parts:
            continue
        todas.extend(violacoes_do_arquivo(arquivo))

    if todas:
        print("DEFAULTS DE CIDADE ENCONTRADOS (dado errado em silêncio):\n")
        for v in todas:
            print("  " + v)
        print(f"\n{len(todas)} violação(ões).")
        return 1

    print("OK — nenhum módulo de ETL amarra uma cidade fora de --id-municipio.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
