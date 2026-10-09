<#
  scripts/enviar-continuidade-homepc.ps1 — empacota e envia ao Home-PC pelo
  Tailscale os arquivos que o repositório NÃO versiona.

  Por que este arquivo existe (regra do dono, 09/10/2026): o trabalho tem de
  continuar em outra sessão e em outra máquina. Tudo que está no Git chega
  por `git pull`; o que NÃO chega são os segredos, porque o .gitignore
  segura eles de propósito (AGENTS 5.8). Só sobra o fio privado do Tailscale.

  O que sai daqui, e por quê:
    - scripts/.env            credenciais dos bots, do CodeScene e do R2;
    - apps/web/.env.local     DATABASE_URL (Heroku), HEROKU_API_KEY, chaves de IA;
    - opencode.json           registro do MCP codescene, que é por máquina.

  Decisões técnicas:
  - O script NUNCA imprime valor: só nome de arquivo e tamanho. Medir segredo
    no terminal já custou caro uma vez (AGENTS 10: `guara env list` só com
    máscara).
  - Ele BLOQUEIA se o Home-PC estiver offline: `tailscale file cp` falharia
    no meio e deixaria a metade entregue, que é pior que não entregar.
  - Sai com código 2 quando a máquina não responde, para a rotina chamadora
    poder reprogramar a tentativa sem confundir com erro de arquivo.
  - Cada etapa é uma função nomeada, e o escopo global só chama. Não é
    estética: o hook do CodeScene barrou a primeira versão com
    "Global Conditionals" (complexidade 20 no global, limite 10). Lógica
    solta no topo não tem onde ser medida em pedaços.

  Uso: powershell -File scripts\enviar-continuidade-homepc.ps1
  Parâmetros: nenhum. Retorna: 0 enviado, 2 destino offline, 3 arquivo ausente.
#>
param()

$ErrorActionPreference = "Stop"

# ────────────────────── o que sai daqui ──────────────────────
# Constantes de topo: atribuição pura, nenhuma condicional.
$Destino = "Home-PC"
$AliasDestino = "controle-popular-continuidade"

# A raiz do monorepo fica dois níveis acima de scripts/ (repo/scripts/...).
$Raiz = Split-Path -Parent $PSScriptRoot

$Arquivos = @(
    @{ Rotulo = "scripts/.env";        Relativo = "scripts\.env" },
    @{ Rotulo = "apps/web/.env.local"; Relativo = "apps\web\.env.local" },
    @{ Rotulo = "opencode.json (MCP)"; Absoluto = (Join-Path $env:USERPROFILE ".config\opencode\opencode.json") }
)

<#
  Monta a lista de raízes onde procurar os arquivos de segredo.

  Os .env são GITIGNORED: não viajam com o clone e não estão em todo
  worktree. Medido 09/10: dentro de um worktree faltam os dois, e eles só
  existem no checkout PRINCIPAL. Daí procurar no worktree E na raiz comum
  de git.

  Retorna: array de caminhos absolutos.
#>
function Obter-Candidatos {
    $lista = @($Raiz)

    $comum = git rev-parse --git-common-dir 2>$null
    if ($comum) {
        # `--git-common-dir` volta ABSOLUTO num worktree (`X:/.../.git`) e
        # RELATIVO no checkout principal (`.git`). Juntar um absoluto com
        # Join-Path fabrica uma rota lixo — medido 09/10. Daí checar a raiz
        # antes de juntar.
        if ([System.IO.Path]::IsPathRooted($comum)) {
            $raizComum = Split-Path -Parent $comum
        } else {
            $raizComum = Split-Path -Parent (Join-Path $Raiz $comum)
        }

        if ($raizComum -and $raizComum -ne $Raiz) { $lista += $raizComum }
    }

    return $lista
}

<#
  Resolve o primeiro lugar onde o arquivo existe.

  Parâmetros:
    $relativo  — caminho relativo à raiz do monorepo (ex.: scripts\.env)
    $candidatos — raízes a testar, na ordem

  Retorna: caminho absoluto, ou $null se não houver em nenhuma raiz.
#>
function Localizar([string]$relativo, [array]$candidatos) {
    foreach ($raizCand in $candidatos) {
        $p = Join-Path $raizCand $relativo
        if (Test-Path -LiteralPath $p) { return $p }
    }
    return $null
}

<#
  Confere se a máquina de destino está na rede e de pé.

  Sai do script com 3 se o Tailscale não responder ou a máquina não existir,
  e com 2 se existir mas estiver offline — o chamador precisa distinguir
  "erro" de "esperar e tentar de novo".

  Retorna: o par (objeto do tailscale) quando está online.
#>
function Garantir-DestinoOnline([string]$nome) {
    $status = tailscale status --json 2>$null | ConvertFrom-Json
    if (-not $status) {
        Write-Host "X Tailscale nao respondeu. Instalou e entrou na rede?"
        exit 3
    }

    $par = Encontrar-Par $status $nome
    if (-not $par) {
        Write-Host "X Maquina '$nome' nao aparece no tailnet."
        Write-Host "  Maquinas vistas agora:"
        Listar-Pares $status
        exit 3
    }

    if (-not $par.Online) {
        Write-Host "X $nome esta OFFLINE (ultimo contato: $($par.LastSeen))."
        Write-Host "  Nada foi enviado. Ligue a maquina e rode de novo."
        exit 2
    }

    Write-Host "OK $nome online ($($par.TailscaleIPs[0]))."
    return $par
}

<#
  Procura um par pelo nome da máquina, sem diferenciar maiúscula de minúscula
  (o tailnet grava "Home-PC" e o usuário digita "home-pc").
  Retorna: o par, ou $null.
#>
function Encontrar-Par($status, [string]$nome) {
    foreach ($p in $status.Peer.PSObject.Properties.Value) {
        if ($p.HostName -ieq $nome) { return $p }
    }
    return $null
}

<#
  Imprime a lista de máquinas vistas no tailnet — só para quem precisa saber
  qual nome digitar. Nome de máquina não é segredo; valor de credencial é.
#>
function Listar-Pares($status) {
    foreach ($p in $status.Peer.PSObject.Properties.Value) {
        Write-Host "   - $($p.HostName) (online=$($p.Online))"
    }
}

<#
  Preenche `Origem` em cada arquivo e aborta com 3 se algum faltar.

  Parâmetros:
    $arquivos   — a lista declarada no topo, com `Origem` ainda vazia
    $candidatos — raízes aonde procurar

  Retorna: a mesma lista, pronta para o envio.
#>
function Resolver-Arquivos([array]$arquivos, [array]$candidatos) {
    $faltando = @()

    foreach ($a in $arquivos) {
        if ($a.Absoluto) {
            $a.Origem = $a.Absoluto
        } else {
            $a.Origem = Localizar $a.Relativo $candidatos
        }
        if (-not $a.Origem) { $faltando += $a.Rotulo }
    }

    if ($faltando.Count -gt 0) {
        Write-Host "X Faltando nesta maquina:"
        $faltando | ForEach-Object { Write-Host "   - $_" }
        Write-Host "  Lugares procurados:"
        $candidatos | ForEach-Object { Write-Host "   - $_" }
        Write-Host "  Sem eles nao da para continuar do zero no outro PC."
        exit 3
    }

    foreach ($a in $arquivos) {
        Write-Host "achado $($a.Rotulo) em: $(Split-Path -Parent $a.Origem)"
    }
    return $arquivos
}

<#
  Envia os arquivos um por vez.

  Um por vez de propósito: se um falhar, os anteriores já chegaram e o log
  diz exatamente onde parou. O envio é idempotente — rodar de novo sobrepõe.

  Retorna: número de arquivos que NÃO chegaram (0 = tudo certo).
#>
function Enviar-Tudo([array]$arquivos) {
    $erros = 0

    foreach ($a in $arquivos) {
        $tamanho = (Get-Item -LiteralPath $a.Origem).Length
        $nomeArquivo = Split-Path -Leaf $a.Origem
        Write-Host -NoNewline "Enviando $($a.Rotulo) ($tamanho bytes) ... "

        $falhou = Invoke-Envio $a.Origem $nomeArquivo
        if ($falhou) {
            Write-Host "FALHOU"
            $erros++
        } else {
            Write-Host "ok"
        }
    }

    return $erros
}

<#
  Chama o `tailscale file cp` e devolve se falhou.

  O try/catch existe porque o comando não instalado vira exceção, não código
  de saída — sem isso o script quebraria com erro feio em vez de relatar.

  Retorna: $true se falhou, $false se enviou.
#>
function Invoke-Envio([string]$origem, [string]$nomeArquivo) {
    try {
        tailscale file cp $origem "${Destino}:${AliasDestino}-${nomeArquivo}"
        return ($LASTEXITCODE -ne 0)
    } catch {
        Write-Host -NoNewline "($($_.Exception.Message)) "
        return $true
    }
}

<#
  Encaminho final: diz o que faltou e o que fazer no destino.
  Retorna: o código de saída do script.
#>
function Fechar([int]$erros) {
    Write-Host ""

    if ($erros -gt 0) {
        Write-Host "$erros arquivo(s) nao chegaram. Rode de novo; o envio e idempotente."
        return 3
    }

    Write-Host "Tudo entregue. No Home-PC, retire com:"
    Write-Host "  tailscale file get <pasta>"
    Write-Host "Coloque cada arquivo no lugar dele e rode:"
    Write-Host "  git config core.hooksPath .githooks"
    return 0
}

# ────────────────────── roda ──────────────────────
# Escopo global: só chamadas, sem condicional nenhum.
$candidatos = Obter-Candidatos
Garantir-DestinoOnline $Destino | Out-Null
$arquivos = Resolver-Arquivos $Arquivos $candidatos
$erros = Enviar-Tudo $arquivos
exit (Fechar $erros)
