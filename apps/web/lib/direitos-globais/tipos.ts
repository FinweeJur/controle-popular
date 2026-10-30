/**
 * @file lib/direitos-globais/tipos.ts
 * @description Tipos para o módulo de Direitos Globais.
 *
 * Sistema para comparar direitos entre países do sul global,
 * com foco em direitos humanos, ambiental, sociais e coletivos.
 */

// Tipos básicos de direitos
export type TipoDireito = 
  | "humanos"
  | "ambiental"
  | "mulheres"
  | "natureza"
  | "politicos"
  | "criancas"
  | "indigenas"
  | "quilombolas"
  | "campesinos"
  | "coletivos"
  | "atingidos_barragens"
  | "atingidos_empreendimentos";

// Tipos de nível de proteção
export type NivelProtecao = "inexistente" | "fraco" | "moderado" | "forte" | "muito_forte";

// Tipos de regime político
export type RegimePolitico = "democracia" | "autoritario" | "hibrido" | "monarquia_constitucional";

// Tipos de fonte jurídica
export type FonteJuridica = "constituicao" | "lei_federal" | "tratado_internacional" | "jurisprudencia" | "decreto";

// Interface para país
export interface Pais {
  id: string;
  nome: string;
  codigo: string; // ISO 3166-1 alpha-2
  continente: Continente;
  subRegiao: string;
  capital: string;
  idiomasOficiais: string[];
  moeda: string;
  populacao: number;
  area: number; // km²
  idh: number;
  pibPerCapita: number;
  regimePolitico: RegimePolitico;
  dataConstituicao: string;
  fontesJuridicas: FonteJuridica[];
}

// Interface para direito específico
export interface DireitoEspecifico {
  id: string;
  tipo: TipoDireito;
  nome: string;
  descricao: string;
  nivelProtecao: NivelProtecao;
  fontes: FonteJuridica[];
  jurisprudenciaRelevante?: string[];
  tratadosInternacionais?: string[];
  implementacao: {
    legal: boolean;
    pratica: boolean;
    desafios: string[];
  };
}

// Interface para comparação entre países
export interface ComparacaoPaises {
  paises: string[];
  direitos: TipoDireito[];
  criterio: "constitucional" | "legislativo" | "jurisprudencial" | "implementacao";
  resultados: Record<string, Record<TipoDireito, NivelProtecao>>;
}

// Interface para análise por dimensão
export interface AnalisePorDimensao {
  dimensao: TipoDireito;
  paises: Array<{
    pais: string;
    nivel: NivelProtecao;
    indicadores: {
      existencia: boolean;
      cobertura: number; // 0-100
      efetividade: number; // 0-100
      recentesDesafios: string[];
    };
  }>;
  tendencias: {
    melhorando: string[];
    piorando: string[];
    estaveis: string[];
  };
}

// Interface para tratados internacionais
export interface TratadoInternacional {
  id: string;
  nome: string;
  tipo: TipoDireito;
  signatarios: string[];
  dataAssinatura: string;
  dataRatificacao?: string;
  status: "ratificado" | "assinado" | "nao_assinado";
  observacoes: string;
}

// Interface para jurisprudência
export interface Jurisprudencia {
  id: string;
  tribunal: string;
  pais: string;
  tipoDireito: TipoDireito;
  data: string;
  descricao: string;
  importancia: "baixa" | "media" | "alta" | "historica";
  resumo: string;
}

// Interface para dados de implementação
export interface DadosImplementacao {
  pais: string;
  tipoDireito: TipoDireito;
  marcoLegal: {
    data: string;
    descricao: string;
    nivel: NivelProtecao;
  };
  indicadoresQuantitativos: {
    leisAprovadas: number;
    politicasPublicas: number;
    recursosAlocados: number;
    instituicoesResponsaveis: string[];
  };
  indicadoresQualitativos: {
    percepcaoSociedade: number; // 0-100
    coberturaGeografica: number; // 0-100
    impactoPopulacional: number; // 0-100
    desafiosImplementacao: string[];
  };
}

// Tipos de continente
export type Continente = 
  | "america-latina"
  | "africa"
  | "asia"
  | "oceania"
  | "europa"
  | "america-do-norte";

// Interface para configuração do sistema
export interface ConfigComparadorGlobal {
  maxPaisesComparacao: number;
  direitosEmFoco: TipoDireito[];
  fontesPrimarias: FonteJuridica[];
  fontesSecundarias: string[];
  atualizacao: string;
}

// Interface para metadados de análise
export interface MetadadosAnalise {
  dataAnalise: string;
  periodoDados: string;
  fontesUtilizadas: string[];
  metodologia: string;
  limitacoes: string[];
  proximaAtualizacao: string;
}

// Interface para relatório de comparação
export interface RelatorioComparacao {
  id: string;
  titulo: string;
  subtitulo: string;
  paises: string[];
  direitos: TipoDireito[];
  criterio: string;
  dataGeracao: string;
  analises: AnalisePorDimensao[];
  conclusoes: {
    pontosFortes: string[];
    pontosFracos: string[];
    recomendacoes: string[];
  };
  metadados: MetadadosAnalise;
}