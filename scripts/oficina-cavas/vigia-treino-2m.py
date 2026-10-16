#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Vigia o GitHub e dispara o treino 2m quando um commit diz respeito a ele.

Fluxo pedido (15/10): o home-pc sobe o manifesto dos recortes 2m
(checkpoint-2m.jsonl) via commit — sem Blob (não estava funcionando). Aqui,
ao LIGAR e em ciclos, o vigia:
  1. git fetch origin
  2. olha os commits novos desde a última vez;
  3. se algum toca as cavas 2m (caminho com "2m"/"cavas-2m"/"recortes-finos"/
     "banco-anm", ou a mensagem fala de cava/2m/recorte), é "sobre isso";
  4. se for, roda o treino de alta resolução (treinar-cavas-2m.py), que por si
     só ADIA quando falta dado limpo — então disparar cedo não faz nada errado.

O corte PAN é determinístico (mesmo centroide -> mesma cena -> mesmo pixel),
então o desktop REGERA os PNGs que o home-pc marcou como ok, sem transferir
imagem. --regenerar faz isso antes de treinar.

Retomável: guarda o último SHA visto em cavas-2m/vigia-state.json.

Uso:
  python scripts/oficina-cavas/vigia-treino-2m.py --once        # roda um ciclo
  python scripts/oficina-cavas/vigia-treino-2m.py               # loop (intervalo)
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path

_RC = Path(__file__).resolve().parents[2]
_ESTADO = _RC / "scripts" / ".cache" / "cavas-2m" / "vigia-state.json"
_TREINO = _RC / "scripts" / "oficina-cavas" / "treinar-cavas-2m.py"
_REGEN = _RC / "scripts" / "oficina-cavas" / "gerar-recortes-2m-rotulados.py"
_MANIFESTO_LOCAL = _RC / "scripts" / "dados" / "cavas-2m" / "checkpoint-2m.jsonl"
_GIT = ["git", "-C", str(_RC)]

# O ÚNICO gatilho: um commit que mexe no manifesto dos recortes 2m (a lista de
# hashes cortados que o home-pc sobe). Código, doc e CI NÃO disparam treino —
# lição do teste pequeno (15/10): regra ampla demais esquentava a GPU à toa.
_MANIFESTO = "scripts/dados/cavas-2m/checkpoint-2m.jsonl"
_PADRAO_CAMINHO = re.compile(re.escape(_MANIFESTO))


def _git(args: list[str]) -> str:
    r = subprocess.run(_GIT + args, capture_output=True, text=True)
    return r.stdout.strip()


def _ultima_vista() -> str:
    if _ESTADO.exists():
        try:
            return json.loads(_ESTADO.read_text(encoding="utf-8")).get("sha", "")
        except json.JSONDecodeError:
            return ""
    return ""


def _salvar_vista(sha: str) -> None:
    _ESTADO.parent.mkdir(parents=True, exist_ok=True)
    _ESTADO.write_text(json.dumps({"sha": sha}), encoding="utf-8")


def _commits_novos(desde: str, atual: str) -> list[str]:
    if not desde:
        return [atual]
    saida = _git(["rev-list", f"{desde}..{atual}"])
    return saida.splitlines() if saida else []


def _eh_relevante(sha: str) -> bool:
    """Só relevante se o commit toca o manifesto 2m (caminho exato)."""
    arquivos = _git(["show", "--name-only", "--pretty=format:", sha])
    return bool(_PADRAO_CAMINHO.search(arquivos))


def _trazer_manifesto() -> None:
    """Traz só o arquivo do manifesto de origin/main p/ o disco (sem mesclar o resto)."""
    _git(["checkout", "origin/main", "--", _MANIFESTO])


def _regenerar() -> None:
    """Regera os 2m de QUEM quer que tenha publicado (lista->pixel determinístico).

    Dois passes: `manifesto` corta o que a OUTRA máquina publicou e eu ainda
    não tenho; `calib` cobre os meus próprios negativos/positivos locais. Ambos
    só processam hash não-feito, então não há corte repetido.
    """
    _trazer_manifesto()
    for fonte in ("manifesto", "calib"):
        print(f"  regera 2m (fonte {fonte})...", flush=True)
        subprocess.run(
            [sys.executable, str(_REGEN), "--fonte", fonte, "--workers", "2"],
            cwd=_RC)


def _treinar(min_entradas: int) -> None:
    print(f"  roda treino 2m (min={min_entradas})...", flush=True)
    subprocess.run([sys.executable, str(_TREINO), "--min", str(min_entradas)],
                   cwd=_RC)


def _commits_desde(atual: str, n: int) -> list[str]:
    saida = _git(["rev-list", "-n", str(n), atual])
    return saida.splitlines() if saida else []


def historico(n: int = 15) -> int:
    """SÓ MOSTRA a classificação dos últimos N commits. Não age. Teste pequeno."""
    atual = _git(["rev-parse", "origin/main"])
    print(f"avaliando {n} commits de origin/main ({atual[:8]}):\n")
    for sha in _commits_desde(atual, n):
        curto = _git(["show", "-s", "--pretty=%h %s", sha])
        alvo = "DISPARA " if _eh_relevante(sha) else "ignora "
        print(f"  [{alvo}] {curto}")
    return 0


def um_ciclo(regenerar: bool, min_entradas: int, dry: bool = False) -> bool:
    """Um ciclo: fetch + classifica + age. Devolve True se disparou treino.

    dry=True só LOGA a decisão e não regenera nem treina (teste seguro).
    """
    _git(["fetch", "origin"])
    atual = _git(["rev-parse", "origin/main"])
    antigos = _commits_novos(_ultima_vista(), atual)
    relevantes = [c for c in antigos if _eh_relevante(c)]
    _agir(relevantes, len(antigos), (regenerar, min_entradas, dry))
    if not dry:
        _salvar_vista(atual)
    return bool(relevantes)


def _agir(relevantes, n_novos, cfg) -> None:
    """Decide e executa (ou só loga, em dry). Sem agir se nada é relevante."""
    regenerar, min_entradas, dry = cfg
    if not relevantes:
        print(f"sem commit de cava 2m novo ({n_novos} commits, nada toca)",
              flush=True)
        return
    print(f"commit 2m novo: {len(relevantes)}/{n_novos} relevantes", flush=True)
    if dry:
        print("  [dry-run] teria: regerado PNG + rodado treino. Nada feito.",
              flush=True)
        return
    if regenerar:
        _regenerar()
    _treinar(min_entradas)


def main() -> int:
    ap = argparse.ArgumentParser(description="Vigia commits e dispara treino 2m")
    ap.add_argument("--once", action="store_true", help="roda um ciclo e sai")
    ap.add_argument("--historico", type=int, metavar="N",
                    help="só classifica os N últimos commits e sai (teste)")
    ap.add_argument("--dry-run", action="store_true",
                    help="decide e loga, mas NÃO regera nem treina")
    ap.add_argument("--intervalo", type=int, default=600,
                    help="segundos entre ciclos no modo loop")
    ap.add_argument("--sem-regenerar", action="store_true",
                    help="não regera PNG antes de treinar (usa o que já há)")
    ap.add_argument("--min", type=int, default=60,
                    help="mínimo de entradas limpas p/ o treino não adiar")
    args = ap.parse_args()

    if args.historico:
        return historico(args.historico)

    regenerar = not args.sem_regenerar
    if args.once:
        um_ciclo(regenerar, args.min, dry=args.dry_run)
        return 0
    while True:
        try:
            um_ciclo(regenerar, args.min, dry=args.dry_run)
        except Exception as e:
            print(f"  ciclo falhou (sigo vivo): {type(e).__name__}: {e}", flush=True)
        time.sleep(args.intervalo)


if __name__ == "__main__":
    sys.exit(main())
