# -*- coding: utf-8 -*-
"""Le nota fiscal (foto ou PDF) com o GLM-OCR da Z.AI e extrai os campos.

Papel no projeto: e o "olho" do bot Financas (Trenzim). Recebe a foto da nota,
transcreve e extrai valor, data, CNPJ e emitente por REGRA, nao por palpite.
O arquivo e guardado LOCAL primeiro (docs/planos/BOT-FINANCAS-TRENZIM.md); o
envio para o Drive, quando existir, e com aprovacao.

Fonte das regras: docs/planos/BOT-FINANCAS-TRENZIM.md e AGENTS.md 5.8.

Decisoes tecnicas nao triviais:
- Usa o GLM-OCR da Z.AI (modelo `glm-ocr`, endpoint `/paas/v4/layout_parsing`).
  ATENCAO: a imagem sai da maquina e vai para a Z.AI. O dono autorizou o uso
  em 19/10/2026; o modelo local nao faz OCR util neste hardware.
- A chave vem da variavel ZAI_API_KEY (nunca impressa, nunca em log).
- Base64 no corpo: aceita JPG, PNG e PDF (limites da API: 10 MB imagem,
  50 MB PDF, 30 paginas).
- Os campos sao extraidos por expressao regular do markdown devolvido: o
  numero vem do documento, nao de estimativa.
- O arquivo e copiado para a pasta local de notas antes de qualquer envio.

Uso:
    python scripts/financas/ler-nota.py foto.jpg
    python scripts/financas/ler-nota.py nota.pdf --json
"""

from __future__ import annotations

import argparse
import base64
import datetime as dt
import json
import os
import re
import shutil
import sys
import urllib.error
import urllib.request
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ENDPOINT = "https://api.z.ai/api/paas/v4/layout_parsing"
MODELO = "glm-ocr"
PASTA_NOTAS = Path(os.environ.get("USERPROFILE", ".")) / ".config" / "mausbot" / "financas" / "notas"
ENV_SEGREDOS = Path(os.environ.get("USERPROFILE", ".")) / ".config" / "mausbot" / "secrets.env"

LIMITE_IMAGEM = 10 * 1024 * 1024
LIMITE_PDF = 50 * 1024 * 1024


def chave() -> str:
    """Le ZAI_API_KEY do ambiente ou do arquivo local de segredos."""
    valor = os.environ.get("ZAI_API_KEY", "").strip()
    if valor:
        return valor
    if ENV_SEGREDOS.exists():
        for linha in ENV_SEGREDOS.read_text(encoding="utf-8").splitlines():
            if linha.startswith("ZAI_API_KEY="):
                return linha.split("=", 1)[1].strip()
    return ""


def transcrever(caminho: Path, chave_api: str) -> str:
    dados = caminho.read_bytes()
    limite = LIMITE_PDF if caminho.suffix.lower() == ".pdf" else LIMITE_IMAGEM
    if len(dados) > limite:
        raise ValueError(f"arquivo grande demais ({len(dados)} bytes)")
    # A API espera data URI ("data:image/png;base64,..."), nao base64 cru
    # (medido em 19/10/2026: base64 cru devolvia HTTP 400).
    mime = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".pdf": "application/pdf",
    }.get(caminho.suffix.lower(), "application/octet-stream")
    conteudo = f"data:{mime};base64," + base64.b64encode(dados).decode("ascii")
    corpo = json.dumps({"model": MODELO, "file": conteudo}).encode("utf-8")
    pedido = urllib.request.Request(
        ENDPOINT,
        data=corpo,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {chave_api}"},
    )
    try:
        with urllib.request.urlopen(pedido, timeout=180) as resposta:
            dados = json.loads(resposta.read().decode("utf-8"))
    except urllib.error.HTTPError as erro:
        detalhe = erro.read().decode("utf-8", errors="replace")[:300]
        raise ValueError(f"HTTP {erro.code}: {detalhe}") from erro
    return dados.get("md_results", "") or ""


def extrair(markdown: str) -> dict:
    """Extrai os campos por regra. Sem dado, campo fica vazio."""
    texto = markdown or ""
    valores = re.findall(r"R\$\s*([\d.]+,\d{2})", texto)
    numeros = [float(v.replace(".", "").replace(",", ".")) for v in valores]
    datas = re.findall(r"\b(\d{2}/\d{2}/\d{4})\b", texto)
    cnpj = re.findall(r"\b\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}\b", texto)
    primeira = next((l.strip("# ").strip() for l in texto.splitlines() if l.strip()), "")
    return {
        "emitente": primeira[:80],
        "valor_total": max(numeros) if numeros else None,
        "valores_encontrados": numeros[:6],
        "data": datas[0] if datas else "",
        "cnpj": cnpj[0] if cnpj else "",
    }


def arquivar(caminho: Path) -> Path:
    """Copia o documento para a pasta local de notas, com data no nome."""
    PASTA_NOTAS.mkdir(parents=True, exist_ok=True)
    destino = PASTA_NOTAS / f"{dt.datetime.now():%Y%m%d-%H%M%S}-{caminho.name}"
    shutil.copy2(caminho, destino)
    return destino


def main() -> int:
    parser = argparse.ArgumentParser(description="Le nota fiscal com GLM-OCR (Z.AI).")
    parser.add_argument("arquivo", help="foto (JPG/PNG) ou PDF da nota")
    parser.add_argument("--json", action="store_true", help="saida maquina-legivel")
    parser.add_argument("--sem-arquivar", action="store_true", help="nao copia para a pasta local")
    args = parser.parse_args()

    caminho = Path(args.arquivo)
    if not caminho.exists():
        print(f"arquivo nao encontrado: {caminho}", file=sys.stderr)
        return 2
    chave_api = chave()
    if not chave_api:
        print("ZAI_API_KEY ausente (ambiente ou .config/mausbot/secrets.env)", file=sys.stderr)
        return 2

    try:
        markdown = transcrever(caminho, chave_api)
    except (urllib.error.URLError, ValueError, OSError) as erro:
        print(f"falha na leitura: {erro}", file=sys.stderr)
        return 2

    campos = extrair(markdown)
    destino = "" if args.sem_arquivar else str(arquivar(caminho))
    saida = {"arquivo": str(caminho), "arquivado_em": destino, "campos": campos, "markdown": markdown}

    if args.json:
        print(json.dumps(saida, ensure_ascii=False, indent=2))
    else:
        print("🧾 NOTA LIDA")
        print(f"• Emitente: {campos['emitente'] or 'sem dado'}")
        print(f"• Valor: {('R$ %.2f' % campos['valor_total']).replace('.', ',') if campos['valor_total'] else 'sem dado'}")
        print(f"• Data: {campos['data'] or 'sem dado'}")
        print(f"• CNPJ: {campos['cnpj'] or 'sem dado'}")
        if destino:
            print(f"• Guardada em: {destino}")
        print("")
        print(markdown.strip()[:1200])
    return 0


if __name__ == "__main__":
    sys.exit(main())
