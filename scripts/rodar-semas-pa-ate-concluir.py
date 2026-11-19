"""Roda o coletor do SIMLAM-PA até o catálogo fechar, retomando do checkpoint.

Por que existe: a rodada completa leva ~14 h (11.598 páginas a 3 s) e o
coletor sozinho morre se o servidor devolver um 500 de EventValidation no
meio. Sem supervisor, a noite se perde a partir da página em que ele parou.

O checkpoint é do próprio coletor (`scripts/.cache/semas-pa/`): cada página
fechada é um chunk, e o `checkpoint.json` só recebe `concluido: true` quando
o pager chega ao fim do catálogo. Este supervisor não guarda estado próprio —
pergunta ao checkpoint se o trabalho terminou e, se não, chama o coletor de
novo, que retoma do primeiro chunk faltando.

  python scripts/rodar-semas-pa-ate-concluir.py
  python scripts/rodar-semas-pa-ate-concluir.py --tentativas 3
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CHECKPOINT = RAIZ / "scripts" / ".cache" / "semas-pa" / "checkpoint.json"
TRAVA = RAIZ / "scripts" / ".cache" / "semas-pa" / "rodando.lock"
CMD = [sys.executable, "scripts/coletar-semas-pa-licencas.py", "--empreendimentos"]
ESPERA_S = 120


def _pid_vivo(pid: int) -> bool:
    """True se o processo existe.

    NÃO use `os.kill(pid, 0)` aqui: no Windows o Python repassa isso para
    `TerminateProcess`, ou seja, checar a vida MATARIA o coletor que já está
    rodando. `OpenProcess` só pergunta."""
    import ctypes
    PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
    h = ctypes.windll.kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
    if not h:
        return False
    ctypes.windll.kernel32.CloseHandle(h)
    return True


def _outra_instancia() -> bool:
    """Trava de instância: o agendador pode disparar de novo antes de a
    anterior terminar, e dois coletores no mesmo host furam o ritmo de 3 s."""
    try:
        pid = int(TRAVA.read_text(encoding="utf-8").split()[0])
    except Exception:
        return False
    if _pid_vivo(pid):
        print(f"[supervisor] já roda no PID {pid} — esta instância sai")
        return True
    TRAVA.unlink(missing_ok=True)  # trava órfã de execução que morreu
    return False


def concluido() -> bool:
    try:
        return bool(json.loads(CHECKPOINT.read_text(encoding="utf-8")).get("concluido"))
    except Exception:
        return False


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tentativas", type=int, default=12,
                        help="quantas vezes reabrir a coleta (default: 12)")
    args = parser.parse_args()

    for tentativa in range(1, args.tentativas + 1):
        if concluido():
            print(f"[supervisor] catálogo completo na tentativa {tentativa - 1}")
            return
        if _outra_instancia():
            return
        TRAVA.parent.mkdir(parents=True, exist_ok=True)
        TRAVA.write_text(f"{os.getpid()} {datetime.now(timezone.utc).isoformat()}",
                         encoding="utf-8")
        print(f"[supervisor] tentativa {tentativa}/{args.tentativas}", flush=True)
        try:
            codigo = subprocess.run(CMD, cwd=RAIZ).returncode
        finally:
            TRAVA.unlink(missing_ok=True)
        if concluido():
            print("[supervisor] catálogo completo")
            return
        print(f"[supervisor] coletor saiu com {codigo}; retomando do checkpoint "
              f"em {ESPERA_S}s", flush=True)
        time.sleep(ESPERA_S)
    print("[supervisor] tentativas esgotadas — o checkpoint está preservado, "
          "rodar de novo retoma de onde parou")
    sys.exit(1)


if __name__ == "__main__":
    main()
