# ==============================================================================
# Deploy AGENDADO do Guara Cloud — políticas do dono, 19/09/2026.
# Regras (OPERACAO.md § 0): só deploy com commit novo NA origin/main,
# último deploy do Guara com >= 5 dias e CI verde.
# Rotina-local (`meia-noite`) NÃO passa aqui: ela é do túnel/Workers,
# que não queima a cota de build do Guara.
# ==============================================================================
$ErrorActionPreference = "Continue"

$RaizRepo = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $RaizRepo "logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}
$ArquivoLog = Join-Path $LogDir "rotina-deploy-guara.log"

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === DEPLOY-AGENDADO GUARA (janela 5 dias) ===" | Tee-Object -FilePath $ArquivoLog -Append
Set-Location $RaizRepo
npx tsx scripts/deploy-guara-agendado.mts *>> $ArquivoLog
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === FIM DA JANELA DEPLOY-AGENDADO ===" | Tee-Object -FilePath $ArquivoLog -Append
