/**
 * Tipos reais das colunas no Postgres, direto do `information_schema`.
 *
 *   npx tsx --env-file=.env.local scripts/colunas-reais.mts contratos despesas
 *
 * Para que serve, com dois casos concretos desta migração:
 *
 * 1. Decidir onde `num()` cabe. Coluna `numeric` volta como STRING no
 *    driver e precisa converter; coluna TEXT não — converter corromperia o
 *    dado. Um levantamento manual já misturou colunas de tabelas vizinhas e
 *    quase converteu `indicadores.valor`, que é TEXT.
 *
 * 2. Descobrir coluna que o código referencia e o banco não tem. Foi assim
 *    que apareceu `atos_oficiais.temas` (migration 0025, nunca aplicada):
 *    o `comColunaOpcional()` do código antigo caía sempre no fallback e o
 *    ranking por área da página de legislação nascia vazio em produção,
 *    sem erro nenhum.
 *
 * O schema do Drizzle vem da introspecção, então em tese bastaria lê-lo —
 * mas ele é uma FOTO, tirada no dia do `drizzle-kit pull`. Este script
 * pergunta ao banco agora.
 *
 * DETECÇÃO DE DRIVER: hostname termina em .neon.tech → neon (WebSocket);
 * qualquer outro → pg (TCP padrão, ex: Guara Cloud, local).
 */
import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)![1].trim().replace(/^["']|["']$/g, "");
const hostname = new URL(url).hostname;
const ehNeon = hostname.endsWith("neon.tech");

let query: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;
let endPool: () => Promise<void>;
if (ehNeon) {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);
  query = (s, p) => sql.query(s, p ?? []) as Promise<Record<string, unknown>[]>;
  endPool = async () => {};
} else {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: url });
  query = async (s, p) => {
    const r = await pool.query(s, p ?? []);
    return r.rows;
  };
  endPool = () => pool.end();
}

const tabelas = process.argv.slice(2);
if (tabelas.length === 0) {
  console.error("uso: npx tsx scripts/colunas-reais.mts <tabela> [tabela...]");
  process.exit(1);
}

try {
  const linhas = await query(
    `select table_schema, table_name, column_name, data_type
       from information_schema.columns
      where table_name = any($1)
      order by table_schema, table_name, ordinal_position`,
    [tabelas]
  );

  let atual = "";
  for (const l of linhas) {
    const chave = `${l.table_schema}.${l.table_name}`;
    if (chave !== atual) {
      atual = chave;
      console.log(`\n== ${chave}`);
    }
    console.log(`   ${String(l.column_name).padEnd(28)} ${l.data_type}`);
  }

  // Tabela que não voltou nada não existe — e é justamente o achado mais
  // útil quando o código referencia uma coluna que a migration não criou.
  const achadas = new Set(linhas.map((l) => l.table_name));
  for (const t of tabelas) if (!achadas.has(t)) console.log(`\n!! NAO EXISTE: ${t}`);
} finally {
  await endPool();
}
process.exit(0);
