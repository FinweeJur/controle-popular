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
 * Host é local ou interno de cluster Kubernetes (ex: Guara Cloud)?
 * Hosts internos falam TCP puro sem TLS; forçar ssl: false evita erro FATAL 08P01 (protocol_violation).
 */
function ehHostInternoSemSsl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]") return true;
    if (host.endsWith(".cluster.local") || host.includes(".svc.") || host.endsWith(".internal")) return true;
    if (parsed.searchParams.get("sslmode") === "disable") return true;
    return false;
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
 * `pg` virou dependency (não mais devDependency): agora ele vive no
 * runtime — standalone da Guara e `next start` do túnel — e a presença no
 * standalone garantida por `serverExternalPackages: ["pg"]` (nft não segue
 * `createRequire` com argumento variável).
 */
function criarLocal(url: string): DB {
  const { createRequire } = (
    process as unknown as { getBuiltinModule(id: string): typeof import("node:module") }
  ).getBuiltinModule("node:module");
  const requireDeNode = createRequire(`${process.cwd()}/`);
  const { Pool } = requireDeNode("pg");
  const { drizzle: drizzlePg } = requireDeNode("drizzle-orm/node-postgres");

  const semSsl = ehHostInternoSemSsl(url);
  const poolConfig: Record<string, unknown> = {
    connectionString: url,
    connectionTimeoutMillis: 5000,
    // Container do Guara (Starter) tem 256 MB de burst: 3 conexões bastam e
    // cada socket/pool custa memória. Era 10; medido 03/10/2026.
    max: 3,
    idleTimeoutMillis: 30000,
  };

  if (semSsl) {
    // Hosts internos do cluster Kubernetes (ex.: cp-postgres do Guara) rodam em TCP puro
    // sem TLS. Forçar ssl: false impede o envio de SSLRequest que causa FATAL 08P01 (protocol_violation).
    poolConfig.ssl = false;
  } else if (url.includes("sslmode=require") || !url.includes("sslmode=disable")) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  const pool = new Pool(poolConfig);
  pool.on("error", (err: unknown) => {
    // Evita queda de processo caso o cluster Kubernetes encerre uma conexao inativa
    console.warn("[pg:pool] cliente inativo desconectado:", err instanceof Error ? err.message : err);
  });

  return drizzlePg(pool, { schema }) as unknown as DB;
}

function criar(url: string) {
  return drizzle(neon(url), { schema });
}

/**
 * Cria a conexão para QUALQUER URL, escolhendo o driver pelo hostname
 * (localhost → `pg`; `*.neon.tech` → HTTP da Neon; resto → `pg`).
 *
 * Existe para a cadeia de reserva (`lib/db/reserva.ts`) montar a conexão
 * de um banco alternativo sem repetir a regra de detecção de driver.
 */
export function criarConexao(url: string): DB {
  if (ehPostgresLocal(url)) return criarLocal(url);
  if (ehNeon(url)) return criar(url);
  return criarLocal(url);
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
 * FALLBACK DE CONEXÃO: se o primary falhar ao CRIAR a conexão e
 * `DATABASE_URL_NEON` existir, tenta a Neon. O caso "conecta mas está
 * vazio" NÃO é tratado aqui — quem trata é `comBancoReserva()`, por
 * consulta (`lib/db/reserva.ts`).
 */
export function getDb(): DB | null {
  if (memo !== undefined) return memo;
  const url = process.env.DATABASE_URL;
  if (!url) return (memo = null);

  try {
    return (memo = criarConexao(url));
  } catch (e) {
    console.error("[getDb] primary falhou:", e instanceof Error ? e.message : e);
  }

  const urlNeon = process.env.DATABASE_URL_NEON;
  if (urlNeon && urlNeon !== url) {
    try {
      console.info("[getDb] tentando fallback de conexão para Neon...");
      return (memo = criarConexao(urlNeon));
    } catch (e) {
      console.error("[getDb] fallback Neon falhou:", e instanceof Error ? e.message : e);
    }
  }

  return (memo = null);
}
