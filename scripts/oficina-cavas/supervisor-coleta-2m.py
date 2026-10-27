#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Supervisor da coleta 2 m: roda no logon e para no G1.

Por que existe (medido 20/10): a coleta de positivos 2 m dependia de alguém
lembrar de rodar. As tarefas de 4 h existentes eram de negativos 8 m e uma
apontava para um .cmd que não existe. Este supervisor:
  1. toma um lock próprio (um supervisor por máquina);
  2. conta os positivos limpos (status ok, nuvem <= 0.30) no checkpoint;
  3. enquanto estiver abaixo da meta (G1 = 300), roda o gerador em lotes de
     24 com 1 worker — o ritmo de 1-2 s por host;
  4. para quando a meta é atingida, quando não há mais pendente ou quando
     três ciclos seguidos não acrescentam nem uma linha (rede/INPE parado).

O gerador tem lock próprio, então uma execução manual simultânea não duplica
hash nem trunca PNG. O checkpoint é a fonte da retomada: reiniciar o PC não
perde o que já foi cortado.

Uso:
  python scripts/oficina-cavas/supervisor-coleta-2m.py
  python scripts/oficina-cavas/supervisor-coleta-2m.py --meta 300 --lote 24
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

_RC = Path(__file__).resolve().parents[2]
_SAIDA = _RC / "scripts" / ".cache" / "cavas-2m"
_CKPT = _SAIDA / "checkpoint-2m.jsonl"
_LOCK = _SAIDA / "supervisor.lock"
_GERADOR = _RC / "scripts" / "oficina-cavas" / "gerar-recortes-2m-rotulados.py"
NUVEM_MAX = 0.30


def _pid_vivo(pid: int) -> bool:
    if pid <= 0:
        return False
    try:
        import psutil
        return psutil.pid_exists(pid) and psutil.Process(pid).is_running()
    except Exception:
        return True


def _trava_estrangeira(pid: int) -> bool:
    """True se o PID do lock é de outro processo vivo."""
    return bool(pid) and pid != os.getpid() and _pid_vivo(pid)


def _adquirir() -> bool:
    """Um supervisor por cache; trava órfã (PID morto) é reciclada."""
    if _LOCK.exists():
        try:
            pid = int(json.loads(_LOCK.read_text(encoding="utf-8")).get("pid", 0))
        except (OSError, ValueError, json.JSONDecodeError):
            pid = 0
        if _trava_estrangeira(pid):
            return False
    _LOCK.parent.mkdir(parents=True, exist_ok=True)
    _LOCK.write_text(json.dumps({"pid": os.getpid(), "ts": time.time()}),
                     encoding="utf-8")
    return True


def _liberar() -> None:
    try:
        if _LOCK.exists():
            dados = json.loads(_LOCK.read_text(encoding="utf-8"))
            if int(dados.get("pid", -1)) == os.getpid():
                _LOCK.unlink()
    except (OSError, ValueError, json.JSONDecodeError):
        pass


def _linhas() -> list[dict]:
    if not _CKPT.exists():
        return []
    out = []
    for linha in _CKPT.read_text(encoding="utf-8").splitlines():
        if not linha.strip():
            continue
        try:
            out.append(json.loads(linha))
        except json.JSONDecodeError:
            continue
    return out


def _limpa_positiva(o: dict) -> bool:
    return (o.get("status") == "ok" and o.get("label") == 1
            and (o.get("nuvem") or 0) <= NUVEM_MAX and bool(o.get("hash")))


def _limpos(linhas: list[dict]) -> int:
    """Positivos limpos por HASH único (linhas duplicadas não contam)."""
    return len({o["hash"] for o in linhas if _limpa_positiva(o)})


def _um_lote(lote: int, workers: int) -> int:
    print(f"  lote de {lote} positivos (workers={workers})...", flush=True)
    r = subprocess.run(
        [sys.executable, str(_GERADOR), "--fonte", "calib",
         "--tipo", "positivo", "--limite", str(lote),
         "--workers", str(workers)],
        cwd=_RC)
    return r.returncode


_TEXTO_PARADA = {
    "meta": "G1 atingido; supervisor para.",
    "parado": "sem progresso; confira rede/INPE. Supervisor para.",
}


def _motivo_parada(limpos: int, meta: int, parado: int,
                   max_parado: int) -> str:
    if limpos >= meta:
        return "meta"
    if parado >= max_parado:
        return "parado"
    return ""


def _proximo_parado(antes: int, depois: int, parado: int) -> int:
    return 0 if depois > antes else parado + 1


def main() -> int:
    ap = argparse.ArgumentParser(description="Supervisor da coleta 2 m")
    ap.add_argument("--meta", type=int, default=300,
                    help="positivos limpos para parar (G1)")
    ap.add_argument("--lote", type=int, default=24)
    ap.add_argument("--workers", type=int, default=1)
    ap.add_argument("--intervalo", type=int, default=60,
                    help="segundos entre lotes")
    ap.add_argument("--max-parado", type=int, default=3,
                    help="ciclos sem linha nova antes de desistir")
    args = ap.parse_args()

    if not _adquirir():
        print("outro supervisor 2m está rodando; saindo", flush=True)
        return 0
    try:
        parado = 0
        while True:
            linhas = _linhas()
            limpos = _limpos(linhas)
            print(f"positivos limpos: {limpos}/{args.meta}", flush=True)
            motivo = _motivo_parada(limpos, args.meta, parado,
                                    args.max_parado)
            if motivo:
                print(_TEXTO_PARADA[motivo], flush=True)
                return 0 if motivo == "meta" else 1
            antes = len(linhas)
            rc = _um_lote(args.lote, args.workers)
            depois = len(_linhas())
            parado = _proximo_parado(antes, depois, parado)
            if parado:
                print(f"sem linha nova ({parado}/{args.max_parado})",
                      flush=True)
            if rc != 0:
                print(f"lote saiu rc={rc}; tento de novo após {args.intervalo}s",
                      flush=True)
            time.sleep(args.intervalo)
    finally:
        _liberar()


if __name__ == "__main__":
    sys.exit(main())
