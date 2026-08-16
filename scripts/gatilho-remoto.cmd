@echo off
rem Invólucro do gatilho remoto para o Agendador de Tarefas do Windows.
rem Mesmo motivo de rotina-local.cmd: diretório de trabalho confiável e
rem comando curto e legível registrado na tarefa.
rem
rem Este processo NÃO TERMINA sozinho — fica escutando HTTP/Telegram. A
rem tarefa que o registra usa "Reiniciar se falhar", não "rodar e sair".

cd /d "%~dp0.."
if errorlevel 1 exit /b 1

call npx tsx scripts/gatilho-remoto.mts
exit /b %errorlevel%
