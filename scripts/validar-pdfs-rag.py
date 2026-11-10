# -*- coding: utf-8 -*-
"""Remove do manifesto os PDFs que não são PDF.

POR QUE EXISTE

Alguns repositórios devolvem página HTML com extensão `.pdf`. O indexador
registra `Invalid PDF structure` e o documento fica no manifesto sem texto —
ruído que aparece na busca como se fosse fonte.

O QUE FAZ

1. lê `arquivoLocal` de cada entrada do manifesto;
2. confere os primeiros bytes: PDF começa com `%PDF`;
3. entrada inválida sai do manifesto e o arquivo sai do cache;
4. o que não tem `arquivoLocal` (metadado puro) não é tocado.

Uso:
    python scripts/validar-pdfs-rag.py
    python scripts/validar-pdfs-rag.py --dry-run
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
MANIFESTO = RAIZ / "apps" / "web" / "data" / "documentos-rag-fontes.json"
CACHE = RAIZ / "apps" / "web" / ".cache" / "documentos-rag-local"


def eh_pdf(caminho: Path) -> bool:
    try:
        with caminho.open("rb") as fp:
            return fp.read(5) == b"%PDF-"
    except OSError:
        return False


def main() -> int:
    ap = argparse.ArgumentParser(description="Remove PDFs inválidos do manifesto.")
    ap.add_argument("--dry-run", action="store_true")
    opcoes = ap.parse_args()
    manifesto = json.loads(MANIFESTO.read_text(encoding="utf-8"))
    validos, removidos = [], []
    for entrada in manifesto:
        arquivo = entrada.get("arquivoLocal")
        if not arquivo:
            validos.append(entrada)
            continue
        caminho = CACHE / arquivo
        if caminho.exists() and eh_pdf(caminho):
            validos.append(entrada)
            continue
        removidos.append(entrada.get("titulo") or arquivo)
        if not opcoes.dry_run and caminho.exists():
            caminho.unlink()
    if not opcoes.dry_run:
        MANIFESTO.write_text(json.dumps(validos, ensure_ascii=False, indent=2),
                             encoding="utf-8")
    print(f"inválidos: {len(removidos)} | restantes: {len(validos)}")
    for titulo in removidos[:10]:
        print(" -", str(titulo)[:70])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
