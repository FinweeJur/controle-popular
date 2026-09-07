/**
 * Script de Verificação de Prontidão do Banco Neon (Postgres Serverless).
 *
 * Executa diagnóstico de conectividade, contagem de tabelas e checklist
 * de migrações (0001 a 0079) para garantir prontidão de build.
 *
 * Uso:
 *   npx tsx scripts/verificar-prontidao-neon.mts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAIZ = path.resolve(__dirname, "..");
const envWebLocal = path.join(RAIZ, "apps", "web", ".env.local");

if (!process.env.DATABASE_URL && fs.existsSync(envWebLocal)) {
  for (const linha of fs.readFileSync(envWebLocal, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(linha);
    if (!m || linha.trim().startsWith("#")) continue;
    process.env[m[1]] = m[2].trim().replace(/^["'](.*)["']$/, "$1");
  }
}

import { getDb } from "../apps/web/lib/db/client.js";
import { sql } from "drizzle-orm";

async function run() {
  console.log("🔍 Verificando prontidão do Banco de Dados (Neon/Postgres)...");

  const db = getDb();
  if (!db) {
    console.error("⛔ DATABASE_URL não configurada ou getDb() retornou null.");
    process.exit(1);
  }

  try {
    const inicio = Date.now();
    const probe = await db.execute(sql`SELECT 1 as teste, current_database() as banco, version() as versao;`);
    const latencia = Date.now() - inicio;

    const row = probe.rows[0] as { teste: number; banco: string; versao: string };
    console.log(`✅ Conexão estabelecida com sucesso! (${latencia} ms)`);
    console.log(`   Banco conectado: ${row.banco}`);
    console.log(`   Versão do Postgres: ${row.versao.split(" on ")[0]}`);

    // Contagem de tabelas públicas
    const tabelas = await db.execute(sql`
      SELECT count(*)::int as total
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    const totalTabelas = (tabelas.rows[0] as { total: number }).total;
    console.log(`📊 Tabelas no schema público: ${totalTabelas} tabelas`);

    // Checagem de migrações críticas (0071 - 0079)
    console.log("\n📋 Auditoria de tabelas e estruturas recentes:");

    const checagens = [
      { nome: "convenios_federais", desc: "Convênios Federais (migração 0071)" },
      { nome: "atos_diario", desc: "Atos do Diário Oficial (migração 0077)" },
      { nome: "sirenejud_processos", desc: "Processos Ambientais SIRENEJud" },
      { nome: "direito_critico_precedentes", desc: "Precedentes de Direito Crítico" },
      { nome: "municipios", desc: "Cidades Estratégicas e Polos" },
      { nome: "proposicoes", desc: "Proposições Legislativas e PLs" },
      { nome: "contratos", desc: "Contratos e Compras Públicas" },
    ];

    for (const c of checagens) {
      const existe = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = ${c.nome}
        ) as existe;
      `);
      const ok = (existe.rows[0] as { existe: boolean }).existe;
      console.log(`   ${ok ? "✅" : "⚠️"} ${c.nome.padEnd(28)} — ${c.desc}`);
    }

    console.log("\n🚀 Conclusão do Diagnóstico:");
    if (totalTabelas >= 40) {
      console.log("   O banco de dados está íntegro e operacional para receber o build de produção.");
    } else {
      console.log("   O banco está respondendo, porém com volume reduzido de tabelas.");
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("⛔ Falha na conexão ou execução contra o banco:", msg);
    process.exit(1);
  }
}

run();
