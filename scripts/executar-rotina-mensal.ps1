# ==============================================================================
# Execução Mensal do Coletor de Dados de Comércio Exterior, CVM e SEC (Dia 01)
# ==============================================================================
# Executa no dia 01 de cada mês às 04:00 AM para renovar o acervo local do PC sem requisições excessivas.

$ErrorActionPreference = "Continue"
$RaizRepo = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $RaizRepo "docs\relatorios-automacao\logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$DataHoje = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ArquivoLog = Join-Path $LogDir "rotina-mensal-comercio-exterior_$DataHoje.log"

[System.Diagnostics.Process]::GetCurrentProcess().PriorityClass = [System.Diagnostics.ProcessPriorityClass]::BelowNormal

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === INICIANDO ROTINA MENSAL DE COMERCIO EXTERIOR E CVM ===" | Tee-Object -FilePath $ArquivoLog

Set-Location $RaizRepo

# 1. Executa atualização mensal de dados CVM, SEC EDGAR e US Census API
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 1/3. Coletando dados abertos da CVM e US Census Bureau..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/coletar-comercio-exterior-eua.mts *>> $ArquivoLog

# 2. Atualiza catálogo dos setores e empresas americanas
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 2/3. Atualizando catalogos estaticos de empresas e fundos..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/gerar-paginas-perfil-empresas-fundos.mts *>> $ArquivoLog

# 3. Varredura obrigatoria de privacidade Mod-11 CPF
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 3/3. Varredura de privacidade mod-11..." | Tee-Object -FilePath $ArquivoLog -Append
python scripts/checar-dado-pessoal-em-dado.py *>> $ArquivoLog

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === ROTINA MENSAL CONCLUIDA COM SUCESSO ===" | Tee-Object -FilePath $ArquivoLog -Append
