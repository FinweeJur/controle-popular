"""Temas editoriais — espelho Python de `rubrica/temas.json`.

Mesma fonte canônica que `lib/temas.ts` (que faz o filtro na UI). Usado
aqui para SELECIONAR lotes de análise por tema — ver `etl/fila_prioridade.py`.
Nunca duplicar a definição de um tema fora do JSON: os dois lados
divergiriam silenciosamente sobre o que "é" cada tema.
"""
import json
import re
import unicodedata
from pathlib import Path
from typing import Any

TEMAS_PATH = Path(__file__).resolve().parents[3] / "apps" / "web" / "lib" / "congresso" / "rubrica" / "temas.json"
TEMAS: list[dict[str, Any]] = json.loads(TEMAS_PATH.read_text(encoding="utf-8"))["temas"]

_TEMAS_POR_SLUG = {t["slug"]: t for t in TEMAS}


def tema_por_slug(slug: str) -> dict[str, Any] | None:
    return _TEMAS_POR_SLUG.get(slug)


def _normalizar(s: str) -> str:
    return unicodedata.normalize("NFC", s or "")


def casa_com_tema(tema: dict[str, Any], prop: dict, direitos_da_analise: list[str] | None = None) -> bool:
    """Espelha `casaComTema` de lib/temas.ts, campo a campo."""
    direitos_da_analise = direitos_da_analise or []
    oficiais = set(prop.get("temas_oficiais") or [])
    if any(t in oficiais for t in tema.get("temasOficiais", [])):
        return True
    if any(d in direitos_da_analise for d in tema.get("direitos", [])):
        return True
    padrao = tema.get("padrao")
    if padrao:
        alvo = f"{prop.get('ementa') or ''} {prop.get('keywords') or ''}"
        if re.search(padrao, _normalizar(alvo), re.IGNORECASE):
            return True
    return False
