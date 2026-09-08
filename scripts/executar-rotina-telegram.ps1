# ==============================================================================
# Execução do Envio do Relatório Diário no Telegram (06:30 AM)
# ==============================================================================

$ErrorActionPreference = "Continue"
$RaizRepo = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $RaizRepo "docs\relatorios-automacao\logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$DataHoje = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ArquivoLog = Join-Path $LogDir "rotina-telegram_$DataHoje.log"

[System.Diagnostics.Process]::GetCurrentProcess().PriorityClass = [System.Diagnostics.ProcessPriorityClass]::BelowNormal

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === ENVIANDO RELATÓRIO DIÁRIO TELEGRAM (06:30 AM) ===" | Tee-Object -FilePath $ArquivoLog

Set-Location $RaizRepo

# Executa compilador do relatório e disparo via Telegram Bot API
npx tsx scripts/enviar-relatorio-telegram.mts *>> $ArquivoLog

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === RELATÓRIO TELEGRAM CONCLUÍDO ===" | Tee-Object -FilePath $ArquivoLog -Append
