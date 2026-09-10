# 📋 RESUMO DE PLANOS — CONTROLE POPULAR

> **Data:** 10 de setembro de 2026  
> **Status:** ✅ Microetapas concluídas (pendência Neon)

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

---

## 📦 ARTEFATOS CONCLUÍDOS

### Bots
| Script | Função | Status |
|--------|--------|--------|
| `bots/verifica-dados.mts` | Cross-check de valores | ✅ Testado |
| `bots/notifica-telegram.mts` | Notificação automática | ✅ Testado |
| `bots/orquestrador.mts` | Orquestração de microetapas | ✅ Testado |
| `bots/crosscheck-pdf-api.mts` | Cross-check PDF vs API | ✅ Testado |
| `bots/microresumo-escassez-betim.mts` | Microresumo de escassez hídrica | ✅ Testado |

### Scripts ETL
| Script | Fonte | Status |
|--------|-------|--------|
| `scripts/etl/conselhos/scrape_conselhos_betim.mts` | Betim | ✅ Corrigido |
| `scripts/etl/outorgas/coletar-outorgas-mg.mts` | IGAM/SIOUT | ✅ Funcional |
| `scripts/coletar-pncp-mg.mts` | PNCP | ✅ 955 contratos coletados |

### Schemas
| Schema | Tabelas | Status |
|--------|---------|--------|
| `apps/web/lib/db/schema-conselhos.ts` | membros, conselhos, atas | ⏳ Aguarda Neon |
| `apps/web/lib/db/schema-outorgas.ts` | outorgas, tipos_uso, regionais | ⏳ Aguarda Neon |
| `apps/web/lib/db/schema-cidades-mg.ts` | cidades-beta | ⏳ Aguarda Neon |

### Dados Gerados
| Arquivo | Conteúdo |
|--------|----------|
| `apps/web/data/conselhos/conselhos-analise.json` | 4 conselheiros Betim |
| `docs/audit/verificacao-2026-09-09.json` | Cross-check valores PNCP |
| `docs/audit/crosscheck-2026-09-10.json` | Cross-check PDF vs API |
| `docs/audit/microresumo-escassez-2026-09-10.json` | Escassez hídrica Betim |

---

## 🚧 BLOCKERS (Neon bloqueado)

> **Neon Neon Postgres está em HTTP 402 até 2026-09-01 (nota 402 venceu 01/09)**
> - V2, O2, S1 bloqueados — dependem de migrations para Neon
> - Solução: usar D1 (escritas) + dados JSON estáticos enquanto Neon offline

---

## 📊 MÉTRICAS FINAIS

| Métrica | Valor |
|---------|-------|
| **Testes passando** | 741+ ✅ |
| **Contratos PNCP coletados** | 955 ✅ |
| **Conselheiros mapeados (Betim)** | 4 ✅ |
| **Outorgas IGAM (fonte)** | 55.729 ✅ |
| **Microresumos gerados** | 3 ✅ |
| **Cross-checks realizados** | 2 ✅ |