#!/usr/bin/env python3
"""
Barra dado pessoal e segredo antes de sair da mÃ¡quina.

â•â•â• POR QUE ESTE ARQUIVO EXISTE â•â•â•

Em 13/08/2026 uma varredura achou SEIS CPF de pessoa real, vÃ¡lidos por mod-11,
jÃ¡ publicados no `origin/main` de um repositÃ³rio PÃšBLICO. Quatro deles moravam
no comentÃ¡rio que documenta a funÃ§Ã£o que remove CPF: alguÃ©m mediu o vazamento
na base real, colou o exemplo verdadeiro para justificar a proteÃ§Ã£o, e o
exemplo virou o vazamento.

O projeto jÃ¡ tinha defesa em profundidade â€” lista branca de colunas na
exportaÃ§Ã£o, `PROIBIDOS` barrando nome de autuado, `_sanitizar_nome` no coletor.
Todas no caminho do DADO. Nenhuma olhava para CÃ“DIGO-FONTE, e foi por ali que
vazou.

â•â•â• POR QUE EM PYTHON, E NÃƒO NO TESTE DO PORTAL â•â•â•

Existe um teste equivalente em `apps/web/lib/sem-cpf-no-repo.test.ts`, mas ele
sÃ³ roda no `npm test` do portal. Este script Ã© o mesmo guarda em forma
portÃ¡til: sem dependÃªncia, roda com o Python que as duas mÃ¡quinas jÃ¡ tÃªm, e
serve para QUALQUER repositÃ³rio do projeto â€” inclusive o `terras-devolutas`,
que nÃ£o tem Node.

Ele Ã© chamado pelo hook de pre-push (`.githooks/pre-push`) e pela CI. O hook
protege quem esquece; a CI protege quem pulou o hook.

Uso:
    python scripts/checar-dado-pessoal.py           # varre o que estÃ¡ rastreado
    python scripts/checar-dado-pessoal.py --staged  # sÃ³ o que estÃ¡ no index

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
# SÃ³ o que Ã© ESCRITO Ã€ MÃƒO. Dado coletado de fonte pÃºblica (.geojson, .csv, os
# dumps) tem regra prÃ³pria no pipeline, e varrer megabyte de dado a cada push
# tornaria o hook lento a ponto de alguÃ©m desligÃ¡-lo â€” que Ã© o pior resultado
# possÃ­vel para um guarda.
# ---------------------------------------------------------------------------
EXTENSOES = ["*.py", "*.ts", "*.tsx", "*.js", "*.mjs", "*.jsx",
             "*.md", "*.sql", "*.json", "*.yml", "*.yaml", "*.sh", "*.html"]

EXCLUIR = [
    ":!*package-lock.json", ":!*pnpm-lock.yaml", ":!*poetry.lock",
    ":!**/node_modules/**", ":!**/.venv/**", ":!**/.next/**",
    ":!**/.open-next/**", ":!out/**", ":!dist/**", ":!**/busca-indice/**",
]

# `[0-9]` e NÃƒO `\d`: `git grep -E` Ã© POSIX ERE e nÃ£o conhece `\d`. A primeira
# versÃ£o do teste irmÃ£o usava `\d`, casava zero, e passava verde com CPF real
# no repositÃ³rio. Guarda cego Ã© pior que guarda nenhum.
RE_CPF = r"\b[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}\b|\b[0-9]{11}\b"

# Segredo. Cada padrÃ£o Ã© de credencial que sÃ³ existe em UMA forma â€” evita o
# ruÃ­do de bater em `process.env.X`, `${{ secrets.Y }}` e placeholder.
# âš ï¸ POSIX ERE, nÃ£o PCRE. `git grep -E` NÃƒO aceita `(?:...)` nem `(?!...)`:
# rejeita a linha inteira com "Invalid preceding regular expression", e a
# varredura daquele padrÃ£o morre em silÃªncio para quem sÃ³ olha o exit code. A
# primeira versÃ£o deste arquivo usava os dois. Filtro que precisaria de
# lookahead se faz em Python, depois â€” ver `achar_segredo`.
SEGREDOS = [
    (r"\bsk-[A-Za-z0-9_-]{20,}", "chave de API estilo OpenAI"),
    (r"\bgh[pousr]_[A-Za-z0-9]{30,}", "token do GitHub"),
    (r"\bAKIA[0-9A-Z]{16}", "chave de acesso AWS"),
    (r"\bAIza[0-9A-Za-z_-]{35}", "chave de API do Google"),
    (r"\bxox[baprs]-[0-9A-Za-z-]{10,}", "token do Slack"),
    (r"BEGIN [A-Z ]*PRIVATE KEY", "chave privada"),
    (r"postgres(ql)?://[^:/@ ]+:[^@ ]{4,}@", "string de conexÃ£o com senha"),
    # âŸ² 13/08: SEXTA TRAVA CEGA DO DIA, e esta era sobre segredo â€” a matÃ©ria
    # deste script. Um agente commitou `Authorization: APIKey <base64>` do
    # DataJud num .md e a varredura passou VERDE. O alcance estava certo
    # (`.md` jÃ¡ estÃ¡ em EXTENSOES); faltava o padrÃ£o. Os sete de cima
    # reconhecem credencial pelo PREFIXO do emissor (sk-, ghp_, AKIA...) e
    # nÃ£o veem chave que nÃ£o anuncia de quem Ã© â€” que Ã© a maioria das APIs
    # pÃºblicas brasileiras.
    #
    # Casa pelo CABEÃ‡ALHO, nÃ£o pelo formato da chave.
    #
    # âš ï¸ CLASSE DE MAIÃšSCULA ESCRITA Ã€ MÃƒO, e nÃ£o `(?i)`: `git grep -E` Ã©
    # POSIX ERE e REJEITA `(?i)` â€” a primeira versÃ£o disto morreu com
    # "Invalid preceding regular expression" no stderr E O SCRIPT AINDA
    # IMPRIMIU "âœ“ nenhum segredo". Ã‰ o mesmo modo de falha que o cabeÃ§alho
    # deste arquivo jÃ¡ registra duas vezes. Sem dialeto errado aqui.
    (r"[Aa][Uu][Tt][Hh][Oo][Rr][Ii][Zz][Aa][Tt][Ii][Oo][Nn][[:space:]]*:[[:space:]]*"
     r"([Aa][Pp][Ii][Kk][Ee][Yy]|[Bb][Ee][Aa][Rr][Ee][Rr]|[Bb][Aa][Ss][Ii][Cc]|[Tt][Oo][Kk][Ee][Nn])"
     r"[[:space:]]+[A-Za-z0-9+/=_.-]{16,}",
     "credencial em cabeÃ§alho Authorization"),
    (r"[Xx]-[Aa][Pp][Ii]-[Kk][Ee][Yy][[:space:]]*:[[:space:]]*[A-Za-z0-9+/=_.-]{16,}",
     "credencial em cabeÃ§alho X-API-Key"),
]

# Host local nÃ£o Ã© vazamento: Ã© o banco de desenvolvimento do projeto
# (`postgres://postgres@127.0.0.1`). Recorte feito aqui, e nÃ£o no padrÃ£o,
# porque exigiria lookahead.
RE_HOST_LOCAL = re.compile("@(127[.]0[.]0[.]1|localhost|::1)")

# CPF sintÃ©tico usado de propÃ³sito para ilustrar formato. NÃ£o Ã© achado.
# CPF sintÃ©tico usado de propÃ³sito para ilustrar formato, ou para testar o
# prÃ³prio validador. `12345678909` Ã© mod-11 VÃLIDO e Ã© o CPF canÃ´nico de teste
# no Brasil â€” precisa estar aqui justamente porque passa na rÃ©gua: sem ele, o
# teste que verifica se o validador funciona seria barrado por este script.
SINTETICOS = {"00000000000", "000.000.000-00", "11111111111", "12345678900", "47018614139", # falso positivo: agregado financeiro do SIAFI (R$ bi) capturado como inteiro pelo grep — dinheiro, nao CPF
              "12345678909", "123.456.789-09",
              "00003106705", # falso positivo: IBGE de Betim com zeros a esquerda (artefato do validate-docbr em docstring) — municipio, nao CPF
              # fixtures do teste adversarial de extracao do diario (lib/diario/extrairEntidades.adversarial.test.ts): CPFs sinteticos validos por mod-11, constantes de teste, nao pessoa real
              "84351260645", "843.512.606-45", "05982413615", "059.824.136-15"}


def cpf_valido(digitos: str) -> bool:
    """DÃ­gitos verificadores. Falso para os 11-dÃ­gitos-iguais.

    Valida por mod-11 em vez de sÃ³ contar 11 dÃ­gitos: sem isto, cÃ³digo IBGE,
    nÃºmero de protocolo e id de processo disparariam o alarme, e um guarda que
    grita Ã  toa Ã© desligado na segunda semana.
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
    # `-e` antes do padrÃ£o: sem ele, um padrÃ£o que comeÃ§a com `-` (como o de
    # chave privada) Ã© lido pelo git como OPÃ‡ÃƒO, e a varredura morre com
    # "unknown option" em vez de procurar.
    cmd = ["git", "grep", "-nIE", *escopo, "-e", padrao,
           "--", *EXTENSOES, *EXCLUIR]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                       errors="replace")
    # `git grep` sai com 1 quando nÃ£o casa nada â€” Ã© o caso bom.
    if r.returncode not in (0, 1):
        print(f"âš ï¸  git grep falhou ({r.returncode}): {r.stderr.strip()[:200]}",
              file=sys.stderr)
        return []
    return [l for l in r.stdout.splitlines() if l.strip()]


def achar_cpf(staged: bool) -> list[tuple[str, str]]:
    """(linha do git grep, o CPF achado) â€” sÃ³ os que passam no mod-11."""
    achados = []
    for linha in _git_grep(RE_CPF, staged):
        # `arquivo:numero:conteudo` â€” o conteÃºdo pode ter `:`, entÃ£o split(2).
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
            # ReferÃªncia a variÃ¡vel de ambiente ou a secret de CI nÃ£o Ã©
            # credencial: Ã© o jeito certo de fazer.
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
    # dele. Um guarda que quebra ao RELATAR o achado nÃ£o protege nada.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, io.UnsupportedOperation):
        pass

    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--staged", action="store_true",
                   help="varrer sÃ³ o index, em vez de tudo que Ã© rastreado")
    opts = p.parse_args()

    cpfs = achar_cpf(opts.staged)
    segredos = achar_segredo(opts.staged)

    if not cpfs and not segredos:
        print("âœ“ nenhum CPF de pessoa real nem segredo em arquivo de cÃ³digo")
        return 0

    print()
    print("â•" * 72)
    print("  PUSH BARRADO â€” dado que nÃ£o pode sair da mÃ¡quina")
    print("â•" * 72)

    if cpfs:
        print(f"\n  {len(cpfs)} CPF vÃ¡lido(s) por mod-11:\n")
        for onde, valor in cpfs:
            print(f"    {onde}  â†’  {valor}")
        print("\n  Troque por 000.000.000-00. Se precisa ilustrar formato, o")
        print("  sintÃ©tico ilustra igual â€” e nÃ£o Ã© o CPF de ninguÃ©m.")

    if segredos:
        print(f"\n  {len(segredos)} segredo(s) provÃ¡vel(is):\n")
        for onde, rotulo, trecho in segredos:
            print(f"    {onde}  â†’  {rotulo}")
            print(f"        {trecho}")
        print("\n  Tire do cÃ³digo e leia de variÃ¡vel de ambiente.")

    print("\n  Se for FALSO POSITIVO, acrescente o valor a SINTETICOS ou ajuste")
    print("  o padrÃ£o em scripts/checar-dado-pessoal.py â€” e diga por quÃª no")
    print("  commit. Nunca use --no-verify para passar por cima calado.")
    print()
    return 1


if __name__ == "__main__":
    sys.exit(main())
