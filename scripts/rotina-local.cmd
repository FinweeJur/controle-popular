@echo off
rem Invólucro da rotina local para o Agendador de Tarefas do Windows.
rem
rem Existe porque o Agendador não tem diretório de trabalho confiável nem
rem resolve `npx` sozinho em toda configuração — e porque um .cmd deixa o
rem comando registrado na tarefa curto e legível no painel.
rem
rem O código de saída é o da rotina: 0 publicou, diferente de 0 NÃO publicou.
rem O Agendador mostra esse número na coluna "Resultado da última execução",
rem que é onde a falha fica visível sem ninguém abrir log.

cd /d "%~dp0.."
if errorlevel 1 exit /b 1

call npx tsx scripts/rotina-local.mts %*
exit /b %errorlevel%
