# -*- coding: utf-8 -*-
"""
Verifica os hyperlinks das fontes oficiais (TSE/TRE) da pagina
/eleicoes/2026/locais-votacao-alterados do Controle Popular.

Fonte oficial: TSE e TREs (dadosabertos.tse.jus.br e tre-<uf>.tse.jus.br).
Por que existe: em 19/10/2026 o dono relatou que nenhuma fonte/link
estava funcionando; esta rotina confere cada link com User-Agent honesto
(finweejur/github artur colito), ritmo de 1,5 s por host, e registra
resultado em docs/02-estado/AUDITORIA-FONTES.md.

Regras eticas: so link publico; respeita robots/limite; hosts que
bloqueiam robot (403) viram AVISO, nao falha, pois sao acessiveis no
navegador — o portal apenas aponta, nunca coleta esses hosts.

Uso: python scripts/etl/eleicoes/verificar-fontes.py [--atualizar-log]
Saida: codigo 0 se nada critico falhou; 1 se link sem excecao falhou.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
REGISTRO = REPO / "scripts" / "etl" / "eleicoes" / "fontes-oficiais.json"
LOG = REPO / "docs" / "02-estado" / "AUDITORIA-FONTES.md"
UA = "finweejur/github artur colito (controlepopular.com.br; verificacao de links oficiais)"
INTERVALO_S = 1.5
TIMEOUT_S = 15

UFS = [
    "ac", "al", "ap", "am", "ba", "ce", "df", "es", "go", "ma", "mt", "ms",
    "mg", "pa", "pb", "pr", "pe", "pi", "rj", "rn", "rs", "ro", "rr", "sc",
    "sp", "se", "to",
]


def carregar_fontes() -> list[dict]:
    """Le o registro JSON e completa os links de TRE derivados por UF."""
    dados = json.loads(REGISTRO.read_text(encoding="utf-8"))["fontes"]
    for uf in UFS:
        dados.append(
            {
                "id": f"tre-{uf}",
                "url": f"https://www.tre-{uf}.jus.br/eleicoes",
                "tipo": "TRE",
                "bloqueia_robot": True,
            }
        )
    return dados


def conferir(url: str) -> tuple[str, int | None]:
    """Faz GET leve e devolve (status_texto, codigo_http)."""
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
            resp.read(4096)
            return "ok", resp.status
    except urllib.error.HTTPError as exc:
        return "erro", exc.code
    except (urllib.error.URLError, TimeoutError, OSError):
        return "falha", None


def classificar(fonte: dict, status: str, codigo: int | None) -> str:
    """Critério objetivo: bloqueio de robot e AVISO; resto e CRITICO."""
    if status == "ok":
        return "OK"
    if fonte.get("bloqueia_robot") and codigo in (403, 405, 429, 503):
        return "AVISO"
    return "CRITICO"


def principal() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--atualizar-log", action="store_true")
    args = parser.parse_args()

    fontes = carregar_fontes()
    agora = datetime.now(timezone(timedelta(hours=-3)))
    linhas = [f"| {agora:%d/%m/%Y %H:%M} BRT |", ""]
    criticos = 0
    avisos = 0

    tabela = ["| Link | Status | HTTP |", "|---|---|---|"]
    for fonte in fontes:
        status, codigo = conferir(fonte["url"])
        classe = classificar(fonte, status, codigo)
        if classe == "CRITICO":
            criticos += 1
        elif classe == "AVISO":
            avisos += 1
        tabela.append(f'| {fonte["id"]} | {classe} | {codigo or "-"} |')
        time.sleep(INTERVALO_S)

    linhas.extend(tabela)
    resumo = f"Total: {len(fontes)} links. Criticos: {criticos}. Avisos (403 robot esperado): {avisos}."
    linhas.append("")
    linhas.append(resumo)
    linhas.append("")
    linhas.append(
        "Regra: CRITICO bloqueia merge na secao de fontes. AVISO de 403/405/429/503 "
        "em host que bloqueia robot nao bloqueia: o portal so aponta o link."
    )

    if args.atualizar_log:
        LOG.parent.mkdir(parents=True, exist_ok=True)
        atual = LOG.read_text(encoding="utf-8") if LOG.exists() else ""
        resumo_linha = f"- {agora:%d/%m/%Y %H:%M} BRT - {len(fontes)} links; {criticos} criticos; {avisos} avisos."
        if resumo_linha not in atual:
            marcador = "## Histórico de resumos"
            if marcador in atual:
                LOG.write_text(
                    atual.rstrip() + "\n" + resumo_linha + "\n", encoding="utf-8"
                )
            else:
                LOG.write_text(atual.rstrip() + "\n\n" + marcador + "\n\n" + resumo_linha + "\n", encoding="utf-8")

    print(resumo)
    for linha in tabela[1:]:
        print(linha)
    return 1 if criticos else 0


if __name__ == "__main__":
    sys.exit(principal())
