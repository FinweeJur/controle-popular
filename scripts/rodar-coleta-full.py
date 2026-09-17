"""rodar-coleta-full.py — executa coletores ambientais faltantes com
segurança: timeout por coletor, checkpoint automático (já nos scripts),
auto-commit + push ao final, reporte no Telegram.

Uso:
    python scripts/rodar-coleta-full.py                 # roda tudo
    python scripts/rodar-coleta-full.py --dry-run        # mostra o que faria
    python scripts/rodar-coleta-full.py --coletor sema-ma # roda só um

Coletores incluídos (os que faltam dados full):
    sema-ma    ~2.681 registros (DOEMA ES)          timeout 2h
    semad-go   ~3.745 registros (GeoNode WFS)       timeout 1h
    semas-pa   ~114.038 registros (ASP.NET)          timeout 12h
    ana        ~751.324 registros (ArcGIS REST)      timeout 6h

Cada coletor já tem checkpoint interno (resume em caso de crash).
Este script adiciona: timeout, auto-commit, reporte.
"""

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RAIZ = Path(__file__).resolve().parent.parent
DATA = RAIZ / "apps" / "web" / "data"
TELEGRAM = RAIZ / "scripts" / "passo-telegram.mts"

COLETORES = {
    "sema-ma": {
        "cmd": ["python", "scripts/coletar-sema-ma-licencas.py", "--limit", "0"],
        "timeout_s": 2 * 3600,  # 2h
        "arquivo": "sema-ma-licencas.json",
        "desc": "SEMA-MA (DOEMA ES, ~2.681 regs)",
    },
    "semad-go": {
        "cmd": ["python", "scripts/coletar-semad-go-licencas.py", "--limit", "0"],
        "timeout_s": 1 * 3600,  # 1h
        "arquivo": "semad-go-licencas.json",
        "desc": "SEMAD-GO (GeoNode WFS, ~3.745 regs)",
    },
    "semas-pa": {
        "cmd": ["python", "scripts/coletar-semas-pa-licencas.py", "--limit", "0"],
        "timeout_s": 12 * 3600,  # 12h
        "arquivo": "semas-pa-licencas.json",
        "desc": "SEMAS-PA (ASP.NET, ~114k regs, lento)",
    },
    "ana": {
        "cmd": ["python", "scripts/coletar-ana-outorgas.py", "--limit", "0"],
        "timeout_s": 6 * 3600,  # 6h
        "arquivo": "ana-outorgas.json",
        "desc": "ANA outorgas (ArcGIS REST, ~751k regs)",
    },
}


def telegram(msg: str) -> None:
    """Envia mensagem via passo-telegram.mts (silencioso se falhar)."""
    try:
        subprocess.run(
            ["npx", "tsx", str(TELEGRAM), msg],
            timeout=60, capture_output=True, cwd=RAIZ,
        )
    except Exception:
        pass


def tamanho_kb(arquivo: Path) -> int:
    return arquivo.stat().st_size // 1024 if arquivo.exists() else 0


def contar_linhas(arquivo: Path) -> int:
    """Conta registros no JSON (campo linhas)."""
    if not arquivo.exists():
        return 0
    try:
        # Usa node para JSON grande (Python pode travar em 150 MB)
        r = subprocess.run(
            ["node", "-e", f"const d=require('./{arquivo.relative_to(RAIZ).as_posix()}'); console.log(d.linhas?.length ?? 0)"],
            capture_output=True, text=True, timeout=60, cwd=RAIZ,
        )
        return int(r.stdout.strip() or 0)
    except Exception:
        return 0


def rodar_coletor(nome: str, cfg: dict, dry_run: bool = False) -> dict:
    """Roda um coletor com timeout. Retorna {ok, motivo, registros, kb}."""
    arquivo = DATA / cfg["arquivo"]
    antes_kb = tamanho_kb(arquivo)
    antes_regs = contar_linhas(arquivo)

    if dry_run:
        print(f"  [dry-run] {cfg['desc']}: pularia")
        return {"ok": True, "motivo": "dry-run", "registros": antes_regs, "kb": antes_kb}

    print(f"\n{'='*60}")
    print(f"  COLETOR: {cfg['desc']}")
    print(f"  Timeout: {cfg['timeout_s'] // 3600}h")
    print(f"  Antes: {antes_regs:,} registros ({antes_kb:,} KB)")
    print(f"{'='*60}")

    inicio = time.time()
    try:
        resultado = subprocess.run(
            cfg["cmd"],
            cwd=RAIZ,
            timeout=cfg["timeout_s"],
            capture_output=True,
            text=True,
        )
        elapsed = time.time() - inicio
        stdout = resultado.stdout or ""
        stderr = resultado.stdout or ""

        # Últimas linhas do output
        linhas_output = (stdout + stderr).strip().split("\n")
        ultimas = "\n".join(linhas_output[-5:])

        if resultado.returncode == 0:
            depois_kb = tamanho_kb(arquivo)
            depois_regs = contar_linhas(arquivo)
            print(f"  ✅ OK ({elapsed/60:.0f} min)")
            print(f"  {ultimas}")
            return {
                "ok": True,
                "motivo": "concluido",
                "registros": depois_regs,
                "kb": depois_kb,
                "elapsed_s": elapsed,
            }
        else:
            print(f"  ⚠️  Exit code {resultado.returncode}")
            print(f"  {ultimas}")
            depois_kb = tamanho_kb(arquivo)
            depois_regs = contar_linhas(arquivo)
            return {
                "ok": False,
                "motivo": f"exit-{resultado.returncode}",
                "registros": depois_regs,
                "kb": depois_kb,
                "elapsed_s": elapsed,
            }

    except subprocess.TimeoutExpired:
        elapsed = time.time() - inicio
        depois_kb = tamanho_kb(arquivo)
        depois_regs = contar_linhas(arquivo)
        print(f"  ⏱️  TIMEOUT após {elapsed/60:.0f} min")
        print(f"  Progresso salvo via checkpoint: {depois_regs:,} registros ({depois_kb:,} KB)")
        return {
            "ok": False,
            "motivo": "timeout",
            "registros": depois_regs,
            "kb": depois_kb,
            "elapsed_s": elapsed,
        }

    except Exception as e:
        elapsed = time.time() - inicio
        depois_kb = tamanho_kb(arquivo)
        depois_regs = contar_linhas(arquivo)
        print(f"  ❌ Erro: {e}")
        return {
            "ok": False,
            "motivo": str(e),
            "registros": depois_regs,
            "kb": depois_kb,
            "elapsed_s": elapsed,
        }


def auto_commit(resultados: dict[str, dict]) -> bool:
    """Commit automático dos arquivos que mudaram. Retorna True se commitou."""
    arquivos_mudaram = []
    for nome, r in resultados.items():
        if r.get("registros", 0) > 0:
            arq = DATA / COLETORES[nome]["arquivo"]
            if arq.exists():
                arquivos_mudaram.append(str(arq.relative_to(RAIZ)))

    if not arquivos_mudaram:
        print("\n  Nenhum arquivo novo para commitar.")
        return False

    # git add
    subprocess.run(["git", "add"] + arquivos_mudaram, cwd=RAIZ, capture_output=True)

    # Monta mensagem
    partes = []
    for nome, r in resultados.items():
        cfg = COLETORES[nome]
        status = "✅" if r.get("ok") else "⚠️"
        partes.append(f"- {cfg['desc']}: {status} {r.get('registros', 0):,} regs ({r.get('kb', 0):,} KB)")

    msg = f"Coleta full ambiental ({datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')})\n\n"
    msg += "\n".join(partes)
    msg += "\n\nCo-Authored-By: opencode <noreply@opencode.ai>"

    msg_file = RAIZ / "scripts" / ".cache" / "msg-coleta-full.txt"
    msg_file.parent.mkdir(parents=True, exist_ok=True)
    msg_file.write_text(msg, encoding="utf-8")

    r = subprocess.run(
        ["git", "commit", "--only"] + arquivos_mudaram + ["-F", str(msg_file)],
        cwd=RAIZ, capture_output=True, text=True,
    )
    if r.returncode == 0:
        print(f"\n  📦 Commit: {r.stdout.strip().split(chr(10))[0]}")
        # Push
        rp = subprocess.run(
            ["git", "push", "origin", "HEAD:main"],
            cwd=RAIZ, capture_output=True, text=True, timeout=600,
        )
        if rp.returncode == 0:
            print("  🚀 Push OK")
            return True
        else:
            print(f"  ⚠️  Push falhou: {(rp.stderr or rp.stdout).strip()[-200:]}")
            return False
    else:
        print(f"\n  ⚠️  Commit falhou: {r.stderr.strip()[-200:]}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Coleta full ambiental com segurança")
    parser.add_argument("--dry-run", action="store_true", help="Não executa, só mostra")
    parser.add_argument("--coletor", choices=list(COLETORES.keys()), help="Roda só um")
    args = parser.parse_args()

    alvos = [args.coletor] if args.coletor else list(COLETORES.keys())

    print(f"Coleta full ambiental — {len(alvos)} coletor(es)")
    print(f"Início: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")

    telegram(f"🔄 Coleta full iniciada: {', '.join(alvos)}")

    resultados = {}
    for nome in alvos:
        cfg = COLETORES[nome]
        r = rodar_coletor(nome, cfg, dry_run=args.dry_run)
        resultados[nome] = r

        # Reporta por coletor
        status = "✅" if r.get("ok") else "⚠️"
        telegram(
            f"{status} {cfg['desc']}: {r.get('registros', 0):,} regs "
            f"({r.get('kb', 0):,} KB) — {r.get('motivo', '?')} "
            f"em {r.get('elapsed_s', 0)/60:.0f}min"
        )

    # Resumo
    print(f"\n{'='*60}")
    print("RESUMO:")
    total_regs = 0
    for nome, r in resultados.items():
        cfg = COLETORES[nome]
        ok = "✅" if r.get("ok") else "⚠️"
        regs = r.get("registros", 0)
        total_regs += regs
        print(f"  {ok} {cfg['desc']}: {regs:,} regs")
    print(f"  Total: {total_regs:,} registros")

    # Auto-commit (só se não dry-run)
    if not args.dry_run:
        print("\nAuto-commit...")
        commitou = auto_commit(resultados)
    else:
        commitou = False

    # Reporte final
    resumo_parts = []
    for nome, r in resultados.items():
        cfg = COLETORES[nome]
        ok = "✅" if r.get("ok") else "⚠️"
        resumo_parts.append(f"{ok} {cfg['desc']}: {r.get('registros', 0):,}")
    resumo = " | ".join(resumo_parts)
    push_msg = " 🚀 pushado" if commitou else " (commit pendente)"
    telegram(f"📊 Coleta full concluída:{push_msg}\n{resumo}")

    print(f"\nFim: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")


if __name__ == "__main__":
    main()
