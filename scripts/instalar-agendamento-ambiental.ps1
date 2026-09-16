# instalar-agendamento-ambiental.ps1 — registra as rotinas de coleta ambiental
# no Agendador de Tarefas do Windows (schtasks) da máquina que publica (home-pc).
#
# Rodar UMA vez na home-pc (como Administrador):
#   powershell -ExecutionPolicy Bypass -File scripts\instalar-agendamento-ambiental.ps1
#
# Pré-condições que o instalador não cria nem testa:
#   - node/npx no PATH (o mesmo usado pelo rotina-local)
#   - scripts/.env com TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID (telemetria do orquestrador)
#   - `py` no PATH (ou defina RADAR_PYTHON nas variáveis da tarefa)
#
# Cadências (comentário vivo no topo de scripts/rotina-ambiental.mts):
#   ibama-licen semanal qui 04h | ibama-autos mensal dia 5
#   ana mensal dia 10 | sigmine semanal dom 03h
#
# Desinstalar: cada tarefa tem nome CP-ambiental-*; para remover:
#   schtasks /Delete /TN <nome> /F

$Raiz = Split-Path -Parent $PSScriptRoot
$Comando = "cmd /c cd /d `"$Raiz`" && npx tsx scripts/rotina-ambiental.mts --fonte"

$Tarefas = @(
  @{ Nome = "CP-ambiental-sigmine";     Fonte = "sigmine";     SC = "WEEKLY";  D = "DOM"; Hora = "03:00" },
  @{ Nome = "CP-ambiental-ibama-licen"; Fonte = "ibama-licen"; SC = "WEEKLY";  D = "QUI"; Hora = "04:00" },
  @{ Nome = "CP-ambiental-ibama-autos"; Fonte = "ibama-autos"; SC = "MONTHLY"; D = "5";   Hora = "04:00" },
  @{ Nome = "CP-ambiental-ana";         Fonte = "ana";         SC = "MONTHLY"; D = "10";  Hora = "04:00" }
)

foreach ($t in $Tarefas) {
  $sch = $Comando + $t.Fonte
  schtasks /Create /TN $t.Nome /TR $sch /SC $t.SC /D $t.D /ST $t.Hora /F
  if ($LASTEXITCODE -eq 0) {
    Write-Output "Registro feito: $($t.Nome) ($($t.SC) dia $($t.D) $($t.Hora))"
  } else {
    Write-Output "FALHOU: $($t.Nome) — conferir PATH de npx e executar como Administrador"
  }
}

Write-Output ""
Write-Output "Conferência final:"
schtasks /Query /FO LIST /TN CP-ambiental-sigmine, CP-ambiental-ibama-licen 2>$null
Get-ScheduledTask -TaskName "CP-ambiental-*" | Format-Table TaskName, State -AutoSize
