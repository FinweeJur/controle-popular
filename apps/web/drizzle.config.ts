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
  // `terras` faltava aqui (medido ao vivo em 2026-08-11 rodando `introspect`
  // para esta migration: `terras.vazio_municipio` existe no banco, mas sem
  // o schema na lista o introspect a apagou de `schema.ts` em silêncio,
  // quebrando `lib/db/queries/terras.ts` no `tsc --noEmit`). Nunca esteve
  // aqui desde que a tabela foi criada (99c7cc7) — quem gerou o `schema.ts`
  // committado na época deve ter rodado com um filtro local não commitado.
  schemaFilter: ["public", "congresso", "judiciario", "ambiental", "terras"],
  introspect: { casing: "preserve" },
  dbCredentials: { url: process.env.DATABASE_URL! },
});
