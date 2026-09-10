$ErrorActionPreference = "Continue"

$RaizRepo = Resolve-Path (Join-Path $PSScriptRoot "..")
$P = Join-Path $RaizRepo "scripts"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  AGENDAMENTO DA ESTEIRA NOTURNA - WINDOWS TASK SCHEDULER" -ForegroundColor Cyan
Write-Host "  Ordem registrada pelo dono em 04/09/2026: deploy as 05:50, report 06:30" -ForegroundColor Cyan
Write-Host "========================================================================`n"

$Tarefas = @(
    @{ Nome = "ControlePopular_PaginasModelo_0100";       Hora = "01:00"; Script = "executar-rotina-paginas.ps1";    Desc = "Manifestos e paginas-modelo" },
    @{ Nome = "ControlePopular_ColetorNoticias_0230";     Hora = "02:30"; Script = "executar-rotina-noticias.ps1";   Desc = "Noticias e diarios" },
    @{ Nome = "ControlePopular_PicoClaw_Madrugada";       Hora = "03:30"; Script = "executar-rotina-madrugada.ps1";  Desc = "Saude das fontes + linkmender + coletas" },
    @{ Nome = "ControlePopular_Hermes_Manha";             Hora = "05:30"; Script = "executar-rotina-manha.ps1";      Desc = "Sondagens e auditoria" },
    @{ Nome = "ControlePopular_AutoDeploy_0550";          Hora = "05:50"; Script = "executar-rotina-meianoite.ps1";  Desc = "Build + deploy (era meia-noite; movida a pedido do dono 04/09)" },
    @{ Nome = "ControlePopular_TelegramReport_0630";      Hora = "06:30"; Script = "executar-rotina-telegram.ps1";   Desc = "Relatorio ao dono (com retry no .mts)" },
    @{ Nome = "ControlePopular_ColetaMensal_Dia01";       Hora = "04:00"; Script = "executar-rotina-mensal.ps1";     Desc = "Coleta mensal, dia 01" }
    # Radar de editais (DOMG-e): roda o .mts direto (sem wrapper .ps1), porque
    # o log dele e simples (uma rodada, um resumo no fim) — registrado no bloco
    # proprio abaixo, no padrao do VigiaServidor. 04:20 fica no buraco entre a
    # coleta da madrugada (03:30) e a sondagem da manha (05:30); a coleta mensal
    # das 04:00 so age no dia 01, entao nao colide de verdade. O radar faz UMA
    # edicao por rodada com pausa de 1,5 s entre requests — carga desprezivel.
    # Se o dono quiser calibrar o limiar de score, acrescente --limiar N na
    # linha de comando do bloco abaixo.
    # @{ Nome = "ControlePopular_RadarEditais";             Hora = "04:20"; Script = "radar-editais-diarios.mts";      Desc = "Radar de editais do DOMG-e" }
)

foreach ($T in $Tarefas) {
    $Script = Join-Path $P $T.Script
    $Comando = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Script`""
    Write-Host "Registrando $($T.Nome) as $($T.Hora) - $($T.Desc)..."
    & schtasks.exe /Create /TN $T.Nome /TR $Comando /SC DAILY /ST $T.Hora /F | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK" -ForegroundColor Green
    } else {
        Write-Host "  FALHOU (rc=$LASTEXITCODE)" -ForegroundColor Yellow
    }
}

# ─── Vigia do servidor (plano PLANO-RESILIENCIA-BOTS, item 1) ─────────────
# Cada 5 minutos. Os incidentes de 01/09 e 08/09/2026: next start morreu e
# ninguem viu. O vigia reinicia (cap de 3/hora) e avisa o Telegram.
Write-Host "`nRegistrando VIGIA do servidor (cada 5 min)..." -ForegroundColor Cyan
$VigiaCmd = "cmd.exe /c cd /d `"$RaizRepo`" && npx tsx scripts/vigia-servidor.mts"
& schtasks.exe /Create /TN "ControlePopular_VigiaServidor_5min" /TR $VigiaCmd /SC MINUTE /MO 5 /F | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Host "  OK" -ForegroundColor Green } else { Write-Host "  FALHOU (rc=$LASTEXITCODE)" -ForegroundColor Yellow }

# ─── Radar de editais do DOMG-e (docs/planos/RADAR-EDITAIS-DIARIOS.md) ─────
# Diario, 04:20. Varre a edicao do dia do Jornal Minas Gerais atras de editais
# de interesse social e grava rascunhos em apps/web/data/radar-editais/pendentes/.
# NAO publica no blog — a publicacao e papel do publicar-radar-editais.mts,
# manual (decisao do dono). Log: docs/relatorios-automacao/logs/rotina-radar-editais.log.
# Registrado pela primeira vez em 10/09/2026 (a task ja existe na maquina).
Write-Host "Registrando RADAR DE EDITAIS (diario, 04:20)..." -ForegroundColor Cyan
$RadarCmd = "cmd.exe /c cd /d `"$RaizRepo`" && npx tsx scripts/radar-editais-diarios.mts >> docs\relatorios-automacao\logs\rotina-radar-editais.log 2>&1"
& schtasks.exe /Create /TN "ControlePopular_RadarEditais" /TR $RadarCmd /SC DAILY /ST 04:20 /F | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Host "  OK" -ForegroundColor Green } else { Write-Host "  FALHOU (rc=$LASTEXITCODE)" -ForegroundColor Yellow }

# ─── Drill mensal (item 6): derruba o next start no dia 01 para o vigia ───
# Provar em treino o que o vigia promete em guerra (SRE Workbook, Failure
# Friday). O script se guarda: so age no dia 01; schtasks nao tem /SC MONTHLY
# simples aqui, entao roda diario e o script ignora os outros dias.
Write-Host "Registrando DRILL mensal de falha (dia 01, 12:10)..." -ForegroundColor Cyan
$DrillCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$P\executar-drill-failure.ps1`""
& schtasks.exe /Create /TN "ControlePopular_DrillFalha_Dia01" /TR $DrillCmd /SC DAILY /ST 12:10 /F | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Host "  OK" -ForegroundColor Green } else { Write-Host "  FALHOU (rc=$LASTEXITCODE)" -ForegroundColor Yellow }

# A coleta mensal precisa disparar so no dia 01: schtasks nao tem /SC MONTHLY
# simples assim — o script interno ja se guarda. Recriar com /SC MONTHLY /D 01.
Write-Host "`nColeta mensal limitada ao dia 01 via guarda interna do proprio script." -ForegroundColor DarkGray
Write-Host "Atencao: os .ps1 PRECISAM de BOM UTF-8 (PowerShell 5.1 corrompe acento sem BOM e a task morre em silencio — ver commit 0aa6a06)." -ForegroundColor Magenta
