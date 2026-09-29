/**
 * Schema de Cidades e Polos Regionais de Minas Gerais
 * 
 * Papel: Estruturar dados geográficos, demográficos e de cobertura dos
 * 853 municípios de Minas Gerais no banco de dados.
 * 
 * Fonte oficial:
 * - IBGE (Instituto Brasileiro de Geografia e Estatística): Malha municipal,
 *   microrregiões, mesorregiões e estimativas populacionais 2024/2026.
 * - PNCP e SIOUT: Mapeamento de status de cobertura de dados cívicos.
 * 
 * Decisão técnica:
 * - Código IBGE com 7 dígitos como identificador primário textual para
 *   evitar perda de zeros à esquerda e manter compatibilidade com tabelas federais.
 */

import { pgTable, text, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";

/**
 * Tabela de cidades de Minas Gerais e status de prontidão cívica
 */
export const cidadesMg = pgTable("cidades_mg", {
  id_ibge: text("id_ibge").primaryKey().notNull(), // Código IBGE 7 dígitos (ex: 3106705 para Betim)
  codigo_ibge_6: text("codigo_ibge_6").notNull(),  // Código IBGE 6 dígitos (ex: 310670)
  nome: text("nome").notNull(),
  slug: text("slug").notNull(),
  microrregiao: text("microrregiao"),
  mesorregiao: text("mesorregiao"),
  regiao_imediata: text("regiao_imediata"),
  regiao_intermediaria: text("regiao_intermediaria"),
  populacao: integer("populacao"),
  area_km2: numeric("area_km2", { precision: 10, scale: 2 }),
  eh_polo: boolean("eh_polo").default(false),
  tier: integer("tier").default(3), // 1 = Polos/Capitais, 2 = Bacias/Médias, 3 = Demais
  status_coleta_pncp: text("status_coleta_pncp").default("pendente"),
  status_coleta_outorgas: text("status_coleta_outorgas").default("pendente"),
  total_contratos_pncp: integer("total_contratos_pncp").default(0),
  total_outorgas_agua: integer("total_outorgas_agua").default(0),
  metadados_adicionais: jsonb("metadados_adicionais"),
  atualizado_em: timestamp("atualizado_em", { withTimezone: true, mode: "string" }).defaultNow(),
});
