"""Trava de instância e estado dos estágios da Oficina de Cavas.

Dois problemas concretos que já custaram tempo neste repo (AGENTS §5.4):
1. duas sessões/processos brigando pelo mesmo checkpoint de cavas — dois
   `next build` no mesmo `.next` já produziram verificação errada em 15/08;
2. trabalho perdido em suspend/kill porque ninguém sabia em que pé estava.

Este módulo resolve os dois com pouco código:

- TRAVA: um lockfile no cache que guarda o PID do processo dono. Se o
  lockfile existe e o PID ainda está vivo, outro processo recusa a rodar.
  Se o PID morreu (PC suspensou, processo foi morto), a trava é "órfã" e é
  tomada de volta. É a mesma ideia de um lock de arquivo, mas com PID para
  detectar o caso comum de PC que dormiu no meio.

- ESTADO: um JSON pequeno que guarda em que pé está cada estágio
  (coletar/analyse/etc). Sobrevive a suspend porque é gravado a cada
  mudança, com escrita atômica (tmp + replace) — nunca fica meio escrito.

Nada aqui fala com rede nem com imagem: é só processo e disco. Por isso o
módulo é stdlib puro e testável sem rasterio.
"""
from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path

# Onde a trava e o estado moram: no cache de cavas, versionado no .gitignore.
# Um caminho fixo por repo (relativo à raiz detectada) — se fosse por CWD,
# dois terminais em pastas diferentes dariam duas travas falsas.
_RAIZ = Path(__file__).resolve().parents[2]
_CACHE = _RAIZ / "scripts" / ".cache" / "cavas-calibracao"
_LOCK = _CACHE / "oficina.lock"
_ESTADO = _CACHE / "oficina-estado.json"

# Estágios da esteira, na ordem em que rodam.
ESTAGIOS = ("coletar", "analisar", "separar", "painel")


def _agora_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _pid_vivo(pid: int) -> bool:
    """True se o PID existe e é nosso. No Windows, os sinais são limitados,
    então usamos psutil se disponível; sem ele, assume vivo (trava segura:
    pior caso é o usuário matar à mão o processo antigo)."""
    if pid <= 0:
        return False
    try:
        import psutil
        return psutil.pid_exists(pid) and psutil.Process(pid).is_running()
    except Exception:
        # Sem psutil não arriscamos derrubar trava de um processo vivo.
        return True


def _trava_estrangeira(pid: int) -> bool:
    """True se o PID da trava é de OUTRO processo vivo (não nosso).

    Extraído de adquirir_trava para baixar a complexidade condicional:
    três condições (pid>0, vivo, !=eu) viram uma função nomeada, mais
    legível e testável.
    """
    return bool(pid) and _pid_vivo(pid) and pid != os.getpid()


def adquirir_trava(quem: str = "") -> Path | None:
    """Tenta tomar a trava de instância. Devolve o caminho do lock ou None.

    None significa "outro processo está rodando a oficina" — o chamador deve
    abortar com mensagem clara, não insistir. Se a trava anterior é órfã
    (PID morto), ela é tomada de volta e a função devolve o caminho.
    """
    _CACHE.mkdir(parents=True, exist_ok=True)
    if _LOCK.exists():
        try:
            dados = json.loads(_LOCK.read_text(encoding="utf-8"))
            pid = int(dados.get("pid", 0))
        except (OSError, ValueError, json.JSONDecodeError):
            pid = 0
        if _trava_estrangeira(pid):
            return None  # outro processo de verdade está no comando
        # Trava órfã (PID morto) ou corrompida: tomamos de volta.
    _LOCK.write_text(
        json.dumps({"pid": os.getpid(), "quem": quem, "ts": _agora_iso()}),
        encoding="utf-8",
    )
    return _LOCK


def liberar_trava() -> None:
    """Remove a trava se ela for nossa. Chamada em finally/finally de cada
    estágio — se o processo morrer sem finally, a trava vira órfã e o
    próximo `adquirir_trava` a recicla sozinho."""
    try:
        if _LOCK.exists():
            dados = json.loads(_LOCK.read_text(encoding="utf-8"))
            if int(dados.get("pid", -1)) == os.getpid():
                _LOCK.unlink()
    except (OSError, ValueError, json.JSONDecodeError):
        # Trava ilegível: não derruba — pode ser de outro processo.
        pass


def ler_estado() -> dict:
    """Lê o estado dos estágios. Devolve dict vazio se não existe."""
    if not _ESTADO.exists():
        return {}
    try:
        return json.loads(_ESTADO.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def gravar_estado(estado: dict) -> None:
    """Grava o estado com escrita atômica (tmp + os.replace).

    Atômico = o leitor nunca vê o arquivo meio escrito. Sem isso, um kill
    no meio da escrita deixaria o JSON inválido e o próximo start acharia
    que não há estado salvo (perda de retomada).
    """
    _CACHE.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(_CACHE), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(estado, fh, ensure_ascii=False, indent=1)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, str(_ESTADO))  # troca atômica no mesmo volume
    except OSError:
        # Não derruba o fluxo por falha de estado; o coletor segue e o
        # logger registra. Estado é conveniência, checkpoint é obrigatório.
        try:
            os.unlink(tmp)
        except OSError:
            pass


def marcar_estagio(nome: str, status: str, detalhe: str = "", **extra) -> dict:
    """Atualiza o status de um estágio e grava. `status` ∈
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
