/**
 * ═══ TIPOS DO MÓDULO "PROMETEU? CUMPRIU?" (PLANO v8) ═══
 *
 * Estruturas de dados para cruzamento de planos de governo (TSE) com a execução
 * real por secretarias municipais/estaduais e ministérios federais.
 *
 * Regras editoriais e técnicas (AGENTS.md):
 * - O número vem do dado.
 * - 'sem_sinal' é lacuna declarada até a data de medição, nunca juízo de valor.
 * - Insinuação é dano: toda evidência carrega link público e órgão oficial.
 */

export type StatusProposta =
  | "sem_sinal"
  | "anunciada"
  | "em_andamento"
  | "concluida"
  | "contrariada"
  | "revogada";

export type TipoEvidencia =
  | "edital"
  | "contrato"
  | "convenio"
  | "obra"
  | "diario_oficial"
  | "noticia"
  | "post_oficial"
  | "lei"
  | "decreto"
  | "tce"
  | "orcamento";

export interface Evidencia {
  id: string;
  tipo: TipoEvidencia;
  titulo: string;
  url: string;
  data_publicacao: string; // ISO YYYY-MM-DD
  orgao_emissor: string;
  via?: string;
  arquivado_em?: string;
  valor_reais?: number;
}

export interface Proposta {
  id: string;
  mandato_id: string;
  tema: string;
  orgao_alvo: string;
  trecho_verbatim: string;
  plano_pagina: number;
  status: StatusProposta;
  status_medido_em: string; // ISO YYYY-MM-DD
  evidencias: Evidencia[];
  observacao?: string;
}

export interface IniciativaForaDoPlano {
  id: string;
  tema: string;
  orgao: string;
  titulo: string;
  descricao: string;
  url: string;
  data: string;
  tipo: TipoEvidencia;
  valor_reais?: number;
}

export interface MandatoGestao {
  ente: string;
  slug: string;
  nome_ente: string;
  esfera: "municipal" | "estadual" | "federal";
  gestor: string;
  cargo: string;
  partido?: string;
  coligacao?: string;
  periodo: {
    inicio: number;
    fim: number;
  };
  plano_pdf_url: string;
  plano_pdf_r2_url?: string; // Espelho arquivado e comprimido no Cloudflare R2
  plano_pdf_hash_sha256?: string;
  plano_registrado_em: string;
  ultima_medicao: string;
  propostas: Proposta[];
  iniciativas_fora_do_plano: IniciativaForaDoPlano[];
}

export interface ResumoStatusGestao {
  totalPropostas: number;
  porStatus: Record<StatusProposta, number>;
  porTema: Record<string, number>;
  porOrgao: Record<string, number>;
  totalEvidencias: number;
  totalForaDoPlano: number;
  percentualComSinal: number; // % que tem sinal público (anunciada, em andamento, concluída)
}

export type RegiaoBrasil = "Sudeste" | "Sul" | "Nordeste" | "Centro-Oeste" | "Norte";

export const REGIAO_POR_UF: Record<string, RegiaoBrasil> = {
  SP: "Sudeste",
  RJ: "Sudeste",
  MG: "Sudeste",
  ES: "Sudeste",
  RS: "Sul",
  PR: "Sul",
  SC: "Sul",
  BA: "Nordeste",
  PE: "Nordeste",
  CE: "Nordeste",
  MA: "Nordeste",
  PB: "Nordeste",
  RN: "Nordeste",
  AL: "Nordeste",
  PI: "Nordeste",
  SE: "Nordeste",
  DF: "Centro-Oeste",
  GO: "Centro-Oeste",
  MT: "Centro-Oeste",
  MS: "Centro-Oeste",
  PA: "Norte",
  AM: "Norte",
  RO: "Norte",
  TO: "Norte",
  AC: "Norte",
  AP: "Norte",
  RR: "Norte",
};

