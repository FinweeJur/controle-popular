# -*- coding: utf-8 -*-
"""Gera o resumo de realidade de uma rota a partir do dado da própria página.

POR QUE EXISTE

O resumo de realidade nasceu na jurisprudência: medir, fechar vocabulário,
escrever no modelo gratuito e só publicar o que passa na verificação. Este
script leva o mesmo ciclo para as outras subfrentes.

COMO FUNCIONA

1. lê o inventário (`apps/web/data/inventario-subfrentes.json`);
2. para cada rota com dado, monta um perfil compacto dos JSON que a alimentam
   (contagem e valores mais frequentes dos campos categóricos);
3. escreve o resumo no S5-free, com número só do perfil;
4. verifica: número fora do perfil, parágrafo sem marca, `[medido]` sem fonte;
5. só grava o JSON publicado se a verificação fechar em zero falha.

Nesta versão o resumo usa **só o dado da página**. Link externo por afirmação
entra na v2, quando cada rota tiver consulta própria ao RAG.

Uso:
    python scripts/gerar-resumos-rotas.py --limite 5
    python scripts/gerar-resumos-rotas.py --rota /ambiental/tac
"""
from __future__ import annotations

import argparse
import collections
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "scripts"))

from verificar_resumo import verificar_texto  # noqa: E402

INVENTARIO = RAIZ / "apps" / "web" / "data" / "inventario-subfrentes.json"
DADOS = RAIZ / "apps" / "web" / "data"
PUBLICOS = RAIZ / "apps" / "web" / "public" / "data"
SAIDA = RAIZ / "apps" / "web" / "data" / "resumos-realidade"
FALHAS = RAIZ / "logs" / "resumos-falhas.jsonl"
MAX_CICLOS = 3
MAX_VALORES = 6
MAX_REGISTROS_AMOSTRA = 400

DEGRAUS = [
    {"nome": "S5-free", "url": "https://chat.maritaca.ai/api",
     "modelo": "S5-free", "chave": "MARITACA_API_KEY"},
    {"nome": "glm-4.5-flash", "url": "https://open.bigmodel.cn/api/paas/v4",
     "modelo": "glm-4.5-flash", "chave": "ZAI_API_KEY"},
]

SISTEMA = """Voce escreve o resumo de abertura de uma pagina do portal
Controle Popular, para leitor comum.

TOM: simples, direto, humano. Frase curta. Sem jargao sem explicacao. Sem
retorica, sem palavra de ordem, sem promessa. Realista: diga o que o dado
mostra e o que nao mostra. Quem le tem pressa.

REGRAS INVIOLAVEIS:
1. Numero so o que estiver no PERFIL. Nao invente, nao arredonde, nao recalcule.
2. Marque cada paragrafo: [medido — dados da pagina], [inferido] ou
   [nao da para concluir].
3. Nao cite documento externo nem invente link: o perfil so tem o dado da
   pagina.
4. Nao prometa resultado e nao faca acusacao que o dado nao sustenta.
5. Proibido: "media", "taxa de sucesso", causa sem contagem.
6. Nao cite nome de arquivo nem fale de "dossie": fale do dado e do que ele
   significa para quem le a pagina.

ESTRUTURA (no maximo 6 paragrafos):
- abertura: o que a pagina mostra, em uma frase;
- dois ou tres achados, cada um com o numero e o que ele significa;
- um paragrafo de limite: o que o dado nao mede.
"""

SISTEMA_CORRECAO = """Voce corrige um resumo de pagina seguindo a lista de
FALHAS. Corrija so o que a lista aponta:

1. numero fora do perfil: remova o numero ou troque pelo valor correto;
2. paragrafo sem marca: acrescente [medido — dados da pagina], [inferido] ou
   [nao da para concluir];
3. paragrafo [medido] sem fonte: escreva [medido — dados da pagina];
4. link ou documento externo: apague, o perfil nao tem fonte externa.

Nao acrescente fato novo. Devolva so o texto revisado, em markdown.
"""


def carregar_json(caminho: Path):
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except (ValueError, OSError):
        return None


def resolver(fonte: str) -> Path | None:
    nome = fonte if fonte.endswith(".json") else f"{fonte}.json"
    for base in (DADOS, PUBLICOS):
        caminho = base / nome
        if caminho.exists():
            return caminho
    return None


def registros(dados) -> list:
    if isinstance(dados, list):
        return dados
    if isinstance(dados, dict):
        for chave in ("itens", "casos", "atos", "trechos", "documentos", "registros"):
            if isinstance(dados.get(chave), list):
                return dados[chave]
    return []


def campos_categoricos(itens: list) -> list[str]:
    """Campos de texto com 2 a 12 valores distintos — os que descrevem o conjunto."""
    contagem: dict[str, set[str]] = collections.defaultdict(set)
    for item in itens[:MAX_REGISTROS_AMOSTRA]:
        if not isinstance(item, dict):
            continue
        for chave, valor in item.items():
            if isinstance(valor, str) and 0 < len(valor) <= 60:
                contagem[chave].add(valor)
    return [chave for chave, valores in contagem.items()
            if 2 <= len(valores) <= 12][:4]


def perfil_fonte(fonte: str, caminho: Path) -> list[str]:
    dados = carregar_json(caminho)
    itens = registros(dados)
    if not itens and isinstance(dados, dict) and isinstance(dados.get("total"), int):
        return [f"- conjunto com {dados['total']} registros (agregado, sem lista)"]
    linhas = [f"- conjunto com {len(itens)} registros"]
    if not itens or not isinstance(itens[0], dict):
        return linhas
    for campo in campos_categoricos(itens):
        contagem = collections.Counter(
            item.get(campo) for item in itens[:MAX_REGISTROS_AMOSTRA]
            if isinstance(item.get(campo), str))
        top = ", ".join(f"{valor} ({n})" for valor, n in contagem.most_common(MAX_VALORES))
        linhas.append(f"  - {campo}: {top}")
    return linhas


def perfil_util(rota: dict) -> bool:
    """Só gera resumo quando há lista de registros com campo descritivo.

    Rota cujo único dado é um total agregado não rende resumo: o modelo enche
    linguiça e o texto fica pior que a ausência.
    """
    for fonte in rota["fontes"]:
        caminho = resolver(fonte)
        if not caminho:
            continue
        itens = registros(carregar_json(caminho))
        if len(itens) >= 10 and isinstance(itens[0], dict) and campos_categoricos(itens):
            return True
    return False


def montar_perfil(rota: dict) -> str:
    linhas = [f"# Perfil da rota {rota['rota']}", f"Total de registros: {rota['registros']}"]
    for fonte in rota["fontes"]:
        caminho = resolver(fonte)
        if caminho:
            linhas += perfil_fonte(fonte, caminho)
    return "\n".join(linhas)


def _postar(degrau: dict, sistema: str, usuario: str) -> str:
    corpo = json.dumps({
        "model": degrau["modelo"],
        "messages": [{"role": "system", "content": sistema},
                     {"role": "user", "content": usuario}],
        "max_tokens": 4000,
        "reasoning_effort": "none",
    }).encode()
    pedido = urllib.request.Request(
        degrau["url"].rstrip("/") + "/chat/completions", corpo,
        {"Content-Type": "application/json",
         "Authorization": f"Bearer {os.environ[degrau['chave']]}"})
    with urllib.request.urlopen(pedido, timeout=300) as resposta:
        dados = json.load(resposta)
    return (dados.get("choices") or [{}])[0].get("message", {}).get("content") or ""


def chamar(sistema: str, usuario: str) -> str:
    """S5-free primeiro, GLM free depois; texto livre, não JSON.

    O `provedores.py` vive no repo da jurimetria. Aqui a cadeia é repetida em
    vinte linhas para o gerador não depender de caminho de outro repositório.
    """
    for degrau in DEGRAUS:
        if not os.environ.get(degrau["chave"]):
            continue
        for _ in range(2):
            try:
                texto = _postar(degrau, sistema, usuario)
            except Exception as erro:  # rede/API: tenta de novo ou cai de degrau
                print(f"  {degrau['nome']} falhou: {str(erro)[:60]}")
                continue
            if texto.strip():
                return texto.strip()
    return ""


def slug(rota: str) -> str:
    limpo = rota.strip("/").replace("/", "-")
    return re.sub(r"[^a-z0-9-]", "", limpo.lower()) or "home"


def gerar(rota: dict) -> tuple[bool, int]:
    perfil = montar_perfil(rota)
    texto = chamar(SISTEMA, perfil)
    if not texto:
        return False, 0
    for ciclo in range(1, MAX_CICLOS + 1):
        falhas = verificar_texto(texto, perfil)
        if not falhas:
            destino = SAIDA / f"{slug(rota['rota'])}.json"
            destino.parent.mkdir(parents=True, exist_ok=True)
            destino.write_text(json.dumps({
                "rota": rota["rota"],
                "geradoEm": "2026-11-08",
                "verificado": True,
                "markdown": texto,
            }, ensure_ascii=False, indent=1), encoding="utf-8")
            return True, ciclo
        entrada = f"{perfil}\n\nTEXTO A CORRIGIR:\n{texto}\n\nFALHAS A CORRIGIR:\n" + \
                  "\n".join(falhas[:40])
        texto = chamar(SISTEMA_CORRECAO, entrada)
        if not texto:
            break
    FALHAS.parent.mkdir(parents=True, exist_ok=True)
    with FALHAS.open("a", encoding="utf-8") as fp:
        fp.write(json.dumps({"rota": rota["rota"], "falhas": len(falhas)}, ensure_ascii=False) + "\n")
    return False, MAX_CICLOS


def main() -> int:
    ap = argparse.ArgumentParser(description="Gera resumos de realidade por rota.")
    ap.add_argument("--limite", type=int, default=5)
    ap.add_argument("--rota", default="")
    opcoes = ap.parse_args()
    inventario = json.loads(INVENTARIO.read_text(encoding="utf-8"))
    fila = [rota for rota in inventario["rotas"]
            if rota["classe"] == "tem-dado" and "[" not in rota["rota"]
            and rota["rota"] != "/jurisprudencia"]
    if opcoes.rota:
        fila = [rota for rota in fila if rota["rota"] == opcoes.rota]
    fila.sort(key=lambda rota: -rota["registros"])
    fila = fila[:opcoes.limite]
    ok = 0
    puladas = 0
    for rota in fila:
        if not perfil_util(rota):
            puladas += 1
            print(f"pula {rota['rota']} | perfil insuficiente")
            continue
        passou, ciclos = gerar(rota)
        ok += 1 if passou else 0
        print(f"{'ok ' if passou else 'FALHA'} {rota['rota']} | ciclos {ciclos} | {rota['registros']} registros")
    print(f"publicados: {ok}/{len(fila) - puladas} | puladas: {puladas}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
