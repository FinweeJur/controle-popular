# -*- coding: utf-8 -*-
"""Insere o bloco de resumo de realidade nas páginas que já têm resumo.

COMO INSERE

1. acha o primeiro `</h1>` da página;
2. coloca `<ResumoRealidadeBox rota="..." />` logo depois;
3. garante o import, se ainda não existir.

Só toca em rota que está no índice com `verificado`. Página sem `<h1>` é
pulada e listada — não se adivinha onde enfiar o bloco.

Uso:
    python scripts/renderizar-resumos.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
APP = RAIZ / "apps" / "web" / "app"
PASTA = RAIZ / "apps" / "web" / "data" / "resumos-realidade"
IMPORTE = 'import { ResumoRealidadeBox } from "@/app/components/ResumoRealidade";'
MARCA = "ResumoRealidadeBox"


def rota_do_arquivo(arquivo: Path) -> str:
    relativo = arquivo.relative_to(APP).as_posix()
    partes = [parte for parte in relativo.split("/") if parte != "page.tsx"]
    return "/" + "/".join(partes)


def inserir_importe(texto: str) -> str:
    if IMPORTE in texto:
        return texto
    linhas = texto.splitlines()
    # Import pode ocupar várias linhas e vir depois de comentário de bloco.
    # O ponto seguro é o fim do último `import` completo, não a última linha
    # que casa `from "..."`: um `import {` logo abaixo quebrava o arquivo.
    ultimo = -1
    dentro = False
    for indice, linha in enumerate(linhas):
        limpa = linha.strip()
        if not dentro:
            if not limpa or limpa.startswith(("//", "/*", "*", "*/")):
                continue
            if not limpa.startswith("import "):
                break
            dentro = True
        ultimo = indice
        if limpa.endswith(";"):
            dentro = False
    linhas.insert(ultimo + 1, IMPORTE)
    return "\n".join(linhas)


def inserir_bloco(texto: str, rota: str) -> str | None:
    alvo = texto.find("</h1>")
    if alvo < 0:
        return None
    fim = alvo + len("</h1>")
    bloco = f'\n\n        <ResumoRealidadeBox rota="{rota}" />'
    return texto[:fim] + bloco + texto[fim:]


def main() -> int:
    indice = (PASTA / "index.ts").read_text(encoding="utf-8")
    rotas = re.findall(r'"([^"]+)":', indice)
    inseridas = puladas = ja_tinha = 0
    for rota in rotas:
        arquivo = APP / rota.strip("/") / "page.tsx"
        if not arquivo.exists():
            print(f"sem page: {rota}")
            puladas += 1
            continue
        texto = arquivo.read_text(encoding="utf-8")
        if MARCA in texto:
            ja_tinha += 1
            continue
        com_bloco = inserir_bloco(texto, rota)
        if com_bloco is None:
            print(f"sem h1: {rota}")
            puladas += 1
            continue
        arquivo.write_text(inserir_importe(com_bloco), encoding="utf-8")
        inseridas += 1
    print(json.dumps({"inseridas": inseridas, "ja_tinha": ja_tinha,
                      "puladas": puladas}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
