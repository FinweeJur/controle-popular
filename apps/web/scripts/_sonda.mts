/** Sonda temporária: numeração e cota das cadeiras já semeadas. */
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";
const t = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const sql = neon(t.match(/^DATABASE_URL=(.*)$/m)![1].trim().replace(/^["']|["']$/g, ""));

for (const trib of ["stj", "tst", "stm"]) {
  const r = await sql.query(
    `select numero, cota, dispositivo, observacao from judiciario.cadeiras
      where tribunal_id = $1 order by numero`,
    [trib]
  );
  console.log(`\n### ${trib} (${r.length} cadeiras)`);
  console.log(r.map((x: any) => `${x.numero}:${x.cota}`).join("  "));
  console.log("dispositivo ex.:", (r[0] as any)?.dispositivo, "| obs:", (r[0] as any)?.observacao);
}
const c = await sql.query(`select column_name, data_type from information_schema.columns
  where table_schema='judiciario' and table_name='magistrados' order by ordinal_position`);
console.log("\n### colunas de magistrados");
console.log(c.map((x: any) => x.column_name).join(", "));
