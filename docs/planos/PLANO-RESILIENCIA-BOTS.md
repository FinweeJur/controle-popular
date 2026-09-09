# Plano — Resiliência dos bots de automação (retry, fallback, melhoria)

> **Tipo:** PLANO
> **Domínio:** operação do projeto
> **Última medição:** 2026-09-09
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [OPERACAO](../05-operacao/OPERACAO.md), [ESTADO](../02-estado/ESTADO.md), [PLANO-AUTOMACAO-LOCAL](../05-operacao/PLANO-AUTOMACAO-LOCAL.md), [LinkMender v2](../relatorios-automacao/linkmender-v2-propostas.md), [orcamento-egress](../../apps/web/scripts/orcamento-egress.mts)
> **Palavras-chave:** retry, backoff, jitter, fallback, watchdog, heartbeat, incidente, telegram, quarentena, drill
> **Fontes consultadas (2026-09-09):** Google SRE Book cap. 22 (Addressing Cascading Failures), SRE Workbook cap. 9 (Incident Response), AWS Builders' Library (Exponential Backoff and Jitter — a referência que o SRE cita)

## Sumário

- [Diagnóstico — os 3 incidentes reais que este plano impede](#diagnóstico)
- [O que já existe (não reinventar)](#o-que-já-existe)
- [O que a pesquisa manda (resumo das fontes)](#o-que-a-pesquisa-manda)
- [O que se aplica aqui — plano em 6 itens, por prioridade](#o-que-se-aplica-aqui)
- [O que NÃO se aplica aqui — e por quê (crítica)](#o-que-no-se-aplica-aqui)
- [Ordem de execução](#ordem-de-execução)

## Diagnóstico

Três incidentes reais, todos com dano mensurado. O plano se justifica por eles,
não por teoria:

| Data | Incidente | Custo | O que faltava |
|---|---|---|---|
| 07/08/2026 | Neon: 5,73 GB de egress em 7 dias, 9 rebuilds, 6 falharam tarde | site fora (402) | orçamento de build + trava |
| 01/09/2026 | deploy quebrou no upload (DNS para api.cloudflare.com); `next start` morto | site 502 | vigia do servidor |
| 08/09/2026 | `next start` morreu de novo, sem ninguém saber | site 502 (achado pelo dono, não pelo sistema) | vigia do servidor + heartbeat |

⚠️ O padrão dos dois últimos é o mesmo: **o processo mais importante do site
não tinha supervisor**. Ninguém percebeu a morte — foi o dono quem viu.

## O que já existe

Inventário medido em 09/09. O plano **não duplica** nada disto:

| Mecanismo | Onde | Estado |
|---|---|---|
| Retry com backoff + histórico JSONL | PicoClaw (`agent-tools/picoclaw-source-watcher.mts`) | ✅ já implementado |
| Checkpoint retomável por fonte | coletores (estudos-rurais, SIGPub etc.) | ✅ |
| Fail-closed (recusa com árvore suja / sem credencial) | `gatilho-remoto.mts` | ✅ |
| Travas de contagem de páginas (piso 1.000, queda máxima) | `rotina-local.mts` | ✅ |
| Checagem de saúde pós-publicação (HTTP 200 até 90 s) | `rotina-local.mts` `publicarTunel()` | ✅ (novidade de 08/09) |
| Orçamento de egress (85% build / 15% tráfego) | `apps/web/scripts/orcamento-egress.mts` | ✅ |
| Camada de correção de links com critérios | LinkMender v2 (58 testes) | ✅ |
| Trava de banco local (build nunca aponta p/ Neon) | `rotina-local.mts` + carregadores | ✅ |
| Guardas de dado pessoal (mod-11, pre-push, CI) | 3 scripts sincronizados | ✅ |
| CI reinicia ETL falhado na próxima rodada | comentários dos workflows | ✅ |

## O que a pesquisa manda

**Google SRE (cap. 22 — falhas em cascata):**
- Retry **sempre com backoff exponencial randomizado (jitter total)** — sem
  jitter, uma rede oscilando faz todos os bots tentar no mesmo instante e
  multiplica a falha
- **Limitar tentativas por requisição** e ter **orçamento de retry global por
  processo** ("só 60 retries/min; estourou, falha e segue")
- **Separar erro retentável** (5xx, 429, rede) **de erro permanente** (400,
  403, 404 — retry nunca vai consertar)
- Health checks, e **mitigação genérica antes da causa raiz** (reverter para a
  última versão boa é melhor que ficar depurando com o site fora)

**AWS Builders' Library (backoff com jitter):** *full jitter* (espera aleatória
entre 0 e 2^n segundos, com teto) é a política que melhor evita sincronização
de tentativas; backoff cresce até um **cap** (ex.: 60 s), não infinito.

**SRE Workbook (cap. 9 — resposta a incidentes):**
- Declarar o incidente **cedo e sempre**; prioridade 1 é **mitigar**, não
  entender
- **Treinar antes** (drills): quem nunca derrubou o sistema em treino erra na
  hora real
- Pós-mortem **sem culpados**, com uma ação concreta por incidente

## O que se aplica aqui

### ✅ 1. Vigia do servidor (P0 — mata os dois incidentes de 502)

**Executado em 09/09:** `scripts/vigia-servidor.mts` + tarefa agendada
`ControlePopular_VigiaServidor_5min`. Reinício via `publicarTunel()` (cap de
3/hora) + Telegram. **Drill real de 09/09:** servidor derrubado de propósito,
restaurado pelo vigia — e o treino pegou DOIS bugs antes do incêndio (aspas do
`cmd` e caminho de `logs/` com um `..` a mais). O gatilho remoto também ganhou
heartbeat e o vigia denuncia quando ele para.

**O que é:** tarefa agendada do Windows rodando a cada 5 minutos. Confere
`http://127.0.0.1:3000`; se não responder 200:
1. Reinicia o servidor (mesma lógica do `publicarTunel()` — reaproveitar)
2. Avisa o Telegram (o dono é o primeiro a saber, nunca o último)

**Guarda obrigatória (orçamento de retry, do SRE):** máx. 3 reinícios por
hora. Estourou → para de reiniciar, só avisa. Sem isso, um bug de boot
transforma o vigia em cascateado que reinicia eternamente.

**Fontes:** health check + process death (SRE cap. 22), retry budget (SRE cap. 22), dead man's switch (prática de indústria).
**Custo:** pequeno — reusa `publicarTunel()` e o `avisar-telegram.mts`.

### ✅ 2. Utilitário único de rede: retry + jitter + orçamento (P0)

**Executado em 09/09:** `apps/web/lib/robusto/rede.ts` — `comRetry` com full
jitter, cap de 60 s, Retry-After do 429, orçamento de tentativas extra por
processo (janela de 5 min), separação retentável × permanente. **9 testes
vitest** (`rede.test.ts`), incluindo o do orçamento estourado. Adoção:
PicoClaw mantém o retry próprio (não duplicar refactor de 24 fontes); novos
coletores e rotinas migram ao toque neles.

**O que é:** `apps/web/lib/robusto/rede.ts` (ou equivalente em script) com uma
função `comRetry(fn, {tentativas: 4, capMs: 60_000, budgetMinutos: 5})`:
- Backoff exponencial com **full jitter** e **cap** de 60 s
- **Retentável**: 5xx, 429 (respeitando `Retry-After` se vier), erro de rede/
  DNS/timeout. **Não-retentável**: 400, 401, 403, 404, erro de validação de
  conteúdo
- **Orçamento por processo**: estourou o budget da rodada, os próximos erros
  retentáveis falham direto (sem martelada)

**O que muda na prática:** coletores e rotinas migram para este utilitário;
o PicoClaw já tem o seu próprio e **fica como está** (duplicação consciente:
refatorar coleto de 24 fontes de uma vez é o tipo de risco que este plano
quer evitar).

**Fontes:** AWS jitter + retry budget + retriable vs permanent (SRE cap. 22).

### ✅ 3. Quarentena de fonte (P1)

**Executado em 09/09:** `scripts/rotina-coletas.mts` — 3 falhas seguidas
colocam a fonte em quarentena por UMA rodada (`scripts/.quarentena-fontes.json`),
com aviso no log e retorno automático na seguinte. Rodada de fonte única
(dono, à mão) ignora a quarentena — pedido explícito manda.

**O que é:** fonte que falha (retentável) N rodadas seguidas (ex.: 3) entra em
**quarentena** — a próxima rotina pula com aviso, e re-tenta na seguinte.
Fonte em 403 permanente (caso ANP/FGV do LinkMender) sai da fila e vira item
do relatório, não tentativa muda todo dia.

**Por quê:** hoje uma fonte morta custa timeout + retry em TODA rodada
(pausa × 24 fontes × tentativas), e o histórico mostra a mesma falha em
loop. Quarentena é o circuit breaker da indústria, na medida.

**Cuidado editorial:** quarentena é declarada no relatório da rodada — lacuna
é informação (regra do AGENTS.md). "Pulei ANP hoje, em quarentena desde 05/09".

### ✅ 4. Heartbeat dos agentes de sessão (P1)

**Executado em 09/09:** gatilho remoto e vigia gravam
`scripts/.heartbeat-<nome>`; o vigia (que roda a cada 5 min) denuncia no
Telegram quando o heartbeat do gatilho fica velho (> 20 min). Próximos
processos de longa vida entram no mesmo padrão ao serem tocados.

**O que é:** `gatilho-remoto`, rotinas agendadas e agentes de longa vida
gravam `scripts/.heartbeat-<nome>` (carimbo) a cada ciclo vivo. A rotina da
madrugada confere: heartbeat mais velho que X → avisa Telegram ("gatilho morto
desde 21:40").

**Por quê:** mesma lição do vigia — o processo silencioso é o que morre sem
ninguém ver. O dono já recebe avisos no Telegram; que receba o de agente
morto também.

### ✅ 5. Pós-mortem com template + rollback documentado (P1)

**Executado em 09/09:** `docs/incidentes/TEMPLATE-POSTMORTEM.md` (sem
culpados, uma ação concreta) e o primeiro postmortem real
(`2026-09-08-next-start-morto.md`). Runbook "site fora do ar (502)" no
[OPERACAO](../05-operacao/OPERACAO.md) — mitigação genérica primeiro.

**O que é:**
- `docs/incidentes/` com template: o que aconteceu → impacto medido → causa →
  mitigação → **1 ação concreta** (a ação vira chip da fila). Sem culpados.
- Runbook mínimo no OPERACAO.md: "site fora → passo 1: vigia? passo 2:
  `next start` na 3000, passo 3: rebuild com `--so-build`" — mitigação
  genérica primeiro (SRE Workbook), causa depois.

### ✅ 6. Drill mensal (P2)

**Executado em 09/09:** `scripts/executar-drill-failure.ps1` + tarefa
`ControlePopular_DrillFalha_Dia01` (age só no dia 01; a task roda diária e o
script se guarda). **O primeiro drill aconteceu no dia da entrega** — derrubou
o servidor de propósito e o vigia restaurou; a meta de < 10 min foi batida
(reinício + saúde em ~2 min).

**O que é:** uma vez por mês (agendado), **matar o `next start` de propósito**
e medir quanto tempo o vigia leva para restaurar. Meta declarada: < 10 min.
O resultado vai no log da rotina. Se o vigia falhar no treino, falhou antes
do incêndio — que é a hora de consertar.

**Fontes:** SRE Workbook cap. 9 (Failure Friday / DiRT, escalados à nossa
realidade de máquina única).

## O que NÃO se aplica aqui

Crítica honesta — as fontes mandam coisas que **este** projeto não precisa:

| Sugestão da indústria | Por que NÃO aqui |
|---|---|
| Load shedding, CoDel, gestão de fila | não há fila nem tráfego que sature; site é estático + cache |
| SLO formal com janelas de burn-rate | overkill para 1 operador; o alerta simples ("site fora > 5 min") cobre o caso real |
| Incident Command System (IC/CL/OL), PagerDuty, war room | equipe é o dono; Telegram + runbook bastam |
| Hedged requests, deadline propagation entre camadas | não há stack distribuída de RPC |
| Graceful degradation programada | a versão degradada já existe de graça: página mostra "ainda não coletado" (regra editorial) |
| Chaos engineering tipo Netflix Simian Army completo | o drill do item 6 é a versão da medida certa |
| Retomar cron de rebuild na CI | já decidido: runner do GitHub não alcança o banco; quem publica é o home-pc |

## Ordem de execução

| # | Item | Custo | Bloqueia quem |
|---|---|---|---|
| 1 | Vigia do servidor (com cap de 3/h e Telegram) | ~1 sessão | — |
| 2 | Util `comRetry` + migração das rotinas | ~1 sessão | — |
| 3 | Quarentena de fonte | meia sessão | item 2 |
| 4 | Heartbeat dos agentes | meia sessão | — |
| 5 | `docs/incidentes/` + runbook no OPERACAO | meia sessão | — |
| 6 | Drill mensal agendado | 1 h | itens 1 e 6 dependem do vigia |

**Critério de aceite do plano:** os incidentes de 01/09 e 08/09 não podem mais
acontecer em silêncio — se o `next start` morrer, o Telegram do dono tem que
saber antes dele, e o site tem que voltar sozinho dentro de 10 minutos.
