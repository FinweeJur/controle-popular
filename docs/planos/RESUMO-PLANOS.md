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
**Status:** ⏳ PARCIAL (Betim validado)

- **Cidades-beta:** 10 cidades com dados de Betim replicados
- **Schema:** `apps/web/lib/db/seed/cidades-mg.ts` (S1 bloqueado no Neon)
- **Route:** `/municipios/mg` (M4 pendente)

### 2b. 📡 Ampliação PNCP (6 principais → demais mapeadas)
**Status:** 🚧 EM ANDAMENTO (medido 25/09)

- **Plano:** [`PLANO-EXPANSAO-PNCP-199-CIDADES.md`](PLANO-EXPANSAO-PNCP-199-CIDADES.md)
- **Fase A:** ✅ fechada 22/09 (Betim, BH, Diamantina, Araçuaí, Itinga;
  SP capital é fila de outra IA)
- **Fase B:** ✅ commitada (`7c67a3a0`) — fila, manifesto, cobertura
- **Fase C:** 🚧 coleta em curso — 47 completas, 89 na fila (203 no manifesto)
- **Checkpoint:** `etl/betim/etl/pncp/checkpoint.py` (retomada por página)

### 3. 📜 TAUS / CDRU / Autorizações Territoriais
**Status:** ⏳ PENDENTE

- **Plano:** `docs/planos/PLANO-EXPANSAO-AMBIENTAL-OUTORGAS-TELIC.md`
- **SIOUT/MG:** Fonte única para TAUS, CDRU, outorgas
- **Schema:** `apps/web/lib/db/schema-outorgas.ts` (pronto)

### 4. 🤝 Parcerias Público-Privadas (PPP)
**Status:** ⏳ PENDENTE

- **Plano:** `docs/planos/PLANO-ANALISE-CONSELHOS-OUTORGAS.md`
- **Fonte:** PNCP (coletado) + Diários Oficiais

### 5. 🤖 Bot do N8n (fiscalização de bots)
**Status:** ⏳ PENDENTE

- **Plano:** `docs/planos/PLANO-TRABALHO-SETEMBRO-2026.md`
- **Skill:** `skills/productivity/verificacao-dados-automacao/SKILL.md`

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
| `bots/notifica-telegram.mts` | Notificação automática | ✅ Testado |
| `bots/orquestrador.mts` | Orquestração de microetapas | ✅ Testado |

### Schemas
| Schema | Tabelas | Status |
|--------|---------|--------|
| `apps/web/lib/db/schema-conselhos.ts` | membros, conselhos, atas | ⏳ Aguarda Neon |
| `apps/web/lib/db/schema-outorgas.ts` | outorgas, tipos_uso, regionais | ⏳ Aguarda Neon |
| `apps/web/lib/db/schema-cidades-mg.ts` | cidades-beta | ⏳ Aguarda Neon |

---

## 📊 MÉTRICAS FINAIS (medidas 29/09)

| Métrica | Valor |
|---------|-------|
| **Testes passando** | 1.626 vitest + 146 globo ✅ |
| **Suíte Internacional/Lab** | 47/47 testes verdes ✅ |
| **Arquivos de dados com 0 CPF** | 473 JSONs verificados ✅ |
| **Bases e coletores vigiados** | 397 bases com telemetria ✅ |
| **Assembleias estaduais** | 27 UFs integradas ✅ |
| **Hubs Internacionais** | 3 hubs (/internacional, /eua, /canada) ✅ |
| **Idiomas com tradução reativa** | 3 (PT, EN, ES) com TTS ✅ |
