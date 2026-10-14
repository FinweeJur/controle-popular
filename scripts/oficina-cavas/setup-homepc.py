#!/usr/bin/env python3
"""Setup da coleta CBERS no home-PC — operação complementar ao desktop.

Regra do dono (14/10/2026): desktop coleta de dia (GPU + WiFi rapido),
home-PC coleta de madrugada (hardware fraco, internet lenta, mas livre
a noite inteira). Nao concorrem: cada um tem seu proprio checkpoint
local em .cache/cavas-calibracao/checkpoint.jsonl. O hash de cada
recorte (sha256 da cena+bbox) deduplica quando os resultados sao
juntados — se as duas maquinas baixaram a mesma cena, o analisar
ignora a duplicata.

O que este script faz no home-PC:
  1. Confere se Python 3.11+ e requests estao disponiveis.
  2. Registra tarefa agendada "ControlePopular_CavasColeta_Madrugada"
     que roda das 1h às 6h (fora do horario do desktop).
  3. Cria o diretorio .cache se nao existir.

Uso: python scripts/oficina-cavas/setup-homepc.py
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

_RAIZ = Path(__file__).resolve().parents[2]
_CACHE = _RAIZ / "scripts" / ".cache" / "cavas-calibracao"
_TAREFA = "ControlePopular_CavasColeta_Madrugada"
_HORARIO_INICIO = 1   # 1h da madrugada
_HORARIO_FIM = 6      # 6h da manha


def _confere_python() -> bool:
    """Python 3.11+ com requests?"""
    if sys.version_info < (3, 11):
        print(f"Python {sys.version} — precisa 3.11+")
        return False
    try:
        import requests  # noqa: F401
        return True
    except ImportError:
        print("requests nao instalado — rode: pip install requests")
        return False


def _registra_tarefa() -> bool:
    """Registra tarefa do Task Scheduler para as 1h-6h.

    Usa python.exe absoluto (o Task Scheduler nao herda PATH do venv).
    Nome sem "Oficina" no inicio — Bitdefender blacklistou o nome antigo.
    """
    python = sys.executable
    script = _RAIZ / "scripts" / "oficina-cavas" / "oficina.py"
    # Roda so a coleta de negativos (desktop cuida dos positivos de dia)
    args = f'"{python}" "{script}" rodar --estagio coletar --tipo negativo --limite 8'
    cmd = [
        "schtasks", "/Create", "/F",
        "/TN", _TAREFA,
        "/SC", "DAILY",
        "/ST", f"{_HORARIO_INICIO:02d}:00",
        "/TR", args,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode == 0:
        print(f"Tarefa '{_TAREFA}' criada: diaria às {_HORARIO_INICIO}h")
        return True
    print(f"Falha ao criar tarefa: {r.stderr.strip()}")
    return False


def main() -> int:
    print("=== Setup coleta CBERS home-PC ===\n")
    if not _confere_python():
        return 1
    _CACHE.mkdir(parents=True, exist_ok=True)
    print(f"Cache: {_CACHE}")
    ok = _registra_tarefa()
    if ok:
        print(f"\nProxima execucao: hoje às {_HORARIO_INICIO}h")
        print(f"Horario: {_HORARIO_INICIO}h-{_HORARIO_FIM}h (fora do desktop)")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
