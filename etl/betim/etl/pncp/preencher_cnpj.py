"""Descobre e grava `municipios.cnpj_prefeitura` que estão nulos.

    python -m etl.pncp.preencher_cnpj --manifesto etl/betim/dados/manifesto-pncp.csv
    python -m etl.pncp.preencher_cnpj --ibge 1100049
    python -m etl.pncp.preencher_cnpj --manifesto ... --max 5 --dry-run

O PLANO diz: CNPJ nulo bloqueia a cidade na fila de PNCP — não se coleta no
escuro. CNPJ errado é pior que ausente (coleta de outro ente em silêncio;
runbook-cidade-nova). Por isso a descoberta:

1. varre `/v1/contratacoes/publicacao` por `codigoMunicipioIbge` + anos
   recentes (igual `etl.pncp.orgaos`, escopo menor: 2 anos, modalidades
   1 e 6 — pregão e concorrência concentram volume);
2. mantém só `orgaoEntidade.esferaId == "M"`;
3. escolhe o CNPJ cuja razão social parece prefeitura/município
   (`escolher_cnpj_prefeitura` — pura, testada);
4. grava em `municipios.cnpj_prefeitura` (e não no JSON do catálogo —
   o JSON é gerado; o banco é a fonte de verdade em runtime).

1 requisição lenta por host com pausa 1,5 s (FONTES). Um ETL PNCP por
máquina: este script É um ETL PNCP — não rode junto com `fila`.
"""
from __future__ import annotations

import argparse
import re
import sys
import time
from typing import Any

import requests

from etl.common import get_supabase_client
from etl.pncp.fila import ler_manifesto
from etl.pncp.manifesto import CATALOGO, carregar_catalogo, montar_manifesto

BASE = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao"
_HEADERS = {
    "User-Agent": "ControlePopular/ETL (portal de transparência)",
    "Accept": "application/json",
}
_PAUSA = 2.5
_MAX_429_POR_UNIDADE = 6
_ANOS_PADRAO = 2
_MODALIDADES_DESCOBERTA = (1, 6)

# Fragments que marcam a prefeitura / câmara do município (nunca "CAMARA"
# sozinha aqui: o CNPJ de prefeitura é o que `contratos` usa como principal).
_PADRAO_PREFEITURA = re.compile(
    r"PREFEITURA|MUNIC[IÍ]PIO DE|MUNICIPIO DE|PREFEITURA MUNICIPAL",
    re.IGNORECASE,
)


def escolher_cnpj_prefeitura(achados: dict[str, dict[str, Any]]) -> str | None:
    """O melhor `cnpj_prefeitura` entre `{cnpj: {razao_social, contagem}}`.

    Pura. Critérios, nesta ordem:
    1. razão social casa o padrão de prefeitura/município;
    2. maior `contagem` (quem mais publica no PNCP);
    3. empate → CNPJ lexicograficamente menor (determinístico).
    """
    melhores: list[tuple[int, int, str]] = []
    for cnpj, info in achados.items():
        if not cnpj or not str(cnpj).isdigit() or len(str(cnpj)) != 14:
            continue
        razao = str((info or {}).get("razao_social") or "")
        contagem = int((info or {}).get("contagem") or 0)
        score = 1 if _PADRAO_PREFEITURA.search(razao) else 0
        melhores.append((score, contagem, str(cnpj)))
    if not melhores:
        return None
    melhores.sort(key=lambda t: (-t[0], -t[1], t[2]))
    top = melhores[0]
    # Só aceita o "melhor" se ele for prefeitura OU se for o único candidato
    # com contagem alta — evita gravar consórcio aleatório como prefeitura.
    if top[0] == 1:
        return top[2]
    if len(melhores) == 1:
        return top[2]
    # Sem razão social de prefeitura e vários candidatos: não adivinha.
    return None


def _ja_tem_prefeitura(achados: dict[str, dict[str, Any]]) -> bool:
    return any(
        _PADRAO_PREFEITURA.search(str((v or {}).get("razao_social") or ""))
        for v in achados.values()
    )


def descobrir(
    ibge: str,
    anos: list[int],
    *,
    pause: float = _PAUSA,
    sessao: requests.Session | None = None,
) -> dict[str, dict[str, Any]]:
    """`{cnpj: {razao_social, contagem}}` só da esfera M.

    Para cedo assim que aparece razão social de prefeitura/município —
    descobrir o CNPJ é o objetivo, não esgotar páginas. Backoff 429 com
    teto: sem teto, 8 cidades em paralelo ficaram 10 min presas no mesmo
    429 (medido 24/09).
    """
    http = sessao or requests.Session()
    achados: dict[str, dict[str, Any]] = {}
    for ano in anos:
        if _ja_tem_prefeitura(achados):
            break
        for mod in _MODALIDADES_DESCOBERTA:
            if _ja_tem_prefeitura(achados):
                break
            pagina = 1
            erros_429 = 0
            while True:
                if _ja_tem_prefeitura(achados):
                    break
                try:
                    r = http.get(
                        BASE,
                        params={
                            "dataInicial": f"{ano}0101",
                            "dataFinal": f"{ano}1231",
                            "codigoModalidadeContratacao": mod,
                            "codigoMunicipioIbge": ibge,
                            "pagina": pagina,
                            "tamanhoPagina": 50,
                        },
                        headers=_HEADERS,
                        timeout=120,
                    )
                except requests.RequestException as e:
                    print(f"[etl.pncp.preencher_cnpj] rede {ibge}: {e}", file=sys.stderr)
                    return achados
                time.sleep(pause)
                if r.status_code == 429:
                    erros_429 += 1
                    if erros_429 >= _MAX_429_POR_UNIDADE:
                        print(
                            f"[etl.pncp.preencher_cnpj] 429 teto {ibge} "
                            f"(mod={mod} ano={ano}) — pula unidade",
                            flush=True,
                        )
                        break
                    espera = 30 * erros_429
                    print(
                        f"[etl.pncp.preencher_cnpj] 429 {ibge} — {espera}s",
                        flush=True,
                    )
                    time.sleep(espera)
                    continue
                erros_429 = 0
                if r.status_code != 200:
                    break
                try:
                    dados = r.json()
                except ValueError:
                    break
                itens = dados.get("data") or []
                if not itens:
                    break
                for it in itens:
                    oe = it.get("orgaoEntidade") or {}
                    cnpj = (oe.get("cnpj") or "").strip()
                    if not cnpj or oe.get("esferaId") != "M":
                        continue
                    reg = achados.setdefault(
                        cnpj,
                        {
                            "razao_social": oe.get("razaoSocial"),
                            "contagem": 0,
                        },
                    )
                    reg["contagem"] += 1
                if _ja_tem_prefeitura(achados):
                    break
                total_paginas = int(dados.get("totalPaginas") or 1)
                if pagina >= total_paginas or pagina >= 3:
                    # Teto de 3 páginas por (ano, mod) na descoberta: o
                    # objetivo é ACHAR o CNPJ, não baixar o acervo.
                    break
                pagina += 1
    return achados


def gravar_cnpj(ibge: str, cnpj: str) -> None:
    client = get_supabase_client()
    linhas = (
        client.table("municipios")
        .select("id_municipio, fontes")
        .eq("id_municipio", ibge)
        .execute()
        .data
    )
    if not linhas:
        raise RuntimeError(f"id_municipio={ibge} não existe em municipios")
    fontes = linhas[0].get("fontes") or {}
    client.table("municipios").update({"cnpj_prefeitura": cnpj}).eq(
        "id_municipio", ibge
    ).execute()
    print(f"[etl.pncp.preencher_cnpj] {ibge} cnpj_prefeitura={cnpj}", flush=True)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Preenche cnpj_prefeitura nulo via PNCP")
    p.add_argument("--manifesto", type=str, default=None)
    p.add_argument("--ibge", action="append", default=[], help="Repetível; ignora manifesto")
    p.add_argument("--max", type=int, default=0, help="0 = sem teto")
    p.add_argument("--anos", type=int, default=_ANOS_PADRAO)
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args(argv)

    import datetime as dt

    ano_atual = dt.date.today().year
    anos = list(range(ano_atual - args.anos + 1, ano_atual + 1))

    alvos: list[dict[str, str]] = []
    if args.ibge:
        alvos = [{"ibge": i, "nome": "", "cnpj_prefeitura": ""} for i in args.ibge]
    else:
        caminho = args.manifesto
        if caminho:
            from pathlib import Path

            linhas = ler_manifesto(Path(caminho))
        else:
            linhas = montar_manifesto(carregar_catalogo(CATALOGO))
        alvos = [
            ln
            for ln in linhas
            if ln.get("status") in ("bloqueada-cnpj", "pronta")
            and not (ln.get("cnpj_prefeitura") or "").strip()
        ]
        # só quem AINDA não tem CNPJ no manifesto (bloqueadas)
        alvos = [ln for ln in alvos if ln.get("status") == "bloqueada-cnpj"]

    if args.max > 0:
        alvos = alvos[: args.max]

    print(
        f"[etl.pncp.preencher_cnpj] alvos={len(alvos)} anos={anos} "
        f"dry_run={args.dry_run}",
        flush=True,
    )
    ok = 0
    falha = 0
    for idx, ln in enumerate(alvos, 1):
        ibge = ln.get("ibge") or ""
        if not ibge:
            continue
        # Pausa entre CIDADES (além do pause por request): uma fila longa
        # sem intervalo acaba no 429 e o retry só piora.
        if idx > 1:
            time.sleep(3.0)
        print(
            f"[etl.pncp.preencher_cnpj] ({idx}/{len(alvos)}) {ibge} "
            f"{ln.get('nome')}",
            flush=True,
        )
        achados = descobrir(ibge, anos)
        cnpj = escolher_cnpj_prefeitura(achados)
        if not cnpj:
            falha += 1
            print(
                f"[etl.pncp.preencher_cnpj] {ibge} "
                f"{ln.get('nome')}: sem CNPJ confiavel "
                f"(achados={len(achados)})",
                flush=True,
            )
            continue
        if args.dry_run:
            print(
                f"[etl.pncp.preencher_cnpj] DRY {ibge} -> {cnpj} "
                f"(achados={len(achados)})",
                flush=True,
            )
            ok += 1
            continue
        try:
            gravar_cnpj(ibge, cnpj)
            ok += 1
        except Exception as e:  # noqa: BLE001 — segue o lote
            falha += 1
            print(
                f"[etl.pncp.preencher_cnpj] ERRO {ibge}: {e}",
                file=sys.stderr,
                flush=True,
            )
    print(
        f"[etl.pncp.preencher_cnpj] fim ok={ok} falha={falha} total={len(alvos)}"
    )
    return 0 if falha == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
