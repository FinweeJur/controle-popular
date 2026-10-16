# Re-registra as 2 tarefas criadas em contexto elevado com o molde oculto.
#
# Por que existe: "Controle Popular - checar novidades" e
# "Controle Popular - gatilho remoto" foram criadas por outra conta e
# schtasks negou acesso no contexto comum (medido 15/10/2026). Rodar UMA
# VEZ num PowerShell aberto com "Executar como administrador":
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\reagendar-ocultas-elevadas.ps1
#
# Molde idem executar-ts-oculto.ps1 (medido 13/10/2026): powershell.exe
# -WindowStyle Hidden envolve a execucao e schtasks nao abre janela
# de console em primeiro plano no PC do dono.
# Atencao: manter este arquivo SEM acentos (PS 5.1 corrompe sem BOM).
$ErrorActionPreference = "Continue"
$P = Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..")) "scripts"
$W = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File $P\executar-ts-oculto.ps1"

schtasks.exe /Create /TN "Controle Popular - checar novidades" /TR "$W -Script sincronizar-e-publicar.mts" /SC DAILY /ST 06:10 /F
if ($LASTEXITCODE -eq 0) { Write-Host "  checar novidades OK" } else { Write-Host "  checar novidades FALHOU rc=$LASTEXITCODE" }

schtasks.exe /Create /TN "Controle Popular - gatilho remoto" /TR "$W -Script gatilho-remoto.mts" /SC ONLOGON /F
if ($LASTEXITCODE -eq 0) { Write-Host "  gatilho remoto OK" } else { Write-Host "  gatilho remoto FALHOU rc=$LASTEXITCODE" }
