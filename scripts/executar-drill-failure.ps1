# executar-drill-failure.ps1 — drill mensal de falha (PLANO-RESILIENCIA-BOTS, item 6)
# Derruba o next start no DIA 01 para provar, em treino, o que o vigia
# promete em guerra (SRE Workbook: Failure Friday). Meta declarada no plano:
# site de volta em menos de 10 minutos.
# So age no dia 01 — a task roda diario porque o schtasks desta maquina nao
# tem /SC MONTHLY confiavel (mesmo padrao da rotina mensal).
# ASCII apenas: PowerShell 5.1 corrompe acento sem BOM e a task morre em silencio.
$hoje = Get-Date
if ($hoje.Day -ne 1) { exit 0 }

$log = Join-Path $env:TEMP "drill-failure.log"
"$(Get-Date -Format s) drill: derrubando next start da porta 3000" | Add-Content $log

$pid3000 = (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
if (-not $pid3000) {
    "$(Get-Date -Format s) drill: porta 3000 livre (site ja fora) - nada a derrubar" | Add-Content $log
    exit 0
}

$nome = (Get-Process -Id $pid3000 -ErrorAction SilentlyContinue).ProcessName
if ($nome -ne "node") {
    "$(Get-Date -Format s) drill: porta ocupada por $nome (nao e node) - NAO toco" | Add-Content $log
    exit 0
}

Stop-Process -Id $pid3000 -Force
"$(Get-Date -Format s) drill: next start (pid $pid3000) derrubado. O vigia deve restaurar e avisar no Telegram em menos de 10 min." | Add-Content $log
