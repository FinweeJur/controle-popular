# ==============================================================================
# Execução da Rotina de Madrugada — PicoClaw (Sondagem e Atualização de Fontes)
# ==============================================================================
# Executa de madrugada (03:30 AM) com prioridade de processo reduzida (BelowNormal)
# para garantir impacto zero no uso de CPU/RAM.

$ErrorActionPreference = "Continue"
$RaizRepo = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $RaizRepo "docs\relatorios-automacao\logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$DataHoje = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ArquivoLog = Join-Path $LogDir "rotina-madrugada_$DataHoje.log"

# Define prioridade do processo atual para 'BelowNormal'
[System.Diagnostics.Process]::GetCurrentProcess().PriorityClass = [System.Diagnostics.ProcessPriorityClass]::BelowNormal

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === INICIANDO ROTINA DE MADRUGADA (PicoClaw) ===" | Tee-Object -FilePath $ArquivoLog

Set-Location $RaizRepo

# 1. Executa sondagem de integridade das fontes via PicoClaw
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 1/5. Executando PicoClaw Source Watcher..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/agent-tools/picoclaw-source-watcher.mts *>> $ArquivoLog

# 2. Executa verificacao de paginas do portal via Argus
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 2/5. Executando Argus Page Checker..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/agent-tools/argus-page-checker.mts *>> $ArquivoLog

# 3. Executa varredura de links externos via LinkMender (so propoe, nao commita)
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 3/5. Executando LinkMender Checker..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/agent-tools/linkmender-checker.mts *>> $ArquivoLog

# 4. Executa coletas automatizadas das fontes prioritárias
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 4/5. Executando rotina de coletas automatizadas..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/rotina-coletas.mts --listar *>> $ArquivoLog

# 5. Varredura obrigatória de privacidade (Mod-11 CPF)
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 5/5. Varredura de privacidade mod-11..." | Tee-Object -FilePath $ArquivoLog -Append
python scripts/checar-dado-pessoal-em-dado.py *>> $ArquivoLog

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === ROTINA DE MADRUGADA CONCLUÍDA ===" | Tee-Object -FilePath $ArquivoLog -Append
