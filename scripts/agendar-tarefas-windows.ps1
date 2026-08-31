$ErrorActionPreference = "Continue"

$RaizRepo = Resolve-Path (Join-Path $PSScriptRoot "..")
$ScriptMadrugada = Join-Path $RaizRepo "scripts\executar-rotina-madrugada.ps1"
$ScriptManha = Join-Path $RaizRepo "scripts\executar-rotina-manha.ps1"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACAO DE AGENDAMENTO AUTOMATICO - WINDOWS TASK SCHEDULER" -ForegroundColor Cyan
Write-Host "========================================================================`n"

# 1. Tarefa de Madrugada (03:30 AM) - PicoClaw e Coletas
$NomeTarefa1 = "ControlePopular_PicoClaw_Madrugada"
$Hora1 = "03:30"
$Comando1 = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptMadrugada`""

Write-Host "Configurando Tarefa 1: $NomeTarefa1 (Horario: $Hora1 diariamente)..."
& schtasks.exe /Create /TN $NomeTarefa1 /TR $Comando1 /SC DAILY /ST $Hora1 /F | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK: Tarefa '$NomeTarefa1' registrada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "  Aviso: Codigo de retorno ao registrar '$NomeTarefa1': $LASTEXITCODE" -ForegroundColor Yellow
}

# 2. Tarefa da Manha (05:30 AM) - Hermes Agent e Auditorias
$NomeTarefa2 = "ControlePopular_Hermes_Manha"
$Hora2 = "05:30"
$Comando2 = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptManha`""

Write-Host "`nConfigurando Tarefa 2: $NomeTarefa2 (Horario: $Hora2 diariamente)..."
& schtasks.exe /Create /TN $NomeTarefa2 /TR $Comando2 /SC DAILY /ST $Hora2 /F | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK: Tarefa '$NomeTarefa2' registrada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "  Aviso: Codigo de retorno ao registrar '$NomeTarefa2': $LASTEXITCODE" -ForegroundColor Yellow
}

Write-Host "`n========================================================================" -ForegroundColor Cyan
Write-Host "  RESUMO DOS AGENDAMENTOS CONFIGURADOS" -ForegroundColor Cyan
Write-Host "========================================================================"
Write-Host "1. $NomeTarefa1 -> Diariamente as $Hora1 (PicoClaw / Sondagem / Ingestao)"
Write-Host "2. $NomeTarefa2 -> Diariamente as $Hora2 (Hermes Agent / Auditoria / Parecer)"
Write-Host "Modo: Background (-WindowStyle Hidden) com prioridade reduzida (BelowNormal)."
