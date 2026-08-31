@echo off
rem Involucro do relatorio da manha para o Agendador de Tarefas do Windows.
rem Mesmo motivo de rotina-local.cmd: diretorio de trabalho confiavel e
rem comando curto e legivel registrado na tarefa.
rem
rem Gera um resumo curto do estagio do app em .claude/manha/RELATORIO-AAAA-MM-DD.md
rem e dispara o opencode (se no PATH) para apresentar o resumo.
rem
rem O codigo de saida e 0 em sucesso ou 1 em falha; o Agendador mostra esse
rem numero na coluna "Resultado da ultima execucao".

cd /d "%~dp0.."
if errorlevel 1 exit /b 1

call npx tsx scripts/relatorio-manha.mts %*
exit /b %errorlevel%
