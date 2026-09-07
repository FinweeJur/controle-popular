$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File C:\DevCoder\controle-popular\scripts\executar-treino-sabia-meianoite.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At "00:00"
Register-ScheduledTask -TaskName "Controle Popular - Treino Sabia 7B" -Action $action -Trigger $trigger -Force
Write-Output "Tarefa agendada com sucesso para as 00:00 (Meia-Noite) diariamente!"
