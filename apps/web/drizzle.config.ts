import { defineConfig } from "drizzle-kit";

/**
 * Introspecta o Neon já restaurado — o schema REAL de produção, não a
 * reconstrução das 39 migrations (o banco tinha drift: a migration
 * `0004_orgao_membros` estava pendente quando isto foi montado).
 *
 * `casing: "preserve"` é decisão de projeto, não estética: o padrão do
 * drizzle-kit converte `n_cadeiras` para `nCadeiras`, e o app inteiro foi
 * escrito contra as chaves snake_case que o PostgREST devolvia. Preservar
 * os nomes do banco evita uma camada de tradução em cada uma das ~136
 * consultas migradas.
 */
export default defineConfig({
  dialect: "postgresql",
  out: "./lib/db",
  schema: "./lib/db/schema.ts",
  schemaFilter: ["public", "congresso", "judiciario", "ambiental"],
  introspect: { casing: "preserve" },
  dbCredentials: { url: process.env.DATABASE_URL! },
});
