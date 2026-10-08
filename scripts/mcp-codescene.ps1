<#
  scripts/mcp-codescene.ps1 — wrapper do servidor MCP do CodeScene para o opencode.

  O que é: ponte entre o opencode e o `@codescene/codehealth-mcp` (analisador de
  saude do codigo do CodeScene, offer do GitHub Student Pack). Ferramentas que
  ele abre: pontos quentes (hotspots) da analise na nuvem, saude de cada arquivo
  e guarda antes de commit.

  Por que existe este arquivo: o token (PAT) precisa chegar ao processo por
  variavel de ambiente, mas a fonte da verdade e `scripts/.env` (gitignorado).
  O opencode so interpola `{env:VAR}`/`{file:path}` — `{file}` devolveria o
  arquivo INTEIRO, com todos os segredos de uma vez. Este wrapper extrai so a
  chave `CS_ACCESS_TOKEN` e nunca imprime valor nenhum no terminal nem no log
  (AGENTS 5.8: segredo nao sai do disco).

  Decisoes tecnicas:
  - Leitura tolerante a CRLF e a BOM: o AGENTS.md 6 mediu que PowerShell
    `Set-Content -Encoding UTF8` e Notepad gravam BOM, que faz regex com `$`
    nao casar — por isso removemos `\uFEFF` antes de casar e usamos split por
    `\r?\n`.
  - `-NoProfile -NonInteractive`: o wrapper roda como processo filho do MCP;
    banner de perfil ou pergunta travaria o handshake stdio.
  - `CS_DISABLE_VERSION_CHECK=1`: evita chamada de rede a cada subida, que em
    rede restrita atrasa o MCP sem ganho nenhum.

  Uso: chamado pelo `opencode.json` (usuario) — nao e para rodar na mao.
  Parametro: nenhum. Retorna: codigo de saida do `npx`.
#>
param()

$ErrorActionPreference = "Stop"

$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    try {
        # UTF-8 sem BOM ou com BOM; CRLF ou LF — os dois casos medidos no repo.
        $conteudo = [System.IO.File]::ReadAllText($envFile)
        $conteudo = $conteudo -replace "^\uFEFF", ""
        foreach ($linha in ($conteudo -split "`r?`n")) {
            $m = [regex]::Match($linha, '^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$')
            if (-not $m.Success) { continue }
            $nome  = $m.Groups[1].Value
            $valor = $m.Groups[2].Value.Trim().Trim('"').Trim("'")
            if ($nome -eq "CS_ACCESS_TOKEN" -and $valor.Length -gt 0) {
                $env:CS_ACCESS_TOKEN = $valor
            }
        }
    }
    catch {
        # Erro de leitura nunca derruba o MCP: sem token ele segue em modo local
        # (saude de arquivo e guarda de commit continuam de pe).
        Write-Warning "scripts/.env ilegivel; seguindo sem CS_ACCESS_TOKEN."
    }
}

$env:CS_DISABLE_VERSION_CHECK = "1"
npx -y @codescene/codehealth-mcp
exit $LASTEXITCODE
