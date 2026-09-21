/** Sonda temporária: numeração e cota das cadeiras já semeadas. */
import fs from "node:fs";

const t = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = t.match(/^DATABASE_URL=(.*)$/m)![1].trim().replace(/^["']|["']$/g, "");
const hostname = new URL(url).hostname;
const ehNeon = hostname.endsWith("neon.tech");

let query: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;
if (ehNeon) {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);
  query = (s, p) => sql.query(s, p ?? []) as Promise<Record<string, unknown>[]>;
} else {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: url });
  const result = await pool.query("SELECT 1");
  // Monkey-patch query para fechar o pool no final
  query = async (s, p) => {
    const r = await pool.query(s, p ?? []);
    return r.rows;
  };
  // Sobrescrever para fechar pool depois
  const origQuery = query;
  query = async (s, p) => {
    try {
      return await origQuery(s, p);
    } finally {
      await pool.end();
    }
  };
}

for (const trib of ["stj", "tst", "stm"]) {
  const r = await query(
    `select numero, cota, dispositivo, observacao from judiciario.cadeiras
      where tribunal_id = $1 order by numero`,
    [trib]
  );
  console.log(`\n### ${trib} (${r.length} cadeiras)`);
  console.log(r.map((x) => `${x.numero}:${x.cota}`).join("  "));
  console.log("dispositivo ex.:", (r[0])?.dispositivo, "| obs:", (r[0])?.observacao);
}
const c = await query(`select column_name, data_type from information_schema.columns
  where table_schema='judiciario' and table_name='magistrados' order by ordinal_position`);
console.log("\n### colunas de magistrados");
console.log(c.map((x) => x.column_name).join(", "));
