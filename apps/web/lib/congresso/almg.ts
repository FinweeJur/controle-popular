/**
 * Tipos para proposições da Assembleia Legislativa de Minas Gerais (ALMG).
 *
 * Fonte: Dados Abertos ALMG — dadosabertos.almg.gov.br/api/v2
 * CSV: dadosabertos.almg.gov.br/documentacao/arquivos/proposicoes
 *
 * A API da ALMG segue o padrão REST com JSON. Os campos espelham o CSV
 * documentado, com nomes em camelCase (API) vs PascalCase (CSV).
 *
 * A rubrica garantista é reaproveitada do Congresso federal — os 24
 * direitos fundamentais da CF/88 valem para o estadual também,因为
 * a Constituição Estadual de MG reproduce os mesmos artigos.
 */

export interface ProposicaoAlmg {
  /** Código no formato "SIGLA NUMERO/ANO" — ex: PL 3015/2024 */
  codigo: string;
  tipo: string;
  sigla_tipo: string;
  numero: number;
  ano: number;
  ementa: string | null;
  indexacao: string | null;
  situacao: string | null;
  situacao_geral: string | null;
  data_publicacao: string | null;
  data_atualizacao: string | null;
  data_ultima_acao: string | null;
  regime: string | null;
  resumo: string | null;
  origem: string | null;
  local: string | null;
  fase_atual: string | null;
  legislatura: number | null;
  autores: AutorAlmg[] | null;
  url_texto: string | null;
  /**true se está em tramitação ativa */
  tramitando: boolean;
}

export interface AutorAlmg {
  id: number;
  nome: string;
  partido: string;
}

export interface DeputadoAlmg {
  id: number;
  nome: string;
  nome_eleitoral: string | null;
  partido: string;
  uf: string;
  gabinete: string | null;
  email: string | null;
  url_foto: string | null;
  legislatura: number;
  ativo: boolean;
}

export interface ComissaoAlmg {
  id: number;
  sigla: string;
  nome: string;
  tipo: string;
}

export interface FiltrosAlmg {
  q?: string;
  tipo?: string;
  situacao?: string;
  ano?: number;
  autor?: string;
  tramitando?: boolean;
  pagina?: number;
  porPagina?: number;
}

/** Status gerais de tramitação (mapeados do CSV da ALMG) */
export const SITUACOES_GERAIS = {
  MAPCO: "Aguardando apreciação nas comissões",
  MAPLE: "Aguardando apreciação no Plenário",
  MAPRI: "Aguardando providências iniciais",
  MAPRV: "Proposições aprovadas",
  MARFI: "Aguardando aprovação da redação final",
  MRJTD: "Proposições rejeitadas",
  MOUTR: "Outras situações",
} as const;

/** Tipos de proposição relevantes para análise garantista */
export const TIPOS_RELEVANTES = [
  "PL",   // Projeto de Lei
  "PLC",  // Projeto de Lei Complementar
  "PEC",  // Proposta de Emenda à Constituição
  "PLD",  // Projeto de Lei Delegada
  "PRE",  // Projeto de Resolução
  "PLE",  // Proposta de Ação Legislativa
] as const;
