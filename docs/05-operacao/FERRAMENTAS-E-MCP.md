# Ferramentas de CLI e MCP

> **Tipo:** GUIA
> **Domínio:** global (operação, CodeScene, Guara, Neon, GitHub)
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [OPERACAO.md](OPERACAO.md), [HOTSPOTSCODESCENE-08-10.md](/docs/historico/planos/HOTSPOTSCODESCENE-08-10.md)
> **Palavras-chave:** ferramentas, cli, guara, neonctl, gh, codescene, mcp, trivy, secrets

## Sumário

- [Ferramentas de CLI](#ferramentas-de-cli)
- [CodeScene MCP (medido em 09/10/2026)](#codescene-mcp-medido-em-09102026)

## Ferramentas de CLI

CLI desta máquina, medido em 19/09:

| Ferramenta | O que faz | Exemplo |
|---|---|---|
| `guara` 0.3.0 | CLI do Guara Cloud: deploy, env, domains, logs | `guara env set -b KEY=valor` |
| `neonctl` 5.0.0 | CLI da Neon: connection string, branches | `neonctl cs` |
| `gh` 2.96 | CLI do GitHub: secrets, workflows | `gh secret set KEY --body "..."` |
| `cs` 1.0.49 | CLI do CodeScene: análise de dívida local | `cs version` |

**`cs docs <tópico>` — a ajuda embutida do CodeScene** (medido 09/10/2026;
não exige rede):

```bash
cs docs git-hooks                        # o hook de pré-commit, com exemplo
cs docs interactive                      # hook que pergunta antes de bloquear
cs docs pre-commit-hook-example          # imprime o hook pronto pra copiar
cs docs code-health-rules                # como ajustar as regras de saúde
cs docs code-health-rules-template       # imprime o .codescene a completar
cs docs custom-quality-gates-template    # imprime os portões de PR
cs docs file-name                        # linguagens que o `cs` entende
cs docs license                          # onde o token vive
```

Tópicos com `cs docs <t> --help` não existem — `--help` é só nos comandos.

Anotações:

- `guara security findings` está quebrado (pacote faltando no CLI). O scan
  válido é `guara services vulnerabilities` (Trivy — scanner de imagem).
- Secrets do repo: `GITHUB` via `gh secret list`. **`GUARA_API_KEY` já
  secretada** (19/09).
- `DATABASE_URL` vive no painel do Guara (runtime **e** build, flag `-b`).
  A string da Neon se recupera com `neonctl connection-string`.
- Segredos nunca vão para o repositório nem para prints. Deny rules ativas.

## CodeScene MCP (medido em 09/10/2026)

- **O que é:** o servidor MCP `@codescene/codehealth-mcp` entrega a análise
  de saúde do código do CodeScene (offer do GitHub Student Pack): pontos
  quentes (hotspots), saúde por arquivo e guarda antes de commit. Sobe com
  `npx -y @codescene/codehealth-mcp`; **a primeira chamada baixa um binário
  de ~83 MB** e por isso pode demorar ou falhar uma vez (`spawn UNKNOWN`) —
  a segunda já sai na hora.
- **Como chamar:** o opencode registra o MCP `codescene`, que roda
  `scripts/mcp-codescene.ps1`. O wrapper lê `CS_ACCESS_TOKEN` de
  `scripts/.env` (gitignorado) e **nunca imprime o valor** (§5.8). A config
  mora em `C:\Users\teste\.config\opencode\opencode.json` e **só recarrega
  com restart do opencode**.
- **Ferramentas que a sessão deve usar antes de refatorar:**
  `verify_installation` (passe **sempre** `git_repository_path`, senão ele
  responde `missing field git_repository_path`),
  `list_technical_debt_hotspots_for_project` (projeto **85760**),
  `code_health_score`, `code_health_review`, `code_ownership_for_path`
  (dono/bus factor), `analyze_change_set` (saúde do diff da branch),
  `pre_commit_code_health_safeguard` (guarda antes do commit),
  `list_technical_debt_goals_for_project`.
  Economia de token (§5.12): `CS_DEFAULT_PROJECT_ID=85760` e
  `CS_ENABLED_TOOLS` na config abrem só o que a sessão usa.
- **Projeto:** `controle-popular`, id **85760**. Sessão autenticada por PAT
  (`CS_ACCESS_TOKEN`, na lista de `env_var` do `get_config`).
- **Refatorar por dado, não por intuição:** leia os hotspots e a saúde do
  arquivo antes de escolher o que mexer, e registre a leitura em um doc.
  Duas leituras já registradas:
  [PENDENCIAS-07-10.md](/docs/historico/planos/PENDENCIAS-07-10.md) e
  [HOTSPOTSCODESCENE-08-10.md](/docs/historico/planos/HOTSPOTSCODESCENE-08-10.md).

## Origem / Histórico

Movido do AGENTS.md §10 em 18/10/2026, sem perda de texto.
