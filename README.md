# Controle Popular — monorepo

> Read this in English: [`README.en.md`](README.en.md).

Portal independente de transparência. Três eixos, um app:

| Zona | URL | O que é |
|---|---|---|
| Cidades | `/betim` | Executivo e legislativo municipal (Betim-MG; BH e SP na Fase 3) |
| Congresso | `/congresso` | Proposições federais, bancadas, comissões |
| Judiciário | `/judiciario` | Composição dos tribunais, vacância, indicações |

A raiz `/` é a home da marca, que lista os três.

## Estrutura

```
apps/web/            app Next.js único
  app/
    layout.tsx       <html>, fontes, tema — só o que é comum
    page.tsx         home da marca
    fonts.ts fonts/  fontes compartilhadas pelas três zonas
    globals.css      CSS compartilhado
    betim/ congresso/ judiciario/    uma pasta por zona, com layout próprio
  lib/
    link-zona.tsx    fábrica do <Link> de cada zona (substitui o basePath)
    betim/ congresso/ judiciario/    libs por zona
etl/
  <zona>/etl/        pacote Python de cada eixo
  <zona>/requirements.txt
supabase/<zona>/migrations/
.github/workflows/etl-<zona>.yml
```

## Como isto foi montado

Veio da fusão de três repos que eram deploys Vercel separados, ligados por
proxy: `betim-ai`, `controle-popular-congresso` e
`controle-popular-judiciario`. O Betim era a zona-mãe e reescrevia
`/congresso` e `/judiciario` para os `*.vercel.app` das outras duas.

**As URLs públicas não mudaram.** Cada app foi para `app/<zona>/` em vez de
ser achatado na raiz, justamente para preservá-las — verificado por diff
das tabelas de rota: das 78 URLs de produção, 77 são idênticas e a única
que mudou é `/betim/hub`, promovida a `/` com redirect permanente.

### O `basePath` e o `<Link>` de zona

Cada repo tinha `basePath` (`/betim`, `/congresso`, `/judiciario`). Um app
tem UM basePath, então ele saiu. O prefixo agora é o próprio diretório da
rota — mas o `basePath` também prefixava automaticamente todo `next/link` e
`router.push`, e isso precisava continuar valendo.

Em vez de reescrever os ~150 `href` espalhados (muitos em JSX multilinha,
outros indiretos como `href={item.href}` vindos de arrays de navegação),
cada zona ganhou um `<Link>` próprio em `lib/<zona>/link.tsx`, e os 53
arquivos tiveram só a linha de import trocada. Um find-and-replace nos
`href` erraria em silêncio, e o modo de falha dessa classe de erro é 404
mudo — que os comentários dos repos originais registram ter acontecido três
vezes.

`<a href>` cru **não** passa pelo wrapper, de propósito: o `basePath` nunca
o tocou. É por isso que os links para a raiz e para as zonas irmãs
continuam sendo `<a>`.

### Fontes canônicas de dados

`rubrica/rubrica.json`, `rubrica/temas.json` (Congresso) e `regras.json`
(Judiciário) são lidos **pelo app e pelo ETL**. Ficam dentro de
`apps/web/lib/<zona>/` porque o Next precisa empacotá-los, e o Python sobe
até lá com `Path(__file__).resolve().parents[3]`. Nunca duplicar: os
comentários no código insistem que a fonte é única, e uma cópia divergente
faria o portal e a análise discordarem em silêncio.

## Rodando localmente

Pré-requisitos: **Node 22**, **Python 3.12** e um banco **Postgres**
(qualquer um serve para rodar local — em produção é [Neon](https://neon.com),
serverless, com o driver HTTP de `@neondatabase/serverless`).

### 1. Clonar e instalar

```bash
git clone https://github.com/FinweeJur/controle-popular.git
cd controle-popular
npm install
```

### 2. Banco

Crie um projeto Postgres (o [free tier da Neon](https://neon.com/pricing)
sustenta o app inteiro) e copie a connection string. Depois:

```bash
cp apps/web/.env.example apps/web/.env.local
# edite apps/web/.env.local e cole a DATABASE_URL
```

Aplique as migrations de cada eixo — não há runner automático, cada arquivo
`.sql` em `supabase/<zona>/migrations/` é aplicado na ordem numérica:

```bash
cd apps/web
for f in ../../supabase/betim/migrations/*.sql; do npx tsx scripts/aplicar-migration.mts "$f"; done
for f in ../../supabase/congresso/migrations/*.sql; do npx tsx scripts/aplicar-migration.mts "$f"; done
for f in ../../supabase/judiciario/migrations/*.sql; do npx tsx scripts/aplicar-migration.mts "$f"; done
```

(No Windows/PowerShell, troque o `for` por
`Get-ChildItem ..\..\supabase\betim\migrations\*.sql | ForEach-Object { npx tsx scripts/aplicar-migration.mts $_.FullName }`.)

As migrations são idempotentes (`if not exists`), então repetir não quebra
nada — é o que permite rodar o comando acima do zero sem se preocupar com
por onde já passou.

### 3. Dado

O banco vazio sobe o app, mas sem dado real toda tela aparece vazia. O
caminho mais rápido para ter algo para olhar é rodar um ETL pequeno:

```bash
cd etl/congresso
python -m venv .venv && source .venv/bin/activate   # .venv\Scripts\activate no Windows
pip install -r requirements.txt
cp .env.example .env    # mesma DATABASE_URL do passo 2
python -m etl.camara.parlamentares
python -m etl.camara.proposicoes --ano 2026
```

Cada zona tem seu próprio `.env.example` — `etl/betim/`, `etl/congresso/`,
`etl/judiciario/`. O de Betim tem mais chaves porque cruza fontes externas
(Portal da Transparência, Base dos Dados); os outros dois só precisam de
`DATABASE_URL`.

### 4. Subir o app

```bash
npm run dev     # http://localhost:3000
```

`npm run build` roda o mesmo build de produção (Next 15, App Router). Como
o build **lê o banco inteiro** para pré-renderizar as páginas estáticas (ver
"Os dois tetos que mandam" no código-comentário de `apps/web/lib/db/`), um
banco vazio builda rápido e um banco cheio pode demorar — é o preço do SSG.

### Explorando com um assistente de IA

Se preferir ter um assistente de IA no terminal ajudando a navegar as
convenções acima em vez de ler tudo direto, ver
[`docs/USAR-COM-IA.md`](docs/USAR-COM-IA.md) — cobre instalar o
[OpenCode](https://opencode.ai) (equivalente open-source ao Claude Code) e
conectar com DeepSeek ou outra API de LLM.

## Estado atual

O app roda inteiramente sobre **Neon (Postgres) + Drizzle ORM**, servido
por **Cloudflare Workers** (`@opennextjs/cloudflare`). A migração a partir
de três deploys Vercel separados sobre Supabase — descrita acima em "Como
isto foi montado" — já terminou; não há mais dependência de
`@supabase/supabase-js` no código. Auth das áreas logadas é
[Better Auth](https://www.better-auth.com/).
