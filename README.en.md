# Controle Popular

> Leia em português: [`README.md`](README.md).

An independent public-transparency portal for Brazil. It gathers official data
that is already public but scattered across dozens of systems and publishes it
in one place, by city and by topic, in plain language.

Live at **[controlepopular.com.br](https://controlepopular.com.br)**
(fallback: [controlepopular.finweejur.workers.dev](https://controlepopular.finweejur.workers.dev))

**Every number has a source, and every estimate is shown next to its measured
error rate.** When the source has no data, the screen says so — a declared gap
is information, not a hidden defect.

## The six fronts

| Front | Route | What it answers |
|---|---|---|
| Cities | `/[municipio]` (`/sp`, `/bh`, `/betim`, `/diamantina`, `/aracuai`, `/itinga`) | Contracts, tenders, **municipal official gazettes** with deterministic classification, federal transfers (ComunicaBR), and municipal finances |
| Congress | `/congresso` | Federal bills by topic, committee, and Minas Gerais party blocs |
| Judiciary | `/judiciario` | Court composition, vacancies, CNJ inspections, and environmental lawsuits (SIRENEJud) |
| Social Function of Land | `/funcaosocialterra` (+ `/mapa`, `/alertas`) | CAR cadastral gap on 3D globe, indigenous lands, quilombola territories, and **387 Conservation Units (CNUC/MMA)** |
| Paraopeba | `/paraopeba` | The Brumadinho reparation: FGV/AECOM audit, R$ 1.64B municipal transfers (853 cities), press radar, and timeline |
| Environment & Corporations | `/ambiental` (+ `/paraopeba/vale`, `/ambiental/mariana`) | **Mariana Agreement (R$ 677M in MG)**, **Vale S.A. Observatory (B3/CVM)**, IBAMA federal licensing, TAC registry, and LAI/CGE rulings |

## Architecture & Data Highlights

- **The 5-Things Rule on Data-Heavy Pages:** Accessible inline SVG charts (no bulky chart libraries), summary macro cards, unaccented search, interactive filter chips (`TagChip`), and UTF-8 BOM `;` CSV exports.
- **Algorithmic LGPD Privacy Guard:** Automatic personal CPF anonymization via **Mod-11** checksum verification before any open data persistence (100% LGPD compliant).
- **Automated Collectors & Local Orchestration:** Proactive collector monitoring via Telegram Bot API (`scripts/rotina-coletas.mts`) and local container workflows with Podman (`changedetection.io` and `n8n`).

## Public API

The portal's aggregated data is also served as open JSON, no key required:

- Interactive docs (Swagger UI, with "Try it out"): **[`/api`](https://controlepopular.com.br/api)**
- OpenAPI spec: `/api/openapi.yaml`
- Datasets: `/api/v1/` (stable contract; breaking changes become `/api/v2/`)

## Stack

npm monorepo. Next.js 16 in `apps/web` (App Router), Python ETL in `etl/`,
Postgres (Neon/local) for build-time reads and Cloudflare D1 for live writes.
Deploy to Cloudflare Workers via OpenNext:

```bash
cd apps/web && npm run cf:deploy
```

Production is served by `next start` behind a Cloudflare Tunnel; the Workers
deploy is the fallback. Either way, the heavy lifting happens at build time:
`next build` reads Postgres and pre-renders the site.

### The failure mode you need to know about

With no reachable database, pages render **empty** and `next build` **exits
0**. A green build is not a health signal. The signal is the page count:

```bash
node -e "console.log(Object.keys(require('./.next/prerender-manifest.json').routes).length)"
```

**21** means the database was never read. **1,471+** is correct (measured
2026-08-16 — re-measure before deciding with it).

## Running it locally

Requirements: **Node 22**, **Python 3.12** and **PostgreSQL** (16+).

### 1. Clone and install

```bash
git clone https://github.com/FinweeJur/controle-popular.git
cd controle-popular && npm install
```

### 2. Database

```bash
createdb controle_popular
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local` and set `DATABASE_URL`
(`postgresql://user:password@127.0.0.1:5432/controle_popular`). Apply the
migrations in numerical order:

```bash
for f in supabase/*/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

They are idempotent (`if not exists`), so re-running breaks nothing.

### 3. Get some data in

An empty database boots the app, but every screen renders empty. The quickest
ETL to run is the Congress one — it needs only `DATABASE_URL`:

```bash
cd etl/congresso && python -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env && .venv/bin/python -m etl.camara.parlamentares
```

On Windows the path is `.venv\Scripts\`. **Always in a venv.**

Each axis has its own `.env.example`. The one under `etl/betim/` needs more
keys because it crosses sources that require registration:

| Variable | What it unlocks | Where to get it |
|---|---|---|
| `TRANSPARENCIA_API_KEY` | federal transfers, debarment lists, welfare data | [Portal da Transparência](https://api.portaldatransparencia.gov.br/) — free |
| `DADOS_GOV_BR_API_TOKEN` | federal open-data catalog API | [dados.gov.br](https://dados.gov.br/) account — free |
| `GOOGLE_APPLICATION_CREDENTIALS` | Base dos Dados (BigQuery): health, education, elections | a GCP service account |

The `.env` holds the **path** to the credential file, never its contents.

### 4. Start it

```bash
npm run dev
```

`http://localhost:3000`. For a production build, `npm run build` — and check
the page count, not the exit code.

## Where each dataset comes from

| Topic | Source |
|---|---|
| Contracts and tenders | PNCP (national public procurement portal) |
| Federal transfers, sanctions, welfare | Portal da Transparência |
| Population, GDP, agriculture | IBGE |
| Schools, health facilities, mortality | INEP, CNES, SIH/SIM (via Base dos Dados) |
| Municipal revenue and spending | SICONFI |
| Federal environmental fines | IBAMA |
| State environmental fines (MG) | CAP / SEMAD-MG |
| Dams | SNISB, FEAM, ANM |
| Mining royalties | CFEM / ANM |
| Federal bills and votes | Chamber and Senate APIs |
| Environmental lawsuits | CNJ — SIRENEJud (bulk download) and DataJud (live queries) |
| Councillors and photos | TSE, SAPL, council portals |
| Transparency score | PNTP / ATRICON |

Every collector documents, in its own file, its source, the traps measured
against the live service, and what it deliberately does **not** collect. The
full operational catalogue is
[`docs/06-fontes/FONTES.md`](docs/06-fontes/FONTES.md) (Portuguese).

## Documentation

Most in-repo documentation is in Portuguese. Start with:

- [`docs/LEIA-PRIMEIRO.md`](docs/LEIA-PRIMEIRO.md) — quick index.
- [`docs/01-produto/PRODUTO.md`](docs/01-produto/PRODUTO.md) — what the portal is, fronts and editorial rules.
- [`docs/02-estado/ESTADO.md`](docs/02-estado/ESTADO.md) — what is live, the queue, blockers.
- [`AGENTS.md`](AGENTS.md) — the repo's hard rules (commit, worktrees, personal data, publishing).

## Licence

[AGPL-3.0-or-later](LICENSE). The data is public; so is the code that
organises it.
