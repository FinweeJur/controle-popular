# ==============================================================================
# Execução da Rotina da Manhã — Hermes Agent & Colibri Bridge
# ==============================================================================
# Executa pela manhã (05:30 AM) com prioridade de processo reduzida (BelowNormal)
# para garantir impacto zero na usabilidade da máquina.

$ErrorActionPreference = "Continue"
$RaizRepo = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $RaizRepo "docs\relatorios-automacao\logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$DataHoje = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ArquivoLog = Join-Path $LogDir "rotina-manha_$DataHoje.log"

# Define prioridade do processo atual para 'BelowNormal'
[System.Diagnostics.Process]::GetCurrentProcess().PriorityClass = [System.Diagnostics.ProcessPriorityClass]::BelowNormal

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === INICIANDO ROTINA DA MANHÃ (Hermes Agent) ===" | Tee-Object -FilePath $ArquivoLog

Set-Location $RaizRepo

# 1. Executa auditoria de segurança defensiva, headers e qualidade de dados
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 1/3. Executando Hermes Security Auditor..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/agent-tools/hermes-security-auditor.mts *>> $ArquivoLog

# 2. Executa baixa e varredura de PDFs do catalogo via DocVault
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 2/3. Executando DocVault (PDFs -> R2)..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/agent-tools/docvault-downloader.mts *>> $ArquivoLog

# 3. Executa consolidação geral e geração de parecer no Colibri Bridge
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 3/3. Executando Colibri Bridge..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/colibri-bridge.mts --tudo *>> $ArquivoLog

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === ROTINA DA MANHÃ CONCLUÍDA ===" | Tee-Object -FilePath $ArquivoLog -Append
