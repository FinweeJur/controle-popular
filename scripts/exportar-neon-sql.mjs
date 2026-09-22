import { neon } from "@neondatabase/serverless";
import fs from "fs";

const NEON_URL = "postgresql://neondb_owner:npg_7tT3mNpdEwcG@ep-autumn-bonus-acgz2eby-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";

const TABLES = [
  "ref_municipios_mg",
  "ambiental_licenciamento",
  "copam_reunioes",
  "copam_pauta_itens",
  "contratos",
  "convenios_federais",
  "atos_oficiais",
];

function esc(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

const sql = neon(NEON_URL);

async function main() {
  fs.mkdirSync("neon_export", { recursive: true });

  for (const table of TABLES) {
    const [exists] = await sql.query(
      `SELECT EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=$1)`, [table]
    );
    if (!exists.exists) { console.log(`SKIP ${table}`); continue; }

    const [{ n: count }] = await sql.query(`SELECT count(*)::int as n FROM "${table}"`);
    if (count === 0) { console.log(`SKIP ${table}: vazia`); continue; }

    console.log(`${table}: ${count} linhas`);

    const colRows = await sql.query(`SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [table]);
    const colNames = colRows.map(c => c.column_name);
    const colList = colNames.map(c => `"${c}"`).join(", ");

    const BATCH = 200;
    let offset = 0;
    let fileIdx = 0;
    let totalRows = 0;
    let stream = null;

    while (offset < count) {
      const batch = await sql.query(`SELECT * FROM "${table}" LIMIT $1 OFFSET $2`, [BATCH, offset]);
      if (batch.length === 0) break;

      if (!stream || totalRows % 10000 === 0) {
        if (stream) stream.end();
        fileIdx++;
        stream = fs.createWriteStream(`neon_export/${table}_${fileIdx}.sql`);
        stream.write(`-- ${table} batch ${fileIdx}\n`);
        stream.write(`TRUNCATE TABLE "${table}" CASCADE;\n\n`);
      }

      for (const row of batch) {
        const vals = colNames.map(c => esc(row[c])).join(", ");
        stream.write(`INSERT INTO "${table}" (${colList}) VALUES (${vals});\n`);
      }

      totalRows += batch.length;
      offset += BATCH;
      if (totalRows % 5000 === 0) process.stdout.write(`  ${totalRows}/${count}\r`);
    }

    if (stream) stream.end();
    console.log(`  OK ${totalRows} linhas -> ${fileIdx} arquivos`);
  }

  console.log("\nPronto! Arquivos em ./neon_export/");
}

main().catch(e => { console.error("ERRO:", e.message); process.exit(1); });
