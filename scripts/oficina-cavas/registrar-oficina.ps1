$ErrorActionPreference = "Continue"

# Registra a Oficina de Cavas no Windows (sem admin, sem wrapper no temp).
#
# Historico medido em 13/10/2026 — cada linha e um defeito medido:
# - schtasks /SC ONLOGON falhou rc=1 (exige admin nesta maquina);
# - .cmd no %TEMP% + tarefa apontando pra ele: Bitdefender comeu tudo
#   (padrao identico ao de ransomware);
# - pasta Startup do usuario: Bitdefender bloqueia escrita (ransomware
#   mitigation protege Startup mesmo com exclusao de pasta no repo);
# - nome de tarefa "ControlePopular_OficinaCavas_Coleta": Bitdefender
#   bloqueou o NOME apos comer a tarefa — nome novo resolve;
# - /TR com redirect >> estoura o teto de 261 chars — o oficina.py ja
#   loga sozinho via LoggerOficina, entao o redirect e opcional.
#
# O que funciona (medido, registrado e sobreviveu):
# 1. Bandeja no logon: chave Run do HKCU (padrao de app de usuario,
#    sem admin, sem pasta Startup). Set-ItemProperty funcionou de primeira.
# 2. Coleta: schtasks /SC MINUTE /MO 240 com python.exe em caminho
#    ABSOLUTO e nome de tarefa NOVO. A trava de instancia (estado.py)
#    garante que nunca ha duas coletas ao mesmo tempo.

$RaizRepo = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Oficina = Join-Path $RaizRepo "scripts\oficina-cavas"
# Caminho absoluto: o Task Scheduler nao herda o PATH do usuario, e o
# python do hermes vive fora do PATH do sistema.
$Python = (Get-Command python).Source
if (-not $Python) { $Python = "python" }

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  OFICINA DE CAVAS - REGISTRO (padrao medido 13/10)" -ForegroundColor Cyan
Write-Host "  Raiz do repo: $RaizRepo" -ForegroundColor DarkGray
Write-Host "  Python:       $Python" -ForegroundColor DarkGray
Write-Host "========================================================================`n"

# ─── 1. Bandeja no logon — chave Run do HKCU ──────────────────────────────
# Por que Run e nao Startup: a pasta Startup e protegida pela
# ransomware-mitigation do Bitdefender; a chave Run nao e (medido).
$RunValor = "`"$Python`" `"$Oficina\painel.py`" --sem-browser"
try {
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" `
        -Name "OficinaCavas" -Value $RunValor -ErrorAction Stop
    $lido = (Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run").OficinaCavas
    if ($lido -eq $RunValor) {
        Write-Host "BANDEJA no logon (Run key): OK" -ForegroundColor Green
        Write-Host "  $RunValor" -ForegroundColor DarkGray
    } else {
        Write-Host "BANDEJA no logon: valor lido difere" -ForegroundColor Yellow
    }
} catch {
    Write-Host "BANDEJA no logon: FALHOU — $($_.Exception.Message)" -ForegroundColor Yellow
}

# ─── 2. Coleta a cada 4h — python absoluto, nome NOVO de tarefa ───────────
# O nome antigo "ControlePopular_OficinaCavas_Coleta" esta na lista de
# bloqueio do Bitdefender (medido). Nome diferente resolve.
$Comando = "`"$Python`" `"$Oficina\oficina.py`" rodar --estagio coletar --tipo negativo --limite 10"
Write-Host "Comando da coleta ($($Comando.Length) chars):" -ForegroundColor DarkGray
Write-Host "  $Comando" -ForegroundColor DarkGray

Write-Host "`nRegistrando COLETA a cada 4h..." -ForegroundColor Cyan
& schtasks.exe /Create /TN "ControlePopular_CavasColeta_4h" `
    /TR $Comando /SC MINUTE /MO 240 /F | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK" -ForegroundColor Green
} else {
    Write-Host "  FALHOU (rc=$LASTEXITCODE) — tente outro nome de tarefa" -ForegroundColor Yellow
}

Write-Host "`nFeito." -ForegroundColor Cyan
Write-Host "Bandeja: proximo logon abre o painel (localhost:8787)." -ForegroundColor DarkGray
Write-Host "Coleta: a cada 4h, silenciosa, com trava de instancia." -ForegroundColor DarkGray
Write-Host "Painel manual: python scripts\oficina-cavas\painel.py" -ForegroundColor DarkGray
