# PLANO — sessão 23/09/2026: bots, laboratório, animações e chatbot

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-23
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [PLANO-FILA-PROXIMA-SESSAO.md](PLANO-FILA-PROXIMA-SESSAO.md), [AGENTS.md](/AGENTS.md), [ROTEIRO-PGVECTOR-CHATBOT.md](ROTEIRO-PGVECTOR-CHATBOT.md)
> **Palavras-chave:** plano, linkmender, pr, bot, revisor, laboratorio, powerbi, dither, marquee, chatbot, seu nono, embeddings, siliconflow, ollama, guara

## Sumário

- [Propósito](#propósito)
- [Decisões do dono](#decisões-do-dono)
- [Fase 0 — Preparação](#fase-0--preparação)
- [Fase 1 — Animações (itens 4 e 5)](#fase-1--animações-itens-4-e-5)
- [Fase 2 — Chatbot Seu Nonô (item 6)](#fase-2--chatbot-seu-nonô-item-6)
- [Fase 3 — LinkMender abre PRs (item 1)](#fase-3--linkmender-abre-prs-item-1)
- [Fase 4 — Bot revisor de PR (item 2)](#fase-4--bot-revisor-de-pr-item-2)
- [Fase 5 — Laboratório PowerBI (item 3)](#fase-5--laboratório-powerbi-item-3)
- [Fase 6 — Verificação e publicação (item 7)](#fase-6--verificação-e-publicação-item-7)
- [Riscos e armadilhas](#riscos-e-armadilhas)

## Propósito

Plano detalhado da sessão de 23/09/2026, com os 7 pedidos do dono.
Sessões paralelas ativas ⇒ worktree próprio `cp-bots-lab`, branch própria,
porta própria **3027**. Cada fase tem critério de pronto.

## Decisões do dono

| # | Decisão | Data |
|---|---|---|
| 1 | Bot revisor **só mescla PRs do próprio bot** (label `bot/linkmender`) | 23/09 |
| 2 | Laboratório: **tudo** — 22 fontes do catálogo + salários = 23 camadas | 23/09 |
| 3 | Chatbot: env no Guara **+ fallback no código** (`AI_API_KEY` genérica) | 23/09 |
| 4 | Ollama **não roda no Guara Starter** — embeddings vão direto pra API | 23/09, medido |

**Medição do Starter (docs Guara, 23/09):** 64 MB RAM normal / **256 MB pico**
por serviço, 0,25 vCPU, 3 serviços por projeto (web + Postgres já usam 2).
Ollama + `nomic-embed-text` precisa de ~300–500 MB — **não cabe**, nem só
embeddings. O `172.18.176.1:11434` atual é o Ollama do `home-pc`, não existe
no container do Guara.

## Fase 0 — Preparação

1. `git worktree add .claude/worktrees/cp-bots-lab -b cp-bots-lab origin/main` ✅
2. Junções de `node_modules` (repo + `apps/web`) ✅
3. Porta 3027 em `.claude/launch.json` ✅
4. Salvar este plano em `docs/planos/` ✅

## Fase 1 — Animações (itens 4 e 5)

**Dither 5× mais devagar** — `apps/web/lib/laboratorio/dither-charts/`:

| Arquivo | Hoje | Vira |
|---|---|---|
| `DitherBarChart.tsx:49` | `+= 0.03` | `0.006` |
| `DitherHeatmapGrid.tsx:38` | `+= 0.03` | `0.006` |
| `DitherGrowthChart.tsx:116` | `+= 0.03` | `0.006` |
| `DitherDonutChart.tsx:88` | `+= 0.02` | `0.004` |
| `DitherStackedChart.tsx:124` | `+= 0.02` | `0.004` |
| `ServerGauge.tsx:49` | `+= 0.05` | `0.01` |
| Morph growth/donut/stacked | 460/500/620 ms | 2300/2500/3100 ms |
| Onda do bar (`time * 2`) | `×2` | `×0.4` |

Bônus medido: BarChart e Heatmap ignoram `prefers-reduced-motion` — alinhar
com os demais (zera o tempo).

**Faixa da navbar 40% mais lenta:**
`globals.css:1080` → `animation: cp-mq 75s` → **`105s`** (75 × 1,4).

Critério de pronto: dono abre `/` e `/laboratorio` e confere o ritmo.

## Fase 2 — Chatbot Seu Nonô (item 6)

**Causa medida (23/09):** `POST /api/chatbot` → **503** `OllamaIndisponivel`.
Cadeia:

1. `provedores.ts:45-64` lê `AI_API_KEY_DEEPSEEK|MARITACA|LING` — ausentes no Guara.
2. Guara só tem `AI_API_KEY` (chat das zonas — **funciona**, medido 200).
3. Fallback Ollama `172.18.176.1:11434` não existe no container → 503.

Correção:

1. **Código:** `provedores.ts` aceita `AI_API_KEY` genérica como fallback
   quando a variante da plataforma não existe. Só o **nome** da env entra no
   código; o valor fica no painel do Guara. Teste unitário novo.
2. **Guara:** `guara env set AI_API_KEY_MARITACA=…` (espelho, nunca no repo).
3. **Embeddings via API — SiliconFlow `BAAI/bge-m3`:**
   - novo provedor em `lib/assistente/embeddings/` (OpenAI-compatible,
     1024 dims, free tier sem cartão — já documentado em
     `PLANO-SEU-NONO-NOTEBOOKLM.md` e `PLANO-CHATBOT-IA.md`);
   - envs `EMBED_API_KEY` / `EMBED_BASE_URL` / `EMBED_MODEL`;
   - gate `rag.ts:212`: chave de embeddings remota **ou** Ollama local
     (dev no `home-pc` continua de graça);
   - Maritaca/DeepSeek/Ling **não têm embeddings** (medido,
     `provedores.ts:14-16`).
4. **Descartado:** Ollama no Guara — impossível no Starter (ver Decisões).
5. Validar `POST /api/chatbot` → 200 no servidor 2 / localhost; deploy Guara
   na janela de ~5 dias (política do dono).

Critério de pronto: chat responde com IA e cita fonte no servidor 2.

## Fase 3 — LinkMender abre PRs (item 1)

Hoje: v1 gera Markdown-diff (cron 03:30); v2 escreve `link-correcoes.json`
local. **Ninguém abre PR.**

1. Novo `scripts/agent-tools/linkmender-pr.mts`:
   - roda o pipeline v2 (já maduro, ~58 testes);
   - branch `bot/linkmender-YYYYMMDD`;
   - commit pathspec (`apps/web/data/link-correcoes.json` + relatório) com `-F`;
   - `gh pr create` com corpo = relatório de propostas;
   - label `bot/linkmender`.
2. **Gate pré-PR:** `validar-link-correcoes.mjs` + `vitest lib/linkmender` verdes.
3. Dedupe: não abre PR se já houver um aberto com a mesma `urlVelha`.
4. Gatilho: rotina madrugada (`executar-rotina-madrugada.ps1`) + manual.
5. Respeita: pausa 1–2 s/host, UA honesto, coleta fora da CI.

Critério de pronto: rodada manual do bot abre PR no GitHub com diff limpo.

## Fase 4 — Bot revisor de PR (item 2)

**Escopo:** só mescla PRs do próprio bot (decisão 1).

1. `.github/workflows/pr-revisor.yml` (`pull_request`: opened/synchronize):
   - extrai URLs **alteradas no diff** (só o diff);
   - sonda ao vivo (HEAD → GET range) com regras de
     `auditoria-links-normas.mjs` (403/429 ≠ quebrado; robots; pausa);
   - critérios de `criterios.ts`: 2xx, domínio oficial, tipo igual, corpo confere;
   - roda `test:lib` + varredura CPF (já existentes);
   - comenta ✅/⛔ por link no PR.
2. **Merge automático só se:** label `bot/linkmender` **E** checks verdes
   **E** links do diff OK **E** branch do mesmo repo (nunca fork).
   `gh pr merge --squash` com `GITHUB_TOKEN`
   (`permissions: pull-requests: write, contents: write`).
3. Aviso no Telegram: "PR #X mesclado / PR #Y reprovado: <link>".
4. `--force` nunca.

Critério de pronto: PR de teste do bot é revisado e mesclado (ou reprovado
com comentário) sem ação humana.

## Fase 5 — Laboratório PowerBI (item 3)

Hoje: 8 camadas no dock; catálogo de **22 fontes** em `dados-catalogo.ts`
não plugado; salários (`judiciario-remuneracoes.json`) órfão.
**Decisão 2: tudo — 23 camadas.**

| Entrega | Detalhe |
|---|---|
| Camadas ativáveis | Plugar `CATALOGO_DADOS` + salários no `lab-dados.ts`; checkbox ligar/desligar no dock e no Seu Nonô (hoje não carregam dado) |
| Novos datasets | Contratos PNCP, convênios ambientais MG, remuneração do Judiciário + os 22 do catálogo |
| Tipos de gráfico | Seletor visível por janela: pizza=donut, colunas=barras, + heatmap/linha/stacked/gauge (já existem, sem lib nova) |
| Payload | Regra §5.1: agregado no cliente; acervo >3 MiB fatiado no servidor (`json-etl.ts`) |
| Regra §8 | Gráfico + cartões + CSV `;`+BOM + filtro + ordenação mantidos |
| Testes | Cada camada nova com agregado medido e datado |

Critério de pronto (dono): em `/laboratorio`, sem código, ligar contratos +
convênios + salários, escolher pizza e colunas, ver os três.

## Fase 6 — Verificação e publicação (item 7)

1. `python scripts/validar-documentacao.py`
2. `npm test` (baseline 1.579 vitest + 146 globo) + `npx tsc --noEmit`
3. `python scripts/checar-dado-pessoal-em-dado.py`
4. Commits **por fase**, pathspec explícito, mensagem em arquivo `-F`,
   sem acento, trailer `Co-Authored-By`
5. `git fetch && git rebase origin/main && git push origin HEAD:main`
   (auto-deploy off — push não quebra a cadência de ~5 dias)

## Riscos e armadilhas

| Risco | Mitigação |
|---|---|
| Sessões paralelas no mesmo `.next` | Worktree `cp-bots-lab` + porta 3027 |
| PR de fork executando código | Revisor só mescla branch do mesmo repo |
| Links gov 403/429 no CI | Bloqueio ≠ quebrado (regra existente) |
| Payload do Lab estourar 25 MiB | Só agregado no cliente; array no servidor |
| Segredo no repo | Valor só no painel Guara; código lê `process.env` |
| Deploy acidental | Auto-deploy off; push não deploya |
| Ollama no Guara | Descartado — Starter tem 256 MB de teto |

## Ordem de execução

`Fase 0 → 1 (itens 4,5) → 2 (item 6) → 3 (item 1) → 4 (item 2) → 5 (item 3) → 6 (item 7)`

## Origem

Pedido do dono em 23/09/2026 (7 itens), com as 4 decisões da sessão.
