# ==============================================================================
# Execução da Verificação do Site & Autodeploy (00:00 - Meia-Noite)
# ==============================================================================
# Verifica se o repositório local está sincronizado com o origin/main no GitHub.
# Se houver novos commits/conteúdos, builda o projeto e faz o deploy automático para o Cloudflare Workers.

$ErrorActionPreference = "Continue"
$RaizRepo = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $RaizRepo "docs\relatorios-automacao\logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$DataHoje = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ArquivoLog = Join-Path $LogDir "rotina-autodeploy-meianoite_$DataHoje.log"

[System.Diagnostics.Process]::GetCurrentProcess().PriorityClass = [System.Diagnostics.ProcessPriorityClass]::BelowNormal

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === INICIANDO VERIFICACAO DE SITE E AUTODEPLOY (00:00 MEIA-NOITE) ===" | Tee-Object -FilePath $ArquivoLog

Set-Location $RaizRepo

# 1. Executa verificação do repositório remoto, build e deploy automático
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 1/1. Checando sincronização com origin/main no GitHub e disparando build/deploy..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/sincronizar-e-publicar.mts *>> $ArquivoLog

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === VERIFICACAO DE MEIA-NOITE CONCLUÍDA ===" | Tee-Object -FilePath $ArquivoLog -Append
