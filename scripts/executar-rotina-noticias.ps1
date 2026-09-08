# ==============================================================================
# Execução do Coletor e Resumidor de Notícias (02:30 AM)
# ==============================================================================
# Executa diariamente às 02:30 AM com prioridade reduzida (BelowNormal)

$ErrorActionPreference = "Continue"
$RaizRepo = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $RaizRepo "docs\relatorios-automacao\logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$DataHoje = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ArquivoLog = Join-Path $LogDir "rotina-noticias_$DataHoje.log"

[System.Diagnostics.Process]::GetCurrentProcess().PriorityClass = [System.Diagnostics.ProcessPriorityClass]::BelowNormal

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === INICIANDO AUTOMACAO DE NOTICIAS (02:30 AM) ===" | Tee-Object -FilePath $ArquivoLog

Set-Location $RaizRepo

# 1. Executa o radar de notícias (Python + FeedParser + RSS)
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 1/2. Executando coletor de noticias..." | Tee-Object -FilePath $ArquivoLog -Append
python scripts/coletar-noticias-paraopeba.py --dias 45 *>> $ArquivoLog

# 2. Executa varredura obrigatoria de privacidade (Mod-11 CPF) nos dados coletados
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 2/2. Varredura de privacidade mod-11 nos dados..." | Tee-Object -FilePath $ArquivoLog -Append
python scripts/checar-dado-pessoal-em-dado.py *>> $ArquivoLog

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === AUTOMACAO DE NOTICIAS CONCLUIDA ===" | Tee-Object -FilePath $ArquivoLog -Append
