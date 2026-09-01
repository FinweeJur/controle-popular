#!/usr/bin/env python3
"""
Valida a estrutura da documentação em docs/.

Verifica:
- todo .md em docs/ (exceto historico/ e pesquisa/ datados) começa com metadados + sumário;
- links internos para .md existem;
- palavras-chave não estão vazias.

Uso:
    python scripts/validar-documentacao.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = REPO_ROOT / "docs"

# Caminhos que ainda não precisam seguir o template completo (arquivos datados de arquivo/pesquisa/relatórios de automação).
EXEMPT_DIRS = {"docs/_historico", "docs/_pesquisa", "docs/historico", "docs/pesquisa", "docs/relatorios-automacao"}

REQUIRED_METADATA = [
    ("Tipo", r"> \*\*Tipo:\*\*"),
    ("Domínio", r"> \*\*Dom.nio:\*\*"),
    ("Última medição", r"> \*\*Última medição:\*\*"),
    ("Leitura estimada", r"> \*\*Leitura estimada:\*\*"),
    ("Relacionados", r"> \*\*Relacionados:\*\*"),
    ("Palavras-chave", r"> \*\*Palavras-chave:\*\*"),
]

LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
CODE_BLOCK_RE = re.compile(r"```[\s\S]*?```")
INLINE_CODE_RE = re.compile(r"`[^`]*`")


def without_code(content: str) -> str:
    """Remove blocos de código e inline code antes de procurar links."""
    content = CODE_BLOCK_RE.sub("", content)
    content = INLINE_CODE_RE.sub("", content)
    return content


def is_exempt(path: Path) -> bool:
    rel = path.relative_to(REPO_ROOT).as_posix()
    for prefix in EXEMPT_DIRS:
        if rel.startswith(prefix):
            return True
    return False


def check_metadata(content: str, path: Path) -> list[str]:
    errors: list[str] = []
    for label, pattern in REQUIRED_METADATA:
        if not re.search(pattern, content):
            errors.append(f"metadado '{label}' ausente ou mal formado")

    # Palavras-chave vazias.
    match = re.search(r"> \*\*Palavras-chave:\*\*\s*(.*)", content)
    if match:
        keywords = match.group(1).strip()
        if not keywords or keywords.lower() in {"", "..."}:
            errors.append("palavras-chave vazias")

    return errors


def check_summary(content: str, path: Path) -> list[str]:
    errors: list[str] = []
    if "## Sumário" not in content:
        errors.append("seção '## Sumário' ausente")
    return errors


def collect_internal_links(content: str) -> list[tuple[str, str, int]]:
    """Retorna (texto, destino, linha) para links internos."""
    content = without_code(content)
    links: list[tuple[str, str, int]] = []
    for lineno, line in enumerate(content.splitlines(), start=1):
        for text, target in LINK_RE.findall(line):
            if target.startswith(("http://", "https://", "mailto:")):
                continue
            if target.startswith("#"):
                continue
            links.append((text, target, lineno))
    return links


def resolve_link(target: str, doc_path: Path) -> Path | None:
    """Resolve um link relativo a docs/ ou absoluto da raiz."""
    if target.startswith("/"):
        candidate = REPO_ROOT / target.lstrip("/")
    else:
        candidate = doc_path.parent / target

    # Remove âncora.
    candidate = Path(str(candidate).split("#")[0])

    if candidate.exists():
        return candidate
    return None


def main() -> int:
    if not DOCS_DIR.exists():
        safe_print("docs/ não encontrado")
        return 1

    md_files = sorted(DOCS_DIR.rglob("*.md"))
    exit_code = 0

    for path in md_files:
        rel = path.relative_to(REPO_ROOT)
        content = path.read_text(encoding="utf-8")
        errors: list[str] = []

        if not is_exempt(path):
            errors.extend(check_metadata(content, path))
            errors.extend(check_summary(content, path))

        # Links internos.
        for text, target, lineno in collect_internal_links(content):
            resolved = resolve_link(target, path)
            if resolved is None:
                errors.append(f"link quebrado para '{target}' (linha {lineno})")

        if errors:
            exit_code = 1
            safe_print(f"{rel}")
            for err in errors:
                safe_print(f"  - {err}")

    if exit_code == 0:
        safe_print("Documentação OK.")
    else:
        safe_print("\nDocumentação com problemas.")

    return exit_code


def safe_print(text: str) -> None:
    """Escreve no stdout usando o buffer bruto para evitar erros de encoding no Windows."""
    sys.stdout.buffer.write((text + "\n").encode("utf-8", "replace"))


if __name__ == "__main__":
    sys.exit(main())
