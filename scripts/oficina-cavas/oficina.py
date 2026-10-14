#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Oficina de Cavas ÔÇö orquestrador CLI dos est├ígios (est├ígio 1 e glue).

O que ├®: o ponto de entrada ├║nico que roda a esteira
coletar ÔåÆ analisar ÔåÆ separar, com trava de inst├óncia (nunca duas coletas
ao mesmo tempo) e retry adaptativo no est├ígio de coleta.

Por que retry adaptativo: a rodada de 13/10/2026 gastou 44 minutos para
coletar ZERO negativos ÔÇö 100 candidatos, todos rejeitados pela r├®gua de
nuvem (max_nuvem=0.20). A reserva ├ù10 foi a alavanca errada: o gargalo n├úo
├® falta de candidato, ├® a r├®gua de nuvem. Este orquestrador monitora a
taxa de aceita├º├úo e, se cair abaixo de 30%, baixa max_nuvem em degraus e
sobe --tentativas, em vez de repetir o mesmo suic├¡dio.

Uso:
    python scripts/oficina-cavas/oficina.py status
    python scripts/oficina-cavas/oficina.py rodar --estagio coletar
    python scripts/oficina-cavas/oficina.py rodar --estagio todos
    python scripts/oficina-cavas/oficina.py rodar --estagio coletar --tipo negativo --limite 10
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path

# Imports do pr├│prio pacote oficina (roda como script, ent├úo ajusta sys.path).
_OFICINA_DIR = Path(__file__).resolve().parent
_RAIZ = _OFICINA_DIR.parents[1]
sys.path.insert(0, str(_OFICINA_DIR))

from estado import (  # noqa: E402
    ESTAGIOS, adquirir_trava, liberar_trava, marcar_estagio, resumo_estado,
)
from logger import LoggerOficina  # noqa: E402

_CACHE = _RAIZ / "scripts" / ".cache" / "cavas-calibracao"
_LOG = _CACHE / "oficina.jsonl"
_COLETOR = _RAIZ / "scripts" / "coletar-cavas-calibracao.py"

# Limites de retry adaptativo (medidos 13/10/2026).
TAXA_MINIMA = 0.30  # se aceita├º├úo < 30%, degrada
DEGRAUS_NUVEM = (0.20, 0.28, 0.35, 0.45)  # sobe o corte = aceita mais cena
DEGRAUS_TENTATIVAS = (3, 5, 8)            # mais cenas por candidato


def _python() -> str:
    return sys.executable or "python"


def _rodar_coletor(params: dict, log: LoggerOficina) -> tuple[int, int]:
    """Roda o coletor uma vez. Devolve (rc, feitos).

    `params` carrega tipo/limite/max_nuvem/tentativas ÔÇö um dict em vez de
    4 argumentos soltos, para a assinatura caber no teto do CodeScene e
    para crescer sem quebrar chamador.
    """
    cmd = [
        _python(), str(_COLETOR),
        "--tipo", params["tipo"], "--limite", str(params["limite"]),
        "--max-nuvem", str(params["max_nuvem"]),
        "--tentativas", str(params["tentativas"]),
    ]
    log.evento("coletor_iniciando", **params)
    t0 = time.time()
    proc = subprocess.run(cmd, cwd=str(_RAIZ), capture_output=True, text=True)
    dt = time.time() - t0
    feitos = _extrair_feitos(proc.stdout or "")
    log.evento("coletor_terminou", rc=proc.returncode, feitos=feitos,
               segundos=round(dt, 1), tipo=params["tipo"])
    if proc.returncode != 0:
        log.erro("coletor_falhou", mensagem=(proc.stderr or "")[-500:],
                 rc=proc.returncode)
    return proc.returncode, feitos


def _extrair_feitos(saida: str) -> int:
    """Extrai o total de recortes feitos da ├║ltima linha do coletor."""
    for linha in reversed(saida.splitlines()):
        linha = linha.strip()
        if "rodada:" in linha:
            # ex.: "rodada: +3 positivos, +7 negativos"
            import re
            nums = re.findall(r"\+(\d+)", linha)
            return sum(int(n) for n in nums)
    return 0


def estagio_coletar(tipo: str, limite: int, log: LoggerOficina) -> bool:
    """Coleta com retry adaptativo. Devolve True se fez pelo menos 1."""
    marcar_estagio("coletar", "rodando", detalhe=f"tipo={tipo} limite={limite}")
    total = 0
    for nuvem, tentativas in zip(DEGRAUS_NUVEM, DEGRAUS_TENTATIVAS):
        rc, feitos = _rodar_coletor(
            {"tipo": tipo, "limite": limite - total,
             "max_nuvem": nuvem, "tentativas": tentativas}, log)
        total += feitos
        if total >= limite or rc != 0:
            break
        taxa = feitos / max(limite, 1)
        log.evento("retry_adaptativo", max_nuvem=nuvem,
                   feitos=feitos, taxa=round(taxa, 3),
                   proximo_nuvem=min(DEGRAUS_NUVEM, key=lambda x: abs(x - nuvem)))
        if taxa >= TAXA_MINIMA:
            break  # aceita├º├úo razo├ível ÔÇö n├úo precisa degradar mais
    status = "ok" if total > 0 else "pulado"
    marcar_estagio("coletar", status, detalhe=f"feitos={total}",
                   tipo=tipo, alvo=limite)
    return total > 0


def estagio_analisar(limite: int | None, log: LoggerOficina) -> bool:
    """Roda a an├ílise em lote (v7 + nuvem) sobre os .jpg do disco."""
    import analisar
    marcar_estagio("analisar", "rodando")
    log.evento("analisar_iniciando", limite=limite)
    try:
        n = analisar.analisar(limite)
        marcar_estagio("analisar", "ok", detalhe=f"novos={n}")
        log.evento("analisar_terminou", novos=n)
        return True
    except Exception as e:
        marcar_estagio("analisar", "erro", detalhe=str(e)[:200])
        log.erro("analisar_falhou", mensagem=str(e))
        return False


def estagio_separar(log: LoggerOficina) -> bool:
    """Gera dataset-vN e CSV de revis├úo a partir das pontua├º├Áes."""
    import separar
    marcar_estagio("separar", "rodando")
    log.evento("separar_iniciando")
    try:
        resumo = separar.separar()
        marcar_estagio("separar", "ok",
                       detalhe=f"dataset v{resumo['versao']} "
                               f"({resumo['total']} itens)")
        log.evento("separar_terminou", **{k: v for k, v in resumo.items()
                                          if isinstance(v, (int, str))})
        return True
    except Exception as e:
        marcar_estagio("separar", "erro", detalhe=str(e)[:200])
        log.erro("separar_falhou", mensagem=str(e))
        return False


def cmd_status(_args) -> int:
    """Mostra o estado dos est├ígios e a trava (para o painel e o humano)."""
    import json
    print(json.dumps(resumo_estado(), ensure_ascii=False, indent=2))
    return 0


def _dispatch_estagios(estagios: list[str], args, log: LoggerOficina) -> bool:
    """Roda os est├ígios pedidos, em ordem. Devolve True se algum deu certo."""
    ok = True
    if "coletar" in estagios:
        ok = estagio_coletar(args.tipo, args.limite, log) or ok
    if "analisar" in estagios:
        ok = estagio_analisar(args.limite_analise, log) or ok
    if "separar" in estagios:
        ok = estagio_separar(log) or ok
    return ok


def cmd_rodar(args) -> int:
    """Roda um ou todos os est├ígios, com trava de inst├óncia."""
    estagios = list(ESTAGIOS) if args.estagio == "todos" else [args.estagio]
    # O painel ├® servidor ÔÇö quem o dispara ├® o oficina painel, n├úo aqui.
    estagios = [e for e in estagios if e != "painel"]
    if not estagios:
        print("nada a rodar")
        return 0

    trava = adquirir_trava(quem="oficina-cli")
    if trava is None:
        print("OUTRA oficina est├í rodando (trava ativa). Abortando.",
              file=sys.stderr)
        return 2
    log = LoggerOficina(_LOG, estagio="oficina")
    try:
        return 0 if _dispatch_estagios(estagios, args, log) else 1
    finally:
        log.fechar()
        liberar_trava()


def montar_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="comando", required=True)

    p_status = sub.add_parser("status", help="mostra estado e trava")
    p_status.set_defaults(fun=cmd_status)

    p_rodar = sub.add_parser("rodar", help="roda est├ígios da esteira")
    p_rodar.add_argument("--estagio", default="todos",
                         choices=list(ESTAGIOS) + ["todos"])
    p_rodar.add_argument("--tipo", default="negativo",
                         choices=["positivo", "negativo", "ambos"])
    p_rodar.add_argument("--limite", type=int, default=10,
                         help="recortes a coletar")
    p_rodar.add_argument("--limite-analise", type=int, default=None,
                         help="recortes a analisar (padr├úo: todos os pendentes)")
    p_rodar.set_defaults(fun=cmd_rodar)
    return ap


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = montar_parser().parse_args(argv)
    return args.fun(args)


if __name__ == "__main__":
    raise SystemExit(main())
