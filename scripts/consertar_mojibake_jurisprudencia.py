# -*- coding: utf-8 -*-
"""Conserta o mojibake duplo do JSON da jurisprudência.

Medido em 31/10/2026: `apps/web/data/jurisprudencia-casos.json` no
`origin/main` tinha 7.429 de 8.713 ementas com "Ôö£├º" no lugar de "ç".
Causa: o texto passou duas vezes pelo code page 850 (terminal OEM do
Windows) em algum passo de PowerShell — `Get-Content`/`Out-File` sem
`-Encoding`. O par reverso é `encode("cp850").decode("utf-8")`, repetido até
não sobrar marcador.

Uso: python scripts/consertar_mojibake_jurisprudencia.py [--aplicar]
"""
import argparse
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
ARQUIVO = RAIZ / "apps" / "web" / "data" / "jurisprudencia-casos.json"
MARCAS = ("├", "Ôö")


def conserta(texto: str) -> str:
    """Desfaz até seis passadas de cp850 -> utf-8."""
    for _ in range(6):
        if not any(m in texto for m in MARCAS):
            return texto
        try:
            novo = texto.encode("cp850").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            return texto
        if novo == texto:
            return texto
        texto = novo
    return texto


def _limpa(valor):
    if isinstance(valor, str):
        return conserta(valor)
    if isinstance(valor, list):
        return [_limpa(v) for v in valor]
    if isinstance(valor, dict):
        return {k: _limpa(v) for k, v in valor.items()}
    return valor


def _sujos(casos: list) -> int:
    return sum(1 for c in casos if any(m in (c.get("ementa") or "") for m in MARCAS))


def _aplicar(dados: dict) -> int:
    dados["casos"] = [_limpa(c) for c in dados.get("casos") or []]
    restantes = _sujos(dados["casos"])
    if restantes:
        print(f"ainda restam {restantes}; nada gravado")
        return 1
    texto = json.dumps(dados, ensure_ascii=False, separators=(",", ":"))
    ARQUIVO.write_text(texto, encoding="utf-8")
    print(f"gravado: {ARQUIVO} | {len(texto)} bytes | restantes: {restantes}")
    return 0


def main() -> int:
    arg = argparse.ArgumentParser(description="Conserta mojibake do JSON da jurisprudência.")
    arg.add_argument("--aplicar", action="store_true", help="grava o arquivo")
    opcoes = arg.parse_args()

    dados = json.loads(ARQUIVO.read_text(encoding="utf-8"))
    casos = dados.get("casos") or []
    print(f"casos: {len(casos)} | com mojibake: {_sujos(casos)}")
    if not opcoes.aplicar:
        return 0
    return _aplicar(dados)


if __name__ == "__main__":
    raise SystemExit(main())
