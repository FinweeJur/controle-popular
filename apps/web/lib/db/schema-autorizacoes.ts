/**
 * Schema Drizzle dos imóveis da União em Minas Gerais.
 *
 * Papel: espelhar em banco o cadastro real da SPU — os mesmos campos do JSON
 * versionado (`apps/web/data/destinacoes-uniao-mg.json`), para quando a coleta
 * passar a gravar direto no Postgres.
 *
 * Fonte oficial: SPU — Secretaria do Patrimônio da União (Ministério da Gestão
 * e Inovação), Painel de Transparência Ativa, aba "Imóveis da União" (UF=MG).
 *
 * Decisões:
 * - A chave é o `rip` (Registro Imobiliário Patrimonial), identificador estável
 *   do imóvel na SPU. Não há coluna `id` serial: o RIP já é único e é a chave.
 * - O cadastro NÃO publica processo, família beneficiada nem datas de emissão —
 *   as colunas fabricadas da versão anterior foram removidas.
 * - `area_ha` é `numeric` para não perder precisão; lat/long são
 *   `doublePrecision`, como vêm da fonte.
 */

import { pgTable, text, numeric, doublePrecision } from "drizzle-orm/pg-core";

/** Imóveis da União em MG, como publicados pela SPU. */
export const imoveisUniao = pgTable("imoveis_uniao", {
  rip: text("rip").primaryKey(),
  municipio: text("municipio").notNull(),
  area_ha: numeric("area_ha", { precision: 12, scale: 4 }),
  destinacao: text("destinacao"),
  regime_completo: text("regime_completo"),
  classe: text("classe"),
  tipo: text("tipo"),
  proprietario: text("proprietario"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  fonte: text("fonte").notNull(),
  fonte_url: text("fonte_url").notNull(),
});
