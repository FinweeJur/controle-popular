import importlib.util
import os
import subprocess
import sys
from pathlib import Path

RAIZ = Path(r"C:\DevCoder\controle-popular")
for nome, caminho in [
    ("semas", RAIZ / "scripts" / "rodar-semas-pa-ate-concluir.py"),
    ("simlam", RAIZ / "scripts" / "coletar-semas-pa-licencas.py"),
]:
    spec = importlib.util.spec_from_file_location(nome, caminho)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    if nome == "semas":
        sup = m

# 1. pid próprio é vivo
assert sup._pid_vivo(os.getpid()) is True, "pid atual deveria estar vivo"

# 2. pid inexistente não é vivo (e não mata nada)
assert sup._pid_vivo(999999) is False, "pid 999999 não deveria existir"

# 3. trava órfã (pid morto) é descartada
sup.TRAVA.parent.mkdir(parents=True, exist_ok=True)
sup.TRAVA.write_text("999999 x", encoding="utf-8")
assert sup._outra_instancia() is False, "trava órfã deveria ser descartada"
assert not sup.TRAVA.exists(), "trava órfã deveria ter sido removida"

# 4. trava viva bloqueia segunda instância
sup.TRAVA.write_text(f"{os.getpid()} agora", encoding="utf-8")
assert sup._outra_instancia() is True, "trava viva deveria bloquear"
sup.TRAVA.unlink(missing_ok=True)
print("ok trava de instância")
