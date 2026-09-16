/**
 * Aplica schema das 5 tabelas de escritas no PostgreSQL e importa os dados do D1.
 * Uso: tsx --env-file-if-exists=.env.local scripts/migrar-d1-para-postgres.mts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { getDb } from "../lib/db/client";

async function principal() {
  const db = getDb();
  if (!db) {
    console.error("❌ DATABASE_URL não configurada no ambiente ou .env.local");
    process.exit(1);
  }

  console.log("🚀 Iniciando migração do D1 para PostgreSQL...");
  const sqlPath = resolve(process.cwd(), "scripts/migrar-d1-para-postgres.sql");
  const conteudo = readFileSync(sqlPath, "utf-8");

  // Divide o arquivo em statements individuais
  const instrucoes = conteudo
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const instrucao of instrucoes) {
    try {
      await db.execute(sql.raw(instrucao));
    } catch (err) {
      console.error("Erro ao executar instrução SQL:", instrucao.slice(0, 80), err);
      throw err;
    }
  }

  console.log("✅ Tabelas de escrita e dados do D1 migrados com sucesso para o PostgreSQL!");
}

principal().catch((e) => {
  console.error("❌ Falha na migração:", e);
  process.exit(1);
});
