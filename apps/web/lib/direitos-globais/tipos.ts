/**
 * @file lib/direitos-globais/tipos.ts
 * @description Tipos para o módulo de Direitos Globais.
 *
 * Sistema para comparar direitos entre países do sul global,
 * com foco em direitos humanos, ambiental, sociais e coletivos.
 */

// Tipos básicos de direitos (catálogo unificado de 24 temas)
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
  | "atingidos_empreendimentos"
  // Novos temas acrescidos (Frentes B e C):
  | "povos"
  | "idosos"
  | "deficiencia"
  | "lgbtqia"
  | "migrantes_refugiados"
  | "trabalho"
  | "saude"
  | "educacao"
  | "moradia"
  | "agua"
  | "terra_territorio"
  | "memoria_verdade_justica";

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
  /**
   * Campos demográficos e econômicos são opcionais de propósito.
   * País sem número conferido fica sem o campo, e a tela mostra "em coleta".
   * Número inventado em portal de transparência é dano, não enfeite.
   */
  populacao?: number;
  area?: number; // km²
  idh?: number;
  pibPerCapita?: number;
  dadosAno?: number;
  regimePolitico: RegimePolitico;
  dataConstituicao: string;
  fontesJuridicas: FonteJuridica[];
  em_coleta?: boolean;
  lacuna?: string;
}

/**
 * Dispositivo legal concreto: o artigo, o texto e o link da fonte.
 *
 * Regra editorial: `texto` é transcrição fiel do dispositivo, sem resumo.
 * Se o original não for em português, `idiomaOriginal` e `traducao` dizem
 * de onde veio o texto que o leitor está vendo.
 */
export interface Dispositivo {
  pais: string;
  tipo: TipoDireito;
  citacao: string; // "Artículo 97" / "ARTÍCULO 40" / "Lei nº 12.651, art. 1º"
  titulo: string;
  texto: string;
  fonte: string; // nome da fonte, ex.: "Constitute Project"
  url: string;
  dataAcesso: string; // ISO 8601
  idiomaOriginal?: string; // "es", "fr", "pt"
  traducao?: string; // observação quando o texto exibido é tradução
  em_coleta?: boolean;
  lacuna?: string;
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