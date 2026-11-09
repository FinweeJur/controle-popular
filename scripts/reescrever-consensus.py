# -*- coding: utf-8 -*-
"""Reescreve as notas dos relatórios Consensus como texto de biblioteca.

POR QUE EXISTE

O relatório exportado do Consensus não pode ser republicado. As notas guardam
os fatos e as citações; este script transforma essas notas em redação própria,
com o mesmo sentido e a mesma atribuição.

REGRA: número só o que está nas notas; cada afirmação mantém a citação do
trabalho que a sustenta.

Uso:
    python scripts/reescrever-consensus.py
"""
from __future__ import annotations

import json
import os
import re
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
NOTAS = RAIZ / "docs" / "pesquisa" / "consensus" / "notas-relatorios.md"
SAIDA = RAIZ / "docs" / "pesquisa" / "consensus"

DEGRAUS = [
    {"nome": "S5-free", "url": "https://chat.maritaca.ai/api",
     "modelo": "S5-free", "chave": "MARITACA_API_KEY"},
    {"nome": "glm-4.5-flash", "url": "https://open.bigmodel.cn/api/paas/v4",
     "modelo": "glm-4.5-flash", "chave": "ZAI_API_KEY"},
]

SISTEMA = """Voce escreve um texto de biblioteca do portal Controle Popular,
a partir de NOTAS com fatos e citacoes de artigos cientificos.

O QUE FAZER
- 4 a 6 paragrafos, em portugues, tom descritivo e direto;
- preserve TODAS as citacoes (autor, ano) que aparecem nas notas, no ponto em
  que a afirmacao e feita;
- mantenha o sentido original, sem copiar frase de terceiro;
- onde houver numero nas notas, mantenha o numero e a citacao ao lado;
- feche com um paragrafo curto sobre o limite da evidencia;
- nao acrescente fato que nao esteja nas notas.

PROIBIDO: "media", "taxa de sucesso", adjetivo de propaganda, promessa.
Devolva so o texto, em markdown, com um titulo H1.
"""


def _postar(degrau: dict, sistema: str, usuario: str) -> str:
    corpo = json.dumps({
        "model": degrau["modelo"],
        "messages": [{"role": "system", "content": sistema},
                     {"role": "user", "content": usuario}],
        "max_tokens": 6000,
        "reasoning_effort": "none",
    }).encode()
    pedido = urllib.request.Request(
        degrau["url"].rstrip("/") + "/chat/completions", corpo,
        {"Content-Type": "application/json",
         "Authorization": f"Bearer {os.environ[degrau['chave']]}"})
    with urllib.request.urlopen(pedido, timeout=600) as resposta:
        dados = json.load(resposta)
    return (dados.get("choices") or [{}])[0].get("message", {}).get("content") or ""


def chamar(sistema: str, usuario: str) -> tuple[str, str]:
    for degrau in DEGRAUS:
        if not os.environ.get(degrau["chave"]):
            continue
        try:
            texto = _postar(degrau, sistema, usuario)
        except Exception as erro:  # rede/API: cai de degrau
            print(f"  {degrau['nome']} falhou: {str(erro)[:70]}")
            continue
        if texto.strip():
            return texto.strip(), degrau["nome"]
    return "", ""


def secoes(texto: str) -> list[tuple[str, str]]:
    """(slug, corpo) de cada seção de relatório."""
    blocos = re.split(r"^## Relatório ", texto, flags=re.M)
    saida = []
    for bloco in blocos[1:]:
        titulo, _, corpo = bloco.partition("\n")
        slug = re.sub(r"[^a-z0-9]+", "-", titulo.lower()).strip("-")
        saida.append((slug, corpo.strip()))
    return saida


def main() -> int:
    notas = NOTAS.read_text(encoding="utf-8")
    for slug, corpo in secoes(notas):
        texto, modelo = chamar(SISTEMA, corpo)
        if not texto:
            print(f"falhou: {slug}")
            continue
        destino = SAIDA / f"sintese-{slug}.md"
        destino.write_text(texto.strip() + "\n", encoding="utf-8")
        print(f"ok  {modelo:14s} {destino.name} ({len(texto)} chars)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
