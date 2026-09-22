param([switch]$StartOnly)
$root = "X:\DevCoder\OpenCode\controle-popular"
$log = Join-Path $root "proxy.log"
$err = Join-Path $root "proxy.err"

# Kill existing proxies
Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -match 'run\.js proxy' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2
Get-NetTCPConnection -LocalPort 15432 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1

Remove-Item $log, $err -Force -ErrorAction SilentlyContinue
$p = Start-Process -FilePath "node" -ArgumentList @(
  'C:\nodejs\node_modules\@guaracloud\cli\bin\run.js',
  'proxy',
  '--project', 'controle-popular',
  '--service', 'cp-postgres-597bd0',
  '--local-port', '15432'
) -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError $err -PassThru

$deadline = (Get-Date).AddSeconds(15)
$listen = $null
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Milliseconds 500
  $listen = Get-NetTCPConnection -LocalPort 15432 -State Listen -ErrorAction SilentlyContinue
  if ($listen) { break }
}

Write-Host "PROXY_PID=$($p.Id) HasExited=$($p.HasExited)"
if ($listen) {
  Write-Host "LISTEN pid=$($listen.OwningProcess)"
} else {
  Write-Host "NOT LISTENING"
}
if (Test-Path $log) { Write-Host "---log---"; Get-Content $log -Tail 20 }
if (Test-Path $err) { Write-Host "---err---"; Get-Content $err -Tail 20 }
