# ==============================================================================
# Execução da Automação de Páginas Modelo (01:00 AM)
# ==============================================================================
# Executa diariamente à 01:00 AM com prioridade de processo reduzida (BelowNormal)

$ErrorActionPreference = "Continue"
$RaizRepo = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $RaizRepo "docs\relatorios-automacao\logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$DataHoje = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ArquivoLog = Join-Path $LogDir "rotina-paginas_$DataHoje.log"

[System.Diagnostics.Process]::GetCurrentProcess().PriorityClass = [System.Diagnostics.ProcessPriorityClass]::BelowNormal

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === INICIANDO AUTOMACAO DE PAGINAS (01:00 AM) ===" | Tee-Object -FilePath $ArquivoLog

Set-Location $RaizRepo

# 1. Executa verificação e geração de páginas modelo pendentes
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 1/2. Gerando manifestos de páginas modelo pendentes..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/gerar-manifesto-modelo.mts --origem apps/web/data/noticias-paraopeba.json --rota noticias-radar --titulo "Radar Diario de Noticias" --tipo acervo *>> $ArquivoLog

# 2. Executa TypeScript check
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 2/2. Checando compilacao de tipos TypeScript..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsc --project apps/web/tsconfig.json --noEmit *>> $ArquivoLog

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === AUTOMACAO DE PAGINAS CONCLUIDA ===" | Tee-Object -FilePath $ArquivoLog -Append
