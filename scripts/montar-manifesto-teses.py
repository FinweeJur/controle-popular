# -*- coding: utf-8 -*-
"""Acrescenta ao manifesto do RAG os PDFs acadêmicos baixados.

Lê o checkpoint do coletor e, para cada item com `status: ok`, cria a entrada
do manifesto com `arquivoLocal` (só o nome do arquivo). Idempotente: rodar de
novo não duplica.

Uso:
    python scripts/montar-manifesto-teses.py
"""
from __future__ import annotations

import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
ESTADO = RAIZ / "logs" / "teses-rag.json"
BIBLIOTECA = RAIZ / "apps" / "web" / "data" / "biblioteca-teses-atingidos.json"
MANIFESTO = RAIZ / "apps" / "web" / "data" / "documentos-rag-fontes.json"
DESASTRES = {"riodoce": "Rio Doce", "brumadinho": "Brumadinho"}


def main() -> int:
    estado = json.loads(ESTADO.read_text(encoding="utf-8"))["itens"]
    itens = {str(item["id"]): item
             for item in json.loads(BIBLIOTECA.read_text(encoding="utf-8"))["itens"]}
    manifesto = json.loads(MANIFESTO.read_text(encoding="utf-8"))
    existentes = {entrada.get("id") for entrada in manifesto}
    novos = 0
    for chave, resultado in estado.items():
        if resultado.get("status") != "ok":
            continue
        item = itens.get(chave)
        if not item:
            continue
        ident = f"tese-{chave}"
        if ident in existentes:
            continue
        desastre = DESASTRES.get(item.get("destino"), "desastre")
        manifesto.append({
            "id": ident,
            "titulo": item.get("titulo") or "Trabalho acadêmico",
            "tipo": item.get("tipo") or "Tese",
            "categoria": "Acadêmico & Pesquisa",
            "tema": f"Atingidos por barragens — {desastre}",
            "orgao": item.get("instituicao") or item.get("sigla") or "Instituição de ensino",
            "url": (item.get("links") or [""])[0],
            "urlPdf": None,
            "arquivoLocal": resultado["arquivo"],
            "resumo": (item.get("resumo") or "")[:600],
            "tags": ["tese", item.get("destino") or "desastre", item.get("ano") or ""],
        })
        novos += 1
    MANIFESTO.write_text(json.dumps(manifesto, ensure_ascii=False, indent=2),
                         encoding="utf-8")
    print(f"entradas novas: {novos} | total no manifesto: {len(manifesto)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
