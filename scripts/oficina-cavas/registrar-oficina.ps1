$ErrorActionPreference = "Continue"

# Registra a Oficina de Cavas no Windows (sem admin, sem wrapper no temp).
#
# Historico medido em 13/10/2026:
# - schtasks /SC ONLOGON falhou com rc=1 (exige admin nesta maquina);
# - /TR com wrapper .cmd no %TEMP% foi comido pelo Bitdefender (padrao
#   identico ao de ransomware: escrever executavel em temp + registrar
#   persistencia). O Bitdefender comeu inclusive a tarefa e o atalho.
# - Lição: registrar a tarefa apontando DIRETO para python.exe, com os
#   args na linha de comando. Mesmo padrao que ja funciona nas outras
#   rotinas do repo (agendar-tarefas-windows.ps1), que sobreviveram.
#
# Bandeja no logon: pasta Startup do usuario (%APPDATA%\...\Startup).
# NAO usa temp nem wrapper indireto — um .cmd minimo que chama o
# python.exe direto. Com a exclusao do Bitdefender no repo, sobrevive.
#
# Coleta a cada 4h: schtasks /SC MINUTE /MO 240 apontando direto pro
# python. Sem .cmd intermediario. A trava de instancia (estado.py)
# garante que nunca ha duas coletas ao mesmo tempo.

$RaizRepo = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Oficina = Join-Path $RaizRepo "scripts\oficina-cavas"
$Python = "python"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  OFICINA DE CAVAS - REGISTRO (padrao limpo, sem temp)" -ForegroundColor Cyan
Write-Host "  Raiz do repo: $RaizRepo" -ForegroundColor DarkGray
Write-Host "========================================================================`n"

# ─── 1. Bandeja no logon via Startup do usuario ───────────────────────────
$Startup = Join-Path $env:APPDATA `
    "Microsoft\Windows\Start Menu\Programs\Startup"
$Atalho = Join-Path $Startup "oficina-cavas.cmd"
# python.exe direto, args na linha. Sem /min para o uvicorn nascer rapido;
# a janela de console some quando o painel sobe (redireciona saida).
$Conteudo = "@echo off`r`n`"$Python`" `"$Oficina\painel.py`" --sem-browser >nul 2>&1`r`n"
[System.IO.File]::WriteAllText($Atalho, $Conteudo,
    [System.Text.Encoding]::ASCII)
if (Test-Path $Atalho) {
    Write-Host "BANDEJA no logon: OK" -ForegroundColor Green
    Write-Host "  $Atalho" -ForegroundColor DarkGray
} else {
    Write-Host "BANDEJA no logon: FALHOU" -ForegroundColor Yellow
}

# ─── 2. Coleta a cada 4h — DIRETO no python, sem wrapper ──────────────────
$LogDir = Join-Path $RaizRepo "docs\relatorios-automacao\logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}
$LogColeta = Join-Path $LogDir "oficina-coleta.log"
# Comando unico. Conta de caracteres: ~200, dentro do teto de 261 do /TR.
$Comando = "`"$Python`" `"$Oficina\oficina.py`" rodar --estagio coletar --tipo negativo --limite 10 >> `"$LogColeta`" 2>&1"
Write-Host "Comando da coleta ($($Comando.Length) chars):" -ForegroundColor DarkGray
Write-Host "  $Comando" -ForegroundColor DarkGray

Write-Host "`nRegistrando COLETA a cada 4h (direto no python)..." -ForegroundColor Cyan
& schtasks.exe /Create /TN "ControlePopular_OficinaCavas_Coleta" `
    /TR $Comando /SC MINUTE /MO 240 /F | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK" -ForegroundColor Green
} else {
    Write-Host "  FALHOU (rc=$LASTEXITCODE)" -ForegroundColor Yellow
}

Write-Host "`nFeito." -ForegroundColor Cyan
Write-Host "Bandeja: proximo logon abre o painel (localhost:8787)." -ForegroundColor DarkGray
Write-Host "Coleta: a cada 4h, silenciosa, com trava de instancia." -ForegroundColor DarkGray
Write-Host "Painel manual: python scripts\oficina-cavas\painel.py" -ForegroundColor DarkGray
