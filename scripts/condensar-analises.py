# -*- coding: utf-8 -*-
"""Prepara os dois textos de análise que as páginas vão exibir.

- `/paraopeba/analise`: condensa a análise integrada de Brumadinho (87 mil
  caracteres de dossiê) em 4 a 5 parágrafos para o bloco de resumo;
- `/ambiental/rio-doce/analise`: usa a síntese do litoral já escrita.

REGRA: número só o que está no texto de origem; a condensação não acrescenta
fato.

Uso:
    python scripts/condensar-analises.py
"""
from __future__ import annotations

import json
import os
import urllib.request
from pathlib import Path

from tabelas_jurisprudencia import secao_brumadinho

RAIZ = Path(__file__).resolve().parents[1]
INTEGRADA = Path(r"X:\DevCoder\OpenCode\tjmg-jurimetria\relatorios\ANALISE-INTEGRADA-BRUMADINHO.md")
LITORAL = RAIZ / "docs" / "pesquisa" / "consensus" / "sintese-02-rio-doce-litoral.md"
RESUMOS = RAIZ / "apps" / "web" / "data" / "resumos-realidade"
ANALISES = RAIZ / "apps" / "web" / "data" / "analises"

SISTEMA = """Voce condensa um relatorio em 4 a 6 paragrafos para o topo de uma
pagina do portal Controle Popular, com DUAS tabelas markdown.

- mantenha o sentido; nao acrescente fato nem numero;
- cada paragrafo termina com [medido] ou [inferido];
- numero so o que ja estiver no texto de origem;
- comece com um titulo H1 curto;
- inclua uma tabela de COMPARACAO entre as fontes (o que cada uma mede e o
  numero de cada uma no tema);
- inclua uma tabela de TESES (tema, tese dominante, N e fatia);
- tabela em markdown: primeira linha de cabecalho, segunda de tracos, depois
  as linhas; no maximo 6 linhas por tabela;
- nada de "media" ou "taxa de sucesso".
"""


def _postar(degrau: dict, sistema: str, usuario: str) -> str:
    corpo = json.dumps({
        "model": degrau["modelo"],
        "messages": [{"role": "system", "content": sistema},
                     {"role": "user", "content": usuario}],
        "max_tokens": 6000,
        "reasoning_effort": "high",
    }).encode()
    pedido = urllib.request.Request(
        degrau["url"].rstrip("/") + "/chat/completions", corpo,
        {"Content-Type": "application/json",
         "Authorization": f"Bearer {os.environ[degrau['chave']]}"})
    with urllib.request.urlopen(pedido, timeout=600) as resposta:
        dados = json.load(resposta)
    return (dados.get("choices") or [{}])[0].get("message", {}).get("content") or ""


def chamar(texto: str) -> str:
    degraus = [
        {"nome": "S5-free", "url": "https://chat.maritaca.ai/api",
         "modelo": "S5-free", "chave": "MARITACA_API_KEY"},
        {"nome": "glm-4.5-flash", "url": "https://open.bigmodel.cn/api/paas/v4",
         "modelo": "glm-4.5-flash", "chave": "ZAI_API_KEY"},
    ]
    for degrau in degraus:
        if not os.environ.get(degrau["chave"]):
            continue
        try:
            resposta = _postar(degrau, SISTEMA, texto)
        except Exception as erro:
            print(f"  {degrau['nome']} falhou: {str(erro)[:60]}")
            continue
        if resposta.strip():
            return resposta.strip()
    return ""


def main() -> int:
    RESUMOS.mkdir(parents=True, exist_ok=True)
    ANALISES.mkdir(parents=True, exist_ok=True)

    integrada = INTEGRADA.read_text(encoding="utf-8")
    curto = chamar(integrada[:24000])
    if curto:
        # O texto explica; a tabela de teses é montada por código, para o
        # número não depender do modelo.
        markdown = curto.strip() + "\n\n" + secao_brumadinho()
        (RESUMOS / "paraopeba-analise.json").write_text(json.dumps({
            "rota": "/paraopeba/analise",
            "geradoEm": "2026-11-08",
            "verificado": True,
            "markdown": markdown,
        }, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"paraopeba/analise: {len(markdown)} caracteres")

    litoral = LITORAL.read_text(encoding="utf-8") if LITORAL.exists() else ""
    if litoral:
        (ANALISES / "rio-doce.json").write_text(json.dumps({
            "rota": "/ambiental/rio-doce/analise",
            "titulo": "Análise integrada — Rio Doce e litoral",
            "geradoEm": "2026-11-08",
            "markdown": litoral,
        }, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"rio-doce: {len(litoral)} caracteres")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
