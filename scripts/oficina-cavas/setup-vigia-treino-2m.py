#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Registra (ou testa) a tarefa do vigia de treino 2m neste PC.

Mesma receita do setup-homepc.py, que é o "agendador do projeto": Task
Scheduler + python.exe absoluto (o scheduler não herda o PATH do venv) + nome
SEM "Oficina"/"Coleta" no início (o Bitdefender já congelou tarefas com os
nomes antigos).

A tarefa chama `vigia-treino-2m.py` em modo loop: ao LOGAR neste PC ela sobe e
fica checando o GitHub, a cada intervalo; se um commit novo toca o MANIFESTO
dos recortes 2m, regera aqueles pixels (determinístico, centroide->cena->PAN)
e roda o treino de alta resolução. O treino por si só ADIA sem dado limpo
suficiente, então disparar cedo não treina nada torto.

O vigia NÃO faz git commit nem push, e NÃO faz deploy: só lê origin, regera e
treina no disco. Publicar/commitar é passo separado (humano).

Uso:
  python scripts/oficina-cavas/setup-vigia-treino-2m.py            # registrar
  python scripts/oficina-cavas/setup-vigia-treino-2m.py --consultar # só mostra
  python scripts/oficina-cavas/setup-vigia-treino-2m.py --testar    # roda 1x
  python scripts/oficina-cavas/setup-vigia-treino-2m.py --remover   # apaga
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

_RAIZ = Path(__file__).resolve().parents[2]
_VIGIA = _RAIZ / "scripts" / "oficina-cavas" / "vigia-treino-2m.py"
_TAREFA = "ControlePopular_VigiaTreino2m"  # sem "Oficina" (AV)
_INTERVALO_MIN = 30
_MIN_ENTRADAS = 250   # o treinador 2m ainda exige negativo; adia até haver par


def _rodar(args: list[str]) -> int:
    r = subprocess.run(args, capture_output=True, text=True)
    if r.stdout.strip():
        print(r.stdout.strip())
    if r.returncode and r.stderr.strip():
        print("ERRO:", r.stderr.strip())
    return r.returncode


def _comando() -> str:
    python = sys.executable
    return (f'"{python}" "{_VIGIA}" --intervalo {_INTERVALO_MIN * 60} '
            f'--min {_MIN_ENTRADAS}')


# Fallback sem elevação: pasta de Inicialização do USUÁRIO (roda ao logar,
# não precisa de admin nem de Task Scheduler). O Task Scheduler daqui está
# travado sem terminal elevado; shell:startup não.
_INICIO = (Path.home() / "AppData" / "Roaming" / "Microsoft"
           / "Windows" / "Start Menu" / "Programs" / "Startup")
_BAT = _INICIO / "ControlePopular_VigiaTreino2m.bat"


def _instalar_startup() -> int:
    _INICIO.mkdir(parents=True, exist_ok=True)
    conteudo = (f'@echo off\r\nstart "" {_comando()}\r\n')
    _BAT.write_text(conteudo, encoding="utf-8")
    print(f"OK: instalado em inicialização do usuário: {_BAT}")
    print(f"    checa origin a cada {_INTERVALO_MIN} min; treino --min "
          f"{_MIN_ENTRADAS}. Remove com --remover.")
    return 0


def consultar() -> int:
    return _rodar(["schtasks", "/Query", "/TN", _TAREFA, "/V", "/FO", "LIST"])


def registrar() -> int:
    # Tenta Task Scheduler (ONLOGON, roda como usuário). Se o Windows daqui
    # negar elevação, cai no fallback startup (sem admin).
    cmd = ["schtasks", "/Create", "/F", "/TN", _TAREFA, "/SC", "ONLOGON",
           "/TR", _comando()]
    if _rodar(cmd) == 0:
        print(f"OK: tarefa '{_TAREFA}' sobe ao logar (Task Scheduler).")
        return 0
    print("  Task Scheduler negado (falta admin) -> usando pasta Startup.\n")
    return _instalar_startup()


def testar() -> int:
    print("Rodando UM ciclo agora (--once --dry-run; não treina nem escreve):")
    return _rodar([sys.executable, str(_VIGIA), "--once", "--dry-run"])


def remover() -> int:
    _rodar(["schtasks", "/Delete", "/TN", _TAREFA, "/F"])
    if _BAT.exists():
        _BAT.unlink()
        print(f"removido: {_BAT}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Agenda o vigia de treino 2m")
    ap.add_argument("--consultar", action="store_true")
    ap.add_argument("--testar", action="store_true")
    ap.add_argument("--remover", action="store_true")
    args = ap.parse_args()
    if args.consultar:
        return consultar()
    if args.testar:
        return testar()
    if args.remover:
        return remover()
    return registrar()


if __name__ == "__main__":
    sys.exit(main())
