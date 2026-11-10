# -*- coding: utf-8 -*-
"""
Monitoramento geral do portal Controle Popular (fase 7 ampliada).

Confere todo dia a saude do site inteiro, com criterios objetivos:
1. ROTAS: GET nas rotas-chave em producao; 200 e OK, resto e CRITICO.
2. DADOS: todo apps/web/data/*.json precisa parsear; corrompido e CRITICO.
3. SEO: robots.txt (200 + linha Sitemap:) e sitemap.xml (200).
4. COMPONENTES: pagina-chave com <title> nao vazio (CRITICO) e
   <meta name="description"/> (AVISO se faltar).

Regras eticas: so leitura publica, User-Agent honesto
(finweejur/github artur colito), ritmo de 1,5 s por host, timeout 15 s.
Log em docs/02-estado/AUDITORIA-GERAL.md.

Uso: python scripts/monitoramento/verificar-geral.py [--atualizar-log]
Saida: codigo 0 se nada critico falhou; 1 caso contrario.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
DADOS = REPO / "apps" / "web" / "data"
LOG = REPO / "docs" / "02-estado" / "AUDITORIA-GERAL.md"
ORIGEM = "https://www.controlepopular.com.br"
UA = "finweejur/github artur colito (controlepopular.com.br; monitoramento de saude do portal)"
INTERVALO_S = 1.5
TIMEOUT_S = 15

ROTAS_CHAVE = [
    "/",
    "/cidades",
    "/ambiental",
    "/paraopeba",
    "/judiciario",
    "/congresso",
    "/editais",
    "/estudos-rurais",
    "/funcaosocialterra",
    "/busca",
    "/imprensa",
    "/noticias",
    "/documentacao",
    "/termos",
    "/status",
    "/eleicoes/2026/locais-votacao-alterados",
]


def requisitar(url: str) -> tuple[str, int | None, str]:
    """GET leve; devolve (status_texto, codigo_http, corpo parcial)."""
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
            corpo = resp.read(20000).decode("utf-8", "replace")
            return "ok", resp.status, corpo
    except urllib.error.HTTPError as exc:
        return "erro", exc.code, ""
    except (urllib.error.URLError, TimeoutError, OSError):
        return "falha", None, ""


def _linha_rota(rota: str) -> tuple[str, int]:
    """Linha da tabela e 1 critico quando a rota nao responde 200."""
    status, codigo, _ = requisitar(ORIGEM + rota)
    if status == "ok" and codigo == 200:
        return f"| {rota} | OK | {codigo} |", 0
    return f"| {rota} | CRITICO | {codigo or '-'} |", 1


def conferir_rotas() -> tuple[list[str], int]:
    linhas = ["| Rota | Status | HTTP |", "|---|---|---|"]
    criticos = 0
    for rota in ROTAS_CHAVE:
        linha, critico = _linha_rota(rota)
        linhas.append(linha)
        criticos += critico
        time.sleep(INTERVALO_S)
    return linhas, criticos


def conferir_dados() -> tuple[list[str], int, int]:
    linhas = ["| Dado | Status |", "|---|---|"]
    criticos = 0
    avisos = 0
    arquivos = sorted(DADOS.glob("*.json"))
    for arquivo in arquivos:
        try:
            json.loads(arquivo.read_text(encoding="utf-8"))
            classe = "OK"
        except (json.JSONDecodeError, UnicodeDecodeError):
            classe = "CRITICO"
            criticos += 1
        if arquivo.stat().st_size == 0:
            classe = "AVISO"
            avisos += 1
        linhas.append(f"| data/{arquivo.name} | {classe} |")
    return linhas, criticos, avisos


def _linha_robots() -> tuple[str, int]:
    """Linha do robots.txt e 1 critico se faltar 200 ou a linha Sitemap."""
    status, codigo, corpo = requisitar(ORIGEM + "/robots.txt")
    if status != "ok" or codigo != 200 or "Sitemap:" not in corpo:
        return "| robots.txt | CRITICO | sem 200 ou sem Sitemap: |", 1
    return "| robots.txt | OK | declara Sitemap |", 0


def _linha_sitemap() -> tuple[str, int]:
    """Linha do sitemap.xml e 1 critico se faltar 200 ou o XML."""
    status, codigo, corpo = requisitar(ORIGEM + "/sitemap.xml")
    if status != "ok" or codigo != 200 or not corpo.lstrip().startswith("<?xml"):
        return "| sitemap.xml | CRITICO | sem 200 ou sem xml |", 1
    return "| sitemap.xml | OK | xml serve |", 0


def conferir_seo() -> tuple[list[str], int, int]:
    linhas = ["| Item SEO | Status | Detalhe |", "|---|---|---|"]
    linha, criticos = _linha_robots()
    linhas.append(linha)
    time.sleep(INTERVALO_S)
    linha, critico = _linha_sitemap()
    linhas.append(linha)
    criticos += critico
    time.sleep(INTERVALO_S)
    return linhas, criticos, 0


def _linha_componente(rota: str) -> tuple[str, int, int]:
    """Linha da tabela e contadores (criticos, avisos) de uma rota."""
    status, codigo, corpo = requisitar(ORIGEM + rota)
    if status != "ok" or codigo != 200 or not corpo.strip():
        return f"| html | {rota} | CRITICO | sem 200 ou HTML vazio |", 1, 0
    if not re.search(r"<title>[^<]+</title>", corpo):
        return f"| title | {rota} | CRITICO | <title> vazio ou ausente |", 1, 0
    if 'name="description"' not in corpo and "name='description'" not in corpo:
        return f"| description | {rota} | AVISO | meta description ausente |", 0, 1
    return f"| title+description | {rota} | OK | |", 0, 0


def conferir_componentes() -> tuple[list[str], int, int]:
    linhas = ["| Componente | Rota | Status | Detalhe |", "|---|---|---|---|"]
    criticos = 0
    avisos = 0
    for rota in ROTAS_CHAVE[:6]:
        linha, critico, aviso = _linha_componente(rota)
        linhas.append(linha)
        criticos += critico
        avisos += aviso
        time.sleep(INTERVALO_S)
    return linhas, criticos, avisos


def gravar_log(linhas: list[str], criticos: int, avisos: int, agora: datetime) -> None:
    """Regrava docs/02-estado/AUDITORIA-GERAL.md com o cabecalho exigido.

    O validador de documentacao pede metadados e "## Sumario" em todo .md de
    docs/. Como este log e reescrito a cada rodada, o cabecalho nasce aqui --
    senao o monitoramento reabre o CI vermelho.
    """
    LOG.parent.mkdir(parents=True, exist_ok=True)
    resumo_linha = (
        f"- {agora:%d/%m/%Y %H:%M} BRT - {criticos} criticos; {avisos} avisos."
    )
    historico: list[str] = []
    if LOG.exists():
        atual = LOG.read_text(encoding="utf-8")
        if "## Historico de resumos" in atual:
            resto = atual.split("## Historico de resumos", 1)[1]
            historico = [l.rstrip() for l in resto.strip().splitlines() if l.strip()]
    if resumo_linha not in historico:
        historico.insert(0, resumo_linha)
    cabecalho = (
        "# Auditoria geral do portal\n\n"
        "> **Tipo:** RELATÓRIO\n"
        "> **Domínio:** operação (monitoramento do portal)\n"
        f"> **Última medição:** {agora:%Y-%m-%d}\n"
        "> **Leitura estimada:** curta (até 5 min)\n"
        "> **Relacionados:** [AGENTS.md](/AGENTS.md), [ESTADO.md](ESTADO.md)\n"
        "> **Palavras-chave:** auditoria, monitoramento, rotas, dados versionados, seo, componentes, portal\n\n"
        "## Sumário\n\n"
        "- [Rotas](#rotas)\n"
        "- [Dados versionados](#dados-versionados)\n"
        "- [SEO](#seo)\n"
        "- [Componentes (title/description)](#componentes-titledescription)\n"
        "- [Historico de resumos](#historico-de-resumos)\n\n"
        "Fase 7 - Monitoramento. Rotina: scripts/monitoramento/verificar-geral.py.\n\n"
        "<!-- ULTIMA RODADA -->\n\n"
    )
    conteudo = (
        cabecalho
        + "\n".join(linhas).rstrip()
        + "\n\n## Historico de resumos\n\n"
        + "\n".join(historico)
        + "\n"
    )
    LOG.write_text(conteudo, encoding="utf-8")


def principal() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--atualizar-log", action="store_true")
    args = parser.parse_args()

    agora = datetime.now(timezone(timedelta(hours=-3)))
    linhas = [f"| {agora:%d/%m/%Y %H:%M} BRT |", ""]

    t_rotas, c_rotas = conferir_rotas()
    t_dados, c_dados, a_dados = conferir_dados()
    t_seo, c_seo, a_seo = conferir_seo()
    t_comp, c_comp, a_comp = conferir_componentes()

    criticos = c_rotas + c_dados + c_seo + c_comp
    avisos = a_dados + a_seo + a_comp
    total_rotas = len(ROTAS_CHAVE)
    total_dados = len(sorted(DADOS.glob("*.json")))

    linhas.append("## Rotas")
    linhas.extend(t_rotas)
    linhas.append("")
    linhas.append("## Dados versionados")
    linhas.extend(t_dados)
    linhas.append("")
    linhas.append("## SEO")
    linhas.extend(t_seo)
    linhas.append("")
    linhas.append("## Componentes (title/description)")
    linhas.extend(t_comp)
    linhas.append("")
    resumo = (
        f"Resumo: {total_rotas} rotas; {total_dados} dados; SEO e componentes conferidos. "
        f"Criticos: {criticos}. Avisos: {avisos}."
    )
    linhas.append(resumo)
    linhas.append("")
    linhas.append(
        "Regra: CRITICO bloqueia merge (rotas fora do ar, JSON corrompido, "
        "robots/sitemap quebrado, pagina sem title). AVISO nao bloqueia."
    )

    if args.atualizar_log:
        gravar_log(linhas, criticos, avisos, agora)

    print(resumo)
    return 0 if criticos == 0 else 1


if __name__ == "__main__":
    sys.exit(principal())
