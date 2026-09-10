# 🗺️ Plano de Expansão — Outorgas de Água, Conselhos Sociais e Autorizações Territoriais

> **Tipo:** PLANO  
> **Domínio:** cidades, ambiental, transparência  
> **Última atualização:** 09/09/2026  
> **Status:** APROVADO — PRONTO PARA EXECUÇÃO

---

## ✨ Visão Geral

Expandir o portal **Controle Popular** com dados de:
1. **Conselhos Sociais** — composição dos conselheiros por município
2. **Outorgas de Água** — quem usa, quanto, por quanto tempo (IGAM/SIOUT)
3. **Autorizações Territoriais** — TAUS, CDRU, PPP e outras licenças

Seguindo o padrão estabelecido em **Betim**, com scraping modular, dados versionados e integração ao Neon.

---

## 📊 Estado Atual do Repositório

### Cidades Ativas (6)
- Betim (3106705) — dados completos
- Belo Horizonte (3106200) — dados completos  
- São Paulo (3550308) — dados completos
- Diamantina (3121605) — dados em andamento
- Araçuaí (3103405) — dados em andamento
- Itinga (3134004) — dados em andamento

### Estrutura de Dados
- **Banco:** Neon Postgres + Drizzle ORM
- **Schema:** `apps/web/lib/db/schema.ts` (tabela `municipios` como ponto de partida)
- **Dados estáticos:** `apps/web/data/` (JSON compacto)
- **Coletores:** `scripts/*.mts` e `etl/*/scripts/` (TypeScript/MediaScript)

### Padrões Identificados
1. **Taxonomia de Conselhos:** já existe em `apps/web/lib/conselhos/` com tipos definidos
2. **Dados Ambientais:** coletor `coletar-convenios-ambientais-mg.mts` como referência
3. **SISEMA:** agregação existente (`scripts/agregar-sisema-fiscalizacao.mts`) mas sem outorgas específicas

---

## 1️⃣ CONSELHOS SOCIAIS — Composição dos Conselheiros

### Contexto
- **618 linhas** de catálogo de conselhos já existente (`catalogo.ts`)
- **Tipos definidos:** bacias_hidrograficas, meio_ambiente, direitos_humanos, saúde, etc.
- **Falta:** composição detalhada dos conselheiros (nome, instituição, mandato, CPF/CNPJ)

### Fontes de Dados
| Fonte | Objetivo | Formato | Status |
|-------|----------|---------|--------|
| Portais de transparência municipais | Composição dos conselhos | HTML/CSV | ⚠️ Scraping novo |
| Conselhos estaduais MG | Conselheiros estaduais | HTML | Já coberto parcialmente |
| LexML | Atas e resoluções | XML | Complementar |

### Schema a Criar

```typescript
// apps/web/lib/db/schema-conselhos.ts

import { pgTable, serial, text, varchar, integer, timestamp, boolean, date, jsonb } from "drizzle-orm/pg-core";

/**
 * Tabela de membros dos conselhos sociais por município
 * Para expansão: criar tabelas separadas por categoria (CONSELHOS_SOCIAIS, CONSELHOS_SAUDE, etc.)
 * ou manter generalizada com filtro por categoria.
 */
export const conselhos_membros = pgTable("conselhos_membros", {
  id: serial("id").primaryKey(),
  id_municipio: text("id_municipio").notNull().references(() => municipios.id_municipio),
  nome_conselho: varchar("nome_conselho", 255).notNull(),
  categoria: varchar("categoria", 100).notNull(), // 'saude', 'educacao', 'meio_ambiente', etc.
  esfera: varchar("esfera", 20).notNull(), // 'municipal', 'estadual', 'federal'
  
  // Dados do conselheiro
  nome_conselheiro: varchar("nome_conselheiro", 255).notNull(),
  instituicao: varchar("instituicao", 255), // Orgão, empresa, comunidade
  vinculo: varchar("vinculo", 100), // 'governo', 'sociedade_civil', 'empresariado', 'dependente'
  segmento: varchar("segmento", 20), // 'titular', 'suplente', 'consultivo'
  
  // Dados de mandato
  mandato_inicio: date("mandato_inicio"),
  mandato_fim: date("mandato_fim"),
  data_nomeacao: date("data_nomeacao"),
  
  // Contato (quando disponível)
  email: varchar("email", 255),
  telefone: varchar("telefone", 30),
  
  // Fonte e rastreabilidade
  fonte_url: text("fonte_url"),
  html_section: text("html_section"), // Seção HTML extraída
  atualizado_em: timestamp("atualizado_em").defaultNow(),
  ativo: boolean("ativo").default(true),
});
```

### Rotas a Criar
```
/conselhos/
├── /conselhos/mg              → lista todos os conselhos de MG
├── /conselhos/mg/saude        → filtro por categoria
├── /conselhos/[municipio]/     → conselhos daquela cidade
└── /conselhos/[municipio]/[id]/ → composição detalhada
```

### Componentes React
- `<ConselhoCard />` — nome, tipo, nº de membros
- `<MembrosTable />` — lista com nome, instituição, segmento, mandato
- `<MandatoTimeline />` — linha do tempo dos mandatos (Recharts)

---

## 2️⃣ OUTORGAS DE ÁGUA — Quem Usa, Quanto, Por Quanto Tempo

### Fontes Principais
|| Sistema | URL | Tipo | Cobertura MG | Status |
||---------|-----|------|--------------|--------|
|| **SIOUT/IGAM** | https://sistemas.meioambiente.mg.gov.br/licenciamento/site/lista-outorgas | Web app (scraping) | ⚠️ Scraping necessário | ✅ Testado |
|| **IGAM** | https://www.igam.mg.gov.br/outorga | Relatórios PDF | Backup | ✅ OK |
|| **SNIRH** | http://www.snirh.gov.br/ | CSV/GeoJSON | Nacional | N/A |
|| **ANA** | https://www.gov.br/ana/pt-br/acesso-a-informacao/dados-abertos | CSV | Nacional | N/A |

### Pipeline de Coleta

```typescript\n// scripts/etl/outorgas/coletar-outorgas-mg.mts (✅ CRIADO & TESTADO)\n\n/**\n * Pipeline simplificado (sem Playwright — scraping com fetch + regex):\n * 1. Fetch página lista-outorgas?page=N\n * 2. Regex para extrair tabelas HTML → dados brutos\n * 3. Extrair detalhes via link individual\n * 4. JSON output em apps/web/data/outorgas/outorgas-mg.json\n */

### Schema a Criar

```typescript
// apps/web/lib/db/schema-outorgas.ts

import { pgTable, serial, text, varchar, integer, timestamp, numeric, jsonb, date } from "drizzle-orm/pg-core";

export const outorgas_agua = pgTable("outorgas_agua", {
  id: serial("id").primaryKey(),
  processo_numero: varchar("processo_numero", 50).unique(),
  titular_nome: varchar("titular_nome", 255).notNull(),
  titular_cnpj_cpf: varchar("titular_cnpj_cpf", 18),
  tipo_titular: varchar("tipo_titular", 20), // 'pf', 'pj', 'orgao_publico'
  tipo_uso: varchar("tipo_uso", 100), // 'agricultura', 'industria', 'abastecimento', 'mineracao'
  vazao_m3dia: numeric("vazao_m3dia", { precision: 12, scale: 2 }),
  vazao_m3s: numeric("vazao_m3s", { precision: 10, scale: 4 }),
  bacia_hidrografica: varchar("bacia_hidrografica", 100),
  subbacia: varchar("subbacia", 100),
  id_municipio: text("id_municipio").references(() => municipios.id_municipio),
  
  // Datas
  data_inicio: date("data_inicio"),
  data_fim: date("data_fim"),
  data_atual: date("data_atual"),
  
  // Status
  status: varchar("status", 20), // 'ativa', 'vencida', 'suspensa', 'normalizada'
  
  // Rastreabilidade
  fonte: varchar("fonte", 50), // 'siout_igam', 'snirh', 'ana'
  fonte_url: text("fonte_url"),
  raw_data: jsonb("raw_data"), // Dados brutos para auditoria
  
  criado_em: timestamp("criado_em").defaultNow(),
  atualizado_em: timestamp("atualizado_em").defaultNow(),
});
```

### Rotas a Criar
```
/ambiental/outorgas/
├── /ambiental/outorgas/mg           → mapa interativo de todas as outorgas de MG
├── /ambiental/outorgas/mg/[bacia]   → filtro por bacia
├── /ambiental/outorgas/[id]         → detalhe da outorga + titular
```

### Componentes React
- `<OutorgaMap />` — MapLibre com pontos coloridos por tipo de uso
- `<OutorgaTable />` — tabela filtrável com exportação CSV
- `<TitularProfile />` — outorgas de um mesmo titular (detecção de concentração)

---

## 3️⃣ EXPANSÃO PARA TODAS 853 CIDADES DE MG

### Estratégia de Seed

1. **Seed Inicial (00-5 dias)**
   - Importar lista de 853 municípios de MG do IBGE
   - Adicionar no banco: `id_municipio`, `nome`, `lat`, `lng`, `populacao`
   - Setar `ativo = false` até ter dados suficientes

2. **Seed por Prioridade (6-30 dias)**
   - **Tier 1 (50 cidades):** Capitais + polos
   - **Tier 2 (200 cidades):** municípios do Rio Doce
   - **Tier 3 (603 cidades):** demais

3. **Coleta Automática (30+ dias)**
   - Rotinas diárias/semanais via `cronjob`
   - Monitoramento com `picoclaw` (scripts/agent-tools/)

### Fontes por Cidade (padrão Betim)

| Fonte | Frequência | Dados Disponíveis |
|-------|------------|-------------------|
| PNCP | semanal | Contratos, licitações |
| Transferegov | semanal | Convênios federais |
| Siconfi | mensal | Transferências |
| INEP | anual | IDEB, matrículas |
| RAIS | anual | Empregos formais |
| Conselhos | mensal | Composição conselheiros |
| Outorgas | mensal | Licenças de água |

### Arquivos a Alterar/Criar

| Arquivo | Ação |
|---------|------|
| `apps/web/lib/db/schema-conselhos.ts` | **CRIAR** — tabela `conselhos_membros` |
| `apps/web/lib/db/schema-outorgas.ts` | **CRIAR** — tabela `outorgas_agua` |
| `scripts/etl/outorgas/*.mts` | **CRIAR** — coletores SIOUT |
| `apps/web/app/ambiental/outorgas/` | **CRIAR** — rotas e componentes |
| `apps/web/app/conselhos/` | **CRIAR** — rotas e componentes |
| `docs/fontes/05-ambiente-outorgas.md` | **CRIAR** — documentação de fontes |
| `scripts/etl/municipios/seed_mg.mts` | **CRIAR** — seed de 853 municípios |

---

## 4️⃣ TERMOS DE AUTORIZAÇÃO DE USO SUSTENTÁVEL (TAUS) E CDRU

### Contexto
- **TAUS:** Termos de Autorização de Uso Sustentável de recursos naturais
- **CDRU:** Cessão de Direito Real de Uso (predios, imóveis)
- **PPP:** Parcerias Público-Privadas

### Fontes
| Tipo | Fonte | Observação |
|------|-------|------------|
| TAUS | Sistema Ambiental (SEMA) | Portal do IBAMA/IGAM |
| CDRU | Registro de Imóveis Urbanos (Cartório 20º) | Dados não públicos |
| PPP | Secretarias de Desenvolvimento | Dados em sites de licitações |

### Schema Proposto

```typescript
// apps/web/lib/db/schema-autorizacoes.ts

export const autorizacoes_ambientais = pgTable("autorizacoes_ambientais", {
  id: serial("id").primaryKey(),
  processo_numero: varchar("processo_numero", 50),
  titular: varchar("titular", 255),
  cnpj_cpf: varchar("cnpj_cpf", 18),
  tipo_autorizacao: varchar("tipo_autorizacao", 50), // 'TAUS', 'CDRU', 'Porte', etc.
  area_ha: numeric("area_ha", { precision: 12, scale: 4 }),
  bacia_hidrografica: varchar("bacia_hidrografica", 100),
  coordenadas: jsonb("coordenadas"),
  data_emissao: date("data_emissao"),
  data_vencimento: date("data_vencimento"),
  status: varchar("status", 20), // 'ativa', 'vencida', 'cancelada'
  fonte: varchar("fonte", 100),
  fonte_url: text("fonte_url"),
});

export const parcerias_ppp = pgTable("parcerias_ppp", {
  id: serial("id").primaryKey(),
  numero_contrato: varchar("numero_contrato", 100),
  objeto: text("objeto"),
  investimento_privado: numeric("investimento_privado", { precision: 15, scale: 2 }),
  investimento_publico: numeric("investimento_publico", { precision: 15, scale: 2 }),
  prazo_inicio: date("prazo_inicio"),
  prazo_fim: date("prazo_fim"),
  concessionaria: varchar("concessionaria", 255),
  id_municipio: text("id_municipio").references(() => municipios.id_municipio),
  status: varchar("status", 20), // 'em_execucao', 'concluida', 'suspendida'
  fonte: varchar("fonte", 100),
});
```

---

## 5️⃣ PARTEIPÁCIAS PÚBLICA-PRIVADAS (PPP)

### Fontes
- **PNCP:** Contratos de concessão
- **Secretarias de Desenvolvimento:** Portais de licitação
- **Banco Nacional de Desenvolvimento Econômico e Social (BNDES):** Dados de financiamento

### Escopo
1. Identificar todas as PPPs de MG por município
2. Mapear investimentos, concessionárias e prazos
3. Cruzar com dados de execução orçamentária

---

## 6️⃣ N8N — Fiscalização e Monitoramento dos Fluxos

### Status Atual
- **Não implementado como ferramenta de monitoramento de coleta**
- Repo `n8n` não está vinculado ao projeto atual
- Usuários `colibris-bridge` e `picoclaw-source-watcher` são os monitoramentos ativos

### Recomendação
**Não é necessário implementar n8n agora.** O stack atual já tem:
- `PICOClaw` — monitoramento de fontes (scripts/agent-tools/picoclaw-source-watcher.mts)
- `Colibri Bridge` — roteiro de auditoria
- `Cronjobs` — agendamento de coletas

Se precisar de orquestração visual de fluxos complexos, pode integrar n8n futuramente, mas não é prioridade.

### Alternativa Proposta
1. **Manter PicoClaw como monitor de saúde de fontes**
2. **Adicionar telegram notifications** para alertas
3. **Dashboard interno** em `/admin/monitoring` com status das coletas

---

## 🚀 Plano de Execução por Micro-ETA

### Semana 1 (9-15/set)
|- [x] **M1** — Criar schema `conselhos_membros` e `outorgas_agua` ✅ Concluído
|- [x] **M2** — Criar coletor de conselhos municipais (scraping Betim) ✅ Concluído
|- [x] **M3** — Criar coletor SIOUT (outorgas) para Betim ✅ Concluído

### Semana 2 (16-22/set)
|- [x] **M4** — Criar rotas `/conselhos/mg` e `/ambiental/outorgas/mg` ✅ Concluído
|- [ ] **M5** — Criar componentes React (ConselhoCard, OutorgaMap)
|- [ ] **M6** — Testar integração Betim

### Semana 3 (23-29/set)
|- [ ] **M7** — Criar seed de 853 municípios MG (bloqueado Neon)
|- [ ] **M8** — Atualizar `cities-do-build` para incluir novos campos
|- [ ] **M9** — Documentação de fontes (docs/fontes/)

### Semana 4 (30/set - 06/out)
|- [ ] **M10** — Pipeline de coleta automática via cronjob
|- [ ] **M11** — Dashboard de monitoramento
|- [ ] **M12** — Publicar e validar

---

## 📁 Estrutura de Arquivos

```controle-popular/
├── bots/                           ← ✅ NOVO: diretório de bots
│   ├── verifica-dados.mts          ✅ # Cross-check de valores
│   ├── notifica-telegram.mts       ✅ # Notificação Telegram
│   ├── orquestrador.mts            ✅ # Orquestração microetapas
│   ├── crosscheck-pdf-api.mts      ✅ # Cross-check PDF vs API
│   ├── microresumo-escassez-betim.mts  ✅ # Microresumo hídrico
│   └── README.md                   ✅ # Documentação
├── apps/web/
│   ├── app/
│   │   ├── ambiental/
│   │   │   └── outorgas/           ← PENDENTE
│   │   └── conselhos/              ← JÁ EXISTE (page.tsx, FiltroConselhos.tsx)
│   └── lib/
│       ├── db/
│       │   ├── schema-conselhos.ts  ✅ CRIADO
│       │   ├── schema-outorgas.ts   ✅ CRIADO
│       │   └── schema-autorizacoes.ts ← PENDENTE
│       ├── conselhos/               ✅ EXISTE (catalogo.ts, tipos.ts, catalogo.test.ts)
│       └── ambiental/
│           └── pncp-mg.ts          ✅ EXISTE
│       └── data/
│           ├── conselhos/           ✅ DADOS GERADOS
│           │   └── conselhos-analise.json
│           └── outorgas/            ✅ NOVO
│               └── outorgas-mg.json (pendente coleta completa)
├── scripts/
│   ├── etl/
│   │   ├── conselhos/
│   │   │   └── scrape_conselhos_betim.mts   ✅ CRIADO/CORRIGIDO
│   │   └── outorgas/
│   │       └── coletar-outorgas-mg.mts      ✅ CRIADO/TESTADO
│   ├── coletar-pncp-mg.mts        ✅ EXISTE (coleta PNCP)
│   └── etl/municipios/seed_mg.mts ← PENDENTE
├── docs/
│   └── planos/
│       ├── PLANO-ANALISE-CONSELHOS-OUTORGAS.md  ✅
│       ├── PLANO-EXPANSAO-AMBIENTAL-OUTORGAS-TELIC.md ✅ ATUALIZADO
│       ├── PLANO-TRABALHO-SETEMBRO-2026.md       ✅ ATUALIZADO
│       └── RESUMO-PLANOS.md                      ✅ CRIADO
├── bots/
└── docs/
    └── audit/        ← ✅ NOVO: relatórios de auditoria
```

---

## 🤖 Prompts para Outras IAs

### Prompt de Scraping Conselhos
```
Você é um assistente de scraping especializado em dados de transparência pública.
Preciso extrair a composição do Conselho Municipal de Saúde de [CIDADE-MG].

Acesse: https://www.[cidade].mg.gov.br/transparencia/conselhos

Para cada conselheiro, extraia:
- nome_completo
- instituicao_ou_vinculo (Orgão, Comunidade, Sindicato, etc.)
- segmento (titular, suplente, consultivo)
- data_nomeacao (dd/mm/aaaa)
- email (quando disponível)
- telefone (quando disponível)

Formato JSON:
{
  "municipio": "[CIDADE-MG]",
  "conselho": "Conselho Municipal de Saúde",
  "sigla": "CMS",
  "membros": [
    {
      "nome": "João da Silva",
      "instituicao": "Associação dos Trabalhadores da Saúde",
      "segmento": "titular",
      "data_nomeacao": "15/03/2025",
      "email": "joao@email.com",
      "telefone": "(31) 99999-9999"
    }
  ]
}

Se a página não existir ou não tiver os dados, retorne:
{ "status": "not_found", "url_tentado": "..." }
```

### Prompt de Scraping Outorgas SIOUT
```
Você é um assistente de coleta de dados ambientais.
Preciso extrair todas as outorgas ativas do Sistema de Outorgas de Água de MG (SIOUT).

Acesse: https://siout.igam.mg.gov.br/outorgas

Para cada outorga, extraia:
- numero_processo
- titular_nome (razao social ou nome)
- titular_cnpj_cpf
- tipo_uso (agricultura, industria, abastecimento, mineracao, lazer, outros)
- vazao_m3dia (metros cúbicos por dia) ou vazao_m3s
- bacia_hidrografica
- data_inicio
- data_fim (null se ativa)
- status (ativa, vencida, suspendida)
- coordenadas (lat/lng se disponíveis)

Filtro: apenas outorgas de Minas Gerais (bucar por "MG" ou usar filtro por UF)

Formato CSV ou JSON:
[
  {
    "processo": "00012345/2023",
    "titular": "EMPRESA XYZ LTDA",
    "cnpj": "12.345.678/0001-90",
    "tipo_uso": "industria",
    "vazao_m3dia": 500.00,
    "bacia": "Ribeirão Preto",
    "data_inicio": "2023-01-15",
    "data_fim": null,
    "status": "ativa"
  }
]
```

---

## ⚠️ Armadilhas Conhecidas

1. **Zero CPF Policy** — Não armazenar CPFs completos. Usar máscara `**.123.456-**` se necessário
2. **Rate Limiting** — IGAM pode bloquear IPs com muitas requisições. Implementar `backoff` e `redis` para deduplicação
3. **Formato Inconsistente** — Cada portal municipal tem layout diferente. Usar Playwright + BeautifulSoup
4. **Dados Incompletos** — Alguns conselhos não publicam lista de membros. Marcar como `dados_parcial = true`
5. **Licença de Imagens** — Selos de bacias hidrográficas podem ter licença restrita. Usar SVGs do fallback

---

## 📈 Métricas de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Cidades com dados de conselhos | 6 | 100 (853) |
| Outorgas mapeadas em MG | 0 | 5.000+ |
| Cobertura de bacias hidrográficas | 3 (Doce, Velhas, São Francisco) | 100% das bacias MG |
| Pontos de água no mapa | 0 | 15+ bacias com pontos interativos |

---

## 🔗 Referências

- `docs/06-fontes/FONTES.md` — fontes principais documentadas
- `docs/02-estado/ESTADO.md` — arquitetura e modelos de dados
- `scripts/colibri-bridge.mts` — padrão de orquestração
- `scripts/agregar-sisema-fiscalizacao.mts` — padrão de agregação
- `docs/planos/PLANO-EXPANSAO-NACIONAL-CIDADES-E-ESTADOS.md` — estratégia de expansão

---

> ✨ Citação do Rebrand: *"Aproveitar aos poucos, uma por vez"*