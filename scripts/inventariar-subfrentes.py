# -*- coding: utf-8 -*-
"""Inventaria as rotas do portal e a fonte de dado que alimenta cada uma.

POR QUE EXISTE

A orquestração das subfrentes precisa de fila, e fila precisa de inventário.
Sem saber qual página tem dado medido e qual é só texto institucional, o
trabalho vira lista de intenção.

O QUE FAZ

1. lista toda rota com `page.tsx` em `apps/web/app`;
2. lê os imports de dado (`@/data/...`, `../../data/...`) e as chamadas
   `fetch("/data/...")`;
3. resolve o arquivo em `apps/web/data` ou `apps/web/public/data`;
4. conta os registros (lista, ou chave `itens`/`casos`/`total`);
5. classifica em `tem-dado`, `so-descritivo` ou `sem-dado`.

Saída: `apps/web/data/inventario-subfrentes.json`.

Uso:
    python scripts/inventariar-subfrentes.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
APP = RAIZ / "apps" / "web" / "app"
DADOS = RAIZ / "apps" / "web" / "data"
PUBLICOS = RAIZ / "apps" / "web" / "public" / "data"
SAIDA = DADOS / "inventario-subfrentes.json"
FILA = RAIZ / "logs" / "fila-subfrentes.jsonl"

IMPORTE_DADO = re.compile(r"""from\s+["']@/data/([^"']+)["']""")
IMPORTE_RELATIVO = re.compile(r"""from\s+["'][^"']*?/data/([^"']+)["']""")
FETCH_DADO = re.compile(r"""fetch\(\s*["']/data/([^"']+)["']""")
IMPORTE_LOCAL = re.compile(r"""from\s+["'](@/[^"']+|\.{1,2}/[^"']+)["']""")
ROTA_GRUPO = re.compile(r"\([^)]*\)")
WEB = RAIZ / "apps" / "web"
PROFUNDIDADE = 3


def rota_de(caminho: Path) -> str:
    relativo = caminho.relative_to(APP).as_posix()
    partes = [parte for parte in relativo.split("/") if parte != "page.tsx"]
    partes = [ROTA_GRUPO.sub("", parte) for parte in partes if ROTA_GRUPO.sub("", parte)]
    rota = "/" + "/".join(partes)
    return rota.rstrip("/") or "/"


def resolver_modulo(origem: Path, especificador: str) -> Path | None:
    """Resolve `@/lib/x` ou `../lib/x` para o arquivo .ts/.tsx no disco."""
    base = WEB if especificador.startswith("@/") else origem.parent
    relativo = especificador[2:] if especificador.startswith("@/") else especificador
    alvo = (base / relativo).resolve()
    candidatos = [alvo, Path(f"{alvo}.ts"), Path(f"{alvo}.tsx"),
                  alvo / "index.ts", alvo / "index.tsx"]
    for candidato in candidatos:
        if candidato.is_file():
            return candidato
    return None


def fontes_do_arquivo(caminho: Path) -> list[str]:
    """Dado citado direto no arquivo."""
    texto = caminho.read_text(encoding="utf-8", errors="replace")
    achados = IMPORTE_DADO.findall(texto) + IMPORTE_RELATIVO.findall(texto)
    achados += [item.replace(".json", "") for item in FETCH_DADO.findall(texto)]
    return [item for item in achados if not item.startswith("tipos")]


def fontes_da_rota(pagina: Path) -> list[str]:
    """Segue os imports locais até `PROFUNDIDADE` e junta as fontes de dado.

    A página quase nunca importa JSON: importa `@/lib/jurisprudencia`, que
    importa o acervo. Olhar só a página dava 8 rotas com dado em 348.
    """
    fontes: set[str] = set(fontes_do_arquivo(pagina))
    visitados: set[Path] = {pagina}
    fronteira = [pagina]
    for _ in range(PROFUNDIDADE):
        proxima = []
        for arquivo in fronteira:
            texto = arquivo.read_text(encoding="utf-8", errors="replace")
            for especificador in IMPORTE_LOCAL.findall(texto):
                modulo = resolver_modulo(arquivo, especificador)
                if not modulo or modulo in visitados or "node_modules" in str(modulo):
                    continue
                visitados.add(modulo)
                fontes.update(fontes_do_arquivo(modulo))
                proxima.append(modulo)
        fronteira = proxima
        if not fronteira:
            break
    return sorted(fontes)


def resolver(fonte: str) -> Path | None:
    nome = fonte if fonte.endswith(".json") else f"{fonte}.json"
    for base in (DADOS, PUBLICOS):
        caminho = base / nome
        if caminho.exists():
            return caminho
    return None


def contar(caminho: Path) -> int:
    """Registros do arquivo: lista direta ou chave conhecida."""
    try:
        dados = json.loads(caminho.read_text(encoding="utf-8"))
    except (ValueError, OSError):
        return 0
    if isinstance(dados, list):
        return len(dados)
    if isinstance(dados, dict):
        for chave in ("itens", "casos", "atos", "trechos", "documentos", "total"):
            valor = dados.get(chave)
            if isinstance(valor, list):
                return len(valor)
            if isinstance(valor, int):
                return valor
        return len(dados)
    return 0


def inventariar() -> list[dict]:
    rotas = []
    for pagina in sorted(APP.rglob("page.tsx")):
        fontes = fontes_da_rota(pagina)
        arquivos = [(fonte, resolver(fonte)) for fonte in fontes]
        existentes = [(fonte, caminho) for fonte, caminho in arquivos if caminho]
        registros = sum(contar(caminho) for _, caminho in existentes)
        if registros >= 10:
            classe = "tem-dado"
        elif existentes:
            classe = "so-descritivo"
        else:
            classe = "sem-dado"
        rotas.append({
            "rota": rota_de(pagina),
            "arquivo": pagina.relative_to(RAIZ).as_posix(),
            "dinamica": "[" in rota_de(pagina),
            "fontes": [fonte for fonte, _ in existentes],
            "registros": registros,
            "classe": classe,
        })
    return rotas


def gerar_fila(rotas: list[dict]) -> list[dict]:
    """Fila de trabalho: rota com dado, maior volume primeiro."""
    com_dado = [rota for rota in rotas if rota["classe"] == "tem-dado"]
    com_dado.sort(key=lambda rota: -rota["registros"])
    return [
        {
            "id": f"resumo-{indice:03d}",
            "subfrente": rota["rota"],
            "maquina": "desktop",
            "etapa": "F2",
            "status": "pendente",
            "registros": rota["registros"],
            "fontes": rota["fontes"],
            "checkpoint": None,
            "dono": None,
        }
        for indice, rota in enumerate(com_dado, 1)
    ]


def main() -> int:
    rotas = inventariar()
    resumo = {
        "geradoEm": "2026-11-08",
        "totalRotas": len(rotas),
        "porClasse": {
            classe: sum(1 for rota in rotas if rota["classe"] == classe)
            for classe in ("tem-dado", "so-descritivo", "sem-dado")
        },
        "rotas": rotas,
    }
    SAIDA.write_text(json.dumps(resumo, ensure_ascii=False, indent=1), encoding="utf-8")
    fila = gerar_fila(rotas)
    FILA.parent.mkdir(parents=True, exist_ok=True)
    FILA.write_text(
        "\n".join(json.dumps(item, ensure_ascii=False) for item in fila) + "\n",
        encoding="utf-8")
    print(json.dumps(resumo["porClasse"], ensure_ascii=False))
    print(f"total: {resumo['totalRotas']} | fila: {len(fila)} | {FILA}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
