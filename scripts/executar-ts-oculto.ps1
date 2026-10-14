# Executa um script .mts do repo em SEGUNDO PLANO, sem janela de console.
#
# Por que existe: o schtasks registra tarefas interativas, e um
# `cmd.exe /c npx tsx ...` cru abre uma JANELA em primeiro plano a cada
# disparo - o vigia do servidor (5 em 5 minutos) tapava a tela do dono
# (medido e corrigido em 13/10/2026). Mesmo molde das rotinas noturnas:
# powershell.exe -WindowStyle Hidden envolve a execucao e a janela do host
# fica invisivel.
#
# Uso (registrado no agendar-tarefas-windows.ps1):
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden \
#     -File <este-arquivo> -Script vigia-servidor.mts [-LogRelativo x.log]
#
# O redirecionamento de log passa pelo cmd de proposito: o `>>` nativo do
# PowerShell 5.1 grava UTF-16 e quebra quem le o log depois.
#
# ATENCAO (regra da esteira): manter este arquivo SEM acentos. O PowerShell
# 5.1 corrompe texto sem BOM UTF-8 e a task morre em silencio.
param(
  [Parameter(Mandatory = $true)]
  [string]$Script,
  [string]$LogRelativo
)
$ErrorActionPreference = "Continue"
$Raiz = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Raiz
if ($LogRelativo) {
  cmd.exe /c "npx tsx scripts\$Script >> docs\relatorios-automacao\logs\$LogRelativo 2>&1"
} else {
  cmd.exe /c "npx tsx scripts\$Script"
}
