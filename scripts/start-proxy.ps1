$root = "X:\DevCoder\OpenCode\controle-popular"
$log = Join-Path $root "proxy.log"
$err = Join-Path $root "proxy.err"
Remove-Item $log, $err -Force -ErrorAction SilentlyContinue
$p = Start-Process -FilePath "node" -ArgumentList @(
  'C:\nodejs\node_modules\@guaracloud\cli\bin\run.js',
  'proxy',
  '--project', 'controle-popular',
  '--service', 'cp-postgres-597bd0',
  '--local-port', '15432'
) -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError $err -PassThru
Start-Sleep -Seconds 7
Write-Host "PID=$($p.Id) HasExited=$($p.HasExited)"
$c = Get-NetTCPConnection -LocalPort 15432 -State Listen -ErrorAction SilentlyContinue
if ($c) { Write-Host "LISTEN pid=$($c.OwningProcess)" } else { Write-Host "NOT LISTENING" }
if (Test-Path $log) { Write-Host "---log---"; Get-Content $log -Tail 15 }
if (Test-Path $err) { Write-Host "---err---"; Get-Content $err -Tail 15 }
