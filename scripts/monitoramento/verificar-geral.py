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
(FinweeJur/Github Artur colito), ritmo de 1,5 s por host, timeout 15 s.
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
UA = "FinweeJur/Github Artur colito (controlepopular.com.br; monitoramento de saude do portal)"
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


def conferir_rotas() -> tuple[list[str], int]:
    linhas = ["| Rota | Status | HTTP |", "|---|---|---|"]
    criticos = 0
    for rota in ROTAS_CHAVE:
        status, codigo, _ = requisitar(ORIGEM + rota)
        classe = "OK" if status == "ok" and codigo == 200 else "CRITICO"
        if classe == "CRITICO":
            criticos += 1
        linhas.append(f"| {rota} | {classe} | {codigo or '-'} |")
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


def conferir_seo() -> tuple[list[str], int, int]:
    linhas = ["| Item SEO | Status | Detalhe |", "|---|---|---|"]
    criticos = 0
    avisos = 0
    status, codigo, corpo = requisitar(ORIGEM + "/robots.txt")
    if status != "ok" or codigo != 200 or "Sitemap:" not in corpo:
        linhas.append("| robots.txt | CRITICO | sem 200 ou sem Sitemap: |")
        criticos += 1
    else:
        linhas.append("| robots.txt | OK | declara Sitemap |")
    time.sleep(INTERVALO_S)

    status, codigo, corpo = requisitar(ORIGEM + "/sitemap.xml")
    if status != "ok" or codigo != 200 or not corpo.lstrip().startswith("<?xml"):
        linhas.append("| sitemap.xml | CRITICO | sem 200 ou sem xml |")
        criticos += 1
    else:
        linhas.append("| sitemap.xml | OK | xml serve |")
    time.sleep(INTERVALO_S)
    return linhas, criticos, avisos


def conferir_componentes() -> tuple[list[str], int, int]:
    linhas = ["| Componente | Rota | Status | Detalhe |", "|---|---|---|---|"]
    criticos = 0
    avisos = 0
    for rota in ROTAS_CHAVE[:6]:
        status, codigo, corpo = requisitar(ORIGEM + rota)
        if status != "ok" or codigo != 200 or not corpo.strip():
            linhas.append(f"| html | {rota} | CRITICO | sem 200 ou HTML vazio |")
            criticos += 1
            time.sleep(INTERVALO_S)
            continue
        tem_title = bool(re.search(r"<title>[^<]+</title>", corpo))
        tem_desc = 'name="description"' in corpo or "name='description'" in corpo
        if not tem_title:
            linhas.append(f"| title | {rota} | CRITICO | <title> vazio ou ausente |")
            criticos += 1
        elif not tem_desc:
            linhas.append(f"| description | {rota} | AVISO | meta description ausente |")
            avisos += 1
        else:
            linhas.append(f"| title+description | {rota} | OK | |")
        time.sleep(INTERVALO_S)
    return linhas, criticos, avisos


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
            if "<!-- ULTIMA RODADA -->" in atual:
                bloco = atual.split("<!-- ULTIMA RODADA -->", 1)[1]
                if "## Historico de resumos" in bloco:
                    bloco = bloco.split("## Historico de resumos", 1)[0]
                rodada_anterior = bloco.strip()
        if resumo_linha not in historico:
            historico.insert(0, resumo_linha)
        conteudo = (
            "# Auditoria geral do portal\n\n"
            "Fase 7 - Monitoramento. Rotina: scripts/monitoramento/verificar-geral.py.\n\n"
            "<!-- ULTIMA RODADA -->\n\n"
            + "\n".join(linhas).rstrip()
            + "\n\n## Historico de resumos\n\n"
            + "\n".join(historico)
            + "\n"
        )
        LOG.write_text(conteudo, encoding="utf-8")

    print(resumo)
    return 0 if criticos == 0 else 1


if __name__ == "__main__":
    sys.exit(principal())
