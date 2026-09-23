/**
 * Aplica um arquivo .sql de migration no Postgres (Neon, Guara Cloud ou local).
 *
 * Uso:  npx tsx scripts/aplicar-migration.mts ../../supabase/congresso/migrations/0005_autoria_completa.sql
 *
 * DETECÇÃO DE DRIVER (mesmo lógica de lib/db/client.ts):
 *  - hostname termina em .neon.tech → Pool do @neondatabase/serverless (WebSocket)
 *  - qualquer outro host → Pool do pg (TCP padrão, ex: Guara Cloud, local)
 *
 * POR QUE `Pool` E NÃO `neon()`: o driver HTTP (`neon()`) manda um
 * statement por requisição. Migration real tem vários, e tem bloco `do $$
 * ... $$` com `;` DENTRO — quebrar o arquivo no ponto-e-vírgula produziria
 * SQL inválido. O `Pool` fala o protocolo de simple query, que aceita o
 * arquivo inteiro de uma vez e o roda numa transação implícita:
 * ou tudo entra, ou nada entra.
 *
 * As migrations deste repo são idempotentes de propósito (`if not exists`,
 * `on conflict`), então reaplicar é seguro — é o que permite rodar sem um
 * controle de versão de schema, que este repo ainda não tem.
 */
import fs from "node:fs";
import path from "node:path";

const arquivo = process.argv[2];
if (!arquivo) {
  console.error("uso: tsx scripts/aplicar-migration.mts <arquivo.sql>");
  process.exit(1);
}

const envLocal = new URL("../.env.local", import.meta.url);
const envTexto = fs.existsSync(envLocal) ? fs.readFileSync(envLocal, "utf8") : "";
const url =
  process.env.DATABASE_URL ||
  envTexto.match(/^DATABASE_URL=(.*)$/m)?.[1].trim().replace(/^["']|["']$/g, "");
if (!url) {
  console.error("DATABASE_URL ausente (nem no ambiente nem em apps/web/.env.local)");
  process.exit(1);
}

let hostname: string;
try {
  hostname = new URL(url).hostname;
} catch {
  console.error(`DATABASE_URL invalida: ${url}`);
  process.exit(1);
}

const ehNeon = hostname.endsWith("neon.tech");

// Carrega o Pool correto: Neon (WebSocket) ou pg (TCP padrão)
let Pool: new (opts: { connectionString: string }) => { query(sql: string): Promise<unknown>; end(): Promise<void> };
if (ehNeon) {
  const mod = await import("@neondatabase/serverless");
  Pool = mod.Pool;
  console.info(`detectado Neon (${hostname}) — usando pool WebSocket`);
} else {
  const mod = await import("pg");
  Pool = mod.Pool;
  console.info(`detectado Postgres TCP (${hostname}) — usando pg driver`);
}

const sql = fs.readFileSync(path.resolve(arquivo), "utf8");
const pool = new Pool({ connectionString: url });
try {
  await pool.query(sql);
  console.log(`OK  ${path.basename(arquivo)} aplicada`);
} catch (e) {
  console.error(`ERRO ${path.basename(arquivo)}: ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
