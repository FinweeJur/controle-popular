#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Supervisor de retreino e calibração do modelo 2 m.

Por que existe (20/10): o vigia só treinava quando um commit tocava o
manifesto publicado. Os negativos difíceis são cortados no cache local e não
passam por commit; sem um gatilho local, o modelo ficava velho. Este
supervisor:
  1. conta os recortes limpos (status ok, nuvem <= 0,30, hash único);
  2. espera `--min-novos` recortes novos desde o último treino e `--min-pos`
     positivos limpos;
  3. roda o treino no split congelado (`--recorte 224`), depois a calibração;
  4. salva o estado, copia os artefatos com carimbo e avisa no Telegram.

O treino e a calibração são processos separados; o treinador tem lock próprio,
então o vigia e o supervisor não escrevem `melhor.pt` ao mesmo tempo. O
supervisor tem lock próprio para não duplicar o loop.

Uso:
  python scripts/oficina-cavas/supervisor-treino-2m.py --max-ciclos 1
  python scripts/oficina-cavas/supervisor-treino-2m.py
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

_RC = Path(__file__).resolve().parents[2]
_DADOS = _RC / "scripts" / ".cache" / "cavas-2m"
_CKPT = _DADOS / "checkpoint-2m.jsonl"
_LOCK = _DADOS / "supervisor-treino.lock"
_ESTADO = _DADOS / "treino-2m-estado.json"
_TREINO = _RC / "scripts" / "oficina-cavas" / "treinar-cavas-2m.py"
_CALIB = _RC / "scripts" / "oficina-cavas" / "calibrar-2m.py"
_SAIDA = Path.home() / "AppData" / "Local" / "Temp" / "opencode" / "cavas" / "treino-2m"
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
    return bool(pid) and pid != os.getpid() and _pid_vivo(pid)


def _adquirir() -> bool:
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


def _linha_limpa(o: dict) -> bool:
    if o.get("status") != "ok" or o.get("label") is None:
        return False
    if (o.get("nuvem") or 0) > NUVEM_MAX:
        return False
    return bool(o.get("hash"))


def _mais_limpo(novo: dict, atual: dict | None) -> bool:
    if atual is None:
        return True
    return (novo.get("nuvem") or 1) < (atual.get("nuvem") or 1)


def _contagens() -> tuple[int, int, int]:
    """(positivos, negativos, total) limpos, com hash único."""
    if not _CKPT.exists():
        return 0, 0, 0
    vistos = {}
    for linha in _CKPT.read_text(encoding="utf-8").splitlines():
        try:
            o = json.loads(linha)
        except json.JSONDecodeError:
            continue
        if not _linha_limpa(o):
            continue
        h = o["hash"]
        if _mais_limpo(o, vistos.get(h)):
            vistos[h] = o
    pos = sum(1 for o in vistos.values() if o["label"] == 1)
    return pos, len(vistos) - pos, len(vistos)


def _ler_estado() -> dict:
    if not _ESTADO.exists():
        return {}
    try:
        return json.loads(_ESTADO.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def _salvar_estado(dados: dict) -> None:
    _ESTADO.parent.mkdir(parents=True, exist_ok=True)
    _ESTADO.write_text(json.dumps(dados, indent=2, ensure_ascii=False),
                       encoding="utf-8")


def _treino_ocupado() -> bool:
    lock = _SAIDA / "treino.lock"
    if not lock.exists():
        return False
    try:
        pid = int(json.loads(lock.read_text(encoding="utf-8")).get("pid", 0))
    except (OSError, ValueError, json.JSONDecodeError):
        return False
    return _trava_estrangeira(pid)


def _rodar(args: list[str]) -> int:
    r = subprocess.run(args, cwd=_RC)
    return r.returncode


def _resumo() -> dict:
    out = {}
    for nome, chave in (("metricas-2m.json", "treino"),
                        ("calibracao-2m.json", "calibracao")):
        p = _SAIDA / nome
        if p.exists():
            try:
                out[chave] = json.loads(p.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                out[chave] = {}
    return out


def _carimbo() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def _guardar_artefatos(carimbo: str) -> None:
    for nome in ("melhor.pt", "metricas-2m.json", "calibracao-2m.json"):
        p = _SAIDA / nome
        if not p.exists():
            continue
        destino = _SAIDA / f"{p.stem}-{carimbo}{p.suffix}"
        try:
            shutil.copy2(p, destino)
        except OSError:
            pass


def _telegram(resumo: dict, carimbo: str) -> None:
    npx = shutil.which("npx.cmd") or shutil.which("npx")
    if not npx:
        return
    treino = resumo.get("treino", {})
    calib = resumo.get("calibracao", {})
    piso = calib.get("melhor_com_piso") or {}
    resumo_txt = (f"Retreino {carimbo}: F1 {treino.get('f1')} "
                  f"P {treino.get('precisao')} R {treino.get('recall')}. "
                  f"P>={calib.get('piso')}: "
                  f"limiar {piso.get('limiar')} R {piso.get('recall')}.")
    try:
        subprocess.run(
            [npx, "tsx", "bots/notifica-telegram.mts",
             "--titulo", "Cavas 2m - retreino automatico",
             "--resumo", resumo_txt, "--status", "concluido",
             "--emoji", "🤖"],
            cwd=_RC, timeout=180)
    except (OSError, subprocess.SubprocessError):
        pass


def _motivo_espera(pos: int, total: int, ultimo: int, args) -> str:
    if pos < args.min_pos:
        return f"pos={pos} < min_pos={args.min_pos}; aguardo"
    if total < ultimo + args.min_novos:
        return f"novos={total - ultimo} < min_novos={args.min_novos}; aguardo"
    if _treino_ocupado():
        return "outro treino 2m está rodando; aguardo"
    return ""


def _executar(args, total: int, estado: dict) -> dict:
    if _rodar([sys.executable, str(_TREINO), "--epocas", "6",
               "--min", str(args.min_pos), "--recorte", "224"]) != 0:
        print("treino saiu com erro; nao atualizo o estado", flush=True)
        return estado
    metricas = _resumo().get("treino", {})
    if metricas.get("adiado"):
        estado["ultimo_treino_limpos"] = total
        _salvar_estado(estado)
        print("treino adiado (dados insuficientes); aguardo", flush=True)
        return estado
    if _rodar([sys.executable, str(_CALIB)]) != 0:
        print("calibracao saiu com erro; estado nao atualizado", flush=True)
        return estado
    carimbo = _carimbo()
    _guardar_artefatos(carimbo)
    estado.update({"ultimo_treino_limpos": total, "treinado_em": carimbo,
                   "resumo": _resumo()})
    _salvar_estado(estado)
    print(f"treino+calibracao ok: {carimbo}", flush=True)
    if not args.sem_telegram:
        _telegram(estado["resumo"], carimbo)
    return estado


def _um_ciclo(args, estado: dict) -> dict:
    pos, neg, total = _contagens()
    print(f"limpos={total} (pos={pos} neg={neg})", flush=True)
    ultimo = estado.get("ultimo_treino_limpos")
    if ultimo is None:
        estado["ultimo_treino_limpos"] = total
        _salvar_estado(estado)
        print("estado inicial: aguardo recortes novos", flush=True)
        return estado
    motivo = _motivo_espera(pos, total, ultimo, args)
    if motivo:
        print(motivo, flush=True)
        return estado
    print(f"dispara treino: {total - ultimo} novos, {pos} pos", flush=True)
    return _executar(args, total, estado)


def main() -> int:
    ap = argparse.ArgumentParser(description="Supervisor de retreino 2 m")
    ap.add_argument("--min-novos", type=int, default=40)
    ap.add_argument("--min-pos", type=int, default=250)
    ap.add_argument("--intervalo", type=int, default=1200)
    ap.add_argument("--max-ciclos", type=int, default=0,
                    help="0 = infinito; use 1 para testar")
    ap.add_argument("--sem-telegram", action="store_true")
    args = ap.parse_args()
    if not _adquirir():
        print("outro supervisor de treino está rodando; saindo", flush=True)
        return 0
    try:
        estado = _ler_estado()
        ciclos = 0
        while True:
            estado = _um_ciclo(args, estado)
            ciclos += 1
            if args.max_ciclos and ciclos >= args.max_ciclos:
                return 0
            time.sleep(args.intervalo)
    finally:
        _liberar()


if __name__ == "__main__":
    sys.exit(main())
