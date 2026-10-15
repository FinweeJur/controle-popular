@echo off
rem Invocro da rotina local para o Agendador de Tarefas do Windows.
rem
rem Existe porque o Agendador no tem diretorio de trabalho confiavel nem
rem resolve `npx` sozinho em toda configuracao -- e porque um .cmd deixa o
rem comando registrado na tarefa curto e legivel no painel.
rem
rem O codigo de saida e o da rotina: 0 publicou, diferente de 0 NAO
rem publicou. O Agendador mostra esse numero na coluna "Resultado da
rem ultima execucao", que e onde a falha fica visivel sem ninguem abrir log.
rem
rem PATH do Node (15/10/2026): a tarefa rodou 10/15-10/15 de manha com
rem "Resultado 1" e SEM log em logs\ - o ultimo log tem data de 10/08.
rem Sintoma de `npx` nao encontrado no contexto nao-interativo (a maquina
rem usa o node instalado em %LOCALAPPDATA%\hermes\node, que so aparece no
rem PATH da sessao interativa). O bootstrap pe po node primeiro no PATH,
rem depois no hermes, e so entao chama a rotina - falha alta, nao muda.

setlocal
cd /d "%~dp0.."
if errorlevel 1 exit /b 1

set "NODE_BIN=%LOCALAPPDATA%\hermes\node"
if exist "%NODE_BIN%\node.exe" set "PATH=%NODE_BIN%;%PATH%"
where npx >nul 2>nul
if errorlevel 1 (
  echo [rotina-local.cmd] FALHA: nem PATH nem %NODE_BIN% tem npx - tarefa nao roda sem Node. 1>&2
  exit /b 127
)

call npx tsx scripts/rotina-local.mts %*
exit /b %errorlevel%
