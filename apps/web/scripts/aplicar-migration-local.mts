/**
 * Aplica um arquivo .sql de migration no Postgres LOCAL desta máquina
 * (127.0.0.1 — nunca a Neon, ver `.env.local` e a nota de memória do
 * projeto). `aplicar-migration.mts` usa `@neondatabase/serverless` (Pool
 * WebSocket), que fala o protocolo da Neon e não conecta em Postgres local
 * puro — por isso este script irmão usa `pg` direto, a mesma dependência
 * que `lib/db/client.ts` já carrega sob `require` escondido para o modo
 * local (ver o comentário lá sobre por que `pg` é devDependency).
 *
 * Uso: npx tsx scripts/aplicar-migration-local.mts ../../supabase/betim/migrations/0067_x.sql
 */
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const arquivo = process.argv[2];
if (!arquivo) {
  console.error("uso: tsx scripts/aplicar-migration-local.mts <arquivo.sql>");
  process.exit(1);
}

const envTexto = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url =
  process.env.DATABASE_URL ||
  envTexto.match(/^DATABASE_URL=(.*)$/m)?.[1].trim().replace(/^["']|["']$/g, "");
if (!url) {
  console.error("DATABASE_URL ausente (nem no ambiente nem em apps/web/.env.local)");
  process.exit(1);
}
if (!/^(127\.0\.0\.1|localhost)/.test(new URL(url).hostname)) {
  console.error(`recusa: DATABASE_URL não é local (host=${new URL(url).hostname}). Use aplicar-migration.mts para Neon.`);
  process.exit(1);
}

const sqlTexto = fs.readFileSync(path.resolve(arquivo), "utf8");
const pool = new Pool({ connectionString: url });
try {
  await pool.query(sqlTexto);
  console.log(`OK  ${path.basename(arquivo)} aplicada (local)`);
} catch (e) {
  console.error(`ERRO ${path.basename(arquivo)}: ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
