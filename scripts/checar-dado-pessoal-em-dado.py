#!/usr/bin/env python3
"""
Barra CPF de pessoa real em DADO ingerido (JSON de acervo/dataset).

═══ POR QUE ESTE ARQUIVO EXISTE ═══

`checar-dado-pessoal.py` varre CÓDIGO-FONTE rastreado no git e, por design,
deixa de fora o que é DADO coletado de fonte pública — `.geojson`, `.csv` e os
dumps — para não deixar o hook lento. O portal começou a ingerir acervo, e o
mesmo risco que vazou por comentário de código em 13/08/2026 (seis CPF reais
publicados no `origin/main`) voltou a morar no DADO: `docs/FONTES-ROUANET-
SALIC.md` registra um CPF que só foi pego porque alguém abriu o arquivo à mão —
"dado pessoal não estava no campo de dado pessoal, estava no texto ao lado".

`docs/planos/TODO-PROXIMAS-RODADAS.md` (§1) registra a dívida: a trava não
cobre acervo ingerido. Este arquivo é essa trava: o mesmo regex de CPF mod-11,
rodando sobre JSON estruturado em vez de `git grep` sobre código. É uma REDE DE
SEGURANÇA automática — não substitui a triagem semântica por acervo
(`apps/web/lib/paraopeba/triagem.ts` pega "L.H.M.G." e "lista de pessoas
desaparecidas", que não têm CPF e passariam batidos aqui).

═══ O QUE ELE VARRE, E POR QUÊ ═══

Só JSON de acervo/dataset em caminhos de DADO, por padrão:

    DIRETORIOS_DADO = [
        "apps/web/data", "apps/web/public/data",
        "docs/dados", "docs/judiciario", "docs/ambiental",
        "etl/betim/dados", "etl/judiciario/etl/dados",
    ]

A lista não é só os dois diretórios originais: é todo diretório rastreado
onde um coletor (`scripts/coletar-*`, `etl/*/etl/apis/*`) grava JSON bruto,
ou onde um doc de frente versiona corpus curado (ex. `docs/judiciario/f0-
corpus-indicacoes.json`, 724 indicações). Ficar de fora daqui é ficar de fora
do pre-push e da CI — foi o caso de `etl/betim/dados/` até 22/08/2026: 25 JSON
de coletor, um deles com 8.570 normas, sem varredura nenhuma até alguém abrir
o arquivo à mão por outro motivo e notar o buraco.

Espacial (`.geojson`) e CSV ficam de fora pela mesma decisão de design do
script irmão: são dados de órgão público já vistados na ingestão, e varrer
megabyte de geometria a cada push deixa o guarda lento a ponto de alguém
desligá-lo. Para um acervo novo (ex. o dump do Solr da Plataforma Brumadinho
UFMG), basta apontar `--extra <arquivo|dir>` — a chamada do dump entra no
pipeline de ingestão, antes de qualquer JSON público sair da máquina. Isso
serve para um dump de UMA rodada: `--extra` não roda sozinho no pre-push nem
na CI (nenhum dos dois passa a flag hoje). Diretório que um coletor grava a
CADA rodada precisa estar em DIRETORIOS_DADO, não só atrás de `--extra` — do
contrário a proteção depende de alguém lembrar de digitar a flag toda vez.

Só os VALORES de texto são varridos (não as chaves, não a estrutura), e só
valores que seriam um CPF de verdade — mod-11. CNPJ (14 dígitos), código IBGE
(7 dígitos) e id/protocolo de 11 dígitos que não passa no mod-11 não disparam.

═══ POR QUE EM PYTHON, E NÃO SÓ NO TESTE DO PORTAL ═══

O script irmão é Python para rodar em QUALQUER repositório do projeto (inclusive
os sem Node) e no hook de pre-push. Este segue a mesma régua. O teste gêmeo em
`apps/web/lib/sem-dado-pessoal-no-repo.test.ts` é a versão que roda no
`npm test`.

Uso:
    python scripts/checar-dado-pessoal-em-dado.py            # varrer o DADO inteiro
    python scripts/checar-dado-pessoal-em-dado.py --staged   # só o que está no index
    python scripts/checar-dado-pessoal-em-dado.py --extra caminho.json  # + 1 arquivo/dir
    python scripts/checar-dado-pessoal-em-dado.py --self-test  # prova que a régua vê e não é cega

Sai com 1 se achar. A mensagem diz o arquivo, o caminho dentro do JSON e o valor.
"""

from __future__ import annotations

import argparse
import glob
import io
import json
import os
import re
import subprocess
import sys
import tempfile

# ---------------------------------------------------------------------------
# O que se varre.
#
# Só JSON de DADO. As EXTENSOES/EXCLUIR do script irmão (`checar-dado-
# pessoal.py`) não se aplicam aqui — este arquivo não usa `git grep`, lê o
# arquivo e caminha pela estrutura.
# ---------------------------------------------------------------------------
DIRETORIOS_DADO = [
    "apps/web/data", "apps/web/public/data",
    "docs/dados", "docs/judiciario", "docs/ambiental",
    "etl/betim/dados", "etl/judiciario/etl/dados",
]

# `[0-9]` e NÃO `\d`: mesmo dialeto do script irmão, e a mesma razão — a
# primeira versão do teste irmão usava `\d` num contexto POSIX ERE e casava
# zero. Aqui o `re` é Python (PCRE), mas manter o padrão idêntico evita
# divergência entre as três cópias (este, `checar-dado-pessoal.py` e o teste).
RE_CPF = r"\b[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}\b|\b[0-9]{11}\b"
_RE_CPF = re.compile(RE_CPF)

# CPF sintético usado de propósito para ilustrar formato, ou para testar o
# próprio validador. `12345678909` é mod-11 VÁLIDO e é o CPF canônico de teste
# no Brasil — precisa estar aqui justamente porque passa na régua.
#
# ⚠️ ESTA LISTA TEM DUAS GÊMEAS: `scripts/checar-dado-pessoal.py` (`SINTETICOS`)
# e `apps/web/lib/sem-cpf-no-repo.test.ts` (`SINTETICOS`). As três JÁ
# DIVERGIRAM uma vez (`12345678909` foi acrescentado numa e esquecido na outra,
# e a suíte quebrou no merge seguinte). Mexeu numa, mexa nas três.
SINTETICOS = {"00000000000", "000.000.000-00", "11111111111", "12345678900",
              "12345678909", "123.456.789-09", "47018614139"}


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


def _procurar_em_texto(texto: str, caminho: str) -> list[tuple[str, str]]:
    """(caminho dentro do JSON, valor) — só os que passam no mod-11."""
    achados = []
    for m in _RE_CPF.finditer(texto):
        valor = m.group(0)
        if valor in SINTETICOS:
            continue
        if cpf_valido(re.sub(r"\D", "", valor)):
            achados.append((caminho, valor))
    return achados


def _varrer_valor(valor: object, caminho: str) -> list[tuple[str, str]]:
    """Caminha pela estrutura e varre só os valores escalares de texto.

    Não varre chave nem número — coordenada de geometria e id numérico não são
    CPF. Inteiro de 11 dígitos é varrido como texto (é indistinguível de CPF
    sem contexto, e o mod-11 filtra o que não é).
    """
    if isinstance(valor, dict):
        achados = []
        for chave, item in valor.items():
            achados += _varrer_valor(item, f"{caminho}.{chave}")
        return achados
    if isinstance(valor, list):
        achados = []
        for i, item in enumerate(valor):
            achados += _varrer_valor(item, f"{caminho}[{i}]")
        return achados
    if isinstance(valor, str):
        return _procurar_em_texto(valor, caminho)
    if isinstance(valor, int):
        return _procurar_em_texto(str(valor), caminho)
    return []


def _em_escopo(caminho: str) -> bool:
    if not caminho.endswith(".json"):
        return False
    for pasta in DIRETORIOS_DADO:
        if caminho == pasta or caminho.startswith(pasta + os.sep):
            return True
    return False


def _arquivos_em_escopo(staged: bool) -> list[str]:
    if staged:
        # Depois do commit o index casa com HEAD; `--staged` serve para quem
        # quer conferir ANTES do commit. Filtra pelo escopo de DADO.
        r = subprocess.run(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
            capture_output=True, text=True, encoding="utf-8", errors="replace",
        )
        if r.returncode not in (0, 1):
            print(f"⚠️  git diff --cached falhou ({r.returncode}): "
                  f"{r.stderr.strip()[:200]}", file=sys.stderr)
            return []
        return [l.strip().replace("/", os.sep) for l in r.stdout.splitlines()
                if l.strip() and _em_escopo(l.strip().replace("/", os.sep))]
    arquivos = []
    for pasta in DIRETORIOS_DADO:
        arquivos += glob.glob(os.path.join(pasta, "**", "*.json"), recursive=True)
    return sorted(set(arquivos))


def _escanear_arquivo(caminho: str) -> list[tuple[str, str]]:
    try:
        with open(caminho, encoding="utf-8") as f:
            dados = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        print(f"⚠️  não consegui ler {caminho}: {e}", file=sys.stderr)
        return []
    return _varrer_valor(dados, "$")


def achar_cpf(arquivos: list[str]) -> list[tuple[str, str, str]]:
    """(arquivo, caminho dentro do JSON, o CPF achado)."""
    achados = []
    for arquivo in arquivos:
        for onde, valor in _escanear_arquivo(arquivo):
            achados.append((arquivo, onde, valor))
    return achados


def self_test() -> int:
    """Prova que a régua vê e não é cega. Zero arquivos do repositório tocados.

    Só o CPF canônico de teste (`12345678909` — mod-11 válido sem ser de
    ninguém) aparece aqui, no mesmo espírito do teste da régua em
    `sem-cpf-no-repo.test.ts`: nunca usar CPF de pessoa real como exemplo.
    Como ele mora em SINTETICOS por design, o caso "o scanner acha" o tira da
    lista temporariamente — prova o caminho finder+validador+relatório sem
    precisar de um número de alguém.
    """
    falhas = 0

    def verifica(rotulo: str, ok: bool, detalhe: str = "") -> None:
        nonlocal falhas
        if not ok:
            falhas += 1
            print(f"✗ {rotulo} {detalhe}")
        else:
            print(f"✓ {rotulo}")

    # 1. A régua do mod-11 funciona nos dois sentidos (unidade, sem arquivo).
    verifica("validador aceita 12345678909", cpf_valido("12345678909"))
    verifica("validador rejeita 00000000000", not cpf_valido("00000000000"))
    verifica("validador rejeita 11111111111", not cpf_valido("11111111111"))
    verifica("validador rejeita 12345678900", not cpf_valido("12345678900"))
    verifica("validador rejeita 3106705 (IBGE)", not cpf_valido("3106705"))

    # 2. O scanner acha CPF válido em estrutura aninhada e informa o caminho.
    global SINTETICOS
    guardado = SINTETICOS
    SINTETICOS = set()
    try:
        achados = _procurar_em_texto(
            "Documento de L.H.M.G. 12345678909 e 123.456.789-09 no texto", "$")
    finally:
        SINTETICOS = guardado
    verifica("scanner acha CPF corrido e formatado",
             any(v == "12345678909" for _, v in achados) and
             any(v == "123.456.789-09" for _, v in achados), f"→ {achados}")

    # 3. Com a lista de volta, o mesmo texto fica limpo — o sintético é isento.
    verifica("scanner respeita SINTETICOS",
             _procurar_em_texto("12345678909 e 123.456.789-09", "$") == [])

    # 4. Dado que NÃO é CPF não dispara — sintético, IBGE e CNPJ.
    tmp = tempfile.mkdtemp(prefix="dado-pessoal-")
    caminho = os.path.join(tmp, "aceita.json")
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump({"id": "00000000000", "ibge": "3106705",
                   "cnpj": "12345678000195", "nome": "Ninguém"}, f)
    verifica("sintético/IBGE/CNPJ não disparam",
             _escanear_arquivo(caminho) == [],
             f"→ {_escanear_arquivo(caminho)}")

    if falhas:
        print(f"\n{falhas} verificação(ões) falharam — a régua está cega. "
              f"Não confie nela.")
        return 1
    print("\n✓ a régua vê CPF válido, ignora sintético/IBGE/CNPJ e informa o caminho")
    return 0


def main() -> int:
    # O console do Windows abre em cp1252 e estoura em qualquer caractere fora
    # dele. Um guarda que quebra ao RELATAR o achado não protege nada.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, io.UnsupportedOperation):
        pass

    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--staged", action="store_true",
                   help="varrer só o DADO no index, em vez de tudo")
    p.add_argument("--extra", action="append", default=[],
                   help="arquivo ou diretório JSON a varrer além do escopo padrão")
    p.add_argument("--self-test", action="store_true",
                   help="provar que a régua vê e não é cega, e sair")
    opts = p.parse_args()

    if opts.self_test:
        return self_test()

    arquivos = _arquivos_em_escopo(opts.staged)
    for extra in opts.extra:
        if os.path.isdir(extra):
            arquivos += glob.glob(os.path.join(extra, "**", "*.json"), recursive=True)
        elif os.path.isfile(extra):
            arquivos.append(extra)
    arquivos = sorted(set(arquivos))

    if not arquivos:
        print("✓ nenhum arquivo de DADO no escopo")
        return 0

    cpfs = achar_cpf(arquivos)

    if not cpfs:
        print(f"✓ nenhum CPF de pessoa real em dado ingerido "
              f"({len(arquivos)} arquivo(s) de DADO)")
        return 0

    print()
    print("═" * 72)
    print("  PUSH BARRADO — CPF de pessoa real em DADO ingerido")
    print("═" * 72)
    print(f"\n  {len(cpfs)} CPF válido(s) por mod-11:\n")
    for arquivo, onde, valor in cpfs:
        print(f"    {arquivo}  {onde}  →  {valor}")
    print("\n  Este repositório é PÚBLICO. Redija o campo na ingestão (ou troque")
    print("  por 000.000.000-00) antes de commitar.")
    print("\n  Se for FALSO POSITIVO, acrescente o valor a SINTETICOS — e diga")
    print("  por quê no commit. Nunca use --no-verify para passar por cima")
    print("  calado.")
    print()
    return 1


if __name__ == "__main__":
    sys.exit(main())
