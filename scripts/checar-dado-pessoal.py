#!/usr/bin/env python3
"""
Barra dado pessoal e segredo antes de sair da máquina.

═══ POR QUE ESTE ARQUIVO EXISTE ═══

Em 13/08/2026 uma varredura achou SEIS CPF de pessoa real, válidos por mod-11,
já publicados no `origin/main` de um repositório PÚBLICO. Quatro deles moravam
no comentário que documenta a função que remove CPF: alguém mediu o vazamento
na base real, colou o exemplo verdadeiro para justificar a proteção, e o
exemplo virou o vazamento.

O projeto já tinha defesa em profundidade — lista branca de colunas na
exportação, `PROIBIDOS` barrando nome de autuado, `_sanitizar_nome` no coletor.
Todas no caminho do DADO. Nenhuma olhava para CÓDIGO-FONTE, e foi por ali que
vazou.

═══ POR QUE EM PYTHON, E NÃO NO TESTE DO PORTAL ═══

Existe um teste equivalente em `apps/web/lib/sem-cpf-no-repo.test.ts`, mas ele
só roda no `npm test` do portal. Este script é o mesmo guarda em forma
portátil: sem dependência, roda com o Python que as duas máquinas já têm, e
serve para QUALQUER repositório do projeto — inclusive o `terras-devolutas`,
que não tem Node.

Ele é chamado pelo hook de pre-push (`.githooks/pre-push`) e pela CI. O hook
protege quem esquece; a CI protege quem pulou o hook.

Uso:
    python scripts/checar-dado-pessoal.py           # varre o que está rastreado
    python scripts/checar-dado-pessoal.py --staged  # só o que está no index

Sai com 1 se achar. A mensagem diz o arquivo, a linha e o valor.
"""

from __future__ import annotations

import argparse
import io
import re
import subprocess
import sys

# ---------------------------------------------------------------------------
# O que se varre
#
# Só o que é ESCRITO À MÃO. Dado coletado de fonte pública (.geojson, .csv, os
# dumps) tem regra própria no pipeline, e varrer megabyte de dado a cada push
# tornaria o hook lento a ponto de alguém desligá-lo — que é o pior resultado
# possível para um guarda.
# ---------------------------------------------------------------------------
EXTENSOES = ["*.py", "*.ts", "*.tsx", "*.js", "*.mjs", "*.jsx",
             "*.md", "*.sql", "*.json", "*.yml", "*.yaml", "*.sh", "*.html"]

EXCLUIR = [
    ":!*package-lock.json", ":!*pnpm-lock.yaml", ":!*poetry.lock",
    ":!**/node_modules/**", ":!**/.venv/**", ":!**/.next/**",
    ":!**/.open-next/**", ":!out/**", ":!dist/**", ":!**/busca-indice/**",
]

# `[0-9]` e NÃO `\d`: `git grep -E` é POSIX ERE e não conhece `\d`. A primeira
# versão do teste irmão usava `\d`, casava zero, e passava verde com CPF real
# no repositório. Guarda cego é pior que guarda nenhum.
RE_CPF = r"\b[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}\b|\b[0-9]{11}\b"

# Segredo. Cada padrão é de credencial que só existe em UMA forma — evita o
# ruído de bater em `process.env.X`, `${{ secrets.Y }}` e placeholder.
# ⚠️ POSIX ERE, não PCRE. `git grep -E` NÃO aceita `(?:...)` nem `(?!...)`:
# rejeita a linha inteira com "Invalid preceding regular expression", e a
# varredura daquele padrão morre em silêncio para quem só olha o exit code. A
# primeira versão deste arquivo usava os dois. Filtro que precisaria de
# lookahead se faz em Python, depois — ver `achar_segredo`.
SEGREDOS = [
    (r"\bsk-[A-Za-z0-9_-]{20,}", "chave de API estilo OpenAI"),
    (r"\bgh[pousr]_[A-Za-z0-9]{30,}", "token do GitHub"),
    (r"\bAKIA[0-9A-Z]{16}", "chave de acesso AWS"),
    (r"\bAIza[0-9A-Za-z_-]{35}", "chave de API do Google"),
    (r"\bxox[baprs]-[0-9A-Za-z-]{10,}", "token do Slack"),
    (r"BEGIN [A-Z ]*PRIVATE KEY", "chave privada"),
    (r"postgres(ql)?://[^:/@ ]+:[^@ ]{4,}@", "string de conexão com senha"),
]

# Host local não é vazamento: é o banco de desenvolvimento do projeto
# (`postgres://postgres@127.0.0.1`). Recorte feito aqui, e não no padrão,
# porque exigiria lookahead.
RE_HOST_LOCAL = re.compile("@(127[.]0[.]0[.]1|localhost|::1)")

# CPF sintético usado de propósito para ilustrar formato. Não é achado.
# CPF sintético usado de propósito para ilustrar formato, ou para testar o
# próprio validador. `12345678909` é mod-11 VÁLIDO e é o CPF canônico de teste
# no Brasil — precisa estar aqui justamente porque passa na régua: sem ele, o
# teste que verifica se o validador funciona seria barrado por este script.
SINTETICOS = {"00000000000", "000.000.000-00", "11111111111", "12345678900",
              "12345678909", "123.456.789-09"}


def cpf_valido(digitos: str) -> bool:
    """Dígitos verificadores. Falso para os 11-dígitos-iguais.

    Valida por mod-11 em vez de só contar 11 dígitos: sem isto, código IBGE,
    número de protocolo e id de processo disparariam o alarme, e um guarda que
    grita à toa é desligado na segunda semana.
    """
    if len(digitos) != 11 or len(set(digitos)) == 1:
        return False

    def dv(ate: int) -> int:
        soma = sum(int(digitos[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        return 0 if resto == 10 else resto

    return dv(9) == int(digitos[9]) and dv(10) == int(digitos[10])


def _git_grep(padrao: str, staged: bool) -> list[str]:
    escopo = ["--cached"] if staged else []
    # `-e` antes do padrão: sem ele, um padrão que começa com `-` (como o de
    # chave privada) é lido pelo git como OPÇÃO, e a varredura morre com
    # "unknown option" em vez de procurar.
    cmd = ["git", "grep", "-nIE", *escopo, "-e", padrao,
           "--", *EXTENSOES, *EXCLUIR]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                       errors="replace")
    # `git grep` sai com 1 quando não casa nada — é o caso bom.
    if r.returncode not in (0, 1):
        print(f"⚠️  git grep falhou ({r.returncode}): {r.stderr.strip()[:200]}",
              file=sys.stderr)
        return []
    return [l for l in r.stdout.splitlines() if l.strip()]


def achar_cpf(staged: bool) -> list[tuple[str, str]]:
    """(linha do git grep, o CPF achado) — só os que passam no mod-11."""
    achados = []
    for linha in _git_grep(RE_CPF, staged):
        # `arquivo:numero:conteudo` — o conteúdo pode ter `:`, então split(2).
        partes = linha.split(":", 2)
        if len(partes) < 3:
            continue
        for m in re.finditer(RE_CPF, partes[2]):
            valor = m.group(0)
            if valor in SINTETICOS:
                continue
            if cpf_valido(re.sub(r"\D", "", valor)):
                achados.append((f"{partes[0]}:{partes[1]}", valor))
    return achados


def achar_segredo(staged: bool) -> list[tuple[str, str, str]]:
    achados = []
    for padrao, rotulo in SEGREDOS:
        for linha in _git_grep(padrao, staged):
            partes = linha.split(":", 2)
            if len(partes) < 3:
                continue
            conteudo = partes[2]
            # Referência a variável de ambiente ou a secret de CI não é
            # credencial: é o jeito certo de fazer.
            if re.search(r"process\.env|os\.environ|\$\{\{\s*secrets|getenv",
                         conteudo):
                continue
            if rotulo.startswith("string de") and RE_HOST_LOCAL.search(conteudo):
                continue
            achados.append((f"{partes[0]}:{partes[1]}", rotulo,
                            conteudo.strip()[:100]))
    return achados


def main() -> int:
    # O console do Windows abre em cp1252 e estoura em qualquer caractere fora
    # dele. Um guarda que quebra ao RELATAR o achado não protege nada.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, io.UnsupportedOperation):
        pass

    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--staged", action="store_true",
                   help="varrer só o index, em vez de tudo que é rastreado")
    opts = p.parse_args()

    cpfs = achar_cpf(opts.staged)
    segredos = achar_segredo(opts.staged)

    if not cpfs and not segredos:
        print("✓ nenhum CPF de pessoa real nem segredo em arquivo de código")
        return 0

    print()
    print("═" * 72)
    print("  PUSH BARRADO — dado que não pode sair da máquina")
    print("═" * 72)

    if cpfs:
        print(f"\n  {len(cpfs)} CPF válido(s) por mod-11:\n")
        for onde, valor in cpfs:
            print(f"    {onde}  →  {valor}")
        print("\n  Troque por 000.000.000-00. Se precisa ilustrar formato, o")
        print("  sintético ilustra igual — e não é o CPF de ninguém.")

    if segredos:
        print(f"\n  {len(segredos)} segredo(s) provável(is):\n")
        for onde, rotulo, trecho in segredos:
            print(f"    {onde}  →  {rotulo}")
            print(f"        {trecho}")
        print("\n  Tire do código e leia de variável de ambiente.")

    print("\n  Se for FALSO POSITIVO, acrescente o valor a SINTETICOS ou ajuste")
    print("  o padrão em scripts/checar-dado-pessoal.py — e diga por quê no")
    print("  commit. Nunca use --no-verify para passar por cima calado.")
    print()
    return 1


if __name__ == "__main__":
    sys.exit(main())
