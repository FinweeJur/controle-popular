"""Trava de inst├óncia e estado dos est├ígios da Oficina de Cavas.

Dois problemas concretos que j├í custaram tempo neste repo (AGENTS ┬º5.4):
1. duas sess├Áes/processos brigando pelo mesmo checkpoint de cavas ÔÇö dois
   `next build` no mesmo `.next` j├í produziram verifica├º├úo errada em 15/08;
2. trabalho perdido em suspend/kill porque ningu├®m sabia em que p├® estava.

Este m├│dulo resolve os dois com pouco c├│digo:

- TRAVA: um lockfile no cache que guarda o PID do processo dono. Se o
  lockfile existe e o PID ainda est├í vivo, outro processo recusa a rodar.
  Se o PID morreu (PC suspensou, processo foi morto), a trava ├® "├│rf├ú" e ├®
  tomada de volta. ├ë a mesma ideia de um lock de arquivo, mas com PID para
  detectar o caso comum de PC que dormiu no meio.

- ESTADO: um JSON pequeno que guarda em que p├® est├í cada est├ígio
  (coletar/analyse/etc). Sobrevive a suspend porque ├® gravado a cada
  mudan├ºa, com escrita at├┤mica (tmp + replace) ÔÇö nunca fica meio escrito.

Nada aqui fala com rede nem com imagem: ├® s├│ processo e disco. Por isso o
m├│dulo ├® stdlib puro e test├ível sem rasterio.
"""
from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path

# Onde a trava e o estado moram: no cache de cavas, versionado no .gitignore.
# Um caminho fixo por repo (relativo ├á raiz detectada) ÔÇö se fosse por CWD,
# dois terminais em pastas diferentes dariam duas travas falsas.
_RAIZ = Path(__file__).resolve().parents[2]
_CACHE = _RAIZ / "scripts" / ".cache" / "cavas-calibracao"
_LOCK = _CACHE / "oficina.lock"
_ESTADO = _CACHE / "oficina-estado.json"

# Est├ígios da esteira, na ordem em que rodam.
ESTAGIOS = ("coletar", "analisar", "separar", "painel")


def _agora_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _pid_vivo(pid: int) -> bool:
    """True se o PID existe e ├® nosso. No Windows, os sinais s├úo limitados,
    ent├úo usamos psutil se dispon├¡vel; sem ele, assume vivo (trava segura:
    pior caso ├® o usu├írio matar ├á m├úo o processo antigo)."""
    if pid <= 0:
        return False
    try:
        import psutil
        return psutil.pid_exists(pid) and psutil.Process(pid).is_running()
    except Exception:
        # Sem psutil n├úo arriscamos derrubar trava de um processo vivo.
        return True


def _trava_estrangeira(pid: int) -> bool:
    """True se o PID da trava ├® de OUTRO processo vivo (n├úo nosso).

    Extra├¡do de adquirir_trava para baixar a complexidade condicional:
    tr├¬s condi├º├Áes (pid>0, vivo, !=eu) viram uma fun├º├úo nomeada, mais
    leg├¡vel e test├ível.
    """
    return bool(pid) and _pid_vivo(pid) and pid != os.getpid()


def adquirir_trava(quem: str = "") -> Path | None:
    """Tenta tomar a trava de inst├óncia. Devolve o caminho do lock ou None.

    None significa "outro processo est├í rodando a oficina" ÔÇö o chamador deve
    abortar com mensagem clara, n├úo insistir. Se a trava anterior ├® ├│rf├ú
    (PID morto), ela ├® tomada de volta e a fun├º├úo devolve o caminho.
    """
    _CACHE.mkdir(parents=True, exist_ok=True)
    if _LOCK.exists():
        try:
            dados = json.loads(_LOCK.read_text(encoding="utf-8"))
            pid = int(dados.get("pid", 0))
        except (OSError, ValueError, json.JSONDecodeError):
            pid = 0
        if _trava_estrangeira(pid):
            return None  # outro processo de verdade est├í no comando
        # Trava ├│rf├ú (PID morto) ou corrompida: tomamos de volta.
    _LOCK.write_text(
        json.dumps({"pid": os.getpid(), "quem": quem, "ts": _agora_iso()}),
        encoding="utf-8",
    )
    return _LOCK


def liberar_trava() -> None:
    """Remove a trava se ela for nossa. Chamada em finally/finally de cada
    est├ígio ÔÇö se o processo morrer sem finally, a trava vira ├│rf├ú e o
    pr├│ximo `adquirir_trava` a recicla sozinho."""
    try:
        if _LOCK.exists():
            dados = json.loads(_LOCK.read_text(encoding="utf-8"))
            if int(dados.get("pid", -1)) == os.getpid():
                _LOCK.unlink()
    except (OSError, ValueError, json.JSONDecodeError):
        # Trava ileg├¡vel: n├úo derruba ÔÇö pode ser de outro processo.
        pass


def ler_estado() -> dict:
    """L├¬ o estado dos est├ígios. Devolve dict vazio se n├úo existe."""
    if not _ESTADO.exists():
        return {}
    try:
        return json.loads(_ESTADO.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def gravar_estado(estado: dict) -> None:
    """Grava o estado com escrita at├┤mica (tmp + os.replace).

    At├┤mico = o leitor nunca v├¬ o arquivo meio escrito. Sem isso, um kill
    no meio da escrita deixaria o JSON inv├ílido e o pr├│ximo start acharia
    que n├úo h├í estado salvo (perda de retomada).
    """
    _CACHE.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(_CACHE), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(estado, fh, ensure_ascii=False, indent=1)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, str(_ESTADO))  # troca at├┤mica no mesmo volume
    except OSError:
        # N├úo derruba o fluxo por falha de estado; o coletor segue e o
        # logger registra. Estado ├® conveni├¬ncia, checkpoint ├® obrigat├│rio.
        try:
            os.unlink(tmp)
        except OSError:
            pass


def marcar_estagio(nome: str, status: str, detalhe: str = "", **extra) -> dict:
    """Atualiza o status de um est├ígio e grava. `status` Ôêê
    {pendente, rodando, ok, erro, pulado}."""
    estado = ler_estado()
    estado.setdefault("estagios", {})[nome] = {
        "status": status, "ts": _agora_iso(),
        "detalhe": detalhe, **extra,
    }
    gravar_estado(estado)
    return estado


def resumo_estado() -> dict:
    """Estado + trava, para o painel exibir de uma vez."""
    estado = ler_estado()
    trava_ativa = _LOCK.exists()
    pid_trava = None
    if trava_ativa:
        try:
            pid_trava = json.loads(_LOCK.read_text(encoding="utf-8")).get("pid")
        except (OSError, json.JSONDecodeError):
            pid_trava = None
    return {
        "estagios": estado.get("estagios", {}),
        "trava_ativa": bool(trava_ativa and _pid_vivo(pid_trava or 0)),
        "pid_trava": pid_trava,
    }
