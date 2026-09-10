/**
 * Schema de Conselhos Sociais e Colegiados Participativos
 * 
 * Tabela para armazenar composição de conselheiros, mandatos,
 * regulamentos e análises de diversidade de representação.
 * 
 * Regras de acesso:
 * - Nenhum CPF/CNPJ completo (zero CPF policy)
 * - Dados públicos apenas (fontes oficiais municipais/estaduais)
 * - Análises sociais focadas em representação e governança
 */

import { pgTable, pgSchema, serial, text, timestamp, boolean, date, jsonb, integer, numeric, varchar, foreignKey, unique, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Import do municipios do schema principal
import { municipios } from "./schema";

export const conselhosSchema = pgSchema("conselhos");

/**
 * Regimentos e legislações que regem os conselhos
 * Fonte: sites oficiais, diários oficiais, portais de transparência
 */
export const regimentosConselho = pgTable("regimentos_conselho", {
  id: serial("id").primaryKey(),
  id_municipio: text("id_municipio")
    .notNull()
    .references(() => municipios.id_municipio),
  
  nome_conselho: text("nome_conselho").notNull(),
  categoria: text("categoria"), // 'saude', 'educacao', 'meio_ambiente', etc.
  esfera: text("esfera"), // 'municipal', 'estadual', 'federal'
  
  // Documentos legislativos
  lei_organica: text("lei_organica"), // URL ou número
  regimento_interno: text("regimento_interno"),
  resolucao_estadual: text("resolucao_estadual"),
  decretos: text("decretos"),
  
  // Links oficiais
  site_oficial: text("site_oficial"),
  portal_transparencia: text("portal_transparencia"),
  atas_oficiais: text("atas_oficiais"),
  
  // Dados de análise
  data_criacao: date("data_criacao"),
  vigencia_atual: boolean("vigencia_atual").default(true),
  
  criado_em: timestamp("criado_em").defaultNow(),
  atualizado_em: timestamp("atualizado_em").defaultNow(),
});

/**
 * Composição dos conselheiros
 * Análise de representação: governo, sociedade civil, empresariado
 */
export const conselhosMembros = pgTable("conselhos_membros", {
  id: serial("id").primaryKey(),
  id_municipio: text("id_municipio")
    .notNull()
    .references(() => municipios.id_municipio),
  
  nome_conselho: text("nome_conselho").notNull(),
  categoria: text("categoria").notNull(),
  esfera: text("esfera").notNull(),
  
  // Dados do conselheiro
  nome_conselheiro: text("nome_conselheiro").notNull(),
  instituicao: text("instituicao"), // Orgão, Comunidade, Sindicato, etc.
  vinculo_principal: text("vinculo_principal"), // 'governo', 'sociedade_civil', 'empresariado', 'dependente'
  segmento: text("segmento"), // 'titular', 'suplente', 'consultivo'
  
  // Termos de referência e mandato
  data_nomeacao: date("data_nomeacao"),
  mandato_inicio: date("mandato_inicio"),
  mandato_fim: date("mandato_fim"),
  data_fim: date("data_fim"), // Quando o mandato terminou efetivamente
  
  // Contato (quando disponível publicamente)
  // Zero CPF: não armazenar CPF/CNPJ completo
  email: text("email"),
  telefone: text("telefone"),
  
  // Análises sociais
  analise_pautas: jsonb("analise_pautas"),
  
  // Fonte e rastreabilidade
  fonte_url: text("fonte_url"),
  html_section: text("html_section"),
  scraped_at: timestamp("scraped_at").defaultNow(),
  
  // Status
  ativo: boolean("ativo").default(true),
  duplicado_detectado: boolean("duplicado_detectado").default(false),
  
  // Notas de análise
  observacoes: text("observacoes"),
  
  // Zero CPF: máscara automática se houver CPF
  cpf_masked: text("cpf_masked"), // ***.123.456-**
}, (table) => [
  index("conselhos_membros_municipio_idx").on(table.id_municipio),
  index("conselhos_membros_categoria_idx").on(table.categoria),
]);

/**
 * Votação e deliberações dos conselhos
 * Para análise de tendências e resultados
 */
export const votacoesConselho = pgTable("votacoes_conselho", {
  id: serial("id").primaryKey(),
  id_municipio: text("id_municipio")
    .notNull()
    .references(() => municipios.id_municipio),
  
  nome_conselho: text("nome_conselho").notNull(),
  assunto: text("assunto").notNull(),
  
  data_votacao: date("data_votacao"),
  tipo_decisao: text("tipo_decisao"), // 'normal', 'excepcional', 'urgente'
  
  // Resultado
  votos_a_favor: integer("votos_a_favor"),
  votos_contra: integer("votos_contra"),
  abstencoes: integer("abstencoes"),
  total_conselheiros: integer("total_conselheiros"),
  
  // Análise
  resultado: text("resultado"), // 'aprovado', 'rejeitado', 'aberto', 'indeferido'
  palavra_chave: text("palavra_chave"), // 'ambiente', 'saude', 'educacao', etc.
  
  // Fonte
  fonte_url: text("fonte_url"),
  atas_anexa: text("atas_anexa"),
  
  criado_em: timestamp("criado_em").defaultNow(),
}, (table) => [
  index("votacoes_municipio_idx").on(table.id_municipio),
  index("votacoes_data_idx").on(table.data_votacao),
]);

/**
 * Agregação para análises gerais (calculado periodicamente)
 * Métricas sociais: representação, diversidade, tendências
 */
export const analiseConselhos = pgTable("analise_conselhos", {
  id: serial("id").primaryKey(),
  id_municipio: text("id_municipio")
    .notNull()
    .references(() => municipios.id_municipio),
  
  // Contagem de conselheiros por vinculo
  total_conselheiros: integer("total_conselheiros"),
  qtd_governo: integer("qtd_governo"),
  qtd_sociedade_civil: integer("qtd_sociedade_civil"),
  qtd_empresariado: integer("qtd_empresariado"),
  qtd_dependente: integer("qtd_dependente"),
  
  // Percentagens de representação
  pct_sociedade_civil: numeric("pct_sociedade_civil", { precision: 5, scale: 2 }),
  pct_governo: numeric("pct_governo", { precision: 5, scale: 2 }),
  pct_empresariado: numeric("pct_empresariado", { precision: 5, scale: 2 }),
  
  // Diversidade de mandatos
  media_dias_mandato: numeric("media_dias_mandato", { precision: 8, scale: 2 }),
  pct_mandatos_renovados: numeric("pct_mandatos_renovados", { precision: 5, scale: 2 }),
  
  // Análise de votações
  total_votacoes: integer("total_votacoes"),
  pct_a_favor: numeric("pct_a_favor", { precision: 5, scale: 2 }),
  pct_contra: numeric("pct_contra", { precision: 5, scale: 2 }),
  
  // Última atualização
  atualizado_em: timestamp("atualizado_em").defaultNow(),
  
  // Dupla verificação obrigatória (regra AGENTS.md)
  verificado_1: boolean("verificado_1").default(false),
  verificado_2: boolean("verificado_2").default(false),
  fonte_1: text("fonte_1"),
  fonte_2: text("fonte_2"),
  metodologia_1: text("metodologia_1"),
  metodologia_2: text("metodologia_2"),
});