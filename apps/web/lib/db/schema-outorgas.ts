/**
 * Schema de Outorgas de Água — Sistema de Licenciamento Hídrico de MG
 * 
 * Foco em análises de:
 * - Escassez hídrica: vazão total x demanda
 * - Concentração hídrica: % de empresas que controlam mais
 * - Tempo de renovação: validade média das licenças
 * - Perfil setorial: uso por tipo de atividade
 * 
 * Fontes: SIOUT-MG, IGAM, SNIRH, ANA
 * Zero CPF: máscara automática
 */

import { pgTable, pgSchema, serial, text, timestamp, boolean, date, numeric, jsonb, integer, varchar, foreignKey, unique, index, doublePrecision } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Import do municipios do schema principal
import { municipios } from "./schema";

export const outorgasSchema = pgSchema("outorgas");

/**
 * Matriz de tipos de uso para padronização
 */
const TIPOS_USO_OUTORGA = [
  "agricultura",
  "pecuaria", 
  "industria",
  "abastecimento",
  "mineracao",
  "lazer",
  "recreacao",
  "energia",
  "transporte",
  "saneamento",
  "outros",
] as const;

/**
 * Status da outorga
 */
const STATUS_OUTORGA = [
  "ativa",
  "vencida",
  "suspendida",
  "cancelada",
  "normalizada",
  "em_analise",
] as const;

/**
 * Tipos de titulares
 */
const TIPOS_TITULAR = [
  "pf_pessoa_fisica",
  "pj_pessoa_juridica",
  "orgao_publico",
  "autarquia",
  "empresa_estatal",
] as const;

/**
 * Tabela principal de outorgas de água
 */
export const outorgasAgua = pgTable("outorgas_agua", {
  id: serial("id").primaryKey(),
  
  // Identificador único da outorga
  processo_numero: text("processo_numero").unique().notNull(),
  numero_unico: text("numero_unico"), // Campo alternativo se existir
  
  // Dados do titular
  titular_nome: text("titular_nome").notNull(),
  titular_cpf_masked: text("titular_cpf_masked"), // ***.123.456-** (zero CPF policy)
  titular_cnpj: text("titular_cnpj"), // CNPJ completo apenas para cross-reference
  tipo_titular: text("tipo_titular"),
  
  // Dados da licença
  tipo_uso: text("tipo_uso"),
  categoria_licenca: text("categoria_licenca"), // 'licenca_total', 'licenca_separada', 'autorizacao_esporadica'
  
  // Recursos hídricos
  bacia_hidrografica: text("bacia_hidrografica"),
  subbacia: text("subbacia"),
  area_ha: numeric("area_ha", { precision: 12, scale: 4 }),
  vazao_m3dia: numeric("vazao_m3dia", { precision: 12, scale: 2 }),
  vazao_m3s: numeric("vazao_m3s", { precision: 10, scale: 4 }),
  vazao_minima_m3dia: numeric("vazao_minima_m3dia", { precision: 10, scale: 2 }),
  
  // Localização
  id_municipio: text("id_municipio").references(() => municipios.id_municipio),
  coordenadas: jsonb("coordenadas"),
  endereco: text("endereco"),
  
  // Período
  data_emissao: date("data_emissao"),
  data_inicio: date("data_inicio"),
  data_fim: date("data_fim"), // null se ativa
  prazo_validade_meses: integer("prazo_validade_meses"),
  
  // Situação atual
  status: text("status").default("ativa"),
  situacao_cadastral: text("situacao_cadastral"),
  
  // Valor (quando aplicável)
  valor_taxa: numeric("valor_taxa", { precision: 12, scale: 2 }),
  valor_multa: numeric("valor_multa", { precision: 12, scale: 2 }),
  
  // Fonte e rastreabilidade
  fonte_origem: text("fonte_origem"), // 'siout_igam', 'snirh', 'ana', 'igam'
  fonte_url: text("fonte_url"),
  raw_data: jsonb("raw_data"), // Dados brutos para auditoria
  scraped_at: timestamp("scraped_at").defaultNow(),
  
  // Notas
  observacoes: text("observacoes"),
  classificacao_economica: text("classificacao_economica"), // CNAE, setor, etc.
  
  // Meta para análises futuras
  demanda_estimada_m3dia: numeric("demanda_estimada_m3dia", { precision: 12, scale: 2 }),
}, (table) => [
  index("outorgas_status_idx").on(table.status),
  index("outorgas_bacia_idx").on(table.bacia_hidrografica),
  index("outorgas_tipo_uso_idx").on(table.tipo_uso),
  index("outorgas_data_inicio_idx").on(table.data_inicio),
  index("outorgas_titular_idx").on(table.titular_nome),
]);

/**
 * Agrupamento para análises de concentração
 * Relaciona múltiplas outorgas ao mesmo titular
 */
export const perfisTitularesOutorgas = pgTable("perfis_titulares_outorgas", {
  id: serial("id").primaryKey(),
  
  titular_nome: text("titular_nome").notNull(),
  titular_cnpj_cpf_masked: text("titular_cnpj_cpf_masked"), // Máscara
  
  // Quantidade de outorgas
  total_outorgas: integer("total_outorgas"),
  outorgas_ativas: integer("outorgas_ativas"),
  outorgas_vencidas: integer("outorgas_vencidas"),
  
  // Vazão total
  vazao_total_m3dia: numeric("vazao_total_m3dia", { precision: 14, scale: 2 }),
  
  // Tipos de uso predominantes (top 3)
  tipos_uso_principais: jsonb("tipos_uso_principais"),
  
  // Bacia predominante
  bacia_hidrografica: text("bacia_hidrografica"),
  
  // Classificação
  classificacao_perfil: text("classificacao_perfil"), // 'individuo', 'empresa', 'orgao_publico', 'concentrado'
  
  // Percentagem de concentração nacional
  pct_concentracao_nacional: numeric("pct_concentracao_nacional", { precision: 6, scale: 2 }),
  
  criado_em: timestamp("criado_em").defaultNow(),
  atualizado_em: timestamp("atualizado_em").defaultNow(),
});

/**
 * Estatísticas agregadas por bacia
 * Para dashboards de mapeamento
 */
export const estatisticasBacias = pgTable("estatisticas_bacias", {
  id: serial("id").primaryKey(),
  bacia_hidrografica: text("bacia_hidrografica").unique().notNull(),
  uf: text("uf"),
  
  // Contagem
  total_outorgas: integer("total_outorgas"),
  outorgas_ativas: integer("outorgas_ativas"),
  outorgas_vencidas: integer("outorgas_vencidas"),
  
  // Vazão
  vazao_total_m3dia: numeric("vazao_total_m3dia", { precision: 14, scale: 2 }),
  vazao_minima_exigida_m3dia: numeric("vazao_minima_exigida_m3dia", { precision: 14, scale: 2 }),
  
  // Setores
  pct_agricultura: numeric("pct_agricultura", { precision: 5, scale: 2 }),
  pct_industria: numeric("pct_industria", { precision: 5, scale: 2 }),
  pct_saneamento: numeric("pct_saneamento", { precision: 5, scale: 2 }),
  
  // Concentração
  top_10_titulares_pct: numeric("top_10_titulares_pct", { precision: 5, scale: 2 }),
  
  // Tempo de validade
  media_validade_dias: numeric("media_validade_dias", { precision: 8, scale: 0 }),
  
  // Última atualização
  atualizado_em: timestamp("atualizado_em").defaultNow(),
});

/**
 * Análise de escassez hídrica por região
 * Compara vazão outorgada com estimativas de demanda
 */
export const analiseEscassez = pgTable("analise_escassez", {
  id: serial("id").primaryKey(),
  bacia_hidrografica: text("bacia_hidrografica").notNull(),
  id_municipio: text("id_municipio").references(() => municipios.id_municipio),
  
  // Métricas de escassez
  vazao_outorgada_m3dia: numeric("vazao_outorgada_m3dia", { precision: 12, scale: 2 }),
  demanda_estimada_m3dia: numeric("demanda_estimada_m3dia", { precision: 12, scale: 2 }),
  margem_seguranca_pct: numeric("margem_seguranca_pct", { precision: 5, scale: 2 }),
  
  // Nível de risco
  nivel_risco: text("nivel_risco"), // 'baixo', 'medio', 'alto', 'critico'
  classificacao_sidra: text("classificacao_sidra"),
  
  // Fonte dos dados
  fonte_estimativa: text("fonte_estimativa"), // 'ibge', 'igeolab', 'snirh'
  
  // Dupla verificação obrigatória
  verificado_1: boolean("verificado_1").default(false),
  verificado_2: boolean("verificado_2").default(false),
  fonte_1: text("fonte_1"),
  fonte_2: text("fonte_2"),
  metodologia_1: text("metodologia_1"),
  metodologia_2: text("metodologia_2"),
  
  criado_em: timestamp("criado_em").defaultNow(),
  atualizado_em: timestamp("atualizado_em").defaultNow(),
}, (table) => [
  index("analise_escassez_bacia_idx").on(table.bacia_hidrografica),
  index("analise_escassez_municipio_idx").on(table.id_municipio),
  index("analise_escassez_risco_idx").on(table.nivel_risco),
]);