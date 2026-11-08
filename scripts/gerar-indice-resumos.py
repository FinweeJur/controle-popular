# -*- coding: utf-8 -*-
"""Gera o índice TypeScript dos resumos de realidade publicados.

POR QUE EXISTE

O Next precisa de import estático: não dá para ler a pasta em runtime no
cliente. Este gerador varre `data/resumos-realidade/*.json` e escreve
`index.ts` com um mapa rota → resumo. O componente importa o mapa.

Rode sempre que publicar ou remover resumo.

Uso:
    python scripts/gerar-indice-resumos.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
PASTA = RAIZ / "apps" / "web" / "data" / "resumos-realidade"
DESTINO = PASTA / "index.ts"

CABECALHO = """/**
 * Índice dos resumos de realidade publicados.
 *
 * GERADO por `scripts/gerar-indice-resumos.py`. Não edite à mão: a próxima
 * execução sobrescreve. Só entra arquivo com `verificado: true`; resumo
 * vencido continua no disco, mas some do mapa.
 */

import type { ResumoRealidade } from "@/lib/resumos-realidade";
"""


def nome_variavel(slug: str) -> str:
    partes = re.split(r"[^a-zA-Z0-9]+", slug)
    return "resumo" + "".join(parte.capitalize() for parte in partes if parte)


def main() -> int:
    resumos = []
    for arquivo in sorted(PASTA.glob("*.json")):
        dados = json.loads(arquivo.read_text(encoding="utf-8"))
        if dados.get("verificado"):
            resumos.append((arquivo.stem, dados["rota"]))
    linhas = [CABECALHO]
    for slug, _ in resumos:
        linhas.append(f'import {nome_variavel(slug)} from "./{slug}.json";')
    linhas.append("")
    linhas.append("export const RESUMOS: Record<string, ResumoRealidade> = {")
    for slug, rota in resumos:
        linhas.append(f'  "{rota}": {nome_variavel(slug)} as ResumoRealidade,')
    linhas.append("};")
    linhas.append("")
    DESTINO.write_text("\n".join(linhas), encoding="utf-8")
    print(f"resumos no índice: {len(resumos)} | {DESTINO}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
