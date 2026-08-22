#!/usr/bin/env python3
"""
Aplica um template enxuto aos documentos de docs/historico/.

Uso:
    python scripts/aplicar-template-historico.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

HISTORICO_DIR = Path(__file__).resolve().parents[1] / "docs" / "historico"


def extract_date(name: str) -> str:
    match = re.search(r"(\d{4}-\d{2}-\d{2})", name)
    return match.group(1) if match else "2026-08-22"


def guess_domain(name: str) -> str:
    lowered = name.lower()
    for domain in ["betim", "congresso", "judiciario", "ambiental", "paraopeba"]:
        if domain in lowered:
            return domain
    return "global"


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text).strip("-")
    return text


def apply_template(path: Path) -> None:
    content = path.read_text(encoding="utf-8")
    lines = content.splitlines()

    if not lines or not lines[0].startswith("# "):
        print(f"Pulado (sem título): {path}")
        return

    title = lines[0][2:].strip()
    body_lines = lines[1:]

    # Remove metadados antigos.
    while body_lines and body_lines[0].startswith("> "):
        body_lines = body_lines[1:]
    while body_lines and body_lines[0].strip() == "":
        body_lines = body_lines[1:]

    # Remove sumário antigo se existir.
    if body_lines and body_lines[0] == "## Sumário":
        body_lines = body_lines[1:]
        while body_lines and not body_lines[0].startswith("## "):
            body_lines = body_lines[1:]
    while body_lines and body_lines[0].strip() == "":
        body_lines = body_lines[1:]

    name = path.stem
    date = extract_date(name)
    domain = guess_domain(name)

    # Palavras-chave por prefixo.
    keywords = "historico, documentacao"
    if name.startswith("PLANO-"):
        keywords = "historico, plano, entregue"
    elif name.startswith("HANDOFF-"):
        keywords = "historico, handoff, entrega"
    elif name.startswith("DIARIO-"):
        keywords = "historico, diario, descoberta"
    elif name.startswith("auditoria-"):
        keywords = "historico, auditoria, descoberta"
    elif "F0-discovery" in name:
        keywords = "historico, descoberta, f0"
    elif name.startswith("FONTES-"):
        keywords = "historico, fontes, coleta"
    elif name in {"rotina-local", "worktrees", "build-em-outro-pc", "SESSOES-CONCORRENTES", "ANTES-DO-PUSH", "PAINEL-EDICAO-COMO-USAR", "USAR-COM-IA"}:
        keywords = "historico, procedimento, operacao"

    metadata = [
        f"> **Tipo:** HISTORICO",
        f"> **Domínio:** {domain}",
        f"> **Última medição:** {date}",
        f"> **Leitura estimada:** curta (< 5 min)",
        f"> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)",
        f"> **Palavras-chave:** {keywords}",
    ]

    # Primeiro parágrafo como propósito, se houver.
    purpose_lines: list[str] = []
    temp = body_lines[:]
    while temp and temp[0].strip() == "":
        temp = temp[1:]
    while temp and not temp[0].startswith("## "):
        purpose_lines.append(temp[0])
        temp = temp[1:]

    if purpose_lines:
        purpose = " ".join(p.strip() for p in purpose_lines if p.strip()).strip()
        if len(purpose) > 300:
            purpose = purpose[:297] + "..."
    else:
        purpose = f"Documento histórico: {title}."

    # Coleta seções ##.
    sections = ["Propósito"]
    for line in body_lines:
        match = re.match(r"^## (.+)$", line)
        if match:
            s = match.group(1).strip()
            if s not in {"Sumário", "Propósito"}:
                sections.append(s)

    toc_lines = ["## Sumário", ""]
    for s in sections:
        toc_lines.append(f"- [{s}](#{slugify(s)})")
    toc_lines.append("")

    new_lines = [f"# {title}", ""] + metadata + [""] + toc_lines + ["## Propósito", "", purpose, ""] + body_lines
    path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    print(f"Template enxuto aplicado: {path}")


def main() -> int:
    if not HISTORICO_DIR.exists():
        print(f"{HISTORICO_DIR} não encontrado", file=sys.stderr)
        return 1

    for path in sorted(HISTORICO_DIR.rglob("*.md")):
        apply_template(path)

    return 0


if __name__ == "__main__":
    sys.exit(main())
