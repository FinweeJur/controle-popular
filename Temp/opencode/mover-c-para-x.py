import json
import shutil
import subprocess
from pathlib import Path

RAIZ_C = Path("C:/Users/teste")
X_ROOT = Path("X:/DevCoder")
BACKUP = X_ROOT / "_backup-git"
DIRTY = BACKUP / "dirty-users-teste-20261018"
LEGADO = X_ROOT / "_legado" / "C-users-teste-20261018"

NOMES = [
    "agitprop", "agitprop-multicidade", "bh-cultural", "bh-turismo-app",
    "despacho", "foz-growth", "foz-juris", "foz-juris-online", "hermes-agent",
    "jarvis", "labiia_lex", "odysseus", "odysseus-pt", "sementeira", "skills",
    "terras-devolutas.OLD-20260728", "Vaire", "ZCodeProject",
    "controlador-financeiro",
]

BACKUP.mkdir(parents=True, exist_ok=True)


def rodar(args, cwd=None):
    return subprocess.run(args, cwd=cwd, capture_output=True, text=True, errors="replace")


resultados = []
for nome in NOMES:
    origem = RAIZ_C / nome
    if not origem.exists():
        resultados.append({"nome": nome, "acao": "ausente"})
        continue

    destino_x = X_ROOT / nome
    if nome.endswith(".OLD-20260728"):
        destino_x = X_ROOT / nome.replace(".OLD-20260728", "")

    e_git = (origem / ".git").exists()
    dirty = []
    if e_git:
        r = rodar(["git", "-C", str(origem), "status", "--porcelain"])
        dirty = [l for l in r.stdout.splitlines() if l.strip()]
        bundle = BACKUP / f"{nome.replace('.', '-')}-users-teste-20261018.bundle"
        rodar(["git", "-C", str(origem), "bundle", "create", str(bundle), "--all"])

    if destino_x.exists():
        # duplicata: guarda os arquivos sujos e remove a copia de C
        if dirty:
            for linha in dirty:
                rel = linha[3:].strip().strip('"')
                src = origem / rel
                if src.exists() and src.is_file():
                    dst = DIRTY / nome / rel
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src, dst)
        shutil.rmtree(origem, ignore_errors=True)
        resultados.append({"nome": nome, "acao": "removido-duplicata", "destino": str(destino_x), "dirty": len(dirty)})
    else:
        # sem equivalente em X: move inteiro
        destino = destino_x if e_git else (LEGADO / nome)
        destino.parent.mkdir(parents=True, exist_ok=True)
        r = rodar(["robocopy", str(origem), str(destino), "/E", "/MOVE", "/R:1", "/W:1", "/NFL", "/NDL", "/NJH", "/NJS"])
        resultados.append({"nome": nome, "acao": "movido", "destino": str(destino), "rc": r.returncode})

Path("Temp/opencode/mover-c-para-x.json").write_text(json.dumps(resultados, ensure_ascii=False, indent=2), encoding="utf-8")
for r in resultados:
    print(r)
