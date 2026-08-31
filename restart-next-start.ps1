$procs = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*next dev*' }
foreach ($p in $procs) {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
}
Write-Output ('parados: ' + @($procs).Count)
Start-Sleep -Seconds 2
Start-Process -FilePath "C:\DevCoder\controle-popular\node_modules\.bin\next.cmd" `
  -ArgumentList "dev","-p","3000" `
  -WorkingDirectory "C:\DevCoder\controle-popular\apps\web" `
  -WindowStyle Hidden
Write-Output 'next dev reiniciado — aguardando 10s para warmup...'
Start-Sleep -Seconds 10
Start-Process -FilePath "C:\Users\Home\AppData\Local\hermes\node\node.exe" `
  -ArgumentList "C:\DevCoder\controle-popular\node_modules\tsx\dist\cli.mjs","C:\DevCoder\controle-popular\scripts\warmup-dev.mts","3000" `
  -WorkingDirectory "C:\DevCoder\controle-popular\apps\web" `
  -WindowStyle Hidden
Write-Output 'warmup em background'
