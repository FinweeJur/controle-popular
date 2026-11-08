# -*- coding: utf-8 -*-
"""Garante que todo resumo publicado comece com um título H2.

POR QUE EXISTE

O contrato do resumo (teste da main) exige que o primeiro bloco seja `##`.
O gerador escrevia direto no parágrafo. Este script deriva um título do
slug da rota e prepende, sem tocar no resto do texto.

Uso:
    python scripts/titular-resumos.py
"""
from __future__ import annotations

import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
PASTA = RAIZ / "apps" / "web" / "data" / "resumos-realidade"

# Rota sem título próprio: nome legível pelo slug.
ESPECIAIS = {
    "/jurisprudencia": "O que a jurisprudência dos desastres mostra",
    "/jurisprudencia/penal": "O que a jurisprudência penal mostra",
}


def titulo_de(rota: str) -> str:
    if rota in ESPECIAIS:
        return ESPECIAIS[rota]
    partes = [parte.replace("-", " ") for parte in rota.strip("/").split("/") if parte]
    if not partes:
        return "O que os dados mostram"
    nome = " · ".join(parte.capitalize() for parte in partes)
    return f"O que os dados de {nome} mostram"


SUBSTITUICOES = (
    ("[nao da para concluir]", "[não dá para concluir]"),
    ("[medido — dados da pagina]", "[medido — dados da página]"),
    ("[medido - dados da pagina]", "[medido — dados da página]"),
    ("[medido — tabela medida]", "[medido — tabela medida]"),
)


def normalizar(markdown: str) -> str:
    """Marca de evidência é texto publicado: vai acentuada."""
    for antigo, novo in SUBSTITUICOES:
        markdown = markdown.replace(antigo, novo)
    return markdown


def main() -> int:
    ajustados = 0
    for arquivo in sorted(PASTA.glob("*.json")):
        resumo = json.loads(arquivo.read_text(encoding="utf-8"))
        markdown = normalizar((resumo.get("markdown") or "").lstrip())
        if markdown.startswith("# "):
            pass
        elif markdown.startswith("## "):
            # Título no nível errado: o parser mapeia `#` para h2 e `##` para h3.
            markdown = markdown[1:]
        else:
            markdown = f"# {titulo_de(resumo['rota'])}\n\n{markdown}"
        if markdown == resumo.get("markdown"):
            continue
        resumo["markdown"] = markdown
        arquivo.write_text(json.dumps(resumo, ensure_ascii=False, indent=1), encoding="utf-8")
        ajustados += 1
    print(f"ajustados: {ajustados}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
