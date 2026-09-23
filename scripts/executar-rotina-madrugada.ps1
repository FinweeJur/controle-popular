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
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 1/6. Executando PicoClaw Source Watcher..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/agent-tools/picoclaw-source-watcher.mts *>> $ArquivoLog

# 2. Executa verificacao de paginas do portal via Argus
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 2/6. Executando Argus Page Checker..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/agent-tools/argus-page-checker.mts *>> $ArquivoLog

# 3. Varredura de links externos via LinkMender checker (relatorio so)
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 3/6. Executando LinkMender Checker..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/agent-tools/linkmender-checker.mts *>> $ArquivoLog

# 3b. LinkMender PR — se a camada mudou, abre branch + PR com label bot/linkmender
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 3b/6. Executando LinkMender PR..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/agent-tools/linkmender-pr.mts *>> $ArquivoLog

# 4. Executa coletas automatizadas das fontes prioritarias
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 4/6. Executando rotina de coletas automatizadas..." | Tee-Object -FilePath $ArquivoLog -Append
npx tsx scripts/rotina-coletas.mts --listar *>> $ArquivoLog

# 5. Varredura obrigatoria de privacidade (Mod-11 CPF)
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 5/6. Varredura de privacidade mod-11..." | Tee-Object -FilePath $ArquivoLog -Append
python scripts/checar-dado-pessoal-em-dado.py *>> $ArquivoLog

# 6. Commit dos relatorios da rotina (pathspec explicito, mensagem -F)
Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] 6/6. Commit de relatorios (se houver diff)..." | Tee-Object -FilePath $ArquivoLog -Append
$diffRel = git status --porcelain -- docs/relatorios-automacao/
if ($diffRel) {
    $msg = Join-Path $env:TEMP "msg-rotina-madrugada.txt"
    Set-Content -Path $msg -Value @(
        "rotina: atualiza relatorios da madrugada",
        "",
        "Saida da rotina local (LinkMender, Argus, PicoClaw).",
        "",
        "Co-Authored-By: opencode <noreply@github.com>"
    ) -Encoding utf8
    git add -- docs/relatorios-automacao/
    git commit --only docs/relatorios-automacao/ -F $msg
} else {
    Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] sem diff em docs/relatorios-automacao." | Tee-Object -FilePath $ArquivoLog -Append
}

Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] === ROTINA DE MADRUGADA CONCLUIDA ===" | Tee-Object -FilePath $ArquivoLog -Append
