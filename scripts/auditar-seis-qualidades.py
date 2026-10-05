#!/usr/bin/env python3
"""Auditor ESTATICO das seis qualidades nas paginas de acervo do portal.

O QUE E ESTE MODULO
-------------------
O dono fixou a "regra das seis qualidades" (AGENTS.md, secao 8): toda pagina
que publica acervo ou lista de dados deve oferecer, no minimo:

  1. link direto para a fonte oficial de cada registro;
  2. busca textual;
  3. filtros por faceta real (status, UF, ano, categoria, tag);
  4. ordenacao por coluna (crescente e decrescente);
  5. resumo / microresumo e cartoes de topo com agregados medidos;
  6. exportacao CSV com BOM UTF-8 e separador `;`, alem de impressao nativa
     (a qualidade 5 do AGENTS e o chatbot civico; aqui ficou fora do escopo
     do auditor porque nao da para inferir RAG lendo o JSX de uma pagina).

Este script le o CODIGO-FONTE das paginas (`page.tsx` sob `--raiz`) e dos
componentes vizinhos que elas importam, e marca por heuristica quais dessas
qualidades PARECEM estar presentes. A saida e um mapa para o dono priorizar
o trabalho -- nao um veredito.

LIMITACAO DECLARADA (leia antes de confiar no resultado)
--------------------------------------------------------
A auditoria e ESTATICA, por palavra-chave. Ausencia de sinal NAO significa
ausencia do recurso: o botao de exportar pode morar num componente importado
de fora do diretorio vizinho, num `lib/`, num hook, ou o filtro pode ser
renderizado por uma biblioteca. Por isso:

  - "nao" = o padrao nao apareceu no que foi lido; pede conferencia humana;
  - "sim" = o padrao apareceu; confirma que o recurso existe no papel, mas
    nao prova que funciona (o filtro pode devolver vazio sempre).

Regra do projeto: pagina que le do banco so mostra as seis qualidades quando
o banco responde (AGENTS secao 8). "Pagina vazia" no ar NAO e "codigo
faltando" -- e o auditor estatico e o ar contam historias diferentes.

COMO FUNCIONA
-------------
- Varre recursivamente `--raiz` (padrao `apps/web/app`) atras de `page.tsx`.
- Para cada pagina, junta o texto do proprio arquivo com o dos componentes
  vizinhos citados por import relativo (`./`, `../`) ou pelo alias `@/app/`
  (um nivel, sem recursao).
- Procura SINAIS por expressao regular em cada categoria e grava `sim`/`nao`.
- Escreve um CSV (`;` + BOM, amigavel ao Excel brasileiro) e imprime no
  stdout quantas paginas tem cada qualidade.

USO
---
    python scripts/auditar-seis-qualidades.py
    python scripts/auditar-seis-qualidades.py --raiz apps/web/app \
        --saida auditoria-seis-qualidades.csv
    python scripts/auditar-seis-qualidades.py --sem-vizinhos   # so o page.tsx

Saida: `auditoria-seis-qualidades.csv` na pasta corrente.
"""

from __future__ import annotations

import argparse
import csv
import os
import re
import sys
from pathlib import Path

# O console do Windows nasce em cp1252 e quebra ao imprimir certos caracteres.
# errors="replace" garante que o relatorio nunca derrube o script (AGENTS secao 6).
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")


# ══════════════════════════════════════════════════════════════════════════
# SINAIS: cada qualidade vira uma lista de expressoes regulares.
# A ideia e ser generoso no "sim" (pegar o recurso quando ele existe) e
# honesto no docstring (avisar que o silencio nao prova ausencia).
# ══════════════════════════════════════════════════════════════════════════

# Qualidade 2a: busca textual. Inclui input de busca, hook do Next que le a
# querystring e componentes cujo nome comeca com "Busca".
SINAIS_BUSCA = [
    r'type\s*=\s*["\']search["\']',
    r'\buseSearchParams\b',
    r'\bBusca[A-Za-z]*\b',
    r'\bBuscar\b',
    r'role\s*=\s*["\']search["\']',
    r'placeholder\s*=\s*["\'][^"\']*[Bb]usc',
]

# Qualidade 2b: filtros por faceta. Select, checkbox, componente "Filtro*"
# e o metodo `filter` de array (heuristica; pode ser falso positivo).
SINAIS_FILTROS = [
    r'<select\b',
    r'type\s*=\s*["\']checkbox["\']',
    r'\bFiltro[A-Za-z]*\b',
    r'\bFaceta[A-Za-z]*\b',
    r'\bfilter\b',
    r'aria-label\s*=\s*["\'][^"\']*[Ff]iltr',
]

# Qualidade 3: ordenacao por coluna. `aria-sort` e o sinal mais forte de
# tabela ordenavel acessivel; `ordenar` cobre os botoes em portugues.
SINAIS_ORDENACAO = [
    r'aria-sort',
    r'\bsortable\b',
    r'\bordenar\b',
    r'\bordenacao\b',
    r'\bordenarPor\b',
    r'onClick\s*=\s*\{[^}]*[Ss]ort',
    r'\.sort\(',
]

# Qualidade 4: cartoes de topo e agregados. Nomes de componente de cartao e
# constantes agregadas do tipo `COBERTURA_*` / `total*`.
SINAIS_CARTOES = [
    r'\bDataCard\b',
    r'\bStatCard\b',
    r'\bCartao[A-Za-z]*\b',
    r'\bCard\b',
    r'\bResumo[A-Za-z]*\b',
    r'\bCOBERTURA_[A-Z_]+',
    r'\btotal[A-Za-z_]*\b',
]

# Qualidade 6: exportacao CSV e impressao. Procura download de Blob, extensao
# .csv, o BOM UTF-8 literal e o `;` usado como separador na montagem da linha.
SINAIS_CSV = [
    r"\.csv",
    r'\bBlob\b',
    r'\\uFEFF',
    '\ufeff',
    r'\bCSV\b',
    r'\bbaixar\b',
    r'\bdownload\b',
    r'text/csv',
    r"join\(\s*['\"];['\"]",
    r'\bseparador\b',
]

# Qualidade 1: link para a fonte oficial. "Fonte" no rotulo e dominios
# publicos brasileiros sao os sinais mais diretos; `href` cobre o restante.
SINAIS_LINK_FONTE = [
    r'\b[Ff]onte\b',
    r'\blink[_-]?[Ff]onte\b',
    r'\burl[_-]?[Ff]onte\b',
    r'gov\.br',
    r'\.org\.br',
    r'\.jus\.br',
    r'\.leg\.br',
    r'\.mp\.br',
    r'\bhref\b',
]

# Componentes conhecidos do padrao do portal (usados como coluna de apoio,
# nao como uma das seis qualidades).
SINAIS_TABELA_ESTATICA = [r'\bTabelaEstatica\b']
SINAIS_RESUMO_EXPANDIVEL = [r'\bResumoExpandivel\b']


# Ordem e rotulos das colunas booleanas no CSV. `chave` e o nome da coluna,
# `rotulo` e o texto humano usado no resumo do stdout.
QUALIDADES = [
    ("busca", "busca textual", SINAIS_BUSCA),
    ("filtros", "filtros por faceta", SINAIS_FILTROS),
    ("ordenacao", "ordenacao por coluna", SINAIS_ORDENACAO),
    ("cartoes_topo", "cartoes de topo / agregados", SINAIS_CARTOES),
    ("csv_bom", "exportacao CSV + BOM", SINAIS_CSV),
    ("link_fonte", "link a fonte oficial", SINAIS_LINK_FONTE),
]

# Limite de arquivos vizinhos lidos por pagina. Evita que uma pagina que
# importa muitos componentes estoure o tempo da varredura.
LIMITE_VIZINHOS = 40


# ══════════════════════════════════════════════════════════════════════════
# LEITURA E RESOLUCAO DE ARQUIVOS
# ══════════════════════════════════════════════════════════════════════════

# Captura o caminho em `from "x"`, `import "x"` e `import("x")`.
PADRAO_IMPORT = re.compile(r"""(?:from|import)\s*\(?\s*["']([^"']+)["']""")


def ler_texto(caminho: Path) -> str:
    """Le um arquivo como texto UTF-8 tolerante a erro.

    `errors="replace"` evita que um byte estranho derrube a auditoria; o pior
    caso e perder um pedaco de sinal, nao o relatorio inteiro.
    """
    try:
        return caminho.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def resolver_modulo(base: Path) -> Path | None:
    """Acha o arquivo real por tras de um especificador de import sem extensao.

    O TypeScript permite importar `./Lista` significando `Lista.tsx`. Aqui a
    gente tenta as extensoes usuais do projeto e, se `base` for um diretorio,
    os `index.*`. Devolve `None` quando nada existe.
    """
    candidatos: list[Path] = []
    if base.suffix:
        candidatos.append(base)
        for ext in (".tsx", ".ts", ".jsx", ".js"):
            candidatos.append(base.with_suffix(ext))
    else:
        for ext in (".tsx", ".ts", ".jsx", ".js"):
            candidatos.append(base.with_suffix(ext))
        for nome in ("index.tsx", "index.ts", "index.jsx", "index.js"):
            candidatos.append(base / nome)
    for candidato in candidatos:
        if candidato.is_file():
            return candidato
    return None


def vizinhos_da_pagina(pagina: Path, raiz: Path) -> list[Path]:
    """Resolve os componentes vizinhos citados nos imports de uma pagina.

    So seguimos:
      - imports relativos (`./`, `../`), os "vizinhos" de verdade;
      - o alias `@/app/`, que aponta para a propria raiz varrida.

    Imports de `lib/`, de pacote npm ou de `@/components/` ficam de fora:
    puxar biblioteca inteira encheria a pagina de sinais que nao sao dela
    (ha `.csv` e `href` em todo canto) e falsearia o mapa.
    """
    texto = ler_texto(pagina)
    encontrados: list[Path] = []
    vistos: set[Path] = set()

    for especificador in PADRAO_IMPORT.findall(texto):
        if especificador.startswith("."):
            base = (pagina.parent / especificador).resolve()
        elif especificador.startswith("@/app/"):
            base = (raiz / especificador[len("@/app/") :]).resolve()
        else:
            continue

        alvo = resolver_modulo(base)
        if alvo is None or alvo == pagina or alvo in vistos:
            continue
        vistos.add(alvo)
        encontrados.append(alvo)
        if len(encontrados) >= LIMITE_VIZINHOS:
            break

    return encontrados


# ══════════════════════════════════════════════════════════════════════════
# DETECCAO DOS SINAIS
# ══════════════════════════════════════════════════════════════════════════


def casa_algum(padroes: list[str], texto: str) -> bool:
    """Diz se pelo menos um dos padroes aparece no texto (sem diferenciar caixa)."""
    return any(re.search(p, texto, re.IGNORECASE) for p in padroes)


def auditar_pagina(pagina: Path, raiz: Path, com_vizinhos: bool) -> dict:
    """Monta a linha de auditoria de uma pagina.

    Devolve um dicionario com uma chave booleana por qualidade, as colunas de
    apoio (`usa_tabela_estatica`, `usa_resumo_expandivel`), a contagem de
    arquivos lidos e o caminho relativo exibido no CSV.
    """
    arquivos = [pagina]
    if com_vizinhos:
        arquivos.extend(vizinhos_da_pagina(pagina, raiz))

    # Junta todo o texto relevante uma vez so; a deteccao e por regex em cima
    # dessa string combinada.
    texto = "\n".join(ler_texto(a) for a in arquivos)

    linha: dict = {
        "pagina": exibir_caminho(pagina),
        "arquivos_lidos": len(arquivos),
    }
    for chave, _rotulo, padroes in QUALIDADES:
        linha[chave] = casa_algum(padroes, texto)
    linha["usa_tabela_estatica"] = casa_algum(SINAIS_TABELA_ESTATICA, texto)
    linha["usa_resumo_expandivel"] = casa_algum(SINAIS_RESUMO_EXPANDIVEL, texto)
    return linha


def exibir_caminho(caminho: Path) -> str:
    """Caminho relativo a pasta corrente em barras normais (estavel no Windows)."""
    try:
        relativo = os.path.relpath(caminho, Path.cwd())
    except ValueError:
        # Unidades diferentes no Windows: cai no caminho absoluto.
        relativo = str(caminho)
    return Path(relativo).as_posix()


# ══════════════════════════════════════════════════════════════════════════
# SAIDA
# ══════════════════════════════════════════════════════════════════════════


def escrever_csv(linhas: list[dict], destino: Path) -> None:
    """Grava o CSV com `;` e BOM, o mesmo formato que o portal exporta."""
    colunas = (
        ["pagina"]
        + [chave for chave, _rotulo, _p in QUALIDADES]
        + ["usa_tabela_estatica", "usa_resumo_expandivel", "arquivos_lidos"]
    )
    with destino.open("w", encoding="utf-8-sig", newline="") as arquivo:
        escritor = csv.writer(arquivo, delimiter=";")
        escritor.writerow(colunas)
        for linha in linhas:
            valores = [linha["pagina"]]
            for chave, _rotulo, _p in QUALIDADES:
                valores.append("sim" if linha[chave] else "nao")
            valores.append("sim" if linha["usa_tabela_estatica"] else "nao")
            valores.append("sim" if linha["usa_resumo_expandivel"] else "nao")
            valores.append(linha["arquivos_lidos"])
            escritor.writerow(valores)


def imprimir_resumo(linhas: list[dict], destino: Path) -> None:
    """Imprime no stdout quantas paginas tem cada qualidade."""
    total = len(linhas)
    if total == 0:
        print("Nenhum page.tsx encontrado. Confira o --raiz.")
        return

    print("")
    print("=" * 64)
    print("AUDITORIA ESTATICA DAS SEIS QUALIDADES")
    print("=" * 64)
    print(f"Paginas page.tsx varridas : {total}")
    print("-" * 64)

    for chave, rotulo, _p in QUALIDADES:
        com = sum(1 for linha in linhas if linha[chave])
        pct = (com / total) * 100
        print(f"  {rotulo:<34} {com:>4} sim  ({pct:5.1f}%)")

    print("-" * 64)
    tabela = sum(1 for linha in linhas if linha["usa_tabela_estatica"])
    resumo = sum(1 for linha in linhas if linha["usa_resumo_expandivel"])
    print(f"  {'usa TabelaEstatica (apoio)':<34} {tabela:>4} sim")
    print(f"  {'usa ResumoExpandivel (apoio)':<34} {resumo:>4} sim")

    # Paginas que parecem ter as seis de uma vez: o alvo da regra do dono.
    completas = sum(
        1
        for linha in linhas
        if all(linha[chave] for chave, _r, _p in QUALIDADES)
    )
    print("-" * 64)
    print(f"  {'com as seis qualidades juntas':<34} {completas:>4} sim")
    print("=" * 64)
    print(f"CSV: {exibir_caminho(destino)}")
    print("LEMBRETE: auditoria estatica por heuristica.")
    print("'nao' pede conferencia; o recurso pode estar em componente importado.")
    print("")


# ══════════════════════════════════════════════════════════════════════════
# ENTRADA
# ══════════════════════════════════════════════════════════════════════════


def montar_parser() -> argparse.ArgumentParser:
    """Define os argumentos de linha de comando do auditor."""
    parser = argparse.ArgumentParser(
        description=(
            "Auditor estatico das seis qualidades (AGENTS secao 8) nas paginas "
            "de acervo. Le page.tsx e vizinhos e gera um CSV de priorizacao."
        )
    )
    parser.add_argument(
        "--raiz",
        default="apps/web/app",
        help="Pasta raiz das rotas do App Router (padrao: apps/web/app).",
    )
    parser.add_argument(
        "--saida",
        default="auditoria-seis-qualidades.csv",
        help="Arquivo CSV de saida (padrao: auditoria-seis-qualidades.csv).",
    )
    parser.add_argument(
        "--sem-vizinhos",
        action="store_true",
        help="Audita so o page.tsx, sem ler os componentes vizinhos importados.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """Ponto de entrada: varre as paginas, detecta sinais e reporta."""
    args = montar_parser().parse_args(argv)
    raiz = Path(args.raiz)

    if not raiz.is_dir():
        print(f"ERRO: --raiz nao e uma pasta valida: {raiz}", file=sys.stderr)
        return 1

    paginas = sorted(raiz.rglob("page.tsx"))
    com_vizinhos = not args.sem_vizinhos

    linhas = [auditar_pagina(p, raiz, com_vizinhos) for p in paginas]

    destino = Path(args.saida)
    escrever_csv(linhas, destino)
    imprimir_resumo(linhas, destino)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
