# PLANO — Canário Telegram v2 (funções novas + integração opencode)

> **Tipo:** PLANO
> **Domínio:** global (operações)
> **Criado:** 2026-08-25 · **Status:** em execução (F0 ✅, F3 ✅, F2 ✅ observação + aprovação remota opt-in)
> **Relacionados:** [GATILHO-REMOTO.md](../05-operacao/GATILHO-REMOTO.md), [OPERACAO.md](../05-operacao/OPERACAO.md)

## Sumário

- [Visão geral](#visão-geral)
- [Fase 0 — Base única](#fase-0--base-única)
- [Fase 1 — Comandos novos no gatilho](#fase-1--comandos-novos-no-gatilho)
- [Fase 2 — Integração opencode](#fase-2--integração-opencode)
- [Fase 3 — Wrapper universal](#fase-3--wrapper-universal)
- [Fase 4 — Proativos](#fase-4--proativos)
- [Segurança transversal](#segurança-transversal)

## Visão geral

O canário passa de "avisos pontuais" para **canal bidirecional entre o dono e
as sessões opencode**, com todo comando longo instrumentado de graça:

```
Dono (celular) ⇅ Telegram ⇅ gatilho-remoto (long-poll, home-pc)
                              ├─ /status /testes /build /deploy /ia
                              └─ ponte de arquivos ⇄ plugin opencode
Sessões opencode ── plugin canario-telegram.ts ──┘ (erros, pedidos de permissão)
Qualquer comando longo ── executar-com-canario.mts ──┘ (início/fim/falha)
```

## Fase 0 — Base única

`scripts/canario/telegram.ts`: fonte única de `enviarMensagem()` e
`listarUpdates()`, lendo `scripts/.env` uma vez. Anti-flood (intervalo mínimo
entre envios), truncamento em 4.000 caracteres, kill-switch `CANARIO_OFF=1`.
CLIs existentes (`avisar-telegram`, `ler-updates-telegram`) viram cascas finas
sobre o módulo. O gatilho-remoto migra para ele na Fase 1.

## Fase 1 — Comandos novos no gatilho

Mapa `COMANDOS` estendido (o gatilho já nasceu para isso):

| Comando | Ação | Guarda |
|---|---|---|
| `/status` v2 | git (branch/ahead/último commit), data do último deploy, HTTP do site, disco, processos node | — |
| `/testes [filtro]` | vitest assíncrono | lock de 1 execução |
| `/build` | `rotina-local --so-build` | árvore suja aborta |
| `/deploy` | publica | dupla confirmação (`/confirmar deploy`) |
| `/ia <pergunta>` | `opencode run "<pergunta>"` headless, resposta ≤ 4 KB | timeout 10 min |
| `/help` | lista | — |

Fila com lock: um comando pesado por vez.

## Fase 2 — Integração opencode

Plugin auto-descoberto `.opencode/plugin/canario-telegram.ts`:

| Hook | Comportamento |
|---|---|
| `event` | sessão com erro → alerta no Telegram (throttle 1/min) |
| `permission.ask` | 🔐 envia ferramenta + argumentos; dono responde `/ok <id>` / `/negar <id>`; plugin consulta `respostas.log` e resolve. Opt-in por `CANARIO_APROVACAO_REMOTA=1`; sem a variável, apenas observa. Timeout = negar |

Ponte com o gatilho por arquivos (`pending/` e `respostas.log` em
`.opencode/canario/`) — mesma máquina, latência de segundos. O gatilho ganhou
passthrough de `/ok`/`/negar` (não colide com os comandos existentes).

**Requer reiniciar o opencode** após criar o plugin (config não é hot-reload).

## Fase 3 — Wrapper universal

`scripts/executar-com-canario.mts "<cmd>" [--limite-min N]`: avisa início,
grava log em `%TEMP%\canario\`, reporta fim/falha + duração + últimas 15
linhas. Usado pelo gatilho e manualmente por qualquer sessão.

## Fase 4 — Proativos

Heartbeat diário 09h (git/site/disco) via Agendador; alerta quando o próprio
gatilho reiniciar.

## Segurança transversal

Somente o chat allowlisted (`TELEGRAM_CHAT_ID`); mutantes sempre com
confirmação em duas etapas; `opencode run` herda as permissões do projeto;
credenciais ficam nos `.env` ignorados pelo git; nada disso entra no bundle
do Worker (é tooling local do home-pc).
