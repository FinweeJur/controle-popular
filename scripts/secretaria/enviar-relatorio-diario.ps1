# Gera o relatorio diario da Secretaria e entrega no Telegram.
#
# Papel no projeto: rodar sozinho as 19:45 pelo Agendador de Tarefas, sem
# depender do app aberto e sem card de aprovacao. Plano em
# docs/planos/RELATORIO-DETERMINISTICO.md.
#
# Entrega em tres degraus, do mais direto ao mais tolerante:
#   1. scripts/.env do repo (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID) via
#      notificar-telegram.mjs;
#   2. `hermes send -t telegram`, que reusa as credenciais do Hermes
#      (util quando o bot e o hermeszin BR ja configurado na maquina);
#   3. sem credencial nenhuma: grava o relatorio em ultimo-relatorio.txt.
# Nada de segredo neste arquivo; o token nunca e impresso.

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

$enviado = $false

# Degrau 1: credenciais do proprio repo.
$envFile = Join-Path $repo 'scripts\.env'
if (-not $enviado -and (Test-Path $envFile)) {
    $res = & node (Join-Path $repo 'scripts\notificar-telegram.mjs') $texto 2>&1 | Out-String
    "$(Get-Date -Format o) telegram (repo): $($res.Trim())" | Add-Content $log
    if ($res -match 'enviado com sucesso') { $enviado = $true }
}

# Degrau 2: credenciais do Hermes (hermeszin BR, quando configurado).
if (-not $enviado) {
    $hermes = Get-Command hermes -ErrorAction SilentlyContinue
    if ($hermes) {
        $res2 = & $hermes.Source send -t telegram -f $saida 2>&1 | Out-String
        "$(Get-Date -Format o) telegram (hermes): $($res2.Trim())" | Add-Content $log
        if ($res2 -notmatch 'not configured|nao configurado') { $enviado = $true }
    } else {
        "$(Get-Date -Format o) hermes ausente do PATH" | Add-Content $log
    }
}

if (-not $enviado) {
    "$(Get-Date -Format o) sem credencial de Telegram: relatorio em $saida" | Add-Content $log
}
"$(Get-Date -Format o) fim" | Add-Content $log
