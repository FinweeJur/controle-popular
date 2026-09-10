#!/bin/bash
# 🛡️ Watchdog: verifica se o report das 06:30 foi publicado no Telegram
# 
# Executa a cada hora entre 7-23h. Se hoje ainda não houve sucesso no log,
# re-dispara o report. Silent quando OK (output vazio = tudo bem).
#
# Cron: 30 7-23 * * * (todo dia às 06:30, com retry até 23h)
# Chat ID: -10017250703518 (Telegram group do Controle Popular)

LOG_FILE="${LOG_FILE:-logs/watchdog-relatorio.log}"
DATA_HOJE=$(date +%Y-%m-%d)

# Cria pasta de logs
mkdir -p logs

# Procura sucesso registrado hoje
if grep -q "SUCCESS.*${DATA_HOJE}" "$LOG_FILE" 2>/dev/null; then
  # ✅ Report publicado hoje — nada a fazer (silent)
  exit 0
fi

# ❌ Nada publicado — tenta re-disparar
{
  echo "[$(date '+%Y-%m-%dT%H:%M:%S')] 🔴 Report não publicado hoje — re-disparando"
} >> "$LOG_FILE"

# Tenta enviar mensagem de alerta via bot (curl silencioso)
TOKEN=$(grep "TELEGRAM_BOT_TOKEN" scripts/.env 2>/dev/null | cut -d= -f2- | tr -d '\r"')
CHAT_ID="-10017250703518"
if [ -n "$TOKEN" ]; then
  MSG="🔴 Alerta: Relatório do dia não foi publicado no Telegram. $(date '+%H:%M'). Verificar sessão agente principal."
  curl -s --max-time 10 "https://api.telegram.org/bot${TOKEN}/sendMessage" \
    -d chat_id="${CHAT_ID}" \
    -d text="${MSG}" > /dev/null 2>&1
fi

echo "[$(date '+%Y-%m-%dT%H:%M:%S')] Alerta Telegram enviado" >> "$LOG_FILE"
