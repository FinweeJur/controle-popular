#!/usr/bin/env python3
"""
radar-editais-extrair-pdf.py — extrai o texto das páginas de um PDF de edição
do Diário Oficial Eletrônico de Minas Gerais (DOMG-e / Jornal Minas Gerais).

═══ POR QUE ESTE ARQUIVO EXISTE ═══

`scripts/radar-editais-diarios.mts` baixa a edição do dia pela API pública do
Jornal Minas Gerais (`api/v1/Jornal/ObterEdicaoPorDataPublicacao`) e recebe o
caderno como base64 de um PDF assinado (CMS/PKCS#7). Node não tem parser de
PDF nativo; o repositório já usa PyMuPDF para isso em vários lugares
(`etl/betim/etl/apis/*`, `scripts/probrumadinho-extrair-texto.py`). Este
arquivo é a ponte mínima: recebe o caminho de um PDF e o caminho de um JSON de
saída, e grava `{"paginas": [{"n": 1, "texto": "..."}, ...]}`.

O texto NÃO é sanitizado aqui — a máscara de CPF (mod-11) mora no .mts,
reusando a régua de `apps/web/lib/paraopeba/triagem.ts` (ver cabeçalho do
radar). Este arquivo não fala rede e não grava nada além do JSON de saída.

Uso:
    python scripts/radar-editais-extrair-pdf.py <entrada.pdf> <saida.json>

Sai com 1 se o PDF não abrir ou não tiver texto nenhum (falha é falha —
o radar não finge sucesso, ver trava de sanidade no cabeçalho dele).
"""

import json
import sys

try:
    import pymupdf as fitz
except ImportError:  # fallback: pacote instalado com o nome antigo
    import fitz  # type: ignore


def extrair(caminho_pdf: str) -> list[dict]:
    doc = fitz.open(caminho_pdf)
    paginas = []
    for i in range(doc.page_count):
        texto = doc[i].get_text().strip()
        if texto:
            paginas.append({"n": i + 1, "texto": texto})
    doc.close()
    return paginas


def main() -> int:
    if len(sys.argv) != 3:
        print("Uso: python radar-editais-extrair-pdf.py <entrada.pdf> <saida.json>",
              file=sys.stderr)
        return 2
    entrada, saida = sys.argv[1], sys.argv[2]
    try:
        paginas = extrair(entrada)
    except Exception as e:  # noqa: BLE001 — qualquer falha de parse é falha
        print(f"falha ao abrir/ler o PDF {entrada}: {e}", file=sys.stderr)
        return 1
    if not paginas:
        print(f"PDF {entrada} sem texto extraível em nenhuma página", file=sys.stderr)
        return 1
    with open(saida, "w", encoding="utf-8") as f:
        json.dump({"paginas": paginas}, f, ensure_ascii=False, indent=1)
    total = sum(len(p["texto"]) for p in paginas)
    print(f"{len(paginas)} pagina(s), {total} caractere(s) -> {saida}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
