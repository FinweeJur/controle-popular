#!/usr/bin/env python3
"""
Aplica o template obrigatório da documentação em um arquivo .md.

Uso:
    python scripts/aplicar-template-docs.py <caminho> \
        --tipo TIPO --dominio DOMINIO --leitura curta|media|longa \
        --relacionados "doc1.md,doc2.md" --palavras "p1, p2, p3"

O script insere metadados + sumário logo após o título principal,
gerando os links âncora a partir das seções de nível 2.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def slugify(text: str) -> str:
    """Gera âncora GitHub-like a partir de um título."""
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text).strip("-")
    return text


def apply_template(
    path: Path,
    tipo: str,
    dominio: str,
    leitura: str,
    relacionados: str,
    palavras: str,
    data: str = "2026-08-22",
) -> None:
    content = path.read_text(encoding="utf-8")
    lines = content.splitlines()

    if not lines or not lines[0].startswith("# "):
        print(f"{path}: primeira linha não é título #", file=sys.stderr)
        return

    title = lines[0][2:].strip()
    body_lines = lines[1:]

    # Remove bloco antigo de metadados se existir (linhas > no início).
    while body_lines and body_lines[0].startswith("> "):
        body_lines = body_lines[1:]
    # Remove linhas em branco iniciais.
    while body_lines and body_lines[0].strip() == "":
        body_lines = body_lines[1:]

    # Coleta seções ## do corpo.
    sections: list[str] = []
    for line in body_lines:
        match = re.match(r"^## (.+)$", line)
        if match:
            sections.append(match.group(1).strip())

    # Filtra seções que já fazem parte do template.
    skip = {"Sumário", "Propósito", "Decisões registradas", "Origem", "Origem / Histórico"}
    toc_sections = [s for s in sections if s not in skip]

    # Garante seções padrão.
    if "Propósito" not in sections:
        toc_sections.insert(0, "Propósito")
    if "Decisões registradas" not in sections:
        if tipo in {"ARQUITETURA", "OPERACAO", "FONTE"}:
            toc_sections.append("Decisões registradas")
    if "Origem" not in sections and "Origem / Histórico" not in sections:
        toc_sections.append("Origem")

    # Remove duplicatas mantendo ordem.
    seen = set()
    unique: list[str] = []
    for s in toc_sections:
        if s not in seen:
            seen.add(s)
            unique.append(s)
    toc_sections = unique

    # Monta sumário.
    toc_lines = ["## Sumário", ""]
    for s in toc_sections:
        toc_lines.append(f"- [{s}](#{slugify(s)})")
    toc_lines.append("")

    # Monta metadados.
    metadata = [
        f"> **Tipo:** {tipo}",
        f"> **Domínio:** {dominio}",
        f"> **Última medição:** {data}",
        f"> **Leitura estimada:** {leitura}",
        f"> **Relacionados:** {relacionados}",
        f"> **Palavras-chave:** {palavras}",
    ]

    new_lines = [f"# {title}", ""] + metadata + [""] + toc_lines + body_lines
    path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    print(f"Template aplicado: {path}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Aplica template em documentos docs/.")
    parser.add_argument("path", type=Path)
    parser.add_argument("--tipo", required=True)
    parser.add_argument("--dominio", required=True)
    parser.add_argument("--leitura", required=True, choices=["curta (< 5 min)", "media (5-15 min)", "longa (> 15 min)"])
    parser.add_argument("--relacionados", required=True)
    parser.add_argument("--palavras", required=True)
    parser.add_argument("--data", default="2026-08-22")
    args = parser.parse_args()

    apply_template(
        args.path,
        tipo=args.tipo,
        dominio=args.dominio,
        leitura=args.leitura,
        relacionados=args.relacionados,
        palavras=args.palavras,
        data=args.data,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
