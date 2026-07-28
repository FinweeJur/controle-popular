# Controle Popular — monorepo

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

## Rodar

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

Os ETLs rodam de dentro da pasta da zona, onde o pacote `etl` resolve:

```bash
cd etl/congresso && pip install -r requirements.txt && python -m etl.camara.proposicoes
```

## Estado da migração

Este monorepo é a Fase 2 do plano de migração para Cloudflare Workers +
Neon. Ainda usa Supabase via `@supabase/supabase-js`; a troca por Drizzle
sobre Neon é a Fase 3, junto com o multi-cidade (`/cidades/[municipio]`), e
a troca do Supabase Auth por Better Auth é a Fase 4.
