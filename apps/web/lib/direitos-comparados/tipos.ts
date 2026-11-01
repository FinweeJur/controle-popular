/**
 * @file lib/direitos-comparados/tipos.ts
 * @description Tipos para o módulo de Direitos Comparados.
 *
 * Sistema para comparar indicadores de direitos fundamentais entre estados,
 * analisar grupos de pesquisa e avaliar o impacto social das universidades.
 */

// Tipos básicos de indicadores
export interface IndicadorBasico {
  id: string;
  nome: string;
  unidade: string;
  valor: number;
  ano: number;
  fonte: string;
}

// Tipos para comparação entre estados
export interface ComparadorEstados {
  estados: string[];
  indicadores: IndicadorBasico[];
  dimensao: DesenhoDireitos;
}

export type DesenhoDireitos = 
  | "desenvolvimento"
  | "educacao" 
  | "saude"
  | "justica"
  | "trabalho"
  | "financas"
  | "inovacao"
  | "extensao"
  | "cultura";

// Tipos para grupos de pesquisa
export interface GrupoPesquisa {
  id: string;
  sigla: string;
  nome: string;
  areaConhecimento: string;
  grandeArea: string;
  instituicao: string;
  unidade?: string;
  coordenadores: string[];
  projetosVinculados: string[];
  urlFonte: string;
  dataAtualizacao: string;
}

export interface RedeCooperacao {
  id: string;
  nome: string;
  instituicoes: string[];
  projetos: string[];
  foco: string;
  coordenacao: string;
}

// Tipos para universidades e impacto
export interface IndicadorSocial {
  id: string;
  dimensao: DesenhoDireitos;
  indicador: string;
  valor: number;
  unidade: string;
  ano: number;
  instituicao: string;
}

export interface CasoDestaque {
  id: string;
  instituicao: string;
  titulo: string;
  descricao: string;
  impacto: string;
  dimensao: DesenhoDireitos;
  localizacao: string;
  urlFonte?: string;
}

export interface RankingImpacto {
  instituicao: string;
  pontuacao: number;
  impactos: DesenhoDireitos[];
  destaque: string;
}

// Metadados das fontes
export interface FonteDados {
  nome: string;
  sigla?: string;
  url: string;
  tipo: "oficial" | "academica" | "privada";
  cobertura: string;
  atualizacao: string;
}

// Configuração do sistema
export interface ConfigComparador {
  maxEstados: number;
  dimensoes: DesenhoDireitos[];
  fontes: FonteDados[];
  atualizacao: string;
}

// Dados consolidados
export interface DadosComparados {
  estados: string[];
  indicadores: Record<DesenhoDireitos, IndicadorBasico[]>;
  rankings: RankingImpacto[];
  redes: RedeCooperacao[];
  casos: CasoDestaque[];
}