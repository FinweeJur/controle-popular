# 📋 PLANO-ESTRUTURA-NACIONAL — EXPANSÃO DO CONTROLE POPULAR

> **Data:** 10 de setembro de 2026
> **Status:** ✅ FASE 1 ✅ FASE 2 CONCLUÍDA | FASE 3 Pendente (Neon)
> **Prioridade:** ⭐⭐ (crítico para escalar além de MG)

---

## 🎯 OBJETIVO

Expandir a cobertura do Controle Popular de **apenas Betim (MG)** para **todos os polos principais do Brasil**, mantendo dentro dos limites do **Neon Free** (0.5 GB storage, 100 CU-horas/mês, 5 GB transferência).

### 🔑 Estratégia Central
**Dados estáticos no D1 / disco local → Dados dinâmicos e agregados no Neon.**
- JSON de municípios, conselhos, outorgas → `apps/web/data/` (estático, build-time)
- Queries interativas, filtros, relatórios → Neon (runtime)
- Agregados/medidores → constantes no código (`COBERTURA_*`)

---

## 📊 ANÁLISE DE ESCOPO

### Total de Municípios do Brasil
```
Fonte: IBGE API v1/localidades/estados/{uf}/municipios
Total: 5.570 municípios
```

### Distribuição por Região
| Região | Estados | Municípios | % do total |
|--------|---------|------------|------------|
| Sudeste | 4 | 1.437 | 25,8% |
| Norte | 7 | 1.842 | 33,1% |
| Nordeste | 9 | 1.119 | 20,1% |
| Sul | 3 | 1.102 | 19,8% |
| Centro-Oeste | 3 | 429 | 7,7% |
| **TOTAL** | **27** | **5.570** | **100%** |

---

## 🏗️ FASES DE EXPANSÃO

### FASE 1 — Polos Econômicos/Política ⭐⭐⭐⭐⭐ ✅ CONCLUÍDA
**Objetivo:** Cobrir os 5 polos mais populaçosos/econômicos do Brasil

| Estado | Municípios | População | Status |
|--------|------------|-----------|--------|
| **MG** | 853 | 20,2M | ✅ (existente) |
| **SP** | 645 | 46,7M | ✅ (`municipios-sp.json`) |
| **RJ** | 92 | 16,7M | ✅ (`municipios-rj.json`) |
| **BA** | 417 | 15,1M | ✅ (`municipios-ba.json`) |
| **RS** | 497 | 10,8M | ✅ (`municipios-rs.json`) |
| **DF** | 1 | 3,1M | ✅ (`municipios-df.json`) |
| **PA** | 144 | 8,7M | ✅ (`municipios-pa.json`) |
| **CE** | 184 | 9,6M | ✅ (`municipios-ce.json`) |
| **GO** | 246 | 7,2M | ✅ (`municipios-go.json`) |
| **PE** | 185 | 9,9M | ✅ (`municipios-pe.json`) |
| **PR** | 399 | 11,4M | ✅ (`municipios-pr.json`) |
| **SC** | 295 | 7,6M | ✅ (`municipios-sc.json`) |

**Total:** 3.105 municípios (~112,4M pessoas) em **~106 KB compactado**

### FASE 2 — Capitais Políticas/Administrativas ⭐⭐⭐ (7 estados)
| Estado | Município | Motivo |
|--------|-----------|--------|
| DF | Brasília | Capital federal |
| PA | Belém | Porta de entrada Amazônia |
| CE | Fortaleza | Polo Nordeste |
| GO | Goiânia | Centro-Oeste |
| PE | Recife | Porto digital |
| PR | Curitiba | Polo Sul |
| SC | Florianópolis | Tecnologia |

### FASE 3 — Polos Universitários/Indústriais ⭐⭐
| Estado | Município | Motivo |
|--------|-----------|--------|
| SP | Campinas | Cidade Universitária |
| MG | Uberaba | Agronegócio Triângulo |
| MT | Cuiabá | Agropecuária Centro-Oeste |

---

## 💰 ANÁLISE DE LIMITES NEON

### Storage (0.5 GB = 500 MB)
| Componente | Estimativa |
|------------|------------|
| Municípios (5.570) | ~350 KB JSON |
| Conselhos (853 MG) | ~42 KB |
| Outorgas água (55.7K MG) | ~2 MB (compactado) → D1 |
| Contratos PNCP (1.2K MG) | ~1 MB (compactado) → D1 |
| **TOTAL estimado** | **~4 MB** (1% do limite) |

✅ **NÃO estoura storage** — os dados permanecem estáticos.

### Transferência (5 GB/mês)
| Fonte | Estimativa/mês |
|-------|----------------|
| API pública (municipios, conselhos) | ~150 KB |
| Dashboard web (queries Neon) | ~5 MB |
| **TOTAL** | **~5.15 MB** (<1% do limite) |

✅ **NÃO estoura transferência.**

### Compute (100 CU-horas)
| Operação | CU estimados |
|----------|--------------|
| Query municípios | ~0.01 CU |
| Query conselhos | ~0.01 CU |
| Query contratos | ~0.05 CU |
| **TOTAL (1.000 queries)** | **~1 CU** (<1% do limite) |

✅ **NÃO estoura compute.**

> 🧮 **Conclusão:** A expansão NÃO estoura limites do Neon Free.

---

## 🧬 MICROETAPAS (Ranqueádas por Custo-Benefício)

### FASE 1 — Polos Econômicos ✅ CONCLUÍDA

#### F1-E1: Seed cidades SP ⭐⭐⭐⭐⭐ ✅
- **Custo:** 4h
- **Benefício:** 645 cidades, população de 46,7 milhões
- **Comando:** `npx tsx scripts/etl/municipios/seed-municipios-estado.mts --uf=35`
- **Arquivo:** `apps/web/data/municipios-sp.json` (22,7 KB compactado)
- **Status:** ✅ Concluído

#### F1-E2: Seed cidades RJ ⭐⭐⭐⭐ ✅
- **Custo:** 2h
- **Benefício:** 92 cidades, população de 16,7 milhões
- **Comando:** `npx tsx scripts/etl/municipios/seed-municipios-estado.mts --uf=33`
- **Arquivo:** `apps/web/data/municipios-rj.json` (3,3 KB compactado)
- **Status:** ✅ Concluído

#### F1-E3: Seed cidades BA ⭐⭐⭐ ⭐
- **Custo:** 3h
- **Benefício:** 417 cidades, população de 15,1 milhões
- **Comando:** `npx tsx scripts/etl/municipios/seed-municipios-estado.mts --uf=29`
- **Arquivo:** `apps/web/data/municipios-ba.json` (14,6 KB compactado)
- **Status:** ✅ Concluído

#### F1-E4: Seed cidades RS ⭐⭐⭐ ✅
- **Custo:** 3h
- **Benefício:** 497 cidades, população de 10,8 milhões
- **Comando:** `npx tsx scripts/etl/municipios/seed-municipios-estado.mts --uf=43`
- **Arquivo:** `apps/web/data/municipios-rs.json` (18,1 KB compactado)
- **Status:** ✅ Concluído

#### F1-E5: Script multiestado ⭐⭐⭐⭐ ✅
- **Custo:** 6h
- **Benefício:** Reutilizável para todos os estados
- **Arquivo:** `scripts/etl/municipios/seed-municipios-estado.mts`
- **Status:** ✅ Concluído (suporta todos os 27 estados)

| F1-E6: Schema `cidades_nacionais` ⭐⭐⭐
- **Custo:** 3h
- **Benefício:** Tabela unificada para todas as cidades brasileiras
- **Arquivo:** `apps/web/lib/db/schema-cidades-nacionais.ts`
- **Status:** ⏳ Pendente (bloqueado Neon)

#### F2-E1: Seed Fase 2 (7 estados) ⭐⭐⭐
- **Custo:** 5h
- **Benefício:** 1.454 cidades adicionais (DF, PA, CE, GO, PE, PR, SC)
- **Status:** ✅ Concluído (106 KB compactado total)

#### F2-E2: Script Brasil completo ⭐⭐
- **Custo:** 4h
- **Benefício:** `seed-municipios-brasil.mts` gera todos os 27 estados
- **Arquivo:** `scripts/etl/municipios/seed-municipios-brasil.mts`
- **Status:** ✅ Concluído

---

## 📐 ARQUITETURA DE DADOS

### Estrutura de Arquivos
```
controle-popular/
├── scripts/etl/municipios/
│   ├── seed-municipios-mg.mts        ✅ (existente)
│   ├── seed-municipios-estado.mts   ✅ (script genérico)
│   └── seed-municipios-brasil.mts    ← Gera todos os estados
├── apps/web/data/
│   ├── municipios-mg.json           ✅ (853 cidades)
│   ├── municipios-sp.json           ✅ (645 cidades)
│   ├── municipios-rj.json           ✅ (92 cidades)
│   ├── municipios-ba.json           ✅ (417 cidades)
│   ├── municipios-rs.json           ✅ (497 cidades)
│   └── municipios-brasil.json        ← NOVO (todos os estados)
└── apps/web/lib/db/
    └── schema-cidades-nacionais.ts   ← NOVO (pendente Neon)
```

### Schema (Drizzle)
```typescript
// apps/web/lib/db/schema-cidades-nacionais.ts
export const cidadesNacionais = pgTable("cidades_nacionais", {
  id_ibge: bigint("id_ibge", { mode: "number" }).primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  uf: varchar("uf", { length: 2 }).notNull(),
  populacao: integer("populacao"),
  area_km2: numeric("area_km2", { precision: 10, scale: 2 }),
  pib_per_capita: numeric("pib_per_capita", { precision: 10, scale: 2 }),
});
```

---

## 🔄 INTEGRAÇÃO COM DADOS EXISTENTES

### Conselhos Municipais
- **MG:** 853 cidades já mapeadas ✅
- **SP:** 645 cidades — usar mesmo parser do conselho Betim
- **RJ:** 92 cidades — scraping SIOUT-RJ

### PNCP
- **MG:** 1.283 contratos já coletados ✅
- **SP/RJ/BA/RS:** usar `scripts/coletar-pncp-mg.mts` como template (parâmetro --uf)

---

## 📅 CRONOGRAMA

```mermaid
gantt
    title Expansão Nacional — Plano Controle Popular
    dateFormat  YYYY-MM-DD
    section Fase 1 ✅ Concluída
    F1-E1 :done, 2026-09-10, 4h
    F1-E2 :done, 2026-09-10, 2h
    F1-E3 :done, 2026-09-10, 3h
    F1-E4 :done, 2026-09-10, 3h
    F1-E5 :done, 2026-09-10, 6h
    section Fase 2 ⏳ Pendente
    F2-E1 : Seed DF/PA/CE/GO/PE : 2026-09-11, 4h
    F2-E2 : Seed PR/SC/DF : 2026-09-11, 3h
    section Fase 3 ⏳ Pendente
    F3-E1 : Schema cidades_nacionais : 2026-09-12, 3h
    F3-E2 : Route /cidades/sp : 2026-09-12, 2h
```

---

## 🎯 MÉTRICAS DE SUCESSO

| Métrica | Meta | Baseline |
|---------|------|----------|
| Total cidades cobertidas | 5.570 | 3.105 (Fase 1+2) |
| Total conselhos mapeados | ≥ 1.500 | 4 (Betim) |
| Total contratos PNCP | ≥ 5.000 | 1.283 |
| Testes passando | ≥ 95% | 93% |
| Neon dentro do limite | < 1% uso | ✅ |

---

## 📌 PRÓXIMOS PASSOS

1. [ ] **Fase 3:** Schema `cidades_nacionais` (quando Neon voltar)
2. [ ] **Route:** `/cidades/sp` — página com TabelaEstatica
3. [ ] **Coleta PNCP:** escalar para SP/RJ/BA/RS usando --uf
4. [ ] **Notificar:** Bot @ControlePopularBOT a cada fase

---

**Fonte do limite Neon:** https://neon.tech/pricing  
**Fonte de dados:** https://servicodados.ibge.gov.br/api/v1/localidades/estados/{uf}/municipios

> **Commit:** `7ec50d9` — Fase 1+2 concluídas, 3.105 municípios, ~106 KB compactado.