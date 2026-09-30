# RESUMO PLANOS

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-29
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [GUIA-DE-DOCUMENTACAO.md](../GUIA-DE-DOCUMENTACAO.md)
> **Palavras-chave:** plano, expansão, fila

## Sumário

- [Propósito](#propósito)
- [MACRO-ETAPAS DO PLANO DE EXPANSÃO](#macro-etapas-do-plano-de-expansão)


---

## 🎯 MACRO-ETAPAS DO PLANO DE EXPANSÃO

> Planos concluídos e verificados saem de `docs/planos/` para
> [`docs/historico/planos/`](../historico/planos/). Cada etapa abaixo aponta o
> plano arquivado quando existe.

### 0. 🏛️ Conselhos Sociais / Direitos / Temáticos
**Status:** ✅ CONCLUÍDO

- **Coletor:** `scripts/etl/conselhos/scrape_conselhos_betim.mts`
- **Dados:** CMS Betim, CODEMA Betim catalogados em `apps/web/lib/conselhos/catalogo.ts`
- **Schema:** `apps/web/lib/db/schema-conselhos.ts` (V2 bloqueado no Neon)
- **Página:** `/ambiental/conselhos` (route Next.js já existe)
- **Bot:** `bots/verifica-dados.mts` (testado, detecta discrepâncias)

### 1. 💧 Outorgas de Água (SIOUT/IGAM)
**Status:** ✅ CONCLUÍDO (parcial)

- **Fonte oficial:** `sistemas.meioambiente.mg.gov.br/licenciamento/site/lista-outorgas`
- **Total:** 55.729 outorgas catalogadas
- **Coletor:** `scripts/etl/outorgas/coletar-outorgas-mg.mts`
- **Schema:** `apps/web/lib/db/schema-outorgas.ts` (O2 bloqueado no Neon)
- **Microresumo:** `bots/microresumo-escassez-betim.mts` (gerado)

### 2. 🌆 Expansão para todas cidades de MG
**Status:** ✅ CONCLUÍDO (29/09)

- **Route:** `/cidades/mg` — 853 municípios do IBGE
- **Polos:** `apps/web/lib/cidades/mg-polos.ts` — 10 polos com população
  exata do **Censo 2022** (IBGE, agregado 4714)
- **Schema:** `apps/web/lib/db/schema-cidades-mg.ts`

### 2b. 📡 Ampliação PNCP (6 principais → demais mapeadas)
**Status:** 🚧 EM ANDAMENTO (medido 25/09)

- **Plano:** [`PLANO-EXPANSAO-PNCP-199-CIDADES.md`](PLANO-EXPANSAO-PNCP-199-CIDADES.md)
- **Fase A:** ✅ fechada 22/09 (Betim, BH, Diamantina, Araçuaí, Itinga;
  SP capital é fila de outra IA)
- **Fase B:** ✅ commitada (`7c67a3a0`) — fila, manifesto, cobertura
- **Fase C:** 🚧 coleta em curso — 47 completas, 89 na fila (203 no manifesto)
- **Checkpoint:** `etl/betim/etl/pncp/checkpoint.py` (retomada por página)

### 3. 📜 TAUS / CDRU / Autorizações Territoriais
**Status:** ✅ CONCLUÍDO (29/09)

- **Fonte real:** SPU — Transparência Ativa, imóveis da União em MG (553)
- **Página:** `/ambiental/autorizacoes` (destinação/regime de cada imóvel)
- **Gerador:** `scripts/etl/territorio/gerar-destinacoes-uniao-mg.py`
- **Schema:** `apps/web/lib/db/schema-autorizacoes.ts`
- **Plano (arquivado):** [PLANO-EXPANSAO-AMBIENTAL-OUTORGAS-TELIC.md](../historico/planos/PLANO-EXPANSAO-AMBIENTAL-OUTORGAS-TELIC.md)

### 4. 🤝 Parcerias Público-Privadas (PPP)
**Status:** ✅ CONCLUÍDO (29/09)

- **Fonte real:** Portal da Transparência MG (CKAN) — 20 contratos
- **Página:** `/ambiental/ppp` (instrumento, supervisão e estruturação)
- **Gerador:** `scripts/etl/concessoes/gerar-ppp-mg.py`
- **Schema:** `apps/web/lib/db/schema-ppp.ts`
- **Plano (arquivado):** [PLANO-ANALISE-CONSELHOS-OUTORGAS.md](../historico/planos/PLANO-ANALISE-CONSELHOS-OUTORGAS.md)

### 5. 🤖 Bot do N8n (fiscalização de bots)
**Status:** ✅ CONCLUÍDO (29/09)

- **Bot:** `bots/fiscaliza-bases.mts` — varre as bases JSON do portal
- **Fiscaliza:** CPF por mod-11, IBGE inválido, duplicata, URL ausente, lacuna
- **Self-test:** `npx tsx bots/fiscaliza-bases.mts --self-test`
- **Skill:** `skills/productivity/verificacao-dados-automacao/SKILL.md`
- **Plano (arquivado):** [PLANO-TRABALHO-SETEMBRO-2026.md](../historico/planos/PLANO-TRABALHO-SETEMBRO-2026.md)

### 6. 🌐 Expansão Internacional & Multilateral
**Status:** ✅ CONCLUÍDO (29/09)

- **Hubs:** `/internacional` (ONU/UNESCO/OMS/OMC), `/eua` (SEC, NID, USAspending) e `/canada` (TSX, NPRI, CORE).
- **Tradução:** Sistema trilíngue reativo PT/EN/ES com voz nativa e exportação CSV formatada.
- **Bot Autônomo:** `scripts/bot-coletor-autonomo.mts` integrado com R2/S3 e avisos Telegram.

### 7. 🔬 Laboratório de Dados & Caderno Cívico
**Status:** ✅ CONCLUÍDO (29/09)

- **Caderno NotebookLM:** Modo cívico offline em Markdown com citações `[n]` e dossiês.
- **Generative UI:** Widgets de Onboarding Cívico, Rastreabilidade Transnacional e Debug do Seu Nonô.

### 8. 🏛️ Assembleias Legislativas Estaduais
**Status:** ✅ CONCLUÍDO (28/09)

- **Rota:** `/assembleias` cobrindo as 27 unidades federativas com orçamentos, composição e links oficiais.

### 9. 🛰️ Cavas de Mineração no Globo 3D
**Status:** ✅ CONCLUÍDO (28/09)

- **Rota:** `/mineracao/cavas` e visualização 3D/2D com modelo VLM calibrado no holdout de 88 negativos.

### 10. 🛡️ Segurança Cívica & Telemetria ETL
**Status:** ✅ CONCLUÍDO (29/09)

- **Vigia ETL:** `vigia-dados-etl.mts` monitorando 397 coletores e bases públicas.
- **Fact-Checking:** Motor inspirado no padrão IFCN/Lupa (`bot-fact-checker-pr.mts`).
- **Resiliência:** Espelho automatizado no GitLab e Hugging Face.

---

## 📦 ARTEFATOS CONCLUÍDOS

### Bots & Coletores
| Script | Função | Status |
|--------|--------|--------|
| `scripts/bot-coletor-autonomo.mts` | Coletor autônomo com R2/S3 e Telegram | ✅ Ativo |
| `scripts/agent-tools/vigia-dados-etl.mts` | Telemetria contínua de 397 bases | ✅ Ativo |
| `scripts/bot-fact-checker-pr.mts` | Fact-checking cívico e abertura de PRs | ✅ Ativo |
| `bots/verifica-dados.mts` | Cross-check de valores | ✅ Testado |
| `bots/fiscaliza-bases.mts` | Fiscaliza as bases JSON (CPF, IBGE, duplicata, lacuna) | ✅ Ativo |
| `bots/notifica-telegram.mts` | Notificação automática | ✅ Testado |
| `bots/orquestrador.mts` | Orquestração de microetapas | ✅ Testado |

### Schemas
| Schema | Tabelas | Status |
|--------|---------|--------|
| `apps/web/lib/db/schema-conselhos.ts` | membros, conselhos, atas | ✅ Pronto (app no Guara) |
| `apps/web/lib/db/schema-outorgas.ts` | outorgas, tipos_uso, regionais | ✅ Pronto (app no Guara) |
| `apps/web/lib/db/schema-cidades-mg.ts` | cidades_mg | ✅ Pronto (app no Guara) |
| `apps/web/lib/db/schema-autorizacoes.ts` | autorizações/destinações (União) | ✅ Pronto |
| `apps/web/lib/db/schema-ppp.ts` | parcerias e concessões | ✅ Pronto |

---

## 📊 MÉTRICAS FINAIS (medidas 29/09)

| Métrica | Valor |
|---------|-------|
| **Testes passando** | 1.872 vitest + 168 globo ✅ |
| **Bases JSON fiscalizadas** | 399 arquivos com 173.119 registros ✅ |
| **Suíte Internacional/Lab** | 47/47 testes verdes ✅ |
| **Arquivos de dados com 0 CPF** | 473 JSONs verificados ✅ |
| **Bases e coletores vigiados** | 397 bases com telemetria ✅ |
| **Assembleias estaduais** | 27 UFs integradas ✅ |
| **Hubs Internacionais** | 3 hubs (/internacional, /eua, /canada) ✅ |
| **Idiomas com tradução reativa** | 3 (PT, EN, ES) com TTS ✅ |
| **Imóveis reais da União em MG** | 553 (SPU, Plano 3) ✅ |
| **Contratos reais de concessão/PPP em MG** | 20 (Transparência MG, Plano 4) ✅ |
