# Controle Popular

> Leia em português: [`README.md`](README.md).

An independent public-transparency portal for Brazil. It gathers official data
that is already public but scattered across dozens of systems — PNCP, the
federal Transparency Portal, IBGE, IBAMA, SEMAD-MG, the Chamber of Deputies,
the Senate, the electoral court — and publishes it in one place, by city and
by topic.

Live at **[controlepopular.finweejur.workers.dev](https://controlepopular.finweejur.workers.dev)**

**Every number on the site has a source, and every estimated figure is shown
next to its measured error rate.** That rule organises the whole project: when
there is no source, the screen says so — it does not quietly fill the gap with
a guess.

---

## What is in it today

| Section | Route | What it answers |
|---|---|---|
| **Cities** | `/betim`, `/diamantina`, … | Where the city hall's money goes, and what the council votes on |
| **Congress** | `/congresso` | Federal bills, party blocs, committees, roll-call votes |
| **Judiciary** | `/judiciario` | Court composition, vacancies, Senate confirmations |
| **Environment** | `/ambiental` | COPAM agenda, environmental fines, dams |
| **Search** | `/busca` | Full-text index over the whole collection |

Six cities: **Betim, Belo Horizonte, São Paulo, Diamantina, Araçuaí and
Itinga**. Betim is the most complete; the three Jequitinhonha Valley cities
came last and still have documented gaps.

Measured on 2026-08-10, against the database that generates the site:

| | |
|---|---:|
| Pre-rendered pages | 1,471 |
| Federal legislators (with photo) | 593 |
| Federal bills | 5,562 |
| Municipal contracts | 1,268 |
| Municipal tenders | 1,133 |
| City councillors | 58 |

Coverage varies a lot per city — the portal shows the gap rather than hiding
it.

---

## How it works

**The site is static.** There is no database in production: `next build` reads
Postgres **at build time** and turns everything into pre-rendered HTML, which
is served from Cloudflare Workers. A visit to the site touches no database.

```
public sources ──ETL (Python)──▶ Postgres ──next build──▶ static HTML ──▶ Cloudflare Workers
```

Three parts:

- **`etl/`** — Python collectors, one package per axis (`betim`, `congresso`,
  `judiciario`). Each module has a single source and knows how to abort when
  that source changes.
- **`apps/web/`** — a Next.js 15 app (App Router) with Drizzle ORM over
  Postgres. This is what becomes HTML.
- **`supabase/<axis>/migrations/`** — numbered SQL, applied in order. No
  automatic runner.

### The failure mode you need to know about

With no reachable database, `getDb()` returns `null`, pages render **empty**,
and `next build` **exits 0**. A green build is not a health signal. The signal
is the page count:

```bash
node -e "console.log(Object.keys(require('./.next/prerender-manifest.json').routes).length)"
```

**21** means the database was never read. **≥ 1,471** is correct. Every deploy
script in this repo checks that before publishing.

### Automatic updates

A scheduled task runs `ETL → build → page-count gate → deploy` once a day and
**refuses to publish** if the count drops. See
[`docs/rotina-local.md`](docs/rotina-local.md) (Portuguese).

```bash
npx tsx scripts/rotina-local.mts --listar
```

The workflows under `.github/workflows/` are still versioned and still
**declare the cadence** (the local routine reads their cron expressions), but
they no longer run on a schedule — the database is local to the build machine.

---

## Running it locally

Requirements: **Node 22**, **Python 3.12** and **PostgreSQL** (16+).

### 1. Clone and install

```bash
git clone https://github.com/FinweeJur/controle-popular.git
```

```bash
cd controle-popular && npm install
```

### 2. Database

```bash
createdb controle_popular
```

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local` and set `DATABASE_URL`
(`postgresql://user:password@127.0.0.1:5432/controle_popular`).

Apply the migrations in numerical order with `psql`:

```bash
for f in supabase/*/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

They are idempotent (`if not exists`), so re-running breaks nothing.

### 3. Get some data in

An empty database boots the app, but every screen renders empty. The quickest
ETL to run is the Congress one — it needs only `DATABASE_URL`, no external
credentials:

```bash
cd etl/congresso && python -m venv .venv && .venv/bin/pip install -r requirements.txt
```

```bash
cp .env.example .env && .venv/bin/python -m etl.camara.parlamentares
```

On Windows the path is `.venv\Scripts\`. **Always in a venv** — a global pip
install has already broken tooling in this project.

Each axis has its own `.env.example`. The one under `etl/betim/` needs more
keys because it crosses sources that require registration:

| Variable | What it unlocks | Where to get it |
|---|---|---|
| `TRANSPARENCIA_API_KEY` | federal transfers, debarment lists, welfare data | [Portal da Transparência](https://api.portaldatransparencia.gov.br/) — free |
| `GOOGLE_APPLICATION_CREDENTIALS` | Base dos Dados (BigQuery): health, education, elections | a GCP service account |

The `.env` holds the **path** to the credential file, never its contents.

### 4. Start it

```bash
npm run dev
```

`http://localhost:3000`. For a production build, `npm run build` — and check
the page count, not the exit code.

---

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
| Dams | SNISB and FEAM |
| Mining royalties | CFEM / ANM |
| Federal bills and votes | Chamber and Senate APIs |
| Councillors and photos | TSE, SAPL, council portals |
| Transparency score | PNTP / ATRICON |

Every collector documents, in its own file, its source, the traps measured
against the live service, and what it deliberately does **not** collect.

---

## Contract alerts

The portal flags contracts showing risk signals, and **separates two kinds** —
because treating them alike would give a statistical suspicion the same weight
as breaking a specific article of law:

- **Legal violation** — waiver just under the legal threshold, amendments over
  the cap, sanctioned supplier, split purchasing. Each cites its statute.
- **Heuristic** — unusual value for the category, low share capital. These are
  signals that federal audit bodies actually use to open investigations, **not
  proof of wrongdoing**, and the screen says so.

Every contract links to its own page on PNCP. Flagging something without
offering a way to check it would be asking for trust — the opposite of what
the portal argues for.

---

## Documentation

Most in-repo documentation is in Portuguese.

| | |
|---|---|
| [`docs/rotina-local.md`](docs/rotina-local.md) | How the site updates itself |
| [`docs/worktrees.md`](docs/worktrees.md) | Working parallel branches without collisions |
| [`docs/build-em-outro-pc.md`](docs/build-em-outro-pc.md) | Setting up a build machine from scratch |
| [`docs/USAR-COM-IA.md`](docs/USAR-COM-IA.md) | Navigating the repo with a terminal AI assistant |

---

## Licence

[AGPL-3.0-or-later](LICENSE). The data is public; so is the code that
organises it.
