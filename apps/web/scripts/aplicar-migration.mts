/**
 * Aplica um arquivo .sql de migration no Neon.
 *
 * Uso:  npx tsx scripts/aplicar-migration.mts ../../supabase/congresso/migrations/0005_autoria_completa.sql
 *
 * POR QUE `Pool` E NÃO `neon()`: o driver HTTP (`neon()`) manda um
 * statement por requisição. Migration real tem vários, e tem bloco `do $$
 * ... $$` com `;` DENTRO — quebrar o arquivo no ponto-e-vírgula produziria
 * SQL inválido. O `Pool` (WebSocket) fala o protocolo de simple query, que
 * aceita o arquivo inteiro de uma vez e o roda numa transação implícita:
 * ou tudo entra, ou nada entra.
 *
 * As migrations deste repo são idempotentes de propósito (`if not exists`,
 * `on conflict`), então reaplicar é seguro — é o que permite rodar sem um
 * controle de versão de schema, que este repo ainda não tem.
 */
import fs from "node:fs";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";

const arquivo = process.argv[2];
if (!arquivo) {
  console.error("uso: tsx scripts/aplicar-migration.mts <arquivo.sql>");
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
