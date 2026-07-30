import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

/**
 * Tabelas do Better Auth (Fase 4 da migração Cloudflare/Neon).
 *
 * Separado de `schema.ts` de propósito: aquele arquivo é gerado por
 * `drizzle-kit introspect` (ver `drizzle.config.ts`) e seria sobrescrito na
 * próxima vez que alguém rodar o introspect de novo. Estas 4 tabelas foram
 * criadas à mão direto no Neon (não há pipeline de migration formal ainda
 * neste monorepo) — DDL equivalente documentado no histórico da sessão que
 * escreveu a Fase 4.
 *
 * `id`/`userId` são `uuid`, não o `text` (nanoid) que o Better Auth usa por
 * padrão — decisão obrigatória, não estética: `judiciario.monitoramentos.
 * user_id` e `judiciario.alertas.user_id` já são colunas `uuid` (do antigo
 * `auth.users` do Supabase). Isso exige `advanced.database.generateId:
 * "uuid"` em `lib/auth/server.ts` (sem isso o Better Auth geraria um id
 * curto não-uuid, incompatível com a coluna).
 *
 * MIGRAÇÃO DE USUÁRIO: checado ao vivo em 2026-07-29 — `auth.users` no
 * Supabase tem ZERO linhas (ninguém nunca completou um login no
 * Judiciário). Não há nenhum dado de usuário a migrar/preservar por uuid.
 * Se isso mudar antes do cutover (Fase 7), reconferir com:
 * `select count(*) from auth.users` no Supabase antes de assumir que
 * continua vazio.
 */

export const user = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: uuid("id").defaultRandom().primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true, mode: "string" }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true, mode: "string" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: uuid("id").defaultRandom().primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});
