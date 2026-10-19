# Gera o relatorio diario da Secretaria e entrega no Telegram.
#
# Papel no projeto: rodar sozinho as 19:45 pelo Agendador de Tarefas, sem
# depender do app aberto e sem card de aprovacao. Plano em
# docs/planos/RELATORIO-DETERMINISTICO.md.
#
# Decisoes: nada de segredo aqui (o token vive em scripts/.env, lido pelo
# notificar-telegram.mjs); falha na entrega nao apaga o relatorio, que fica
# gravado em ultimo-relatorio.txt.

$repo = 'X:\DevCoder\controle-popular'
$py = 'C:\Users\teste\AppData\Local\Programs\Python\Python312\python.exe'
$casa = 'C:\Users\teste\.config\mausbot'
$log = Join-Path $casa 'relatorio-diario.log'
$saida = Join-Path $casa 'ultimo-relatorio.txt'

if (-not (Test-Path $casa)) { New-Item -ItemType Directory -Path $casa -Force | Out-Null }
"$(Get-Date -Format o) inicio" | Add-Content $log

$texto = & $py (Join-Path $repo 'scripts\secretaria\relatorio-diario.py') 2>&1 | Out-String
if (-not $texto.Trim()) {
    "$(Get-Date -Format o) relatorio vazio: nada enviado" | Add-Content $log
    exit 1
}
$texto | Set-Content $saida -Encoding utf8
"$(Get-Date -Format o) relatorio gerado ($($texto.Length) caracteres)" | Add-Content $log

$envFile = Join-Path $repo 'scripts\.env'
if (Test-Path $envFile) {
    $res = & node (Join-Path $repo 'scripts\notificar-telegram.mjs') $texto 2>&1 | Out-String
    "$(Get-Date -Format o) telegram: $($res.Trim())" | Add-Content $log
} else {
    "$(Get-Date -Format o) scripts/.env ausente: entrega no Telegram pulada (relatorio em $saida)" | Add-Content $log
}
"$(Get-Date -Format o) fim" | Add-Content $log
