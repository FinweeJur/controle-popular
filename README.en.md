# Controle Popular — monorepo

> This is an English translation of [`README.md`](README.md). The canonical
> version is the Portuguese one — code comments, UI copy, and every other
> doc in this repo are Portuguese-first, since the primary audience is
> Brazilian civic-tech groups and local governments. If the two ever
> disagree, trust the Portuguese one and flag it.

Independent transparency portal. Three axes, one app:

| Zone | URL | What it is |
|---|---|---|
| Cities | `/betim` | Municipal executive & legislative (Betim-MG; BH and SP coming in Phase 3) |
| Congress | `/congresso` | Federal bills, caucuses, committees |
| Judiciary | `/judiciario` | Court composition, vacancies, appointments |

The root `/` is the brand home, which lists all three.

## Structure

```
apps/web/            single Next.js app
  app/
    layout.tsx       <html>, fonts, theme — only what's shared
    page.tsx         brand home
    fonts.ts fonts/  fonts shared by all three zones
    globals.css      shared CSS
    betim/ congresso/ judiciario/    one folder per zone, own layout
  lib/
    link-zona.tsx    factory for each zone's <Link> (replaces basePath)
    betim/ congresso/ judiciario/    per-zone libs
etl/
  <zone>/etl/        Python package for each axis
  <zone>/requirements.txt
supabase/<zone>/migrations/
.github/workflows/etl-<zone>.yml
```

## How this came together

Merged from three repos that used to be separate Vercel deploys, wired by
proxy: `betim-ai`, `controle-popular-congresso`, and
`controle-popular-judiciario`. Betim was the parent zone and rewrote
`/congresso` and `/judiciario` to the other two's `*.vercel.app` URLs.

**Public URLs didn't change.** Each app moved into `app/<zone>/` instead of
being flattened at the root, specifically to preserve them — verified by
diffing the route tables before and after: of 78 production URLs, 77 are
identical, and the only one that changed is `/betim/hub`, promoted to `/`
with a permanent redirect.

### `basePath` and the per-zone `<Link>`

Each original repo had its own `basePath` (`/betim`, `/congresso`,
`/judiciario`). One app can only have one `basePath`, so it's gone now —
the prefix is just the route's own directory. But `basePath` also used to
prefix every `next/link` and `router.push` automatically, and that behavior
still had to hold.

Instead of rewriting the ~150 scattered `href`s (many inside multi-line
JSX, others indirect like `href={item.href}` coming from nav arrays), each
zone got its own `<Link>` in `lib/<zone>/link.tsx`, and the 53 affected
files only needed their import line swapped. A blind find-and-replace on
`href` would have failed silently, and that failure mode is a mute 404 —
which the original repos' comments record having happened three times
already.

A raw `<a href>` **doesn't** go through the wrapper, on purpose: `basePath`
never touched those either. That's why links to the root and to sibling
zones stay plain `<a>` tags.

### Canonical data sources

`rubrica/rubrica.json`, `rubrica/temas.json` (Congress) and `regras.json`
(Judiciary) are read **by both the app and the ETL**. They live inside
`apps/web/lib/<zone>/` because Next needs to bundle them, and Python reaches
up to them via `Path(__file__).resolve().parents[3]`. Never duplicate them:
the code comments insist the source stays single, because a divergent copy
would make the portal and the analysis silently disagree with each other.

## Running locally

Prerequisites: **Node 22**, **Python 3.12**, and a **Postgres** database
(any Postgres works locally — production runs on serverless
[Neon](https://neon.com), via the HTTP driver from
`@neondatabase/serverless`).

### 1. Clone and install

```bash
git clone https://github.com/FinweeJur/controle-popular.git
cd controle-popular
npm install
```

### 2. Database

Create a Postgres project ([Neon's free tier](https://neon.com/pricing)
comfortably runs the whole app) and copy the connection string. Then:

```bash
cp apps/web/.env.example apps/web/.env.local
# edit apps/web/.env.local and paste in DATABASE_URL
```

Apply each axis's migrations — there's no automatic runner, every `.sql`
file under `supabase/<zone>/migrations/` is applied in numeric order:

```bash
cd apps/web
for f in ../../supabase/betim/migrations/*.sql; do npx tsx scripts/aplicar-migration.mts "$f"; done
for f in ../../supabase/congresso/migrations/*.sql; do npx tsx scripts/aplicar-migration.mts "$f"; done
for f in ../../supabase/judiciario/migrations/*.sql; do npx tsx scripts/aplicar-migration.mts "$f"; done
```

(On Windows/PowerShell, swap the `for` loop for
`Get-ChildItem ..\..\supabase\betim\migrations\*.sql | ForEach-Object { npx tsx scripts/aplicar-migration.mts $_.FullName }`.)

Migrations are idempotent (`if not exists`), so re-running them is safe —
that's what lets you run the command above from a clean slate without
tracking what's already applied.

### 3. Data

An empty database boots the app, but with no real data every screen is
blank. The fastest way to have something to look at is running one small
ETL:

```bash
cd etl/congresso
python -m venv .venv && source .venv/bin/activate   # .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env    # same DATABASE_URL as step 2
python -m etl.camara.parlamentares
python -m etl.camara.proposicoes --ano 2026
```

Each zone has its own `.env.example` — `etl/betim/`, `etl/congresso/`,
`etl/judiciario/`. Betim's has more keys because it cross-references
external sources (Portal da Transparência, Base dos Dados); the other two
only need `DATABASE_URL`.

### 4. Run the app

```bash
npm run dev     # http://localhost:3000
```

`npm run build` runs the same build production uses (Next 15, App Router).
Because the build **reads the entire database** to statically pre-render
pages (see "Os dois tetos que mandam" in the code comments under
`apps/web/lib/db/`), an empty database builds fast and a full one can take
a while — that's the cost of SSG.

### Exploring with an AI assistant

If you'd rather have a terminal AI assistant help navigate the conventions
above instead of reading everything cold, see
[`docs/USAR-COM-IA.md`](docs/USAR-COM-IA.md) (Portuguese) — it covers
installing [OpenCode](https://opencode.ai) (the open-source equivalent of
Claude Code) and connecting it to DeepSeek or another LLM API.

## Current state

The app runs entirely on **Neon (Postgres) + Drizzle ORM**, served by
**Cloudflare Workers** (`@opennextjs/cloudflare`). The migration away from
three separate Vercel deploys on Supabase — described above in "How this
came together" — is finished; there's no remaining dependency on
`@supabase/supabase-js` in the code. Auth for the logged-in areas is
[Better Auth](https://www.better-auth.com/).

## License

[GNU AGPL-3.0-or-later](LICENSE). Chosen deliberately: anyone running a
modified fork as a public-facing service is required to publish their
changes — a copyleft that matters for a civic-transparency tool.
