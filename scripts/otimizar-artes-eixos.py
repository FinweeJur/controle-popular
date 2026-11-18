# -*- coding: utf-8 -*-
"""Gera as miniaturas das artes dos eixos usadas na home.

POR QUE EXISTE

O dono relatou, em 18/11/2026, cards da home com a arte em branco. Medido: a
`<img>` dos eixos usava o arquivo original (1376x768, ~240 KB cada) com
`loading="lazy"`. Ao rolar até a seção, o cartão ficava sem arte até o arquivo
chegar; em captura de página inteira, os eixos 5, 6, 8 e 9 saíam vazios.

A página mostra a arte em 345 px de largura. Servir 1376 px gasta ~5x o
necessário. Este script grava uma versão de 720 px (cobre telas 2x) em
`apps/web/public/images/eixos/hero/`, e a `HeroEixos` passa a carregá-la de
forma imediata. As páginas de eixo (`ArteEixo`, faixa larga) continuam com o
original.

COMO RODAR

    python scripts/otimizar-artes-eixos.py            # grava as miniaturas
    python scripts/otimizar-artes-eixos.py --seco     # só mede o ganho

A lista de arquivos é lida de `arte-eixos.ts` e de `public/capas/` (webp),
para não haver duas verdades sobre qual arte pertence a qual eixo.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parents[1]
WEB = RAIZ / "apps" / "web"
MAPA = WEB / "lib" / "navegacao" / "arte-eixos.ts"
DESTINO = WEB / "public" / "images" / "eixos" / "hero"

# Largura do cartão na home: 345 px; em tela 2x, 690 px. 720 cobre os dois.
LARGURA = 720
QUALIDADE = 80
SECO = "--seco" in sys.argv


def fontes() -> list[Path]:
    """Caminhos de arte declarados no mapa do portal."""
    texto = MAPA.read_text(encoding="utf-8")
    brutos = re.findall(r'src:\s*"([^"]+)"', texto)
    caminhos: list[Path] = []
    for bruto in brutos:
        if not bruto.startswith("/"):
            continue
        arquivo = WEB / "public" / bruto.lstrip("/")
        if arquivo.exists() and arquivo not in caminhos:
            caminhos.append(arquivo)
    return caminhos


def miniatura(origem: Path) -> Path:
    sufixo = ".webp" if origem.suffix.lower() == ".webp" else ".jpg"
    return DESTINO / f"{origem.stem}{sufixo}"


def converter(origem: Path) -> tuple[int, int, int]:
    """Reamostra para LARGURA px e grava no destino. Devolve bytes antes/depois."""
    antes = origem.stat().st_size
    alvo = miniatura(origem)
    if SECO:
        return antes, antes, 0
    with Image.open(origem) as img:
        img = img.convert("RGB")
        if img.width > LARGURA:
            altura = round(img.height * LARGURA / img.width)
            img = img.resize((LARGURA, altura), Image.LANCZOS)
        alvo.parent.mkdir(parents=True, exist_ok=True)
        if alvo.suffix == ".webp":
            img.save(alvo, "WEBP", quality=QUALIDADE, method=6)
        else:
            img.save(alvo, "JPEG", quality=QUALIDADE, optimize=True, progressive=True)
    return antes, alvo.stat().st_size, img.height


def main() -> int:
    total_antes = total_depois = 0
    for origem in fontes():
        antes, depois, altura = converter(origem)
        total_antes += antes
        total_depois += depois
        marca = "medido" if SECO else "gravado"
        print(
            f"{marca} {origem.name} {antes // 1024} KB -> {depois // 1024} KB"
            + (f" (720x{altura})" if altura else "")
        )
    if total_antes:
        economia = 100 - round(total_depois * 100 / total_antes)
        print(
            f"total {total_antes // 1024} KB -> {total_depois // 1024} KB"
            f" ({economia}% menor)"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
