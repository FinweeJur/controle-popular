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

# A coleta mensal precisa disparar so no dia 01: schtasks nao tem /SC MONTHLY
# simples assim — o script interno ja se guarda. Recriar com /SC MONTHLY /D 01.
Write-Host "`nColeta mensal limitada ao dia 01 via guarda interna do proprio script." -ForegroundColor DarkGray
Write-Host "Atencao: os .ps1 PRECISAM de BOM UTF-8 (PowerShell 5.1 corrompe acento sem BOM e a task morre em silencio — ver commit 0aa6a06)." -ForegroundColor Magenta
