# Plano de Orquestração Multi-Agente — v2

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [PLANO-ORQUESTRACAO-AGENTES.md](PLANO-ORQUESTRACAO-AGENTES.md), [PLANO-ORQUESTRACAO-DISTRIBUIDA.md](PLANO-ORQUESTRACAO-DISTRIBUIDA.md), [FILA-AGENTES.md](FILA-AGENTES.md), [AGENTS.md](/AGENTS.md), [GUIA-DE-DOCUMENTACAO.md](../GUIA-DE-DOCUMENTACAO.md)
> **Palavras-chave:** orquestracao, agentes, openmausbot, hermes, opencode, antigravity, agy, ollama, deepseek, qwen, glm, sabia, modelos-chineses, dois-pcs, gpu, fila, telegram, acp, dsh

## Sumário

- [Propósito](#propósito)
- [O que muda da v1](#o-que-muda-da-v1)
- [Topologia: dois PCs](#topologia-dois-pcs)
- [Hub: OpenMausBot no lugar do Hermes](#hub-openmausbot-no-lugar-do-hermes)
- [Bots e modelos](#bots-e-modelos)
- [Workflow — 7 fases (herdadas da v1)](#workflow--7-fases-herdadas-da-v1)
- [Comunicação entre os dois PCs](#comunicação-entre-os-dois-pcs)
- [Reaproveitar (não recriar)](#reaproveitar-não-recriar)
- [Pendências](#pendências)
- [Decisões registradas](#decisões-registradas)
- [Origem / Histórico](#origem--histórico)

## Propósito

Orquestrar agentes de IA de origem **chinesa, brasileira e/ou open source** (com
Gemini/Antigravity como exceção declarada) nos dois PCs do dono, sem depender de
Hermes como orquestrador — trocando-o pelo **OpenMausBot** como hub de UI e
aprovação, mantendo os 7 fases e as regras já validadas na v1.

## O que muda da v1

| v1 (2026-10-16, `2c836df`) | v2 (este documento) |
|---|---|
| **Hermes = orquestrador** (instável/lento — medido pelo dono) | **OpenMausBot = hub** (UI multi-bot, approval cards, MCP, CLI headless) |
| Hermes no centro de todas as fases | Hermes **rebaixado a ponte Telegram + memória** — só o que ele faz bem e ninguém mais faz |
| OpenCode Go com `server error` (workaround agy) | OpenCode + **DeepSeek/Qwen/GLM** via OpenRouter ou endpoint direto |
| Modelos mistos (GPT-OSS, solar free) | Matriz fechada: **CN/BR/open + Gemini (exceção)** — sem GPT, Grok, Llama, Mistral |
| Um PC no comando (implícito) | **Dois PCs complementares** (§ Topologia) — home-pc sempre ligado, desktop com a GPU |
| Needle = triagem | Needle **em decisão** (§ Pendências) — manter ou cortar |

O que **não** muda: as 7 fases, os handoffs em `.agents/orquestrador/workflow/`,
worktree por tarefa, as regras de ouro do AGENTS.md, a fila de tarefas e o
modelo de dois PCs idempotentes do PLANO-ORQUESTRACAO-DISTRIBUIDA.

## Topologia: dois PCs

> **Correção sobre a v1 da distribuída:** o Ollama com GPU mora no **desktop**,
> não no home-pc (medido 2026-10-18). A tabela abaixo substitui a de
> `PLANO-ORQUESTRACAO-DISTRIBUIDA.md` § "As duas máquinas".

| | **desktop** (este PC, `X:\DevCoder`) | **home-pc** (`C:\DevCoder`) |
|---|---|---|
| Hardware | **mais memória + GPU** — roda Ollama forte | mais fraco |
| Internet | rápida | **lenta** |
| Uptime | ligado de dia / sob demanda | **geralmente ligado** |
| Papel | **potência**: Ollama local (modelos grandes), builds pesados, benchmark, coleta que exige navegador/portais JS | **disponibilidade**: fila, crons/ETL leve, túnel Cloudflare, Postgres local, ponte Telegram |
| O que NÃO roda aqui | o que precisa de uptime contínuo (túnel, agendador) | o que precisa de GPU ou download pesado |

**Complementariedade além dos agentes:**

1. **home-pc = sempre de pé**: site no ar (túnel), agendador, fila viva, sync incremental leve — mesmo com internet lenta, só trafega texto/commit.
2. **desktop = músculo**: Ollama GPU, `ollama pull`, builds, benchmarks, dados brutos pesados — download pesado só aqui.
3. **Nunca competem**: regra herdada da distribuída — baixa frequência, ociosidade, claim idempotente; cada máquina faz o que só ela consegue.
4. **Desktop desligado ≠ parado**: tarefas que exigem GPU ficam na fila no home-pc e executam quando o desktop abrir (claim registrado, não duplica).
5. **Repo**: checkout único em cada máquina (`X:\DevCoder\controle-popular` no desktop; `C:\DevCoder\controle-popular` no home-pc), sincronizados por git + fila.

## Hub: OpenMausBot no lugar do Hermes

**OpenMausBot** (Apache 2.0, app desktop + harness em `127.0.0.1:8799`) vira a
equipe visível: cada agente da v1 é um **bot no sidebar**, com seu modelo, seu
prompt e seus cards de aprovação.

- **Por que:** o Hermes orquestrando era o gargalo (lento/instável — quebras de
  gateway, echo loops — ver commits `ce8a690`, `690df3d`). OpenMausBot não
  decide nada sozinho: ele só hospeda os CLIs que já funcionam e transforma
  cada ação de risco em card Allow/Deny.
- **O que ele assume:** UI dos 7 fases, aprovação humana (fases AVALIAR e
  ATUALIZAR), roteamento de bot por conversa, MCP server p/ controle externo,
  CLI `openmausbot run --json` p/ CI e rotinas (triggers).
- **O que ele NÃO substitui:** Telegram. OpenMausBot não tem ponte
  Telegram — enquanto não houver alternativa, a ponte fica com o Hermes
  (cron `hermes-telegram-bridge`) ou com `scripts/envia-telegram.py`
  chamado nas fases.
- **Onde roda:** UI no **desktop**; o harness/headless (o que não pode parar)
  pode rodar no **home-pc** quando a UI não for necessária.
- **Engines ACP:** OpenCode, Antigravity (agy), Gemini CLI, Hermes, Qwen, Kimi,
  `customAcp` (qualquer CLI que fale ACP, incl. `dsh --profile acp`).

## Bots e modelos

### Bots (um por engine da v1)

| Bot | Engine | Papel nas fases | Onde |
|---|---|---|---|
| **executor** | OpenCode CLI | EXECUTAR / RE-EXECUTAR (código) | desktop (build) ou home-pc (leve) |
| **planejador** | AGY / Antigravity | SUGERIR / PLANEJAR / AVALIAR criativo | qualquer PC (API) |
| **local** | Ollama | triagem barata, fallback offline | **desktop (GPU)** |
| **ponte** | Hermes | só Telegram + memória (não orquestra) | home-pc (sempre ligado) |
| **dsh** (opcional) | DeepSeek Harness via `dsh --profile acp` | pesado DeepSeek-nativo | decidir |

### Matriz de modelos (fechada)

| Permitido | Origem | Uso |
|---|---|---|
| DeepSeek V4 (Flash/Pro) | CN, MIT | código, raciocínio |
| Qwen3.8 | CN, Apache/MIT | código, multilíngue |
| GLM-5.x / GLM-Flash | CN, MIT | agentes, tool use |
| Kimi K3, MiniMax, MiMo | CN, open weights | alternativas, long-context |
| Sabiá-4 / Sabiazinho-4 (Maritaca) | **BR** | revisão/escrita PT-BR |
| Ollama local (qwen2.5-coder, deepseek-r1…) | open, offline | triagem, fallback |
| **Gemini (via Antigravity/AGY)** | **exceção EUA declarada** | sugestão/planejamento |

**Proibido por enquanto:** GPT, Grok, Llama, Mistral (e não usar engines
Claude/Codex/Grok do OpenMausBot).

**Regra operacional de escolha (dificuldade × custo), 18/10/2026:**
[AGENTS.md §5.15](/AGENTS.md) — barato primeiro no OpenCode Go, reasoning
desligado em tarefa simples, Gemini avançado no Antigravity, e **nunca
ChatGPT** (Claude só exceção temporária se a cota do Gemini acabar).

## Workflow — 7 fases (herdadas da v1)

Fluxo idêntico ao `scripts/orquestrador-ia.py` (o script é subprocess puro —
não depende de qual UI está aberta):

1. **SUGERIR** — planejador (AGY/Gemini) + triagem (local/Needle) → `sugestoes_antigravity.json`
2. **PLANEJAR** — planejador lê `AGENTS.md` → `docs/planos/PLANO-AUTO-<task_id>.yaml`
3. **EXECUTAR** — executor (OpenCode) em worktree isolado (`~/worktrees/<projeto>-task<id>/`)
4. **AVALIAR** — checks determinísticos (`tsc --noEmit`, lint, CodeScene, CPF) **+ card de aprovação no OpenMausBot**
5. **RE-EXECUTAR** — executor corrige, máx. 3 iterações
6. **ATUALIZAR** — commit por pathspec + push; **card de aprovação antes do push**; Telegram notifica
7. **MONITORAR** — planejador busca novidades (modelos open-source, fontes) → `monitoramento.md`

Handoffs continuam em `.agents/orquestrador/workflow/task_<id>/` (Markdown/YAML).

## Comunicação entre os dois PCs

Herdado de `PLANO-ORQUESTRACAO-DISTRIBUIDA.md` — não recriar:

- **Fila viva** ([FILA-AGENTES.md](FILA-AGENTES.md)) como fonte de verdade de trabalho; claim por item, idempotente.
- **Telegram** como canal entre máquinas e com o dono (3 linhas por fase: feito / próximo / risco).
- **git** como sincronização de código (commit por pathspec, mensagem em arquivo, Co-Authored-By).
- **Regra de peso:** home-pc só despacha o que exige GPU/build para o desktop; desktop desligado = item espera na fila com aviso, não falha.

## Reaproveitar (não recriar)

1. `scripts/orquestrador-ia.py` — as 7 fases, intactas (só trocar quem chama no topo, se preciso).
2. Handoffs + worktrees + regras de ouro do `AGENTS.md` (§5.5 pathspec, §5.6 mensagem em arquivo).
3. Smoke tests da v1 §1.1 (`agy -p`, `opencode run`, `ollama list`) — revalidar após a troca de hub.
4. `FILA-AGENTES.md` (donatário + status + notas) e o padrão de claim da distribuída.
5. `PLANO-ORQUESTRACAO-DISTRIBUIDA.md` — princípios (ociosidade, redundância boa, máquina única por capacidade).

## Pendências

- [ ] **Instalar OpenMausBot no desktop** (installer Windows) e criar os 4 bots da tabela.
- [ ] **OpenCode + OpenRouter/chinês**: conectar provider e revalidar `opencode run` com DeepSeek/Qwen/GLM *(o OpenCode Go estava com server error na v1 — testar o caminho novo)*
- [ ] **Needle** — decidir: manter como triagem (26M, barato) ou cortar da matriz. *(aberto desde a v1)*
- [ ] **Antigravity auth** — confirmar `agy` logado nas duas máquinas onde for usado.
- [ ] **Ponte Telegram** — manter Hermes nela ou migrar para `scripts/envia-telegram.py` + triggers do OpenMausBot.
- [ ] **DSH como bot** — avaliar `dsh --profile acp` em `customAcp` (só se o DeepSeek-nativo compensar a instabilidade de preview).
- [ ] ** home-pc**: clonar/actualizar checkout (`C:\DevCoder\controle-popular`) e alinhar a topologia da § Topologia (Ollama GPU saiu daqui).

## Decisões registradas

1. **2026-10-18 — Hermes sai do posto de orquestrador.** Motivo medido: instabilidade e lentidão (quebras de gateway, echo loops, ciclos de 2 min). Função residual: ponte Telegram + memória, enquanto não houver substituto.
2. **2026-10-18 — OpenMausBot é o hub.** Apache 2.0, engines ACP nativas (OpenCode, AGY, Hermes), approval cards em toda ação de risco, CLI headless p/ CI. Se não provar utilidade em 2 semanas, volta para o orquestrador Python puro (o script nunca dependeu de UI).
3. **2026-10-18 — Modelos fechados em CN/BR/open + Gemini (exceção).** Sem GPT, Grok, Llama, Mistral por enquanto.
4. **2026-10-18 — Ollama com GPU mora no desktop** (mais memória/GPU); home-pc = uptime. Corrige a tabela do PLANO-ORQUESTRACAO-DISTRIBUIDA.
5. **2026-10-18 — Dois PCs se complementam além dos agentes:** home-pc = disponibilidade (túnel, fila, crons, Telegram); desktop = potência (GPU, builds, downloads pesados). Regra: nunca competir, sempre claimar.

## Origem / Histórico

- **Absorve:** [PLANO-ORQUESTRACAO-AGENTES.md](PLANO-ORQUESTRACAO-AGENTES.md) (v1, 2026-10-16, commit `2c836df`) — fases, smoke tests, regras.
- **Hereda:** [PLANO-ORQUESTRACAO-DISTRIBUIDA.md](PLANO-ORQUESTRACAO-DISTRIBUIDA.md) (2026-09-30) — dois PCs, fila, ociosidade (com correção da GPU na Decisão 4).
- **Contexto:** discussão de 2026-10-18 sobre OpenMausBot (hub multi-agentes ACP) vs DeepSeek Harness (runtime de agente único) — decisão: OpenMausBot como hub; DSH como bot opcional.
- **Estado da v1:** superada por este documento; manter até a migração do hub ser validada, depois mover para `docs/historico/planos/`.
