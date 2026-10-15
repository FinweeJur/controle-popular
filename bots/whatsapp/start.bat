@echo off
REM bots/whatsapp/start.bat — Autostart do bot WhatsApp no Windows.
REM
REM Inicia o bot Go (ouvinte WhatsApp) e o processor Node.js (busca web)
REM em loop com restart automático. Rode da raíz do repo.
REM
REM Adicione ao Agendador de Tarefas (Trigger: no logon) ou pasta startup:
REM   shell:startup
REM
REM Requisitos:
REM   - bots/whatsapp/whatsapp-bot  (go build -o whatsapp-bot .)
REM   - Node.js 21+ (para npx tsx)

setlocal
set BOT_DIR=%~dp0
set REPO_ROOT=%BOT_DIR%..\..
set LOG_FILE=%BOT_DIR%bot.log

cd /d "%REPO_ROOT%"

echo [%date% %time%] Iniciando processor (busca web)... >> "%LOG_FILE%"
start "whatsapp-processor" /b cmd /c "npx tsx scripts/whatsapp-processor.mts >> \"%LOG_FILE%\" 2>&1"

:loop
  echo [%date% %time%] Iniciando bot WhatsApp... >> "%LOG_FILE%"
  "%BOT_DIR%whatsapp-bot"
  echo [%date% %time%] Bot parou (exit code %ERRORLEVEL%). Reiniciando em 10s... >> "%LOG_FILE%"
  timeout /t 10 /nobreak >nul
  goto loop
