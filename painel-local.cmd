@echo off
rem Painel de edicao local (docs/PAINEL-EDICAO-COMO-USAR.md).
rem Forma verificada: PAINEL_LOCAL=1 com aspas (sem espaco no valor) + porta 3028.
set "PAINEL_LOCAL=1"
cd /d "X:\DevCoder\controle-popular\apps\web"
start "" powershell -WindowStyle Hidden -Command "Start-Sleep -Seconds 12; Start-Process 'http://localhost:3028/painel'"
npx next dev --port 3028