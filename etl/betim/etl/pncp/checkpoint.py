"""Checkpoint de retomada dos ETLs PNCP (contratos e licitações).

Grava estado em JSON no disco local para que queda de internet, erro 500
do PNCP ou desligamento do PC não apague o progresso de UMA rodada.

O que já foi gravado no Postgres continua lá (upsert idempotente por
`numero_controle_pncp`); este arquivo só diz **de onde continuar** sem
refazer página/modo/ano já percorridos.

Arquivo por ETL, em `etl/betim/` (gitignored — estado desta máquina):

  .checkpoint-pncp-contratos.json
  .checkpoint-pncp-licitacoes.json

Formato (um nível por unidade de trabalho):

  contratos:  {"2024": {"status": "parcial", "pagina": 3, "registros": 150}}
  licitações: {"2024-6": {"status": "parcial", "pagina": 2, "registros": 100}}

status:
  parcial — unidade em andamento; retomar da `pagina` seguinte
  ok      — unidade completa; pular na próxima rodada
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

# etl/betim/etl/pncp/checkpoint.py -> etl/betim
_RAIZ_ETL_BETIM = Path(__file__).resolve().parents[2]


def _caminho(nome: str) -> Path:
    return _RAIZ_ETL_BETIM / nome


def carregar(nome: str) -> dict[str, Any]:
    path = _caminho(nome)
    if not path.is_file():
        return {}
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        # Checkpoint corrompido não pode derrubar a coleta: começa zero e o
        # upsert idempotente absorve o re-fetch.
        return {}


def salvar(nome: str, estado: dict[str, Any]) -> None:
    path = _caminho(nome)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(estado, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def unidade_pronta(estado: dict[str, Any], chave: str) -> bool:
    item = estado.get(chave)
    return isinstance(item, dict) and item.get("status") == "ok"


def marcar_parcela(
    estado: dict[str, Any],
    nome: str,
    chave: str,
    *,
    pagina: int,
    registros: int,
) -> None:
    estado[chave] = {
        "status": "parcial",
        "pagina": pagina,
        "registros": registros,
        "atualizado_em": _agora_iso(),
    }
    salvar(nome, estado)


def marcar_ok(
    estado: dict[str, Any],
    nome: str,
    chave: str,
    *,
    registros: int,
) -> None:
    estado[chave] = {
        "status": "ok",
        "pagina": 0,
        "registros": registros,
        "atualizado_em": _agora_iso(),
    }
    salvar(nome, estado)


def pagina_retomar(estado: dict[str, Any], chave: str) -> int:
    """Próxima página a buscar (1 = do zero)."""
    item = estado.get(chave)
    if not isinstance(item, dict) or item.get("status") != "parcial":
        return 1
    try:
        p = int(item.get("pagina") or 0)
    except (TypeError, ValueError):
        return 1
    # `pagina` no checkpoint é a ÚLTIMA página já gravada; retoma na seguinte.
    return max(p + 1, 1)


def _agora_iso() -> str:
    import datetime as dt

    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


NOME_CONTRATOS = ".checkpoint-pncp-contratos.json"
NOME_LICITACOES = ".checkpoint-pncp-licitacoes.json"
