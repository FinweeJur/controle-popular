$ErrorActionPreference = "Continue"

# Registra a Oficina de Cavas no Agendador de Tarefas do Windows.
#
# O dono pediu (13/10/2026): "sempre que esse PC ligar, abrir um programa
# na barra de tarefas inferior" que rode coleta, análise, separação e mostre
# os logs. O "programa na barra de tarefas" e o painel.py — ele sobe o
# servidor localhost:8787 E o icone de bandeja (pystray).
#
# Por que ONLOGON e nao ONSTART: o painel abre o navegador e usa o perfil do
# usuario (modelos em %TEMP%, cache de cavas em %USERPROFILE%). Em ONSTART
# (antes do login) nao ha perfil de usuario nem bandeja visivel.
#
# Duas tarefas:
#   1. ControlePopular_OficinaCavas_Bandeja — no logon, sobe o painel
#      (bandeja + servidor). Start only, sem repeticao: e um app, nao um job.
#   2. ControlePopular_OficinaCavas_Coleta  — a cada 4h, roda a coleta em
#      silencio (sem bandeja), com trava de instancia. A coleta longa nao
#      deve depender do painel aberto.

$RaizRepo = Resolve-Path (Join-Path $PSScriptRoot "..")
$Oficina = Join-Path $RaizRepo "scripts\oficina"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  OFICINA DE CAVAS - AGENDADOR DE TAREFAS (WINDOWS)" -ForegroundColor Cyan
Write-Host "  Bandeja no logon + coleta a cada 4h. Trava de instancia no oficina.py" -ForegroundColor Cyan
Write-Host "========================================================================`n"

# ─── 1. Bandeja + painel no logon ──────────────────────────────────────────
# Abre o painel (icone de bandeja + localhost:8787). Start only.
Write-Host "Registrando BANDEJA no logon..." -ForegroundColor Cyan
$PainelPy = Join-Path $Oficina "painel.py"
$BandejaCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$PainelPy`""
& schtasks.exe /Create /TN "ControlePopular_OficinaCavas_Bandeja" /TR $BandejaCmd /SC ONLOGON /F | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Host "  OK" -ForegroundColor Green } else { Write-Host "  FALHOU (rc=$LASTEXITCODE)" -ForegroundColor Yellow }

# ─── 2. Coleta em background a cada 4h ─────────────────────────────────────
# Roda oficina.py rodar --estagio coletar --tipo negativo --limite 10.
# A trava de instancia (estado.py) garante que nunca ha duas coletas.
# Log em docs/relatorios-automacao/logs/oficina-coleta.log (mesmo padrao das
# outras rotinas da esteira noturna).
Write-Host "`nRegistrando COLETA a cada 4h..." -ForegroundColor Cyan
$OficinaPy = Join-Path $Oficina "oficina.py"
$LogDir = Join-Path $RaizRepo "docs\relatorios-automacao\logs"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$LogColeta = Join-Path $LogDir "oficina-coleta.log"
$ColetaCmd = "cmd.exe /c cd /d `"$RaizRepo`" && python `"$OficinaPy`" rodar --estagio coletar --tipo negativo --limite 10 >> `"$LogColeta`" 2>&1"
& schtasks.exe /Create /TN "ControlePopular_OficinaCavas_Coleta" /TR $ColetaCmd /SC MINUTE /MO 240 /F | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Host "  OK" -ForegroundColor Green } else { Write-Host "  FALHOU (rc=$LASTEXITCODE)" -ForegroundColor Yellow }

Write-Host "`nFeito. A bandeja aparece no proximo logon." -ForegroundColor Cyan
Write-Host "Painel: http://127.0.0.1:8787 (só neste PC, sem acesso externo)." -ForegroundColor DarkGray
Write-Host "Coleta: a cada 4h em background; trava impede duas ao mesmo tempo." -ForegroundColor DarkGray
Write-Host "Atencao: .ps1 precisa de BOM UTF-8 (PowerShell 5.1 corrompe acento sem BOM)." -ForegroundColor Magenta
