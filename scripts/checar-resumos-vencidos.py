# -*- coding: utf-8 -*-
"""Marca resumo vencido quando o dado da página muda.

POR QUE EXISTE

Resumo velho é pior que resumo ausente: ele afirma com segurança um número
que já não é o da página. Este script compara a impressão das fontes com a
gravada no JSON e, se mudou, derruba `verificado` — o componente deixa de
renderizar até nova geração.

Uso:
    python scripts/checar-resumos-vencidos.py
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
INVENTARIO = RAIZ / "apps" / "web" / "data" / "inventario-subfrentes.json"
PASTA = RAIZ / "apps" / "web" / "data" / "resumos-realidade"
DADOS = RAIZ / "apps" / "web" / "data"
PUBLICOS = RAIZ / "apps" / "web" / "public" / "data"


def resolver(fonte: str) -> Path | None:
    nome = fonte if fonte.endswith(".json") else f"{fonte}.json"
    for base in (DADOS, PUBLICOS):
        caminho = base / nome
        if caminho.exists():
            return caminho
    return None


def impressao(fontes: list[str]) -> str:
    partes = []
    for fonte in fontes:
        caminho = resolver(fonte)
        if not caminho:
            continue
        estado = caminho.stat()
        partes.append(f"{fonte}:{estado.st_size}:{int(estado.st_mtime)}")
    return hashlib.sha1("|".join(sorted(partes)).encode()).hexdigest()[:16]


def main() -> int:
    inventario = json.loads(INVENTARIO.read_text(encoding="utf-8"))
    por_rota = {rota["rota"]: rota for rota in inventario["rotas"]}
    vencidos = 0
    sem_fonte = 0
    for arquivo in sorted(PASTA.glob("*.json")):
        resumo = json.loads(arquivo.read_text(encoding="utf-8"))
        rota = por_rota.get(resumo.get("rota", ""))
        if not rota:
            sem_fonte += 1
            continue
        atual = impressao(rota["fontes"])
        if not resumo.get("impressao"):
            # Resumo anterior à impressão: carimba o estado de agora.
            resumo["fontes"] = rota["fontes"]
            resumo["impressao"] = atual
            arquivo.write_text(json.dumps(resumo, ensure_ascii=False, indent=1),
                               encoding="utf-8")
            continue
        if resumo["impressao"] != atual:
            resumo["verificado"] = False
            arquivo.write_text(json.dumps(resumo, ensure_ascii=False, indent=1),
                               encoding="utf-8")
            vencidos += 1
            print(f"vencido: {resumo['rota']}")
    print(f"vencidos: {vencidos} | sem rota no inventário: {sem_fonte}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
