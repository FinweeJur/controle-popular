Vou estruturar o plano completo. Como não tenho acesso *live* ao repo (os commits mais recentes além da retrospectiva de 01/09/2026 não me são visíveis), baseio-me no **documento de retrospectiva técnico** (903 commits, 155 páginas, 45+ fontes, monorepo com Neon+Drizzle, Next.js, D1) e nas **fontes do Data Ocean** já mapeadas. O plano abaixo é detalhado o suficiente para ser executado pelo time.

---

# 🗺️ Plano de Expansão — Controle Popular (v7.3+)

## Nota sobre atualização do repo

Não tenho acesso *live* ao GitHub além da retrospectiva documentada (último snapshot: 01/09/2026, commit `9b0c4f4`). O plano abaixo assume:
- **Stack atual:** Next.js 14 + TypeScript, Neon Postgres + Drizzle, D1 para dados estáticos, Cloudflare Workers
- **Estrutura:** monorepo com `/apps/portal`, `/libs/data`, `/scripts/etl`, `/docs/`
- **Cidades ativas:** Betim, BH, Araçuaí, Diamantina, Itinga, SP
- **Fontes disponíveis:** 45+ (PNCP, TCE-MG, IBAMA, INPE, CNJ, DataJud, SIH-SUS, etc.)

Se houve mudanças arquiteturais pós-01/09, ajuste os caminhos conforme necessário.

---

## 0️⃣ CONSELHOS SOCIAIS — Composição dos conselheiros

### 📊 Fontes de dados

| Fonte | Onde encontrar | Formato | Acesso |
|---|---|---|---|
| **e-Gov (conselhos municipais)** | Portais de transparência municipais (ex: `transparencia.[cidade].mg.gov.br`) | HTML (listas) ou CSV | Scraping necessário |
| **Conselhos estaduais (MG)** | [transparencia.mg.gov.br](https://www.transparencia.mg.gov.br/) → "Conselhos Estaduais" | HTML | Scraping |
| **Conselhos federais** | [conselhos.planejamento.gov.br](https://conselhos.planejamento.gov.br/) | JSON/HTML | API parcial |
| **LexML** | [lexml.gov.br](https://www.lexml.gov.br/) | XML | Para atas e resoluções |
| **Diários Oficiais** | DOM-PBH, DOC-SP, Jornal Minas Gerais | PDF/HTML | OCR/Scraping |

> ⚠️ **Não existe cadastro nacional unificado de conselhos municipais.** Esta é uma das maiores lacunas de transparência no Brasil. A coleta será **municipal por municipal**, começando pelas 6 cidades ativas e expandindo.

### 🔄 Pipeline de coleta e tratamento

```
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 1: DISCOVERY — Mapear conselhos por município       │
│  Script: scripts/etl/councils/discovery_consels.py           │
│  • Busca em portais de transparência municipais             │
│  • Padrão: Google dork "conselho municipal [tema]"           │
│  • Resultado: JSON {municipio, conselhos: [{nome, url}] }   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  ETAPA 2: SCRAPING — Extrair composição dos conselhos        │
│  Script: scripts/etl/councils/scrape_members.py              │
│  • Para cada URL do discovery, extrai:                        │
│    - Nome do conselheiro                                      │
│    - Instituição/vínculo (governo, sociedade civil, etc.)     │
│    - Segmento (titular/suplente)                             │
│    - Mandato (período)                                        │
│    - CPF/CNPJ (quando disponível)                             │
│  • Usa Playwright (renderiza JS) + BeautifulSoup             │
│  • Tolerância a layouts diferentes (cada portal é único)      │
│  • Resultado: CSV por município                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  ETAPA 3: NORMALIZAÇÃO E DEDUPLING                           │
│  Script: scripts/etl/councils/normalize.py                   │
│  • Padroniza nomes (remover acentos, caixa alta)             │
│  • Classifica instituição:                                   │
│    - "Governo" / "Sociedade Civil" / "Empresariado" / "Outro"│
│  • Deduplica conselheiros (mesmo CPF em múltiplos conselhos) │
│  • Resultado: tabela SQL `conselhos_membros`                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  ETAPA 4: ENRIQUECIMENTO (opcional)                          │
│  Script: scripts/etl/councils/enrich.py                      │
│  • Cruzamento com CNPJ/CPF (Receita Federal) → identificar  │
│    se o conselheiro é pessoa física ou representante legal   │
│  • Cruzamento com RAIS → ocupação profissional               │
│  • Resultado: campos adicionais na mesma tabela               │
└─────────────────────────────────────────────────────────────┘
```

### 🗄️ Modelo de dados (Drizzle)

```typescript
// libs/db/schema/conselhos.ts

import { relations } from 'drizzle-orm';
import { pgTable, serial, text, varchar, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const conselhos = pgTable('conselhos', {
  id: serial('id').primaryKey(),
  municipio_id: integer('municipio_id').notNull().references(() => municipios.id),
  nome: varchar('nome', 255).notNull(),
  tipo: varchar('tipo', 50).notNull(), // 'saude', 'educacao', 'meio_ambiente', 'assistencia_social', 'direitos_humanos', 'tematico'
  ato_criacao: text('ato_criacao'), // link para lei/decreto
  periodicidade_reuniao: varchar('periodicidade_reuniao', 50), // 'mensal', 'bimestral', etc.
  fonte_url: text('fonte_url').notNull(),
  atualizado_em: timestamp('atualizado_em').defaultNow(),
});

export const conselheiros = pgTable('conselheiros', {
  id: serial('id').primaryKey(),
  conselho_id: integer('conselho_id').notNull().references(() => conselhos.id),
  nome: varchar('nome', 255).notNull(),
  cpf_masked: varchar('cpf_masked', 14), // ***.123.456-**
  instituicao: varchar('instituicao', 255).notNull(),
  segmento: varchar('segmento', 50).notNull(), // 'titular', 'suplente', 'convidado'
  tipo_representacao: varchar('tipo_representacao', 50), // 'governo', 'sociedade_civil', 'empresariado', 'sindicato', 'ong'
  mandato_inicio: timestamp('mandato_inicio'),
  mandato_fim: timestamp('mandato_fim'),
  email: varchar('email', 255),
  telefone: varchar('telefone', 20),
  fonte_url: text('fonte_url'),
  ativo: boolean('ativo').default(true),
});

export const conselhosRel = relations(conselhos, ({ many }) => ({
  membros: many(conselheiros),
}));
```

### 🌐 Exposição no frontend

```
Rotas a criar:
├── /conselhos
│   ├── /conselhos/mg          → lista todos os conselhos de MG por cidade
│   ├── /conselhos/[municipio] → lista conselhos daquela cidade
│   └── /conselhos/[municipio]/[conselho_id] → composição detalhada + atas + mandatos
```

**Componentes:**

| Componente | Tipo | Descrição |
|---|---|---|
| `<ConselhoCard />` | React | Nome do conselho, tipo, nº de membros, periodicidade |
| `<ComposicaoTable />` | React | Lista de conselheiros com: nome, instituição, segmento, mandato, tipo de representação (com cor: governo=azul, sociedade civil=verde, empresariado=amarelo) |
| `<MandatoTimeline />` | Recharts | Linha do tempo dos mandatos — mostra sobreposição e renovações |
| `<RedeConselheiros />` | Visx/ForceGraph | Grafo de conexões — conselheiros que participam de múltiplos conselhos (potencial "captura" de agenda) |

**API endpoints:**

```typescript
// apps/portal/app/api/v1/conselhos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const municipio = searchParams.get('municipio');
  const tipo = searchParams.get('tipo');
  
  let query = db.select().from(conselhos).leftJoin(conselheiros, conselhos.id.eq(conselheiros.conselho_id));
  
  if (municipio) query = query.where(conselhos.municipio_id.eq(parseInt(municipio)));
  if (tipo) query = query.where(conselhos.tipo.eq(tipo));
  
  const results = await query.limit(200);
  
  return NextResponse.json({
    results: results.map(r => ({
      conselho: {
        id: r.conselhos.id,
        nome: r.conselhos.nome,
        tipo: r.conselhos.tipo,
        total_membros: r.conselhos.membros?.length || 0,
      },
      membros: r.conselheiros ? [ /* ... */ ] : [],
    }))
  });
}
```

### 🤖 Prompt para outra IA (ex: Kimi, Claude, DeepSeek)

> **Prompt de scraping para conselhos municipais:**
>
> "Você é um assistente de fiscalização de transparência pública. Sua tarefa é extrair a composição completa do Conselho Municipal de Saúde de [NOME DA CIDADE], MG. Acesse o portal de transparência municipal em [URL DO PORTAL] e encontre a página dos conselhos. Para cada conselheiro, extraia: nome completo, instituição/vínculo, segmento (titular/suplente), tipo de representação (governo, sociedade civil, empresariado, etc.), período do mandato, e qualquer contato disponível (email/telefone). Formate em JSON com a estrutura: `{municipio: string, conselho: string, membros: [{nome, instituicao, segmento, tipo_representacao, mandato_inicio, mandato_fim, email, telefone}]}`. Se a página não existir ou não tiver os dados, retorne `status: "not_found"` com o URL tentado. Use Playwright para renderizar JavaScript se necessário."

---

## 1️⃣ OUTORGAS DE ÁGUA — Quem usa, quanto, por quanto tempo

### 📊 Fontes de dados

| Fonte | Onde | Formato | Cobertura MG |
|---|---|---|---|
| **SIGRH / IGAM** | [igam.mg.gov.br](https://www.igam.mg.gov.br/) → "Outorgas" | PDF (relatórios) / HTML / Shapefile | ✅ Completo |
| **SNIRH** | [snirh.gov.br](http://www.snirh.gov.br/) | CSV / Shapefile | Nacional |
| **ANA — Cadastro de Usuários de Água** | [ana.gov.br/sirgas](https://www.gov.br/ana/pt-br/acesso-a-informacao/dados-abertos) | CSV / GeoJSON | Nacional |
| **SIOUT-MG** | [siout.igam.mg.gov.br](https://siout.igam.mg.gov.br/) | Web app (sem API) | MG — sistema de outorgas digital |

> ⚠️ O SIOUT-MG é um sistema web que **não tem API pública**. A coleta exige scraping ou download manual de relatórios.

### 🔄 Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 1: SCRAPING DO SIOUT/IGAM                            │
│  Script: scripts/etl/water/outorgas_scrape.py                │
│  • Acessa SIOUT → busca por bacia hidrográfica / município  │
│  • Para cada outorga:                                       │
│    - Nº do processo                                                          │
│    - Titular (pessoa física ou jurídica)                                   │
│    - CNPJ/CPF                                                              │
│    - Tipo de uso (irrigação, abastecimento, industrial)                    │
│    - Vazão outorgada (m³/s ou m³/dia)                                       │
│    - Período (início–fim)                                                  │
│    - Coordenadas (quando disponível)                                       │
│  • Resultado: CSV com outorgas de MG                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  ETAPA 2: NORMALIZAÇÃO + GEOCODIFICAÇÃO                      │
│  Script: scripts/etl/water/outorgas_normalize.py              │
│  • Padroniza tipos de uso (taxonomia controlada)             │
│  • Geocodifica coordenadas (quando só há endereço)           │
│  • Classifica titular: pessoa física / empresa / órgão       │
│  • Cruzamento com CNPJ (Receita Federal) → setor econômico   │
│  • Resultado: tabela SQL `outorgas_agua`                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  ETAPA 3: ENRIQUECIMENTO COM AMBIENTAL                      │
│  Script: scripts/etl/water/enrich_with_ambiental.py           │
│  • Cruzamento com licenças ambientais SEMAD/SISEMA            │
│  • Cruzamento com focos de incêndio (INPE) → pressão hídrica │
│  • Resultado: campos adicionais na tabela                    │
└─────────────────────────────────────────────────────────────┘
```

### 🗄️ Modelo de dados

```typescript
// libs/db/schema/outorgas.ts

import { pgTable, serial, text, varchar, integer, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';

export const outorgas_agua = pgTable('outorgas_agua', {
  id: serial('id').primaryKey(),
  processo_numero: varchar('processo_numero', 50).unique(),
  titular_nome: varchar('titular_nome', 255).notNull(),
  titular_cnpj_cpf: varchar('titular_cnpj_cpf', 18), // CPF ou CNPJ
  tipo_titular: varchar('tipo_titular', 20).notNull(), // 'pf', 'pj', 'orgao_publico'
  tipo_uso: varchar('tipo_uso', 100).notNull(), // 'irrigacao', 'abastecimento', 'industria', 'mineracao', 'lazer'
  vazao_outorgada_m3s: numeric('vazao_outorgada_m3s', { precision: 10, scale: 4 }),
  volume_outorgado_m3dia: numeric('volume_outorgado_m3dia', { precision: 12, scale: 2 }),
  bacia_hidrografica: varchar('bacia_hidrografica', 100),
  subbacia: varchar('subbacia', 100),
  municipio_id: integer('municipio_id').references(() => municipios.id),
  coordenadas: jsonb('coordenadas'), // {lat: number, lng: number}
  data_inicio: timestamp('data_inicio'),
  data_fim: timestamp('data_fim'),
  status: varchar('status', 50), // 'ativa', 'vencida', 'renovada', 'cancelada'
  fonte_url: text('fonte_url').notNull(),
  observacoes: text('observacoes'),
  criado_em: timestamp('criado_em').defaultNow(),
});
```

### 🌐 Exposição no frontend

```
Rotas:
├── /ambiental/outorgas
│   ├── /ambiental/outorgas/mg          → mapa de todas as outorgas de MG
│   ├── /ambiental/outorgas/[municipio] → lista por município com filtros
│   └── /ambiental/outorgas/[id]        → detalhe da outorga + titular + histórico
```

**Componentes:**

| Componente | Tipo | Descrição |
|---|---|---|
| `<OutorgaMap />` | MapLibre + GeoJSON | Cada ponto é uma outorga; cor por tipo de uso; tamanho por vazão |
| `<OutorgaTable />` | React + filters | Filtros: tipo de uso, status, bacia, período |
| `<VazaoDonutChart />` | Recharts | Distribuição % por tipo de uso (irrigação, indústria, abastecimento) |
| `<TitularProfile />` | Card | Mostra todas as outorgas de um mesmo titular (ex: empresa com 15 outorgas) |

**API endpoint:**

```typescript
// apps/portal/app/api/v1/ambiental/outorgas/route.ts

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const municipioId = searchParams.get('municipio_id');
  const tipoUso = searchParams.get('tipo_uso');
  const status = searchParams.get('status');
  const ano = searchParams.get('ano');
  
  let query = db.select().from(outorgas_agua);
  
  if (municipioId) query = query.where(outorgas_agua.municipio_id.eq(parseInt(municipioId)));
  if (tipoUso) query = query.where(outorgas_agua.tipo_uso.eq(tipoUso));
  if (status) query = query.where(outorgas_agua.status.eq(status));
  if (ano) {
    const start = new Date(`${ano}-01-01`);
    const end = new Date(`${parseInt(ano)+1}-01-01`);
    query = query.where(outorgas_agua.data_inicio.gte(start).and(outorgas_agua.data_inicio.lt(end)));
  }
  
  const results = await query.limit(500);
  return NextResponse.json({ results });
}
```

### 🤖 Prompt para outra IA

> **Prompt de scraping para outorgas de água:**
>
> "Acesse o Sistema de Outorgas de Água de Minas Gerais (SIOUT-MG) em https://siout.igam.mg.gov.br/. Navegue até a consulta pública de outorgas. Para a bacia do Rio Doce, extraia todas as outorgas ativas com: número do processo, titular, CNPJ/CPF, tipo de uso, vazão outorgada, coordenadas geográficas, data de início e fim do mandato. Formate em GeoJSON FeatureCollection com os atributos acima. Se o sistema exigir login público, use as credenciais padrão de consulta. Se houver mais de 500 resultados, implemente paginação automática. Priorize precisão geográfica — se coordenadas não estiverem disponíveis, tente geocodificar pelo endereço do ponto de captação."

---

## 2️⃣ EXPANSÃO PARA TODAS AS 853 CIDADES DE MG

### 📊 Fontes de dados

| Dado necessário | Fonte | Como obter |
|---|---|---|
| Lista de municípios + código IBGE | IBGE / basedosdados | `SELECT CD_MUN, NM_MUN FROM basedosdados.br_ibge_populacao.municipio WHERE sigla_uf = 'MG' AND ano = 2022` |
| População | Censo 2022 (IBGE) | Já no basedosdados |
| Renda média | Censo 2022 (renda do responsável) | Já no basedosdados |
| IDEB | INEP via basedosdados | Já disponível |
| Contratos PNCP | PNCP API | Filtrar por município |
| Transferências | Transferegov API | Filtrar por município |
| Conselhos | Scraping municipal (item 0) | ETL próprio |
| Outorgas | IGAM/SIOUT (item 1) | ETL próprio |

### 🔄 Pipeline de expansão

```
┌─────────────────────────────────────────────────────────────┐
│  PASSO 1: SEED DO CATÁLOGO DE MUNICÍPIOS MG                 │
│  Script: scripts/etl/municipal/seed_mg_municipios.py        │
│  • Busca lista de 853 municípios MG (IBGE)                  │
│  • Cria registro em `municipios` com:                       │
│    - id (sequencial), cd_ibge (7 dígitos), nome,           │
│    - populacao, renda_media, lat, lng                       │
│  • Status field: `expansao_status` ('seeded', 'partial',    │
│    'complete', 'errored') + `last_updated`                  │
│  • Resultado: tabela `municipios` com 853 registros         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  PASSO 2: EXPANSÃO GRADUAL DOS DADOS                        │
│  Script: scripts/etl/municipal/expand_city_data.py           │
│  • Loop sobre municípios com status 'seeded' ou 'partial'   │
│  • Para cada município, executa em paralelo:                 │
│    1. PNCP → contratos locais                                │
│    2. Transferegov → transferências federais                │
│    3. INEP → IDEB + matrículas                               │
│    4. RAIS → empregos formais                                │
│    5. CNES → estabelecimentos de saúde                        │
│    6. Conselhos → scraping (item 0)                          │
│    7. Outorgas → scraping (item 1)                            │
│  • Atualiza `expansao_status` por município                  │
│  • Implementa rate limiting (APIs governamentais têm quota)  │
│  • Usa Redis para deduplicar requests                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  PASSO 3: QUALIDADE E ALERTAS                                 │
│  Script: scripts/etl/municipal/quality_check.py              │
│  • Para cada município:                                      │
│    - Verifica se há pelo menos 3 fontes de dados            │
│    - Alerta se PNCP retornou 0 contratos (pode ser cidade    │
│      pequena ou erro de API)                                 │
│    - Gera relatório de gaps por município                    │
│  • Dashboard interno: /admin/expansao-mg                    │
└─────────────────────────────────────────────────────────────┘
```

### ⚙️ Arquitetura técnica

| Aspecto | Decisão |
|---|---|
| **Processamento paralelo** | Python `concurrent.futures.ThreadPoolExecutor` com 10 workers (ajustável) |
| **Rate limiting** | 5 req/s por API; backoff exponencial em caso de 429 |
| **Retentativas** | 3 tentativas por município/fonte antes de marcar como `errored` |
| **Armazenamento intermediário** | Dados brutos em R2/S3 (JSON por município) → processamento → Postgres |
| **Progresso visível** | Endpoint `/api/v1/admin/expansao-status` com % concluído e municípios pendentes |

### 🗄️ Modelo de dados (tabela `municipios`)

```typescript
// libs/db/schema/municipios.ts

import { pgTable, serial, varchar, integer, numeric, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const municipios = pgTable('municipios', {
  id: serial('id').primaryKey(),
  cd_ibge: varchar('cd_ibge', 7).unique().notNull(),
  nome: varchar('nome', 100).notNull(),
  sigla_uf: varchar('sigla_uf', 2).default('MG'),
  populacao: integer('populacao'),
  renda_media_responsavel: numeric('renda_media_responsavel', { precision: 12, scale: 2 }),
  coordenadas: jsonb('coordenadas'), // {lat: -19.9, lng: -43.9}
  area_km2: numeric('area_km2', { precision: 10, scale: 2 }),
  // Status de expansão
  expansao_status: varchar('expansao_status', 20).default('seeded'),
  last_updated: timestamp('last_updated'),
  fontes_coletadas: jsonb('fontes_coletadas'), // ["pn