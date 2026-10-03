# Plano — n8n, monitoramento de bots e painel de edição que faz commits

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-10-03
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [HANDOFF-M9-M10-PODMAN.md](HANDOFF-M9-M10-PODMAN.md), [PLANO-ORQUESTRACAO-DISTRIBUIDA.md](PLANO-ORQUESTRACAO-DISTRIBUIDA.md), [PLANO-RESILIENCIA-BOTS.md](PLANO-RESILIENCIA-BOTS.md), [PLANO-M7-M11-CURADORIA-OSS.md](PLANO-M7-M11-CURADORIA-OSS.md), [EDICAO.md](../07-edicao/EDICAO.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [GATILHO-REMOTO.md](../05-operacao/GATILHO-REMOTO.md), [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** n8n, podman, monitoramento, bots, painel, edicao, commit, telegram, vigia, automacao, orquestracao, changedetection

## Sumário

- [Propósito](#propósito)
- [Estado da arte: o que já existe (não recriar)](#estado-da-arte-o-que-já-existe-não-recriar)
- [O que dá para reusar hoje](#o-que-dá-para-reusar-hoje)
- [Decisões já tomadas — não reabrir](#decisões-já-tomadas--não-reabrir)
- [Arquitetura proposta, em fases](#arquitetura-proposta-em-fases)
- [Fase 0 — o chão: resumo de monitoramento no Telegram (sem n8n)](#fase-0--o-chão-resumo-de-monitoramento-no-telegram-sem-n8n)
- [Fase 1 — n8n no Podman: monitoramento publicado no Telegram](#fase-1--n8n-no-podman-monitoramento-publicado-no-telegram)
- [Fase 2 — n8n espelha os `.ps1` (sem apagar a contingência)](#fase-2--n8n-espelha-os-ps1-sem-apagar-a-contingência)
- [Fase 3 — painel de edição que faz commits (endurecer e completar)](#fase-3--painel-de-edição-que-faz-commits-endurecer-e-completar)
- [Fase 4 — painel de operação (somente leitura)](#fase-4--painel-de-operação-somente-leitura)
- [Riscos e regras](#riscos-e-regras)
- [O que fica para depois](#o-que-fica-para-depois)
- [Critérios de aceite](#critérios-de-aceite)
- [Origem / Histórico](#origem--histórico)

## Propósito

Retomar o projeto de **n8n / monitoramento de bots / painel de edição que faz
commits** — o dono o colocou como última prioridade, "para depois das outras
tarefas". Este documento é **reconhecimento + plano**, para executar em sessão
futura. Não é ordem de execução agora.

Três perguntas ele responde:

1. **n8n** — onde ele foi planejado, por que nunca subiu, e o que muda quando
   o bloqueio cair.
2. **Monitoramento de bots** — o que já vigia o portal hoje e como consolidar
   num único resumo no Telegram.
3. **Painel de edição que faz commits** — o que já está no ar, o que falta, e
   como endurecer as regras de commit/segurança.

A regra que governa o plano: **reusar a esteira, não criar orquestrador novo**
(decisão registrada em [PLANO-ORQUESTRACAO-DISTRIBUIDA.md](PLANO-ORQUESTRACAO-DISTRIBUIDA.md)).
O n8n entra como **camada visual por cima do que já roda**, nunca como
substituto silencioso.

## Estado da arte: o que já existe (não recriar)

Tudo abaixo foi medido no repositório em 03/10/2026. Quem pegar este plano não
precisa redescobrir nada.

### n8n — planejado e bloqueado por infra

| Documento | O que decidiu |
|---|---|
| [HANDOFF-M9-M10-PODMAN.md](HANDOFF-M9-M10-PODMAN.md) | Handoff de 31/08: M9 = changedetection.io (porta 5000), M10 = n8n (porta 5678). **Bloqueio medido:** `podman: not found` e `docker: not found`; WSL2/Ubuntu presente. Decisão: **containers = Podman, nunca Docker Desktop**. n8n só executa comandos; segredos ficam em `scripts/.env`; workflows versionados em `scripts/n8n-workflows/` (recomendado, confirmação do dono pendente) |
| [PLANO-ORQUESTRACAO-DISTRIBUIDA.md](PLANO-ORQUESTRACAO-DISTRIBUIDA.md) | F7 = "n8n substituindo os `.ps1`" — ⛔ bloqueada por Podman ausente. Telegram é o canal entre máquinas e a redundância de observação; `/fila` e `/rodar <tipo>` já existem no gatilho |
| [PLANO-M7-M11-CURADORIA-OSS.md](PLANO-M7-M11-CURADORIA-OSS.md) | M10 = migração do agendamento para n8n local; mesmo bloqueio (Podman) |
| [PLANO-AUTOMACAO-COLETA-CIDADES.md](PLANO-AUTOMACAO-COLETA-CIDADES.md) | Lista `scripts/n8n-workflows/*.json` como artefato; n8n espelha os `.ps1` sem divergência |
| [PLANO-ANALISE-CONSELHOS-OUTORGAS.md](../historico/planos/PLANO-ANALISE-CONSELHOS-OUTORGAS.md) | Análise que **recomendou não usar n8n** naquele momento: infra extra sem ganho sobre o agendador atual |
| [PLANO-EXPANSAO-AMBIENTAL-OUTORGAS-TELIC.md](../historico/planos/PLANO-EXPANSAO-AMBIENTAL-OUTORGAS-TELIC.md) | M11 = "Dashboard de monitoramento" — nunca implementado como dashboard; virou os vigias de linha de comando |

**Medição crítica:** `scripts/n8n-workflows/` **não existe** hoje (glob vazio).
O n8n nunca subiu. Não há container, workflow ou volume.

### Monitoramento — já existe e é testado diariamente

| Peça | Papel | Arquivo |
|---|---|---|
| Farol | Vigia do servidor: health a cada 5 min, auto-restart com cap de reinícios, Telegram | `scripts/vigia-servidor.mts` |
| Olho | Varredura das páginas nobres (top-100 + catálogo dos eixos), aviso agrupado, anti-spam | `scripts/agent-tools/vigia-paginas.mts` |
| Telemetria de bases | 397 bases/coletores auditados | `scripts/agent-tools/vigia-dados-etl.mts` |
| Vigia de build | Puxa `pedido-build.json`, roda a rotina, grava `ultimo-build.json` | `scripts/vigia-build.mts` |
| Vigia Telegram/OpenCode | Ponte de tarefas delegadas, restaura o webhook do portal | `scripts/vigia-telegram-opencode.mts` |
| Fiscalizador de bases | CPF mod-11, IBGE inválido, duplicata, URL ausente, lacuna | `bots/fiscaliza-bases.mts` |
| Gatilho remoto | Long-poll do Telegram: `/status`, `/logs`, `/fila`, `/rodar`, `/webhook` | `scripts/gatilho-remoto.mts` |
| Bot público | Menu do portal no Telegram | `apps/web/app/api/telegram/route.ts` |
| Registro do webhook | Confere e registra o webhook no `www` | `scripts/telegram-set-webhook.mts` |

O `/logs` do gatilho já monta um resumo de Farol, Radar, Escudo, Olho,
Painel e heartbeats — **é a semente do "resumo de monitoramento"**. Ver
[GATILHO-REMOTO.md](../05-operacao/GATILHO-REMOTO.md) e
[PLANO-RESILIENCIA-BOTS.md](PLANO-RESILIENCIA-BOTS.md) (entregue em 09/09).

### Painel de edição — Fase 1b já entregue

| Peça | Papel | Arquivo |
|---|---|---|
| Tela | `/painel`, **só em `next dev`** com `PAINEL_LOCAL=1` | `apps/web/app/painel/page.local.tsx` |
| API | `edicoes`, `publicar`, `sincronizar`, `texto-atual`, `ia-config` | `apps/web/app/api/painel/*/route.local.ts` |
| Lógica | I/O das edições, rotas editáveis, estado do git, último build | `apps/web/lib/painel/*.ts` |
| Dado | `edicoes.json`, `pedido-build.json`, `ultimo-build.json` | `apps/web/data/` |
| CLI irmã | `--listar`, `--rota … --titulo … --por … --motivo …`, `--remover` | `scripts/editar-pagina.mts` |
| Plano original | Fases 1/1b entregues; Fases 2 (apagar) e 3 (renomear) pendentes | [PLANO-PAINEL-EDICAO.md](../historico/entregas/PLANO-PAINEL-EDICAO.md) |
| Uso | Procedimento de uso | [PAINEL-EDICAO-COMO-USAR.md](../historico/procedimentos/PAINEL-EDICAO-COMO-USAR.md), [EDICAO.md](../07-edicao/EDICAO.md) |

**O painel que faz commit já existe.** `apps/web/app/api/painel/publicar/route.local.ts`
grava o pedido, **commita por pathspec**, dá `git push origin HEAD:main` e o
`vigia-build.mts` puxa e builda. A garantia de "não vai para produção" é
estrutural: extensões `.local.*` ficam fora de `pageExtensions` quando
`PAINEL_LOCAL` não é `1` ou `NODE_ENV` é `production` (ver
[ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md)). Autenticação por
`PAINEL_TOKEN`, fail-closed.

### Orquestração — a fila distribuída já roda

`apps/web/lib/fila/fila.ts` (lógica pura + teste), o arquivo
`docs/relatorios-automacao/fila-distribuida.json` e o runner
`scripts/automacao/rodar-fila.mts` (dry-run por padrão, `--executar --push`
para valer). O n8n, quando subir, é **mais um consumidor desta fila** — não
um orquestrador paralelo.

## O que dá para reusar hoje

| Necessidade do projeto | Peça existente | Como entra |
|---|---|---|
| Avisar o dono no Telegram | `notifyTelegram` do `vigia-servidor.mts` + `scripts/.env` | Fase 0 e 1 reusam sem token novo |
| Resumo de estado dos bots | `/logs` do `gatilho-remoto.mts` | Extrair para módulo e agendar |
| Health de páginas e bases | `vigia-paginas.mts`, `vigia-dados-etl.mts` | n8n chama os mesmos scripts |
| Editar e commitar | painel `/painel`, `editar-pagina.mts`, `vigia-build.mts` | Fase 3 endurece, não reescreve |
| Coordenação entre PCs | `fila.ts` + `rodar-fila.mts` | n8n enfileira `fonte`/`pagina`/`dado` |
| Controle remoto | `gatilho-remoto.mts` (long-poll) | n8n pode enfileirar via arquivo da fila |
| Agendamento | Agendador do Windows + `executar-rotina-*.ps1` | Contingência do n8n; não apagar |

## Decisões já tomadas — não reabrir

- **Containers = Podman** (rootless, WSL2/Ubuntu), nunca Docker Desktop (31/08).
- **Portas fixas:** 5000 (changedetection) e 5678 (n8n); conferir com
  `Get-NetTCPConnection -LocalPort 5000,5678`.
- **Segredos:** n8n **executa comandos** que leem `scripts/.env`; o container
  não carrega token nenhum (recomendação do handoff, confirmação do dono
  ainda pendente).
- **Serviços locais nunca na CI** — changedetection e n8n são do `home-pc`.
- **Nunca `--privileged`**, superfície mínima de portas.
- **Reusar a esteira** (PicoClaw, Hermes, Argus, LinkMender, Colibri), não
  recriar lógica de coleta dentro de nós do n8n.
- **Telegram só para o `TELEGRAM_CHAT_ID`**; webhook do bot público só em
  `https://www.controlepopular.com.br/api/telegram` (AGENTS §5.11).

## Arquitetura proposta, em fases

Cada fase é **pequena, testável e reversível**. A ordem põe o menor risco
primeiro e deixa o n8n (bloqueado) depois do chão que não depende dele.

```
Fase 0  chão          → resumo de monitoramento no Telegram, sem n8n    (reusa tudo)
Fase 1  n8n sobe       → workflow "monitoramento" publica no Telegram   (depende do Podman)
Fase 2  n8n espelha    → workflow madrugada/manhã espelha os .ps1        (só após 3 dias verdes)
Fase 3  painel commits → endurecer commit/-F, completar fases 2/3        (já existe 90%)
Fase 4  painel ops     → tela somente leitura de status (opcional)      (por último)
```

## Fase 0 — o chão: resumo de monitoramento no Telegram (sem n8n)

**A menor entrega útil.** Não depende de Podman, não depende de n8n, e reusa
100% do que já roda.

- Extrair o bloco do `/logs` do `gatilho-remoto.mts` para um módulo
  (`scripts/lib/resumo-bots.mts`) que lê os JSONs de status e devolve o resumo
  em texto — Farol, Olho, bases, fila, heartbeats, reinícios.
- Um script fino (`scripts/relatorio-bots.mts`) que envia esse resumo ao
  Telegram pelo mesmo `notifyTelegram` (sem token novo, sem segredo em log).
- Agendar no Agendador do Windows uma vez por dia (ex.: 08:30), fora das
  janelas de build.
- **Critério:** chega uma mensagem por dia com números medidos; se um vigia
  está mudo, o resumo denuncia pelo heartbeat velho.

Por que este é o chão: mesmo que o n8n nunca suba, o dono já ganha o painel de
observação que o projeto pede. Se o n8n subir, ele **chama este mesmo script**
em vez de reimplementar o resumo.

## Fase 1 — n8n no Podman: monitoramento publicado no Telegram

Pré-requisito: Podman instalado pelo dono e `podman --version` respondendo.

- Subir o n8n conforme o handoff:
  `podman run -d --name n8n --restart=unless-stopped -p 5678:5678 -v n8n-data:/home/node/.n8n -e GENERIC_TIMEZONE=America/Sao_Paulo docker.io/n8nio/n8n`.
  Acesso em `http://localhost:5678` com conta local. **Nunca exposto.**
- Criar o workflow `monitoramento` (Cron diário): nó `Execute Command` rodando
  `npx tsx scripts/relatorio-bots.mts` (o da Fase 0) + nó Telegram para o
  `TELEGRAM_CHAT_ID`. Os segredos vêm do `scripts/.env`, não do credential
  store (decisão recomendada; confirmar com o dono).
- Versionar o export do workflow em `scripts/n8n-workflows/monitoramento.json`
  (criar a pasta). O JSON passa pela varredura de dado pessoal e de segredo —
  nunca deve conter token, CPF ou webhook de terceiro.
- **Verificação:** executar o workflow à mão, comparar o resumo com o da
  Fase 0 (têm de ser idênticos); reiniciar o container (`podman restart n8n`)
  e confirmar que o workflow persiste no volume.
- **Contingência:** se o Podman falhar (kernel WSL2 desatualizado é o problema
  clássico), registrar o erro exato e **manter a Fase 0 no Agendador do
  Windows**. Nada de pressa.

## Fase 2 — n8n espelha os `.ps1` (sem apagar a contingência)

Só depois de **3 madrugadas e 3 manhãs seguidas sem divergência** entre o
n8n e as rotinas atuais.

- Workflow `madrugada` (Cron 03:30) espelhando `executar-rotina-madrugada.ps1`:
  PicoClaw → Argus → LinkMender → coletas → varredura de dado pessoal.
- Workflow `manha` (Cron 05:30): Hermes → DocVault → Colibri.
- Workflow `alerta-disponibilidade`: condicional sobre
  `picoclaw-fontes-status.json` — se `taxaDisponibilidade < 70%`, Telegram.
- **Os `.ps1` não são apagados:** viram contingência documentada; rollback é
  reagendar as tarefas do Windows.
- **Critério:** 3 ciclos sem divergência nos relatórios de
  `docs/relatorios-automacao/` antes de desativar qualquer tarefa do Windows.

## Fase 3 — painel de edição que faz commits (endurecer e completar)

O painel já edita, commita e pede build. Esta fase corrige o que contraria as
regras do repo e completa as fases 2/3 do plano original.

**Correções de regra (obrigatórias):**

1. **Mensagem de commit por arquivo.** Hoje
   `apps/web/app/api/painel/publicar/route.local.ts` (e o `editar-pagina.mts`)
   usam `git commit -m`. A regra AGENTS §5.6 proíbe `-m`: crase vira
   substituição de comando e o PowerShell deixa `@` solto no título. Trocar
   por `-F <arquivo-temporário>` (o `rodar-fila.mts` já é o modelo disso).
2. **Pathspec explícito sempre.** Manter `git commit --only <caminho>` e o
   `git add` por pathspec (já feito) — nunca `git add -A`.
3. **Fetch antes de aceitar edição** (lock otimista): se `origin/main` andou,
   a tela recusa e pede `pull` — evita a colisão de duas máquinas.
4. **Nunca `--force`.** Desfazer é `git revert` do commit da edição, seguido
   de rebuild; jamais reescrever histórico.
5. **Publicar continua separado de salvar.** O botão "Pedir publicação" grava
   `pedido-build.json`; não é deploy e não atravessa a cadência de ~5 dias
   (AGENTS §5.7.1).

**Completar (Fases 2 e 3 do [PLANO-PAINEL-EDICAO.md](../historico/entregas/PLANO-PAINEL-EDICAO.md)):**

- **Apagar página** por arquivo de supressão versionado
  (`paginas-suprimidas.json`), nunca `DELETE` na tabela de origem (o ETL
  reescreveria). Estado "pendente de publicação" visível até o rebuild passar.
- **Renomear URL** por `redirects.json` orientado a dado + página-ponte se o
  GitHub Pages ainda for alvo. É a fase mais arriscada; confirmar o alvo antes.

**Segurança (não negociável):**

- Painel **nunca** exposto por `custom_domain` nem `workers_dev`; só
  `localhost`/tailnet. Conferir com `grep` no `wrangler.jsonc` antes de deploy.
- `PAINEL_TOKEN` próprio, fail-closed, **distinto** de `ADMIN_TOKEN` e de
  `GATILHO_TOKEN`.
- Cada edição exige `quem` e `motivo` (auditoria). Erro de digitação em título
  é caso de uso; "editar qualquer coluna do banco" fica fora de propósito.

## Fase 4 — painel de operação (somente leitura)

Opcional e por último: uma aba no painel local que mostra o **status** (Farol,
Olho, bases, fila, último build) lendo os mesmos JSONs — sem botão que dispare
nada além do "Pedir publicação" que já existe. Serve para o dono olhar a saúde
do portal sem abrir o Telegram. Não substitui o resumo da Fase 0.

## Riscos e regras

| Risco | Regra que fecha o risco |
|---|---|
| **Painel que faz commit é superfície de escrita** | Autenticação própria fail-closed (`PAINEL_TOKEN`); rotas `.local.*` fora do build (garantia estrutural, não disciplinar); nunca exposto; lock otimista antes de aceitar edição |
| **Commit pega trabalho de outra sessão** | `git commit --only <caminho>` + `git add` por pathspec; `git diff --cached --name-only` vazio antes |
| **Mensagem de commit com crase/`@`** | Mensagem **sempre por arquivo** (`-F`), nunca `-m` (AGENTS §5.6) — corrigir o que já usa `-m` na Fase 3 |
| **Dado pessoal em dado novo** | Coletor/workflow novo que grava JSON entra em `DIRETORIOS_DADO` do `scripts/checar-dado-pessoal-em-dado.py`; rodar a suíte **antes** de commitar; `sem-cpf-no-repo.test.ts` valida por mod-11 |
| **Segredo dentro do n8n/workflow** | Workflows versionados sem token; n8n executa comandos que leem `scripts/.env`; nada de segredo em log, print ou prompt de IA |
| **Webhook de terceiro no bot** | Só `https://www.controlepopular.com.br/api/telegram`; bot de trabalho é long-poll (AGENTS §5.11); a régua é `scripts/checar-webhook-telegram.py` |
| **n8n dispara deploy sozinho** | n8n só enfileira (`fila.ts`) e pede build (`pedido-build.json`); deploy segue manual, ~5 dias (AGENTS §5.7.1) |
| **Container local vira porta aberta** | Bind em localhost, só 5000/5678, sem `--privileged`, nunca na CI |
| **API responde 200 e mente** | Validar o **conteúdo**, nunca o status (filtro ignorado, `sort` silencioso) |
| **Falha silenciosa de um vigia** | Heartbeat por arquivo; o resumo da Fase 0 denuncia heartbeat velho |
| **`--force`** | Proibido (AGENTS §5.3); `git revert` é o desfazer |

## O que fica para depois

- **Substituir os `.ps1` pelo n8n** (Fase 2) — só após 3 dias de validação;
  os scripts viram contingência.
- **changedetection.io (M9)** para portais que exigem JS (ex.: LAI CGE-MG) —
  descrito no [HANDOFF-M9-M10-PODMAN.md](HANDOFF-M9-M10-PODMAN.md).
- **Cutiazinha** como dispatcher de mensagem — vive fora do repo; decisão do dono.
- **Painel: apagar e renomear página** (Fases 2/3) — cada uma tem janela de
  inconsistência entre gravar e o rebuild publicar.
- **Dashboard M11** — o painel de operação da Fase 4 é o que sobrou dele.
- **`riskernel`** — não existe no repo; a definir com o dono.
- **Edição ao vivo sem rebuild** — custo arquitetural medido (o site é SSG);
  fica de fora de propósito.
- **n8n na CI** — nunca; serviço local do `home-pc`.

## Critérios de aceite

| Fase | Aceite |
|---|---|
| 0 | Uma mensagem diária no Telegram com números medidos (páginas ok, bases, heartbeats); nenhum segredo em log |
| 1 | Workflow `monitoramento` no n8n publica o mesmo resumo da Fase 0; `podman restart n8n` preserva o workflow; container não sobe na CI |
| 2 | 3 madrugadas e 3 manhãs sem divergência entre n8n e `.ps1`; relatórios em `docs/relatorios-automacao/` |
| 3 | Editar → commitar por pathspec com mensagem `-F` → pedir build, com trilha em `git log` e desfazer por `git revert`; token fail-closed; nada exposto |
| 4 | Tela mostra o status lendo os JSONs existentes, sem nova superfície de escrita |
| Geral | `python scripts/validar-documentacao.py` verde; `git config --get core.hooksPath` ligado antes do pre-push; suíte + `tsc` verdes antes de publicar |

## Origem / Histórico

Consolida reconhecimento de 03/10/2026 sobre material anterior: o handoff M9/M10
(31/08), o plano de orquestração distribuída (status 30/09), o plano de
resiliência dos bots (entregue 09/09), o plano do painel de edição (Fase 1b
entregue) e o plano canário Telegram (arquivado 01/09). O n8n nunca foi
instalado — este documento é o ponto de retomada para quando o Podman existir
e para as fases que **não** dependem dele.
