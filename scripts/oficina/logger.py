"""Logger JSONL da Oficina de Cavas.

O que é: um logger mínimo que grava eventos em JSON Lines (uma linha JSON
por evento) com fsync — ou seja, o sistema operacional confirma a escrita
em disco antes de a próxima linha ser gravada.

Por que fsync: a coleta de cavas roda em background neste PC (home-pc) e
já perdemos trabalho quando o PC suspensou no meio. Um print() bufferizado
não sobrevive a suspend/kill; o fsync do logger sim. Cada evento leva um
carimbo de tempo, o estágio que o originou e — se houver — o hash do recorte
e o erro, para o painel e para qualquer IA (opencode) lerem depois sem
raspar texto de .log.

Nada de segredo aqui: o logger só grava o que o chamador passar. Ele não
lê .env nem imprime token (regra de privacidade do repo).
"""
from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

# fsync a cada N eventos. Custo medido ~µs por chamada; o ganho (obra salva
# na hora) supera em muito o preço numa coleta de horas.
_FSYNC_A_CADA = 1


def _agora_iso() -> str:
    """Timestamp ISO-8601 em UTC, legível por humano e por máquina."""
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


class LoggerOficina:
    """Escreve eventos JSONL em um arquivo, com flush e fsync.

    Uso:
        log = LoggerOficina(Path(".../oficina.jsonl"), estagio="coletar")
        log.evento("aceito", hash="abc...", nuvem=0.11)
        log.erro("leitura_falhou", mensagem="timeout no INPE")

    Cada linha é um dict com as chaves fixas `ts` e `estagio`, mais os
    campos extras passados por `evento()`/`erro()`. O arquivo é aberto em
    modo append — várias rodadas se somam no mesmo log, na ordem.
    """

    def __init__(self, caminho: Path, estagio: str = "oficina"):
        self.caminho = Path(caminho)
        self.estagio = estagio
        self.caminho.parent.mkdir(parents=True, exist_ok=True)
        # "a" = append; line_buffering=True dá flush por linha mesmo sem
        # fsync, e o fsync a cada N eventos fecha o risco de suspend.
        self._fh = open(self.caminho, "a", encoding="utf-8",
                        buffering=1)
        self._desde_fsync = 0

    def evento(self, nome: str, **campos) -> dict:
        """Registra um evento de progresso. Devolve o dict gravado."""
        reg = {"ts": _agora_iso(), "estagio": self.estagio,
               "evento": nome, **campos}
        self._escrever(reg)
        return reg

    def erro(self, nome: str, mensagem: str = "", **campos) -> dict:
        """Registra um erro. Mesmo formato, com `erro` para o painel filtrar."""
        reg = {"ts": _agora_iso(), "estagio": self.estagio,
               "evento": nome, "erro": True, "mensagem": mensagem,
               **campos}
        self._escrever(reg)
        return reg

    def _escrever(self, reg: dict) -> None:
        self._fh.write(json.dumps(reg, ensure_ascii=False) + "\n")
        self._fh.flush()
        self._desde_fsync += 1
        if self._desde_fsync >= _FSYNC_A_CADA:
            os.fsync(self._fh.fileno())
            self._desde_fsync = 0

    def fechar(self) -> None:
        """Fsync final e fecha o descritor. Chame no fim de cada estágio."""
        try:
            self._fh.flush()
            os.fsync(self._fh.fileno())
        finally:
            self._fh.close()

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.fechar()
        return False


def ler_ultimos(caminho: Path, n: int = 50) -> list[dict]:
    """Lê as últimas N linhas do JSONL (para o painel mostrar o tail).

    Devolve lista vazia se o arquivo não existir. Lê de trás para frente
    só o suficiente — o log cresce com o tempo e não pode ser carregado
    inteiro na memória do painel.
    """
    p = Path(caminho)
    if not p.exists():
        return []
    try:
        # readlines() num log grande é pesado; usamos deque com maxlen.
        from collections import deque
        with open(p, encoding="utf-8") as fh:
            filas = deque(fh, maxlen=n)
    except OSError:
        return []
    saida: list[dict] = []
    for linha in filas:
        linha = linha.strip()
        if not linha:
            continue
        try:
            saida.append(json.loads(linha))
        except json.JSONDecodeError:
            continue  # linha meio escrita por kill — pula, não derruba
    return saida


def contar_erros(caminho: Path) -> int:
    """Quantos eventos marcados como erro existem no log (para o painel)."""
    return sum(1 for r in ler_ultimos(caminho, n=10_000) if r.get("erro"))
