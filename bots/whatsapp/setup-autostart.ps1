# bots/whatsapp/setup-autostart.ps1 — Configura autostart do bot WhatsApp no Windows.
#
# Cria uma tarefa no Agendador de Tarefas que inicia o bot no logon do usuário,
# sem abrir janela (runsilently). Requer o binário compilado.
#
# Uso:
#   cd bots/whatsapp
#   go build -o whatsapp-bot .
#   ./setup-autostart.ps1

param(
    [string]$BotDir = (Get-Location).Path,
    [string]$Binary = (Join-Path $BotDir "whatsapp-bot")
)

if (-not (Test-Path $Binary)) {
    Write-Error "Binário não encontrado: $Binary. Compile primeiro: go build -o whatsapp-bot ."
    exit 1
}

$TaskName = "WhatsappBot-Hermes"
$ScriptPath = Join-Path $BotDir "start.bat"

# Cria a tarefa no Task Scheduler: roda no logon, sem janela, reinposta automaticamente
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$ScriptPath`""
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Seconds 30)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
    -Settings $settings -Principal $principal -Description "Bot WhatsApp via whatsmeow — responder grupos pelo Hermes Agent"

Write-Host "✅ Tarefa '$TaskName' criada no Agendador de Tarefas."
Write-Host "   O bot iniciará automaticamente no próximo logon."
Write-Host "   Gerenciar: taskschd.msc → Tarefas Agendadas → $TaskName"
