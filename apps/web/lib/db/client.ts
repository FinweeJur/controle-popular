import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Acesso ao Postgres — suporta Neon (HTTP), Guara Cloud e Postgres local.
 *
 * DETECÇÃO DE DRIVER (3 vias):
 *  - localhost/127.0.0.1/::1 → `pg` (node-postgres, TCP) — build local
 *  - hostname termina em neon.tech → `@neondatabase/serverless` (HTTP)
 *  - qualquer outro hostname → `pg` (TCP) — ex: Guara Cloud, Supabase, RDS
 *
 * FALLBACK: se o primary falhar e `DATABASE_URL_NEON` estiver configurada,
 * tenta a Neon automaticamente. Isso garante resiliência quando o Guara Cloud
 * (ou outro Postgres remoto não-Neon) está fora.
 *
 * DRIVER NEON: `@neondatabase/serverless` no modo HTTP. Cada query é um POST
 * HTTPS, sem conexão TCP persistente. O Neon Free suspende o compute depois
 * de ~5 min ocioso — um pool persistente manteria acordada 24/7 e queimaria
 * a cota. No Workers, cada isolate é efêmero e não há onde pool viver.
 *
 * TETO DE SUBREQUESTS: no Workers Free são 50 por invocação, e cada query
 * HTTP conta uma. Página que hoje faz 5-10 selects sequenciais deve virar
 * 1-2 com join/CTE. Nada de N+1.
 */

export type DB = ReturnType<typeof criar>;

/**
 * NÃO passe `fetchOptions: { cache: "no-store" }` aqui.
 *
 * É tentador: o driver HTTP faz cada consulta com `fetch`, o Next
 * intercepta esse `fetch` com a Data Cache dele, e essa cache PERSISTE
 * ENTRE BUILDS (ver `npm run prebuild`, que é a correção certa). Mas
 * `no-store` marca a requisição como `revalidate: 0`, e aí o Next se
 * recusa a prerenderizar qualquer página que a use — medido: o build
 * morre em `/[municipio]/meio-ambiente/paraopeba` com
 * `DYNAMIC_SERVER_USAGE`. Isso derrubaria a estaticização, que é a base
 * do plano de ir para o Workers Free (Fase 5).
 *
 * A cache DENTRO de um build é desejável: ela é o que faz `listarCidades()`
 * custar uma consulta em vez de 110. O problema é só a que sobrevive de um
 * build para o outro.
 */

/**
 * O host é Neon? Só então o driver SQL-sobre-HTTP entra.
 *
 * Troca por HOSTNAME, nunca por `includes`: uma URL pode conter a palavra
 * em qualquer lugar (nome de branch, senha). Neon = termina em `neon.tech`.
 * Qualquer outro host (localhost, Postgres do Guara, Postgres local)
 * fala TCP puro e usa `pg` — o driver HTTP da Neon não abre conexão
 * Postgres: ele monta uma URL de API `https://<host>/sql` e, apontado a
 * outro Postgres, falha com `TypeError: fetch failed`. Medido em
 * 2026-09-20: sitemap e páginas de Congresso morreram assim no runtime
 * do Docker da Guara com o banco interno (`svc-*.svc.cluster.local`).
 */
function ehNeon(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith("neon.tech");
  } catch {
    return false;
  }
}

/**
 * Host é local? Decide se usa `pg` (TCP) ou `neon` (HTTP).
 *
 * Teste por HOSTNAME, não por `includes("localhost")`: uma URL da Neon pode
 * conter a palavra em qualquer lugar (nome de branch, senha) e cairia no
 * driver errado — falhando com "Failed to parse URL", não com algo legível.
 */
function ehPostgresLocal(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
  } catch {
    return false;
  }
}

/**
 * MOTOR TCP (`pg` + `drizzle-orm/node-postgres`).
 *
 * Servia só quando `DATABASE_URL` apontava a localhost (build offline,
 * docs/build-em-outro-pc.md §5). Desde a Fase 4 também serve o runtime do
 * Docker da Guara Cloud: o host interno `svc-*.svc.cluster.local` não é
 * Neon, então cai aqui — sem isso o driver HTTP da Neon mandava fetch
 * HTTPS para o Postgres e producão morria com `fetch failed`.
 *
 * POR QUE `require` ESCONDIDO DO BUNDLER, e não `import` no topo: o alvo
 * padrão continua Cloudflare Workers, com teto de 3 MiB gzip e sem TCP. Um
 * `import { Pool } from "pg"` no topo deste arquivo entraria no bundle do
 * Worker em todo deploy, para um caminho que lá nunca roda (o host da
 * Neon usa o motor HTTP). O só-caminho-executado mantém o Worker enxuto.
 *
 * `pg` virou dependency (não mais devDependency): agora ele vive no
 * runtime — standalone da Guara e `next start` do túnel — e a presença no
 * standalone garantida por `serverExternalPackages: ["pg"]` (nft não segue
 * `createRequire` com argumento variável).
 */
function criarLocal(url: string): DB {
  // `(0, eval)("require")` NAO serve aqui, e o modo de falha e traicoeiro:
  // em Node solto funciona, mas dentro do chunk do Turbopack (ESM) da
  // `ReferenceError: require is not defined`, cai no catch de `getDb()` e o
  // build sai VERDE com zero pagina de cidade. Medido em 2026-08-09.
  //
  // `process.getBuiltinModule` (Node 22) devolve `node:module` SEM import
  // estatico — que e o ponto: o bundler do Worker continua sem enxergar `pg`.
  const { createRequire } = (
    process as unknown as { getBuiltinModule(id: string): typeof import("node:module") }
  ).getBuiltinModule("node:module");
  const requireDeNode = createRequire(`${process.cwd()}/`);
  const { Pool } = requireDeNode("pg");
  const { drizzle: drizzlePg } = requireDeNode("drizzle-orm/node-postgres");
  // O cast mantém `DB` com UM tipo só. Os dois drivers expõem a mesma
  // superfície para tudo que este app usa — e `db.execute()`, que é a
  // diferença real entre eles, já é desembrulhado com `.rows ?? []` nos 13
  // chamadores (`NeonHttpQueryResult` e `QueryResult` do pg têm ambos
  // `.rows`). Sem o cast, o tipo de retorno viraria união e as 149 funções
  // de consulta passariam a precisar de narrowing.
  return drizzlePg(new Pool({ connectionString: url }), { schema }) as unknown as DB;
}

function criar(url: string) {
  return drizzle(neon(url), { schema });
}

let memo: DB | null | undefined;

/**
 * Conexão com o banco, ou `null` quando `DATABASE_URL` não está configurada.
 *
 * O `null` é deliberado e herdado do `getSupabaseClient()` original:
 * chamadores DEVEM tratá-lo como "fonte de dados ainda não configurada" e
 * renderizar estado vazio, nunca lançar. É o que permite `next build`
 * rodar sem banco — sem isso, os ~50 arquivos que tocam dados passariam a
 * quebrar o build em qualquer ambiente sem credencial (CI, clone novo).
 *
 * FALLBACK: se o primary falhar e `DATABASE_URL_NEON` existir, tenta a Neon.
 * Isso garante que o site funcione mesmo quando o Postgres primary (ex:
 * Guara Cloud) está indisponível.
 */
export function getDb(): DB | null {
  if (memo !== undefined) return memo;
  const url = process.env.DATABASE_URL;
  if (!url) return (memo = null);

  const urlNeon = process.env.DATABASE_URL_NEON;

  // 1. Localhost → pg driver (build local, nunca muda)
  if (ehPostgresLocal(url)) {
    try {
      return (memo = criarLocal(url));
    } catch (e) {
      console.error("[getDb] falhou ao criar conexao local; seguindo sem banco:", e);
      return (memo = null);
    }
  }

  // 2. Neon (HTTP protocol) ou Postgres remoto (TCP padrão, ex: Guara Cloud)
  try {
    if (ehNeon(url)) {
      return (memo = criar(url));
    }
    // Qualquer outro host remoto (Guara Cloud, Supabase, RDS, etc.)
    // usa o pg driver via TCP — mesmo mecanismo do build local
    return (memo = criarLocal(url));
  } catch (e) {
    console.error("[getDb] primary falhou:", e instanceof Error ? e.message : e);
  }

  // 3. Fallback: se primary falhou e Neon está configurada, tenta Neon
  if (urlNeon && urlNeon !== url) {
    try {
      console.info("[getDb] tentando fallback para Neon...");
      return (memo = criar(urlNeon));
    } catch (e) {
      console.error("[getDb] fallback Neon falhou:", e instanceof Error ? e.message : e);
    }
  }

  return (memo = null);
}
