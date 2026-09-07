# ==============================================================================
# Execução da Automação do Treino Sabiá 7B (00:00 Meia-Noite até 12:00 Meio-Dia)
# ==============================================================================
# Inicia a esteira de fine-tuning QLoRA e destilação do Sabiá 7B (Seu Nonô)
# e despacha o relatório consolidado com os resultados para o Telegram às 12:00.

$ErrorActionPreference = "Continue"
$RaizRepo = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $RaizRepo "docs\relatorios-automacao\logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$DataHoje = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ArquivoLog = Join-Path $LogDir "rotina-treino-sabia_$DataHoje.log"

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === DISPARANDO ESTEIRA DO SABIÁ 7B (MEIA-NOITE) ===" | Tee-Object -FilePath $ArquivoLog

Set-Location $RaizRepo

# 1. Executa pipeline de treinamento e avaliação
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 1/2. Executando treinamento e validação factual..." | Tee-Object -FilePath $ArquivoLog -Append
python scripts/treinar-sabia-automacao.py *>> $ArquivoLog

# 2. Envia relatório para o Telegram
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 2/2. Enviando relatório consolidado para o Telegram..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/enviar-report-sabia-telegram.mts *>> $ArquivoLog

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === ROTINA DO SABIÁ CONCLUÍDA ===" | Tee-Object -FilePath $ArquivoLog -Append
