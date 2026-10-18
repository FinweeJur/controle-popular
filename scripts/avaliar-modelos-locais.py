# -*- coding: utf-8 -*-
"""Avaliador de modelos locais (Ollama) para os agentes do ecossistema.

Papel no projeto: decidir, por MEDICAO e nao por intuicao, qual modelo local
tem o melhor equilibrio entre qualidade de resposta e tokens por segundo no
hardware do dono (RTX 3050 Laptop 4 GB VRAM + 15,7 GB RAM).

Fonte das regras: AGENTS.md secao 5.12 (Ollama local: confira hardware e
modelos, delegue o repetitivo) e secao 5.15 (soberania de dados: local e o
unico degrau que recebe dado sensivel).

Decisoes tecnicas nao triviais:
- So biblioteca padrao (urllib/json): roda em qualquer clone, sem pip extra.
- Fala com a API local do Ollama (127.0.0.1:11434); nada sai da maquina.
- temperature=0 e num_predict fixo: comparacao justa entre modelos.
- A bateria mede 5 habilidades que os bots usam de verdade: JSON estrito,
  aritmetica multi-passo, chamada de ferramenta, obediencia de formato curto
  e leitura de contexto. Cada prova vale 1 ponto; empate desempata por tok/s.
- Lista de modelos e por argumento; sem argumento, avalia os instalados.

Uso:
    python scripts/avaliar-modelos-locais.py
    python scripts/avaliar-modelos-locais.py qwen3:8b qwen3-vl:4b
    python scripts/avaliar-modelos-locais.py --out docs/planos/modelos-locais-report.json
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request

OLLAMA = "http://127.0.0.1:11434"

# Texto publico curto para a prova de extracao (nenhum dado pessoal real).
TEXTO_EXTRACAO = (
    "O municipio de Mariana publicou o contrato 042/2026 com a empresa Vale "
    "Aguas Ltda, no valor de R$ 1.250.000,00, assinado em 12/03/2026, para "
    "recuperacao de drenagem na bacia do Rio Doce."
)

PROVAS = [
    {
        "nome": "json_extracao",
        "prompt": (
            "Extraia do texto um JSON com exatamente as chaves: numero, empresa, "
            "valor, data. Responda somente o JSON.\n\nTexto: " + TEXTO_EXTRACAO
        ),
        "formato": "json",
        "valida": lambda r: isinstance(r, dict)
        and {"numero", "empresa", "valor", "data"} <= set(r.keys()),
    },
    {
        "nome": "aritmetica",
        "prompt": (
            "Uma cidade recebeu R$ 480 mil em janeiro e R$ 615 mil em fevereiro. "
            "Gastou R$ 700 mil no total. Quanto sobrou, em reais? Responda so o numero."
        ),
        "formato": None,
        "valida": lambda r: "395" in str(r).replace(".", "").replace(",", ""),
    },
    {
        "nome": "tool_call",
        "prompt": (
            "Responda somente um JSON de chamada de ferramenta no formato "
            '{"name": "...", "arguments": {...}} para buscar os contratos do '
            "municipio de Mariana no ano de 2026."
        ),
        "formato": "json",
        "valida": lambda r: isinstance(r, dict)
        and "name" in r
        and isinstance(r.get("arguments"), dict),
    },
    {
        "nome": "brevidade",
        "prompt": (
            "Explique em no maximo 2 linhas o que e um TAC do IBAMA. "
            "Nao use listas."
        ),
        "formato": None,
        "valida": lambda r: 0 < len([l for l in str(r).splitlines() if l.strip()]) <= 3,
    },
    {
        "nome": "recall_contexto",
        "prompt": (
            "Contexto: o portal Controle Popular cobre 853 municipios de Minas "
            "Gerais e usa o codigo IBGE como chave unica. "
            "Pergunta: quantos municipios de Minas Gerais o portal cobre? "
            "Responda so o numero."
        ),
        "formato": None,
        "valida": lambda r: "853" in str(r),
    },
]


def _post(caminho: str, corpo: dict, timeout: int = 900) -> dict:
    dados = json.dumps(corpo).encode("utf-8")
    req = urllib.request.Request(
        OLLAMA + caminho, data=dados, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def modelos_instalados() -> list[str]:
    req = urllib.request.Request(OLLAMA + "/api/tags")
    with urllib.request.urlopen(req, timeout=30) as resp:
        dados = json.loads(resp.read().decode("utf-8"))
    return [m["name"] for m in dados.get("models", [])]


def avaliar_modelo(modelo: str) -> dict:
    resultado = {"modelo": modelo, "provas": {}, "pontos": 0, "tok_s": 0.0}
    # Aquecimento: a primeira chamada carrega o modelo na VRAM/RAM e nao
    # entra na nota (medido em 18/10: o 8B levou mais de 5 min no cold load).
    try:
        _post(
            "/api/chat",
            {
                "model": modelo,
                "messages": [{"role": "user", "content": "ok"}],
                "stream": False,
                "options": {"temperature": 0, "num_predict": 4},
            },
        )
    except (urllib.error.URLError, TimeoutError):
        pass
    tempos = []
    for prova in PROVAS:
        corpo = {
            "model": modelo,
            "messages": [{"role": "user", "content": prova["prompt"]}],
            "stream": False,
            "options": {"temperature": 0, "num_predict": 160},
        }
        if prova["formato"]:
            corpo["format"] = prova["formato"]
        inicio = time.time()
        try:
            resposta = _post("/api/chat", corpo)
        except urllib.error.URLError as erro:
            resultado["provas"][prova["nome"]] = f"erro: {erro}"
            continue
        duracao = time.time() - inicio
        tempos.append(duracao)
        conteudo = resposta.get("message", {}).get("content", "")
        bruto = conteudo
        if prova["formato"] == "json":
            try:
                bruto = json.loads(conteudo)
            except (ValueError, TypeError):
                bruto = None
        try:
            passou = bool(prova["valida"](bruto))
        except (TypeError, AttributeError):
            passou = False
        if passou:
            resultado["pontos"] += 1
        # tokens/s de geracao, medido pelo proprio Ollama
        gerados = resposta.get("eval_count", 0) or 0
        nanos = resposta.get("eval_duration", 0) or 1
        tok_s = gerados / (nanos / 1e9) if gerados else 0.0
        resultado["provas"][prova["nome"]] = {
            "passou": passou,
            "tok_s": round(tok_s, 1),
            "segundos": round(duracao, 1),
            "resposta": conteudo[:200],
        }
        if tok_s:
            resultado["tok_s"] = round(max(resultado["tok_s"], tok_s), 1)
    resultado["media_segundos"] = (
        round(sum(tempos) / len(tempos), 1) if tempos else 0.0
    )
    return resultado


def main() -> int:
    parser = argparse.ArgumentParser(description="Avalia modelos locais do Ollama.")
    parser.add_argument("modelos", nargs="*", help="modelos a avaliar (vazio = instalados)")
    parser.add_argument("--out", default="", help="grava o relatorio JSON neste caminho")
    args = parser.parse_args()

    try:
        modelos = args.modelos or modelos_instalados()
    except urllib.error.URLError:
        print("Ollama nao respondeu em 127.0.0.1:11434. Suba o Ollama primeiro.")
        return 1
    if not modelos:
        print("Nenhum modelo instalado.")
        return 1

    relatorios = []
    for modelo in modelos:
        print(f"avaliando {modelo} ...", flush=True)
        relatorios.append(avaliar_modelo(modelo))

    relatorios.sort(key=lambda r: (-r["pontos"], -r["tok_s"]))
    print()
    print(f"{'modelo':<28} {'pontos':>6} {'tok/s':>7} {'s/req':>7}")
    for r in relatorios:
        print(
            f"{r['modelo']:<28} {r['pontos']:>4}/5 {r['tok_s']:>7} "
            f"{r['media_segundos']:>7}"
        )

    if args.out:
        with open(args.out, "w", encoding="utf-8") as arq:
            json.dump(relatorios, arq, ensure_ascii=False, indent=2)
        print(f"\nrelatorio gravado em {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
