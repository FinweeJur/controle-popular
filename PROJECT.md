# Project: Municipal Gazette Pipeline (Diário Oficial)

## Architecture
Monorepo Next.js 16 (`apps/web`) with static export (`output: export`) for Cloudflare Workers (25 MiB asset ceiling, 3 MiB gzip bundle) + Python ETL (`etl/betim/`).
The gazette pipeline ingests official acts from 5 municipalities (Diamantina, Betim, Belo Horizonte, Araçuaí, Itinga), classifies them deterministically into 7 canonical types (`decreto`, `portaria`, `edital`, `contrato`, `convenio`, `lei`, `outro`), extracts structured entities (R$ monetary values, CNPJs, process/contract/edital numbers, objects), strips/anonymizes real CPFs via Mod-11 validation, and generates static compact JSON slices consumed by `TabelaEstatica.tsx` on `/[municipio]/prefeitura/diario`, with cross-links to contracts, tenders, and agreements.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MUNICIPAL GAZETTE PIPELINE                      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Sources (SIGPub AMM-MG, DOM-PBH, Órgão Oficial Betim, CMSs)        │
│    etl/betim/etl/camaras/sigpub.py, domweb.py, itinga, aracuai         │
│                           │                                            │
│ 2. Classification & Entity Extraction (TS + Python)                   │
│    apps/web/lib/diario/classificarAto.ts                               │
│    apps/web/lib/diario/extrairEntidades.ts                             │
│    etl/betim/etl/diario.py                                             │
│                           │                                            │
│ 3. Privacy & Sanitization (Mod-11 Anonymizer)                          │
│    Zero CPF persistence -> scripts/checar-dado-pessoal-em-dado.py      │
│                           │                                            │
│ 4. Data Slicing & Storage (2 MiB Chunks)                               │
│    apps/web/app/[municipio]/prefeitura/diario/dados/[arquivo]/route.ts│
│                           │                                            │
│ 5. Frontend & 5-Things UI (No External Chart Libs)                     │
│    apps/web/app/[municipio]/prefeitura/diario/page.tsx (SVG + Cards)   │
│    apps/web/app/[municipio]/prefeitura/diario/ListaDiario.tsx (Table)  │
│                           │                                            │
│ 6. Cross-Linking                                                       │
│    /[municipio]/prefeitura/contratos (Extratos e Aditivos)             │
│    /[municipio]/prefeitura/licitacoes (Avisos e Editais)               │
│    /[municipio]/convenios (Termos MROSC)                               │
└────────────────────────────────────────────────────────────────────────┘
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Deterministic 7-type classification | Categorize acts into decreto, portaria, edital, contrato, convenio, lei, outro with strict rule precedence | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Entity Extraction (R$, CNPJs, Processos, Objetos) | Extract monetary amounts, verified CNPJs, edital/process/contract IDs and objects in TS & Python | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Mod-11 CPF Anonymization | Strictly anonymize personal CPFs before persistence / JSON emission | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Municipal Data Slices (Diamantina, Betim, BH, Araçuaí, Itinga) | Format and slice gazette data for target cities into 2 MiB chunks via static route | M2 | ORIGINAL_REQUEST §R2 |
| 5 | Gazette Page Top Macro Cards | 4 summary cards: total acts, editais/licitações, contratos/aditivos, convênios/parcerias | M3 | ORIGINAL_REQUEST §R3 |
| 6 | Inline Accessible SVG Chart | Yearly timeline and type distribution chart without external libraries | M3 | ORIGINAL_REQUEST §R3 |
| 7 | Interactive TagChip & Dropdown Filters | Filter by type (TagChip with counts), organ, and year with URL sync | M3 | ORIGINAL_REQUEST §R3 |
| 8 | Search with `semAcento` | Fast client search over ementa, act number, organ, and object | M3 | ORIGINAL_REQUEST §R3 |
| 9 | UTF-8 BOM `;` CSV Export | Export filtered table records to CSV with UTF-8 BOM and `;` separator | M3 | ORIGINAL_REQUEST §R3 |
| 10 | Cross-linking to Contratos | Gazette card / tab in `/[municipio]/prefeitura/contratos` linking to contract extracts | M4 | ORIGINAL_REQUEST §R4 |
| 11 | Cross-linking to Licitações | Gazette card / tab in `/[municipio]/prefeitura/licitacoes` linking to tender notices | M4 | ORIGINAL_REQUEST §R4 |
| 12 | Cross-linking to Convênios | Gazette card / tab in `/[municipio]/convenios` linking to collaboration/fostering terms | M4 | ORIGINAL_REQUEST §R4 |
| 13 | Navigation Integration | Update `Header.tsx` (`PREFEITURA_SUB`) and `prefeitura/page.tsx` (`TABS` and Diário card) | M4 | ORIGINAL_REQUEST §R3 |
| 14 | E2E and Unit Test Suite | Comprehensive testing for classifier, extractor, anonymizer, 5-things UI, and zero-CPF audit | E2E | ORIGINAL_REQUEST Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Classifier & Entity Extractor Engine | Implement `classificarAto.ts`, `extrairEntidades.ts`, Python parity `diario.py`, Mod-11 CPF anonymization, test fixtures | none | DONE |
| M2 | Municipal Ingestion & Static Data Slices | Implement `apps/web/lib/betim/diario.ts`, static slice route `app/[municipio]/prefeitura/diario/dados/[arquivo]/route.ts`, sample data for target municipalities | M1 | DONE |
| M3 | Gazette UI Route (5-Things Rule) | Implement `apps/web/app/[municipio]/prefeitura/diario/page.tsx` and `ListaDiario.tsx` with SVG charts, macro cards, TagChips, search, CSV export | M1, M2 | DONE |
| M4 | Cross-Linking & Navigation Integration | Connect gazette acts into `/contratos`, `/licitacoes`, `/convenios`, update `Header.tsx` and `prefeitura/page.tsx` | M2, M3 | DONE |
| E2E | Test Suite & Verification Track | Comprehensive unit, integration, and E2E verification; zero-CPF audit; TypeScript compilation | M1, M2, M3, M4 | DONE |

## Interface Contracts

### 1. `apps/web/lib/diario/classificarAto.ts` & `etl/betim/etl/diario.py`
```typescript
export type TipoAto = "decreto" | "portaria" | "edital" | "contrato" | "convenio" | "lei" | "outro";

export const TIPOS_ATO: readonly TipoAto[] = [
  "decreto", "portaria", "edital", "contrato", "convenio", "lei", "outro"
];

export const ROTULOS_TIPO: Record<TipoAto, string> = {
  decreto: "Decretos",
  portaria: "Portarias",
  edital: "Editais e Licitações",
  contrato: "Contratos e Aditivos",
  convenio: "Convênios e Parcerias",
  lei: "Leis",
  outro: "Outros Atos",
};

export function classificarAto(titulo: string, categoriaOriginal?: string | null): TipoAto;
```

### 2. `apps/web/lib/diario/extrairEntidades.ts`
```typescript
export interface EntidadesAto {
  valoresMonetarios: number[];
  valorPrincipal: number | null;
  cnpjs: string[];
  numeroProcesso: string | null;
  numeroEdital: string | null;
  numeroContrato: string | null;
  objeto: string | null;
}

export function extrairEntidades(texto: string): EntidadesAto;
export function anonimizarCpfs(texto: string): string;
```

### 3. `apps/web/lib/betim/diario.ts`
```typescript
export interface ResumoDiarioOficial {
  total: number;
  totalEditais: number;
  totalContratos: number;
  totalConvenios: number;
  totalDecretos: number;
  totalPortarias: number;
  totalLeis: number;
  totalOutros: number;
}

export interface SerieDiarioAno {
  ano: number;
  total: number;
}

export interface LinhaAtoDiario {
  id: string;
  data_publicacao: string;
  edicao: string | null;
  pagina: string | null;
  tipo: TipoAto;
  numero_ato: string | null;
  orgao: string | null;
  ementa: string | null;
  link_fonte: string;
  processo_ref?: string | null;
  valor?: number | null;
  cnpj_mascarado?: string | null;
}

export async function fetchResumoDiario(idMunicipio: string): Promise<ResumoDiarioOficial>;
export async function fetchSerieDiarioPorAno(idMunicipio: string): Promise<SerieDiarioAno[]>;
export async function fetchAtosDiario(idMunicipio: string): Promise<LinhaAtoDiario[]>;
```

## Code Layout
```
apps/web/
├── app/
│   └── [municipio]/
│       ├── components/
│       │   └── Header.tsx                         # Modified: add /prefeitura/diario in PREFEITURA_SUB
│       ├── prefeitura/
│       │   ├── page.tsx                           # Modified: add /prefeitura/diario in TABS and card
│       │   ├── contratos/page.tsx                 # Modified: cross-link gazette contracts
│       │   ├── licitacoes/page.tsx                # Modified: cross-link gazette tenders
│       │   └── diario/
│       │       ├── page.tsx                       # New: Server Component with 5-things layout
│       │       ├── ListaDiario.tsx                # New: Client Component with TabelaEstatica & CSV
│       │       └── dados/
│       │           └── [arquivo]/
│       │               └── route.ts               # New: Sliced static data route
│       └── convenios/page.tsx                     # Modified: cross-link gazette agreements
├── lib/
│   ├── betim/
│   │   └── diario.ts                              # New: Query/aggregation helpers for gazettes
│   └── diario/
│       ├── classificarAto.ts                      # Modified/Enhanced: 7-type classification
│       ├── classificarAto.test.ts                 # Modified/Enhanced: unit tests
│       ├── extrairEntidades.ts                    # New: Entity extraction & CPF anonymization
│       ├── extrairEntidades.test.ts               # New: Entity extraction unit tests
│       └── fixtures/
│           ├── diamantina-75-titulos.json         # Existing calibration fixture
│           └── atos-extracao-fixtures.json        # New: 25+ real act extraction fixtures
etl/betim/
└── etl/
    ├── diario.py                                  # Enhanced: Parity classification, extraction, CPF mask
    └── diario_test.py                             # Enhanced: Python unit tests
```
