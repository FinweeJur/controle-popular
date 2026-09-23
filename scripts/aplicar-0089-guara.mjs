#!/usr/bin/env node
/**
 * Aplica a migration 0089 no Postgres do Guara via proxy local 15432.
 * DATABASE_URL vem de `guara env list` e nunca é impressa.
 * Uso: node scripts/aplicar-0089-guara.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = "C:\\nodejs\\node_modules\\@guaracloud\\cli\\bin\\run.js";
const SQL_PATH = path.join(RAIZ, "supabase", "betim", "migrations", "0089_ambiental_condicionantes.sql");

const raw = execFileSync(
  process.execPath,
  [CLI, "env", "list", "--project", "controle-popular"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);

const m = raw.match(/postgresql:\/\/([^@\s]+)@([^:\s]+):(\d+)\/(\S+)/);
if (!m) {
  console.error("DATABASE_URL nao encontrada no output de guara env list");
  process.exit(1);
}
const cred = m[1];
const db = m[4].replace(/["',]+$/, "");
const url = `postgresql://${cred}@127.0.0.1:15432/${db}`;

const { default: pg } = await import("pg");
const pool = new pg.Pool({ connectionString: url, connectionTimeoutMillis: 15000 });
const sql = fs.readFileSync(SQL_PATH, "utf8");
try {
  await pool.query(sql);
  console.log("OK 0089_ambiental_condicionantes.sql aplicada");
  const r = await pool.query(
    `select table_name from information_schema.tables
     where table_schema='public'
       and table_name in ('documentos_ambientais','condicionantes','condicionantes_evidencias')
     order by 1`,
  );
  console.log("tabelas:", r.rows.map((x) => x.table_name).join(", ") || "(nenhuma)");
} catch (e) {
  console.error("ERRO:", e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
