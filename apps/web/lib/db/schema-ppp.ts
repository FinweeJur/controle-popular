/**
 * Schema de concessões e parcerias público-privadas (PPPs) de Minas Gerais.
 *
 * Papel: espelhar, no Postgres, a base versionada `apps/web/data/ppp-mg.json`,
 * que reúne contratos do Estado de MG cujo objeto cita concessão ou PPP.
 *
 * Fonte oficial: Portal da Transparência de Minas Gerais, base de contratos
 * publicada como dado aberto em `dados.mg.gov.br` (CKAN). URL canônica:
 * https://www.transparencia.mg.gov.br/contratos.
 *
 * Decisões técnicas:
 * - `numeric(18,2)` em valor_inicial/valor_atual: os contratos chegam à casa
 *   dos bilhões (maior valor inicial da base: R$ 6,7 bi), então 18 dígitos
 *   totais com 2 casas evitam estouro de precisão.
 * - `natureza` separa o instrumento da concessão dos contratos de supervisão e
 *   de estudo — só o primeiro é a PPP. Sem essa coluna, o denominador mente.
 * - Zero CPF: a base só traz pessoas jurídicas (CNPJ da concessionária).
 */

import { pgTable, serial, text, integer, date, numeric, timestamp } from "drizzle-orm/pg-core";

/**
 * Tabela de concessões e PPPs do Estado de Minas Gerais.
 * As colunas seguem, uma a uma, os campos do JSON de origem.
 */
export const parceriasPpp = pgTable("parcerias_ppp", {
  id: serial("id").primaryKey(),
  numero_contrato: text("numero_contrato").unique().notNull(),
  numero_processo: text("numero_processo"),
  ano: integer("ano"),
  objeto: text("objeto").notNull(),
  /** 'instrumento_concessao' | 'supervisao_verificacao' | 'estruturacao_estudos' */
  natureza: text("natureza").notNull(),
  setor: text("setor").notNull(),
  concessionaria: text("concessionaria").notNull(),
  cnpj_concessionaria: text("cnpj_concessionaria"),
  valor_inicial: numeric("valor_inicial", { precision: 18, scale: 2 }),
  valor_atual: numeric("valor_atual", { precision: 18, scale: 2 }),
  data_inicio: date("data_inicio"),
  data_fim: date("data_fim"),
  orgao: text("orgao"),
  unidade_gestora: text("unidade_gestora"),
  situacao: text("situacao"),
  esfera: text("esfera"),
  fonte: text("fonte").notNull(),
  fonte_url: text("fonte_url").notNull(),
  criado_em: timestamp("criado_em", { withTimezone: true, mode: "string" }).defaultNow(),
  atualizado_em: timestamp("atualizado_em", { withTimezone: true, mode: "string" }).defaultNow(),
});
