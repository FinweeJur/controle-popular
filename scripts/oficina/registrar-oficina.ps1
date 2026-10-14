$ErrorActionPreference = "Continue"

# Registra a Oficina de Cavas no Windows (sem exigir admin).
#
# O dono pediu (13/10/2026): "sempre que esse PC ligar, abrir um programa
# na barra de tarefas inferior". O "programa" e o painel.py — servidor
# localhost:8787 + icone de bandeja (pystray).
#
# Por que NAO usamos schtasks /SC ONLOGON para a bandeja: criar tarefa de
# logon exige privilegios de administrador e falhou com rc=1 nesta maquina
# (medido 13/10/2026). A pasta Startup do usuario faz o mesmo sem admin:
# qualquer .cmd/.vbs ali roda no logon do proprio usuario.
#
# Por que wrapper curto para a coleta: o schtasks limita /TR a 261
# caracteres, e o caminho completo do repo + args + log passa disso
# (medido 13/10, rc=-2147467259). O wrapper .cmd no %TEMP% resolve.

$RaizRepo = Resolve-Path (Join-Path $PSScriptRoot "..")
$Oficina = Join-Path $RaizRepo "scripts\oficina"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  OFICINA DE CAVAS - REGISTRO NO WINDOWS (sem admin)" -ForegroundColor Cyan
Write-Host "========================================================================`n"

# ─── 1. Bandeja no logon via pasta Startup do usuario ─────────────────────
# shell:startup = %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
$Startup = Join-Path $env:APPDATA `
    "Microsoft\Windows\Start Menu\Programs\Startup"
$Atalho = Join-Path $Startup "oficina-cavas.cmd"
# Wrapper .cmd minimalista: esconde a janela e sobe o painel.py.
$Conteudo = "@echo off`r`nstart `"`" /min python `"$Oficina\painel.py`" --sem-browser`r`n"
[System.IO.File]::WriteAllText($Atalho, $Conteudo,
    [System.Text.Encoding]::ASCII)
if (Test-Path $Atalho) {
    Write-Host "BANDEJA no logon: OK ($Atalho)" -ForegroundColor Green
} else {
    Write-Host "BANDEJA no logon: FALHOU" -ForegroundColor Yellow
}

# ─── 2. Coleta a cada 4h via schtasks + wrapper curto ─────────────────────
# Wrapper no %TEMP% (caminho curto) que chama o oficina.py com args.
$WrapDir = Join-Path $env:TEMP "oficina"
if (-not (Test-Path $WrapDir)) { New-Item -ItemType Directory -Path $WrapDir -Force | Out-Null }
$Wrap = Join-Path $WrapDir "coleta.cmd"
$LogDir = Join-Path $RaizRepo "docs\relatorios-automacao\logs"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$LogColeta = Join-Path $LogDir "oficina-coleta.log"
# O wrapper ja redireciona o log; o /TR do schtasks fica curto.
$WrapConteudo = "@echo off`r`ncd /d `"$RaizRepo`" && python `"$Oficina\oficina.py`" rodar --estagio coletar --tipo negativo --limite 10 >> `"$LogColeta`" 2>&1`r`n"
[System.IO.File]::WriteAllText($Wrap, $WrapConteudo,
    [System.Text.Encoding]::ASCII)

Write-Host "`nRegistrando COLETA a cada 4h..." -ForegroundColor Cyan
& schtasks.exe /Create /TN "ControlePopular_OficinaCavas_Coleta" `
    /TR "`"$Wrap`"" /SC MINUTE /MO 240 /F | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK (wrapper: $Wrap)" -ForegroundColor Green
} else {
    Write-Host "  FALHOU (rc=$LASTEXITCODE)" -ForegroundColor Yellow
}

Write-Host "`nFeito." -ForegroundColor Cyan
Write-Host "Bandeja: aparece no proximo logon (pasta Startup, sem admin)." -ForegroundColor DarkGray
Write-Host "Coleta: a cada 4h; trava de instancia impede duas ao mesmo tempo." -ForegroundColor DarkGray
Write-Host "Painel manual: python scripts\oficina\painel.py" -ForegroundColor DarkGray
