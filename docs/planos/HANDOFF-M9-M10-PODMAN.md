# Handoff M9/M10 — changedetection.io e n8n em Podman

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-08-31
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [PLANO-M7-M11-CURADORIA-OSS.md](PLANO-M7-M11-CURADORIA-OSS.md), [AGENTS.md](/AGENTS.md), [ESTADO.md](../02-estado/ESTADO.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [GATILHO-CONTEXT.md](../../scripts/GATILHO-CONTEXT.md), [executar-rotina-madrugada.ps1](../../scripts/executar-rotina-madrugada.ps1), [executar-rotina-manha.ps1](../../scripts/executar-rotina-manha.ps1)
> **Palavras-chave:** podman, changedetection, n8n, docker, container, agendamento, telegram, wsl2, monitoramento, handoff

## Sumário

- [Propósito](#propósito)
- [Estado do bloco — medições de 31/08](#estado-do-bloço--medições-de-3108)
- [Pré-requisitos](#pré-requisitos)
- [M9 — changedetection.io](#m9--changedetectionio)
- [M10 — n8n](#m10--n8n)
- [Riscos e regras](#riscos-e-regras)
- [Decisões registradas](#decisões-registradas)
- [Origem / Histórico](#origem--histórico)

## Propósito

Handoff operacional para a sessão que for executar M9 (changedetection.io) e M10 (n8n) quando o Podman existir na máquina. Tudo que foi medido, decidido e mapeado em 31/08 está aqui — quem pegar este documento não precisa redescobrir nada, só executar.

## Estado do bloco — medições de 31/08

- `docker: not found` e `podman: not found` na máquina de desenvolvimento.
- `wsl --list --quiet` → **Ubuntu presente** (backend WSL2 pronto).
- **Decisão do dono (31/08): containers = Podman, não Docker Desktop** — daemonless, rootless, sem licença restritiva nem daemon de VM com privilégios.
- O agendamento atual (PowerShell + rotinas) **funciona e é testado diariamente** — nada de M9/M10 substitui nada até validar no lugar.
- Os 6 itens M1–M6 e os M7/M8/M11 já foram entregues; M8 (brasil.io) segue pendente de token (ver ESTADO.md, itens 32–35).

## Pré-requisitos

- [ ] **Podman Desktop instalado pelo dono** (Windows, backend WSL2/Ubuntu) e `podman --version` respondendo.
- [ ] Portas livres na máquina: **5000** (changedetection) e **5678** (n8n) — conferir com `Get-NetTCPConnection -LocalPort 5000,5678`.
- [ ] `scripts/.env` com `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` (já existe — é o canário; ver `scripts/.env.exemplo`). **Nunca versionar.**
- [ ] **Decisão do dono (pendente): onde vivem os segredos do n8n** — n8n tem credential store próprio dentro do container; a alternativa é o n8n executar comandos que leem `scripts/.env` (o segredo nunca entra no n8n). Recomendado: **segredos ficam em `scripts/.env`, o n8n só executa comandos** — assim o container não carrega token nenhum.
- [ ] **Decisão do dono (pendente): versionar os workflows do n8n?** (export JSON em `scripts/n8n-workflows/` para rastreabilidade) — recomendado, mas não obrigatório.

## M9 — changedetection.io

### Instalação (quando o Podman existir)

```bash
podman volume create changedetection-data
podman run -d --name changedetection --restart=unless-stopped \
  -p 5000:5000 -v changedetection-data:/datastore \
  dgtlmoon/changedetection.io
```

Primeiro acesso em `http://localhost:5000` (sem login por padrão — instalação local).

### Watches iniciais (URLs medidas em 31/08)

| Watch | URL | O que detectar | Filtro sugerido |
|---|---|---|---|
| LAI CGE-MG (portal Angular) | `http://acessoainformacao.mg.gov.br/sistema/site/busca_decisao.aspx` | novos recursos de LAI decididos — o PicoClaw não renderiza JS, por isso este watch existe | texto "novo" / contagem de resultados |
| SIGBM — barragens ANM | `https://dadosabertos.anm.gov.br` | mudança no cadastro de barragens (CRI/DPA/nível de emergência) | JSONPath no campo `total_barragens` ou `nivel_emergencia` |
| IBAMA — licenças e autuações | `https://dados.gov.br/dados/conjuntos-dados/licencas-ambientais` | nova publicação de licença/autuação | lista de recursos do dataset |

### Alerta Telegram

- changedetection.io tem notificação nativa para Telegram: configurar no watch com `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`.
- ⚠️ O token entra como configuração do serviço local, **nunca no repositório** (mesma regra do `scripts/.env`).
- Alternativa: webhook para o canário do `gatilho-remoto.mts` (tailnet) — mais trabalho, sem token fora do `.env`.

### Verificação

1. Criar watch de teste numa página que muda com frequência.
2. Mudar o conteúdo de uma URL controlada (ex.: arquivo local servido em HTTP) e confirmar a notificação.
3. Confirmar que o container **não** sobe na CI — serviço local do home-pc, só.

## M10 — n8n

### Instalação (quando o Podman existir)

```bash
podman volume create n8n-data
podman run -d --name n8n --restart=unless-stopped \
  -p 5678:5678 -v n8n-data:/home/node/.n8n \
  -e GENERIC_TIMEZONE=America/Sao_Paulo \
  docker.io/n8nio/n8n
```

Primeiro acesso em `http://localhost:5678` (criar conta de usuário local — não é conta em nuvem).

### Workflows a criar

**Workflow `madrugada` (Cron 03:30)** — espelha `scripts/executar-rotina-madrugada.ps1`:

| Passo | Comando (Execute Command) |
|---|---|
| 1. PicoClaw | `npx tsx scripts/agent-tools/picoclaw-source-watcher.mts` |
| 2. Argus | `npx tsx scripts/agent-tools/argus-page-checker.mts` |
| 3. LinkMender | `npx tsx scripts/agent-tools/linkmender-checker.mts` |
| 4. Coletas | `npx tsx scripts/rotina-coletas.mts --listar` |
| 5. Privacidade | `python scripts/checar-dado-pessoal-em-dado.py` |

**Workflow `manha` (Cron 05:30)** — espelha `scripts/executar-rotina-manha.ps1`:

| Passo | Comando (Execute Command) |
|---|---|
| 1. Hermes | `npx tsx scripts/agent-tools/hermes-security-auditor.mts` |
| 2. DocVault | `npx tsx scripts/agent-tools/docvault-downloader.mts` |
| 3. Colibri | `npx tsx scripts/colibri-bridge.mts --tudo` |

**Workflow `alerta-disponibilidade`**: condicional sobre `picoclaw-fontes-status.json` — se `taxaDisponibilidade < 70%`, Telegram node envia alerta (mesmos token/chat do canário).

### Contingência e regras

- **Os scripts PowerShell não são apagados** — viram contingência documentada; rollback = reagendar as tarefas do Windows (ver `scripts/agendar-tarefas-windows.ps1`).
- Executar cada workflow manualmente UMA vez (botão "Execute") e comparar os relatórios com a última rodada das rotinas (timestamps em `docs/relatorios-automacao/`).
- Só depois de 3 madrugadas/manhãs seguidas sem divergência, desativar o agendador do Windows.

### Verificação

1. Workflow `madrugada` executado à mão → relatórios gerados com timestamp de hoje.
2. `alerta-disponibilidade` testado com limiar artificial (0.5) → mensagem no Telegram.
3. Container reiniciado (`podman restart n8n`) → workflows persistem (volume).

## Riscos e regras

- **Nunca** `podman run` com `--privileged` nem expor portas além de 5000/5678 (máquina local, mas a regra do repositório vale: superfície mínima).
- **Segredos** (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, tokens de API) nunca entram no repositório nem em prompts de IA — ver [AGENTS.md](/AGENTS.md) "Agentes de IA e Privacidade".
- **Prioridade**: o agendador atual continua sendo a fonte da verdade até a validação de 3 dias; M9/M10 não quebram as rotinas.
- **Fora da CI**: changedetection e n8n são serviços locais do home-pc, nunca GitHub Actions.
- Se o Podman falhar na instalação (WSL2 kernel desatualizado é o problema clássico), registrar o erro exato e **voltar ao agendador atual** — não há pressa.

## Decisões registradas

- **Containers = Podman, não Docker Desktop** (dono, 31/08) — daemonless/rootless, sem licença restritiva; WSL2/Ubuntu já presente.
- **Segredos fora do n8n** (recomendação deste handoff, confirmação do dono pendente): o n8n só executa comandos; tokens ficam em `scripts/.env`.
- **Versionar workflows do n8n em `scripts/n8n-workflows/`** (recomendação, confirmação do dono pendente).
- **changedetection e n8n são serviços locais** — nunca CI.

## Origem / Histórico

Handoff gerado em 31/08/2026 ao fechar a rodada M7–M11 ([PLANO-M7-M11-CURADORIA-OSS.md](PLANO-M7-M11-CURADORIA-OSS.md)). M9/M10 permanecem bloqueados por infra (Podman não instalado); este documento é o ponto de retomada quando o pré-requisito existir.
