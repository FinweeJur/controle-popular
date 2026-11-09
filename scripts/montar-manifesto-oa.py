# -*- coding: utf-8 -*-
"""Acrescenta ao manifesto do RAG os artigos de acesso aberto baixados por DOI.

Lê o checkpoint do coletor OpenAlex e cria a entrada com `arquivoLocal`.
Idempotente: rodar de novo não duplica.

Uso:
    python scripts/montar-manifesto-oa.py
"""
from __future__ import annotations

import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
ESTADO = RAIZ / "logs" / "oa-consensus.json"
MANIFESTO = RAIZ / "apps" / "web" / "data" / "documentos-rag-fontes.json"


def autores(item: dict) -> str:
    valor = item.get("autores")
    if isinstance(valor, list):
        return ", ".join(str(nome) for nome in valor[:3])
    return str(valor or "Autoria não informada")[:120]


def main() -> int:
    estado = json.loads(ESTADO.read_text(encoding="utf-8"))["itens"]
    manifesto = json.loads(MANIFESTO.read_text(encoding="utf-8"))
    existentes = {entrada.get("id") for entrada in manifesto}
    novos = 0
    for doi, resultado in estado.items():
        if resultado.get("status") != "ok":
            continue
        ident = f"oa-{doi.replace('/', '-')}"
        if ident in existentes:
            continue
        manifesto.append({
            "id": ident,
            "titulo": resultado.get("titulo") or "Artigo científico",
            "tipo": "Artigo",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Desastres de barragem — artigos",
            "orgao": autores(resultado),
            "url": f"https://doi.org/{doi}",
            "urlPdf": None,
            "arquivoLocal": resultado["arquivo"],
            "resumo": f"Artigo de acesso aberto. Revista: {resultado.get('revista') or 'não informada'}.",
            "tags": ["artigo", "acesso aberto", str(resultado.get("ano") or "")],
        })
        novos += 1
    MANIFESTO.write_text(json.dumps(manifesto, ensure_ascii=False, indent=2),
                         encoding="utf-8")
    print(f"entradas novas: {novos} | total no manifesto: {len(manifesto)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
