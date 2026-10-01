# Plano — Orquestração distribuída (todo PC ligado contribui)

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-30
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [PLANO-AUTOMACAO-LOCAL.md](../05-operacao/PLANO-AUTOMACAO-LOCAL.md), [GATILHO-REMOTO.md](../05-operacao/GATILHO-REMOTO.md), [PLANO-ECOSSISTEMA-CIVICO.md](PLANO-ECOSSISTEMA-CIVICO.md), [HANDOFF-M9-M10-PODMAN.md](HANDOFF-M9-M10-PODMAN.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** orquestracao, distribuida, home-pc, desktop, colibri, cutiazinha, ollama, picoclaw, hermes, telegram, redundancia, fila, claim, guara, servidor 2, code review, security review, sanitizacao, testes, pr

## Sumário

- [Propósito](#propósito)
- [As duas máquinas, e o que cada uma tem de único](#as-duas-máquinas-e-o-que-cada-uma-tem-de-único)
- [Princípios (herdados, não novos)](#princípios-herdados-não-novos)
- [O que já existe (não recriar)](#o-que-já-existe-não-recriar)
- [A fila distribuída — como duas máquinas não fazem a mesma coisa](#a-fila-distribuída--como-duas-máquinas-não-fazem-a-mesma-coisa)
- [O canal entre as máquinas — Telegram](#o-canal-entre-as-máquinas--telegram)
- [Redundância boa (e a ruim, que se evita)](#redundância-boa-e-a-ruim-que-se-evita)
- [Como isso contribui com o servidor 2 e o Guara Cloud](#como-isso-contribui-com-o-servidor-2-e-o-guara-cloud)
- [Ferramentas: colibri, ollama, cutiazinha, riskernel](#ferramentas-colibri-ollama-cutiazinha-riskernel)
- [Baixa frequência — usar a ociosidade, nunca competir](#baixa-frequência--usar-a-ociosidade-nunca-competir)
- [Fases de execução](#fases-de-execução)
- [Status de execução](#status-de-execução-30092026)
- [Ferramentas prontas (reaproveitar)](#ferramentas-prontas-reaproveitar-não-reinventar)
- [Riscos e regras](#riscos-e-regras)
- [Decisões registradas e abertas](#decisões-registradas-e-abertas)

## Propósito

Fazer **qualquer PC ligado** contribuir com a ociosidade dele: atualizar,
verificar, sanitizar, testar, abrir PR, revisar segurança e revisar código —
sem que a ausência de um PC derrube o site nem faça o outro repetir trabalho.
É a evolução do que já existe (rotinas, agentes, gatilho remoto) para um
modelo **descentralizado, idempotente e coordenado por mensagem**.

## As duas máquinas, e o que cada uma tem de único

| Máquina | O que é | Hardware/segredo que só ela tem | Onde mora |
|---|---|---|---|
| **home-pc** | produção/servidor 2 | **Postgres local** (127.0.0.1:5432), buildar/deployar, **Ollama com GPU** (embeddings e geração), túnel Cloudflare | `C:\DevCoder\controle-popular` |
| **desktop-fefpddp** | dev e dado bruto | sessão de dev, **dado bruto externo** (CAR/INCRA), navegador para portais que exigem JS, capacidade ociosa de CPU | este checkout (`X:\DevCoder\...`) |

A regra que sai daí: **cada máquina faz o que só ela consegue**, e a ociosidade
serve para o que qualquer uma consegue.

## Princípios (herdados, não novos)

1. **O home-pc enriquece, não serve** ([PLANO-ECOSSISTEMA-CIVICO.md](PLANO-ECOSSISTEMA-CIVICO.md)).
   O site no Guara nunca depende de um PC para renderizar. O trabalho pesado
   vira **dado estático commitado**; PC desligado = site mais velho, não fora.
2. **Reusar a esteira, não criar orquestrador novo** (decisão registrada).
   PicoClaw, Hermes, Argus, LinkMender, Colibri e Ollama já existem.
3. **Nada de segredo no repo.** Token vive em `scripts/.env` (mesmo padrão do
   `GATILHO_TOKEN`); os agentes **executam comandos** que leem esse arquivo.
4. **Zero-CPF antes de commitar.** `scripts/checar-dado-pessoal-em-dado.py` é
   o piso, em qualquer máquina.
5. **Degradação graciosa.** Sem Ollama ou sem banco, a tarefa **não roda e
   diz por quê** — nunca publica resultado pela metade.

## O que já existe (não recriar)

| Peça | Papel | Arquivo |
|---|---|---|
| Agentes | PicoClaw (fontes), Hermes (segurança), Argus (páginas), LinkMender (links), DocVault (PDFs→R2) | `scripts/agent-tools/*.mts` |
| Guardas de PR/merge | segurança de merge, fact-check cívico, supply chain | `scripts/agent-tools/bot-seguranca-merge.mts`, `bot-fact-checker-pr.mts`, `auditor-supply-chain.mts` |
| Colibri | orquestra PicoClaw + Hermes via Ollama | `scripts/colibri-bridge.mts`, `colibri/colibri-config.json` |
| Rotinas | coleta, ETL, build, deploy, radar, Telegram | `scripts/executar-rotina-*.ps1`, `scripts/rotina-*.mts` |
| Gatilho remoto | pedir sync+publica **de outra máquina** (HTTP no tailnet + Telegram) | `scripts/gatilho-remoto.mts`, [GATILHO-REMOTO.md](../05-operacao/GATILHO-REMOTO.md) |
| Servidor 2 | publica o build pelo túnel | `scripts/agent-tools/publicar-tunel.mts` |
| n8n (orquestrador visual) | **planejado, bloqueado** por Podman ausente | [HANDOFF-M9-M10-PODMAN.md](HANDOFF-M9-M10-PODMAN.md) |

## A fila distribuída — como duas máquinas não fazem a mesma coisa

O problema central: **sem um serviço de coordenação**, dois PCs ligados pegam a
mesma tarefa. A solução reaproveita o que já é compartilhado: **o próprio git**.

- Um arquivo versionado guarda a fila:
  `docs/relatorios-automacao/fila-distribuida.json` — lista de tarefas
  `{ id, tipo, alvo, maquinaPreferida, status, claimPor, claimEm, resultado }`.
- Cada máquina, ao acordar, faz `git fetch`, lê a fila e **reivindica** a
  próxima tarefa livre:
  `status: "livre"` → grava `claimPor: "<máquina>"` → `git commit` +
  `git push`. Quem chega primeiro vence; o segundo recebe
  **non-fast-forward**, faz rebase e vê o claim — pega a próxima.
- O `id` é **determinístico** (`tipo:alvo:data|hashConteudo`). Rodar a mesma
  tarefa duas vezes **não duplica resultado** — o segundo só confirma.
- O push é a trava. Não há servidor de fila, não há banco de coordenação.

> Analogia: é a lista de compras na porta da geladeira. Duas pessoas em casa
> podem ir ao mercado, mas quem lê o item já riscado não compra de novo.

**Tipos de tarefa** (o que cada PC pode pegar quando ligado):

| Tipo | O que faz | Ferramenta | Máquina que consegue |
|---|---|---|---|
| `fonte` | sonda se a fonte responde | PicoClaw | qualquer (rede) |
| `pagina` | confere rota/página viva | Argus | qualquer |
| `link` | acha e confirma link substituto | LinkMender | qualquer |
| `dado` | varre CPF/IBGE/duplicata nas bases | `bots/fiscaliza-bases.mts` | qualquer |
| `teste` | roda `npm test` + `tsc` numa fatia | vitest | qualquer |
| `security` | auditoria de segurança/dados | Hermes | qualquer |
| `code-review` | revisão por micro-parte (ver REVISAO-CODIGO) | sessão de agente | qualquer |
| `pr` | abre/atualiza PR verde | `bot-seguranca-merge.mts` | que tenha `gh` autenticado |
| `indice` | regenera índice de busca | `gerar-indice-busca.mts` | **só home-pc** (exige banco) |
| `rag` | regenera acervo + finetuning | `exportar-finetuning.mts` | qualquer (sem banco) |
| `build`/`deploy` | build e publica | `rotina-local.mts` | **só home-pc** |

## O canal entre as máquinas — Telegram

O `gatilho-remoto.mts` já é o mensageiro: HTTP dentro do tailnet e **long-poll
do Telegram**, fail-closed, com `GATILHO_TOKEN` e chat travado no
`TELEGRAM_CHAT_ID`. Estende-se o vocabulário de comandos:

| Comando | Efeito |
|---|---|
| `/sincronizar` | (existe) git sync + build + publica no servidor 2 |
| `/status` | (existe) há sincronização em andamento? |
| `/fila` | estado da fila distribuída (livres, em execução, por máquina) |
| `/pegar <id>` | reivindica uma tarefa à mão (para o dono) |
| `/rodar <tipo>` | dispara um tipo agora, na máquina que responder |

Cada tarefa concluída manda **uma mensagem de 2-3 linhas** (regra do dono):
etapa atual, próxima, risco. O Telegram é a **redundância de observação**:
se um PC trava, o dono vê pelo celular.

## Redundância boa (e a ruim, que se evita)

**Boa:** o trabalho pesado vira **dado estático commitado**. Qualquer máquina
regera. Se o home-pc cai, o site continua no Guara; o desktop assume os tipos
`fonte/dado/teste/code-review` (que não precisam de banco). Se o desktop cai,
o home-pc segue com tudo.

**Ruim, e se evita:**
- **Dois `build`/`deploy` ao mesmo tempo** no mesmo checkout → correção
  quebrada. Por isso `build`/`deploy`/`indice` são **exclusivos do home-pc**.
- **Dois `git push` concorrentes** no mesmo ramo → resolvido pelo claim na
  fila (non-fast-forward vira "pega a próxima").
- **Dois coletando a mesma fonte em paralelo** = martelada no servidor
  público. O claim + a pausa por host (AGENTS § 11) evitam.

## Como isso contribui com o servidor 2 e o Guara Cloud

- **Servidor 2 (túnel do home-pc):** o `publicar-tunel.mts` publica o build no
  túnel; o **Vigia** (`vigia-servidor.mts`, a cada 5 min no Agendador) confirma
  que está de pé. Os agentes garantem que **sempre há um build verde** para o
  servidor 2 servir quando o Guara falha.
- **Guara Cloud:** é o site principal, **deploy manual a cada ~5 dias**
  (`guara deploy`, cota de build — AGENTS § 5.7.1). O papel dos agentes é
  **chegar ao deploy com a suíte + `tsc` verdes e a fila de PR resolvida** —
  o PC não publica no Guara sozinho; ele **prepara** o último commit para o
  deploy da vez.
- **Nunca no caminho crítico:** nenhum PC no caminho de renderização. O Worker
  da Cloudflare é o fallback técnico.

## Ferramentas: colibri, ollama, cutiazinha, riskernel

| Ferramenta | Onde está | Papel no plano |
|---|---|---|
| **Ollama** | home-pc (`:11434`, GPU); embeddings via `nomic-embed-text` | inferência de quem tem GPU: resumo, classificação, embeddings do RAG. O desktop **consome remoto** (tailnet) quando não tem modelo local. |
| **Colibri** | `scripts/colibri-bridge.mts` + `colibri/colibri-config.json` | orquestra PicoClaw + Hermes via Ollama e sintetiza o parecer em `docs/relatorios-automacao/`. |
| **Cutiazinha** | `C:\DevCoder\cutiazinha` (daemon Go, <20 MB) | mensageria/dispatch (Telegram/WhatsApp nativos) — o "carteiro" que acorda as rotinas e leva o recado entre PCs. **Não vive neste repo.** |
| **riskernel** | **não existe no repositório** | 🔸 a definir com o dono: o que é, onde roda, o que verifica. Enquanto isso, o papel de "risco" fica com o Hermes + `auditor-supply-chain` + `guara-shield-bot`. |

## Baixa frequência — usar a ociosidade, nunca competir

- **Só quando ocioso:** rodar com prioridade baixa (nice/affinity) e **pausar**
  se houver build, deploy ou sessão de dev ativa na máquina.
- **Janelas noturnas** para o pesado (Ollama, embeddings) — as rotinas atuais
  já usam 01:00–06:30; o plano **não muda horários**, só acrescenta o que roda
  "quando sobra".
- **Uma tarefa por vez por máquina** (o claim já serializa); a fila evita picos.
- **Teto de recurso:** cada agente declara CPU/RAM/GPU que usa (colibri já tem
  limites: asset 25 MiB, bundle 3 MiB). A máquina escolhe o que cabe nela.

## Fases de execução

| Fase | Entrega | Depende de |
|---|---|---|
| **F1** | **Definir o formato da fila** (`fila-distribuida.json`) + `claim` por commit | só código |
| **F2** | **Estender o `gatilho-remoto`** com `/fila` e `/rodar` | `scripts/.env` (já existe) |
| **F3** | **Runner de fila** (`scripts/automacao/rodar-fila.mts`): pega a próxima tarefa, roda o agente do tipo, grava resultado, commita | F1/F2 |
| **F4** | **Idle-gate**: só pega tarefa se a máquina estiver ociosa | F3 |
| **F5** | **Cobertura de conhecimento**: `rag` (acervo+finetuning) e `indice` (busca) como tipos da fila | home-pc para `indice` |
| **F6** | **Cutiazinha** como dispatcher de mensagem (fora do repo) | decisão do dono |
| **F7** | **n8n** substituindo os `.ps1` | **Podman** (bloqueado) |

## Status de execução (30/09/2026)

| Fase | Entrega | Estado |
|---|---|---|
| F1 | Fila versionada + claim por commit | ✅ `apps/web/lib/fila/fila.ts` (+ teste) e `docs/relatorios-automacao/fila-distribuida.json` |
| F2 | `/fila` e `/rodar <tipo>` no gatilho | ✅ `scripts/gatilho-remoto.mts` (ganhou também `/webhook`) |
| F3 | Runner da fila | ✅ `scripts/automacao/rodar-fila.mts` — dry-run por padrão |
| F4 | Gate de ociosidade | ✅ `--somente-ocioso` (cede a vez se há build/next rodando) |
| F5 | Conhecimento como tipo da fila | ✅ `indice` (só home-pc) e `rag` no mapa do runner |
| F6 | Cutiazinha como dispatcher | ⛔ externo (`C:\DevCoder\cutiazinha`) — decisão do dono |
| F7 | n8n no lugar dos `.ps1` | ⛔ bloqueada: **Podman ausente** |

O que mais entrou nesta leva, fora das fases:

- **gitleaks** (scan de segredo) — `.gitleaks.toml`, workflow `scan-segredos.yml` e passo no `.githooks/pre-push`; irmã do `dado-pessoal.yml` (um caça CPF, o outro caça chave/token).
- **act** — `.actrc`, para rodar GitHub Actions localmente (exige container).
- **Espelhos** GitLab e Hugging Face — **já ativos e verdes** (os secrets existem).
- **Testes ~6× mais rápidos** — `fileParallelism: true` no `apps/web/vitest.config.mts` (~120-160 s → ~21 s, verde), medido em 30/09.
- **Bot público do Telegram** — menu no estágio atual e webhook corrigido para o **www** (o apex dá 301 e o Telegram não segue redirect — era o que deixava o `/menu` mudo).

## Ferramentas prontas (reaproveitar, não reinventar)

Pesquisa medida com `gh` em 30/09/2026 — o que serve à automação multi-forja:

| Função | Repo | Estrelas |
|---|---|---:|
| Espelhar entre GitHub/Gitee/GitLab (Action) | `Yikun/hub-mirror-action` | 711 |
| Auto-sync para Gitea/Forgejo | `RayLabsHQ/gitea-mirror` | 1.463 |
| Rodar GitHub Actions local | `nektos/act` | 72.177 |
| Dependências multi-forja | `renovatebot/renovate` | 22.634 |
| Segredo no git | `gitleaks/gitleaks` | 29.580 |
| Fluxos visuais (o M10/n8n) | `n8n-io/n8n` | — |

GitLab e Gitee também têm **mirroring nativo** nas configurações do repositório.

## Riscos e regras

- **Nunca `--force`**, nunca reescrever histórico (AGENTS). O claim depende do
  git linear.
- **Coleta fora da CI**, com pausa por host e UA honesto (AGENTS § 11).
- **Sem segredo em log/prompt**; Telegram só para o `TELEGRAM_CHAT_ID`.
- **Uma tarefa pesada não pode atrasar o deploy da vez** — o runner cede a vez.
- **Falha vira lacuna declarada**, nunca resultado inventado.

## Decisões registradas e abertas

**Registradas:**
- Reusar a esteira (PicoClaw/Hermes/Colibri/Ollama), não criar orquestrador novo.
- `build`/`deploy`/`indice` são **exclusivos do home-pc**; o resto é de quem estiver ligado.
- A fila é um **arquivo versionado**; o `push` é a trava do claim.
- Telegram é o canal entre máquinas e a redundância de observação.

**Abertas (decisão do dono):**
- **`riskernel`**: o que é e o que verifica.
- **Cutiazinha**: adotar como dispatcher? (vive fora do repo).
- **n8n**: instalar Podman e migrar, ou manter os `.ps1` como fonte da verdade?
- **Segredos no n8n**: ficam em `scripts/.env` (recomendado) ou no credential store?
- **Escopo do "code review" automático**: até onde um agente revisa sozinho antes de abrir PR.
