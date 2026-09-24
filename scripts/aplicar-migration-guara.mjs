#!/usr/bin/env node
/**
 * Aplica uma migration no Postgres do Guara via proxy local 15432.
 * Uso: node scripts/aplicar-migration-guara.mjs 0064_ambiental_licenciamento.sql
 * DATABASE_URL nunca é impressa.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = "C:\\nodejs\\node_modules\\@guaracloud\\cli\\bin\\run.js";
const nome = process.argv[2];
if (!nome || !/^[0-9]{4}_[a-z0-9_]+\.sql$/.test(nome)) {
  console.error("Uso: node scripts/aplicar-migration-guara.mjs <NNNN_nome.sql>");
  process.exit(1);
}
const SQL_PATH = path.join(RAIZ, "supabase", "betim", "migrations", nome);
if (!fs.existsSync(SQL_PATH)) {
  console.error("Migration não encontrada:", SQL_PATH);
  process.exit(1);
}

const raw = execFileSync(process.execPath, [CLI, "env", "list", "--project", "controle-popular"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
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
  console.log("OK", nome, "aplicada");
  const r = await pool.query(
    `select table_name from information_schema.tables
     where table_schema='public'
       and table_name in ('ambiental_licenciamento','condicionantes','condicionantes_evidencias','documentos_ambientais')
     order by 1`,
  );
  console.log("tabelas:", r.rows.map((x) => x.table_name).join(", ") || "(nenhuma)");
  if (r.rows.some((x) => x.table_name === "ambiental_licenciamento")) {
    const c = await pool.query(`select count(*)::int as n from ambiental_licenciamento`);
    console.log("ambiental_licenciamento linhas:", c.rows[0].n);
  }
  if (r.rows.some((x) => x.table_name === "condicionantes")) {
    const c = await pool.query(`select count(*)::int as n from condicionantes`);
    console.log("condicionantes linhas:", c.rows[0].n);
  }
} catch (e) {
  console.error("ERRO:", e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
