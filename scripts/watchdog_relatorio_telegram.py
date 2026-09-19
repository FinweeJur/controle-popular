#!/usr/bin/env python3
"""
watchdog_relatorio_telegram.py — Vigia do relatório matinal das 06:30.

Executa via Hermes Cron.
Se o relatório de hoje já foi publicado com sucesso: saída vazia (silencioso).
Se ainda não foi publicado hoje: envia alerta e registra no log.
"""

import datetime
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

REPO = Path(r"C:\DevCoder\controle-popular")
ENV_PATH = REPO / "scripts" / ".env"
LOGS_DIR = REPO / "logs"
LOG_FILE = LOGS_DIR / "watchdog-relatorio.log"


def carregar_env() -> dict:
    dados = {}
    if not ENV_PATH.exists():
        return dados
    for linha in ENV_PATH.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$", linha)
        if m:
            dados[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return dados


def main() -> int:
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    hoje = datetime.date.today().isoformat()

    # 1. Verifica se já houve sucesso registrado hoje no log do watchdog
    if LOG_FILE.exists():
        conteudo = LOG_FILE.read_text(encoding="utf-8", errors="replace")
        if f"SUCCESS" in conteudo and hoje in conteudo:
            # Já publicado e confirmado hoje — silencioso
            return 0

    # 2. Verifica se a rotina do telegram já rodou com sucesso hoje em docs/relatorios-automacao/logs
    relatorios_logs = REPO / "docs" / "relatorios-automacao" / "logs"
    if relatorios_logs.exists():
        for arq in relatorios_logs.glob(f"rotina-telegram_{hoje}*.log"):
            txt = arq.read_text(encoding="utf-8", errors="replace")
            if "RELATÓRIO TELEGRAM CONCLUÍDO" in txt or "concluído com sucesso" in txt.lower():
                # Registra SUCCESS no log do watchdog para futuras checagens no mesmo dia
                agora = datetime.datetime.now().isoformat(timespec="seconds")
                with LOG_FILE.open("a", encoding="utf-8") as f:
                    f.write(f"[{agora}] SUCCESS: Relatório verificado hoje ({hoje})\n")
                return 0

    # 3. Não há registro de sucesso hoje — registrar tentativa no log
    agora = datetime.datetime.now().isoformat(timespec="seconds")
    hora_atual = datetime.datetime.now().strftime("%H:%M")
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(f"[{agora}] 🔴 Report não publicado hoje ({hoje}) — disparando alerta\n")

    # 4. Envia alerta ao Telegram
    env = carregar_env()
    token = env.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = env.get("TELEGRAM_CHAT_ID", "7250703518")

    msg = f"🔴 Alerta: Relatório do dia não foi publicado no Telegram ({hora_atual}). Verificar sessão agente principal."

    if token and chat_id:
        try:
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            payload = json.dumps({"chat_id": chat_id, "text": msg}).encode("utf-8")
            req = urllib.request.Request(
                url, data=payload, headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    with LOG_FILE.open("a", encoding="utf-8") as f:
                        f.write(f"[{agora}] ✅ Alerta Telegram enviado para {chat_id}\n")
        except Exception as e:
            with LOG_FILE.open("a", encoding="utf-8") as f:
                f.write(f"[{agora}] ❌ Falha ao enviar alerta Telegram: {e}\n")

    # Output para o Hermes (em no-agent mode, Hermes entrega ao deliver target se não vazio)
    # Deixar vazio para evitar duplicidade com o sendMessage direto, ou imprimir se preferir
    return 0


if __name__ == "__main__":
    sys.exit(main())
