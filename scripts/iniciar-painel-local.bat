@echo off
title Controle Popular - Painel e Editor Local
cd /d "C:\DevCoder\controle-popular\apps\web"

echo ========================================================
echo   Iniciando Controle Popular - Painel e Editor Local
echo   Porta: 3028 ^| Banco Local: 5432 ^| Modo: PAINEL_LOCAL=1
echo ========================================================
echo.

set PAINEL_LOCAL=1

start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3028/painel"

npx next dev --port 3028
