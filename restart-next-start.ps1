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
Write-Output 'next dev reiniciado'
