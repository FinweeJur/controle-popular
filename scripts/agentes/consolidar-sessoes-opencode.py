#!/usr/bin/env python3
"""
Extrato das sessões do opencode do Controle Popular: prompt e conclusão.

POR QUE EXISTE

O opencode guarda cada sessão num SQLite em
`~/.local/share/opencode/opencode.db` (medido 18/10/2026: 11,8 GB). O banco é
local, não vai para o repo, e é a única memória completa do que os agentes
fizeram. O inventário `docs/02-estado/RELATORIOS-AGENTES.md` só consegue ler
transcrições de subagente gravadas em arquivo `agent-*.jsonl`; sessões que
existem apenas no banco ficariam invisíveis.

Este script lê o banco em modo SOMENTE LEITURA e imutável. Para cada sessão do
projeto, extrai só duas coisas:
  1. o primeiro texto do usuário (a tarefa/prompt);
  2. o último texto do assistente (a conclusão).
Nada de ferramenta, nada de diff, nada de arquivo anexado.

CUSTO

A leitura é local e não gasta token de modelo. Não usa Ollama: o corte é por
tipo de parte (`part.data.type == "text"`), que já separa pergunta e resposta.
Ollama só entraria se quiséssemos resumir; para "pegar o fim de cada log" não
é preciso.

PRIVACIDADE

O repo é público. Antes de escrever, o script:
  - redige CPF válido por módulo 11 (mesma régua da §5.2 do AGENTS.md);
  - redige padrões comuns de segredo (chave de API, token de bot, PEM);
  - corta prompt e conclusão por teto de caracteres.

USO

    python scripts/agentes/consolidar-sessoes-opencode.py
    python scripts/agentes/consolidar-sessoes-opencode.py --final-cap 2500
    python scripts/agentes/consolidar-sessoes-opencode.py --db <caminho>
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
DB_PADRAO = Path(os.path.expanduser("~/.local/share/opencode/opencode.db"))
SAIDA_PADRAO = RAIZ / "docs" / "relatorios-automacao" / "opencode-sessoes-cp.md"
FILTRO_PADRAO = "controle-popular"

CPF_RE = re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")
SEGREDO_RE = [
    re.compile(r"sk-[A-Za-z0-9]{20,}"),
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"gho_[A-Za-z0-9]{20,}"),
    re.compile(r"xox[bap]-[A-Za-z0-9-]{10,}"),
    re.compile(r"Bearer\s+[A-Za-z0-9._-]{20,}"),
    re.compile(r"-----BEGIN [A-Z ]+-----[\s\S]*?-----END [A-Z ]+-----"),
]

SQL_SESSOES = """
select id, parent_id, title, agent, time_created, time_updated
from session where directory like ? order by time_created desc
"""


def cpf_valido(digitos: str) -> bool:
    if not re.fullmatch(r"\d{11}", digitos) or re.fullmatch(r"(\d)\1{10}", digitos):
        return False

    def dv(ate: int) -> int:
        soma = sum(int(digitos[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        return 0 if resto == 10 else resto

    return dv(9) == int(digitos[9]) and dv(10) == int(digitos[10])


def redigir(texto: str) -> str:
    def troca_cpf(match: re.Match[str]) -> str:
        return "[CPF removido]" if cpf_valido(re.sub(r"\D", "", match.group(0))) else match.group(0)

    saida = CPF_RE.sub(troca_cpf, texto)
    for padrao in SEGREDO_RE:
        saida = padrao.sub("[segredo removido]", saida)
    # Texto de agente cita caminhos relativos à raiz do repo; o extrato mora em
    # docs/relatorios-automacao/, então o link precisa ser absoluto para não quebrar.
    return saida.replace("](docs/", "](/docs/")


def recortar(texto: str, limite: int) -> str:
    texto = " ".join(texto.split())
    if len(texto) <= limite:
        return texto
    return texto[:limite].rsplit(" ", 1)[0] + "…"


def data_de(ms: int) -> str:
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


def ler_sessoes(cur: sqlite3.Cursor, filtro: str) -> list[tuple]:
    return list(cur.execute(SQL_SESSOES, (f"%{filtro}%",)))


def texto_do_item(item: object) -> str:
    if not isinstance(item, dict) or item.get("type") != "text":
        return ""
    texto = item.get("text")
    return texto.strip() if isinstance(texto, str) else ""


def ler_textos(cur: sqlite3.Cursor, ids: list[str]) -> dict[str, list[str]]:
    marcadores = ",".join("?" for _ in ids)
    textos: dict[str, list[str]] = {}
    consulta = f"select session_id, data from part where session_id in ({marcadores}) order by time_created"
    for session_id, data in cur.execute(consulta, ids):
        try:
            texto = texto_do_item(json.loads(data))
        except (TypeError, ValueError):
            continue
        if texto:
            textos.setdefault(session_id, []).append(texto)
    return textos


def montar_registro(sessao: tuple, trechos: list[str], caps: dict[str, int]) -> dict:
    session_id, parent_id, title, agent, criada, atualizada = sessao
    return {
        "id": session_id,
        "parent": parent_id,
        "titulo": title or "(sem título)",
        "agente": agent or "?",
        "data": data_de(criada),
        "prompt": recortar(redigir(trechos[0]), caps["prompt"]),
        "final": recortar(redigir(trechos[-1]), caps["final"]) if len(trechos) > 1 else "(sem texto final capturado)",
    }


def extrair(db: Path, filtro: str, caps: dict[str, int]) -> tuple[list[dict], int]:
    con = sqlite3.connect(f"file:{db}?mode=ro&immutable=1", uri=True)
    cur = con.cursor()
    sessoes = ler_sessoes(cur, filtro)
    if not sessoes:
        return [], 0

    textos = ler_textos(cur, [linha[0] for linha in sessoes])
    registros = [montar_registro(s, textos[s[0]], caps) for s in sessoes if textos.get(s[0])]
    return registros, len(sessoes)


def linhas_cabecalho(registros: list[dict], total: int, meta: dict) -> list[str]:
    filhos = sum(1 for r in registros if r["parent"])
    return [
        "<!-- GERADO POR scripts/agentes/consolidar-sessoes-opencode.py — NÃO EDITE À MÃO. -->",
        "",
        "# Sessões do opencode — prompt e conclusão",
        "",
        f"- Projeto filtrado por diretório: `{meta['filtro']}`.",
        f"- Sessões encontradas no banco: **{total}**; com texto extraído: **{len(registros)}**; subagentes: **{filhos}**.",
        f"- Recortes: prompt até {meta['caps']['prompt']} caracteres; conclusão até {meta['caps']['final']}.",
        "- Fonte: `~/.local/share/opencode/opencode.db`, leitura somente-leitura.",
        "- CPF e padrões de segredo são redigidos antes de escrever.",
        "",
        "## Propósito",
        "",
        "Guardar o começo e o fim de cada sessão do opencode no Controle Popular:",
        "a pergunta que abriu o trabalho e a conclusão a que o agente chegou.",
        "O meio (ferramentas, diffs, arquivos) fica fora de propósito — o valor",
        "está no pedido e no veredito.",
        "",
    ]


def linhas_sessao(registro: dict) -> list[str]:
    origem = "subagente de " + registro["parent"] if registro["parent"] else "sessão principal"
    return [
        f"## {registro['data']} — {registro['titulo']}",
        "",
        f"- **Sessão:** `{registro['id']}`",
        f"- **Agente:** `{registro['agente']}`",
        f"- **Origem:** {origem}",
        "",
        f"**Pergunta:** {registro['prompt']}",
        "",
        f"**Conclusão:** {registro['final']}",
        "",
    ]


def montar(registros: list[dict], total: int, meta: dict) -> str:
    linhas = linhas_cabecalho(registros, total, meta)
    for registro in registros:
        linhas += linhas_sessao(registro)
    return "\n".join(linhas)


def principal() -> int:
    parser = argparse.ArgumentParser(description="Extrato de prompts e conclusões das sessões do opencode.")
    parser.add_argument("--db", type=Path, default=DB_PADRAO)
    parser.add_argument("--saida", type=Path, default=SAIDA_PADRAO)
    parser.add_argument("--filtro", default=FILTRO_PADRAO)
    parser.add_argument("--prompt-cap", type=int, default=700)
    parser.add_argument("--final-cap", type=int, default=1800)
    opcoes = parser.parse_args()

    if not opcoes.db.exists():
        print(f"banco do opencode não encontrado: {opcoes.db}", file=sys.stderr)
        return 1

    caps = {"prompt": opcoes.prompt_cap, "final": opcoes.final_cap}
    registros, total = extrair(opcoes.db, opcoes.filtro, caps)
    if not registros:
        print("nenhuma sessão com texto para o filtro informado", file=sys.stderr)
        return 1

    meta = {"filtro": opcoes.filtro, "caps": caps}
    opcoes.saida.parent.mkdir(parents=True, exist_ok=True)
    opcoes.saida.write_text(montar(registros, total, meta), encoding="utf-8")
    print(f"escrito {opcoes.saida.relative_to(RAIZ)} com {len(registros)} de {total} sessões")
    return 0


if __name__ == "__main__":
    raise SystemExit(principal())
