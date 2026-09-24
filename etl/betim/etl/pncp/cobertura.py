"""CSV de cobertura da coleta PNCP por cidade.

    python -m etl.pncp.cobertura
    python -m etl.pncp.cobertura --manifesto etl/betim/dados/manifesto-pncp.csv

Lê o manifesto + os dois checkpoints desta máquina e escreve
`etl/betim/dados/cobertura-pncp.csv` com separador `;` e BOM UTF-8
(regra do portal: o Excel brasileiro lê acento).

Contagens de linha no banco NÃO entrem aqui sem o CLI do Guara — este
artefato é o estado do checkpoint (o que a coleta JÁ percorreu). A
recontagem no banco é o C4 do plano e roda à parte.
"""
from __future__ import annotations

import argparse
import csv
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from etl.pncp import checkpoint as ck
from etl.pncp.fila import ler_manifesto, resumo_ibge
from etl.pncp.manifesto import carregar_catalogo, montar_manifesto

_RAIZ_ETL = Path(__file__).resolve().parents[2]
SAIDA_COBERTURA = _RAIZ_ETL / "dados" / "cobertura-pncp.csv"

COLUNAS = [
    "ibge",
    "nome",
    "uf",
    "tipo",
    "status",
    "cnpj_prefeitura",
    "contratos_total",
    "contratos_ok",
    "licitacoes_total",
    "licitacoes_ok",
    "cidade_completa",
    "ultimo_erro",
    "atualizado_em",
]


def _ultimo_erro(estado: dict[str, Any], ibge: str, sep: str = ":") -> str:
    """Chave namespaced mais recente que NÃO está ok (parcial/erro)."""
    pior = ""
    pior_ts = ""
    for k, v in estado.items():
        if not k.startswith(f"{ibge}{sep}") or not isinstance(v, dict):
            continue
        if v.get("status") == "ok":
            continue
        ts = str(v.get("atualizado_em") or "")
        if ts >= pior_ts:
            pior_ts = ts
            pior = f"{k}:{v.get('status')}"
    return pior


def linhas_cobertura(
    manifesto: list[dict[str, str]],
    estado_contratos: dict[str, Any],
    estado_licitacoes: dict[str, Any],
    *,
    agora_iso: str | None = None,
) -> list[dict[str, Any]]:
    from etl.pncp.fila import cidade_completa

    ts = agora_iso or datetime.now(timezone.utc).isoformat(timespec="seconds")
    out: list[dict[str, Any]] = []
    for ln in manifesto:
        ibge = ln.get("ibge") or ""
        tc, oc, _ = resumo_ibge(estado_contratos, ibge)
        tl, ol, _ = resumo_ibge(estado_licitacoes, ibge)
        erro = _ultimo_erro(estado_contratos, ibge) or _ultimo_erro(
            estado_licitacoes, ibge
        )
        out.append(
            {
                "ibge": ibge,
                "nome": ln.get("nome") or "",
                "uf": ln.get("uf") or "",
                "tipo": ln.get("tipo") or "",
                "status": ln.get("status") or "",
                "cnpj_prefeitura": ln.get("cnpj_prefeitura") or "",
                "contratos_total": tc,
                "contratos_ok": oc,
                "licitacoes_total": tl,
                "licitacoes_ok": ol,
                "cidade_completa": (
                    "sim"
                    if cidade_completa(estado_contratos, estado_licitacoes, ibge)
                    else "nao"
                ),
                "ultimo_erro": erro,
                "atualizado_em": ts,
            }
        )
    return out


def gravar_csv(linhas: list[dict[str, Any]], caminho: Path) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with caminho.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLUNAS, delimiter=";", lineterminator="\n")
        w.writeheader()
        w.writerows(linhas)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="CSV de cobertura PNCP")
    p.add_argument("--manifesto", type=Path, default=None)
    p.add_argument("--saida", type=Path, default=SAIDA_COBERTURA)
    args = p.parse_args(argv)

    if args.manifesto:
        manifesto = ler_manifesto(args.manifesto)
    else:
        manifesto = montar_manifesto(carregar_catalogo())

    estado_c = ck.carregar(ck.NOME_CONTRATOS)
    estado_l = ck.carregar(ck.NOME_LICITACOES)
    linhas = linhas_cobertura(manifesto, estado_c, estado_l)
    gravar_csv(linhas, args.saida)
    completas = sum(1 for x in linhas if x["cidade_completa"] == "sim")
    prontas = sum(1 for x in linhas if x["status"] == "pronta")
    print(
        f"[etl.pncp.cobertura] {args.saida} "
        f"linhas={len(linhas)} prontas={prontas} completas={completas}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
