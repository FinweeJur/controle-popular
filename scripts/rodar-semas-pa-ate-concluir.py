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
import subprocess
import sys
import time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CHECKPOINT = RAIZ / "scripts" / ".cache" / "semas-pa" / "checkpoint.json"
CMD = [sys.executable, "scripts/coletar-semas-pa-licencas.py", "--empreendimentos"]
ESPERA_S = 120


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
        print(f"[supervisor] tentativa {tentativa}/{args.tentativas}", flush=True)
        codigo = subprocess.run(CMD, cwd=RAIZ).returncode
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
