export type UF = "AC" | "AL" | "AP" | "AM" | "BA" | "CE" | "DF" | "ES" | "GO" | "MA" | "MT" | "MS" | "MG" | "PA" | "PB" | "PR" | "PE" | "PI" | "RJ" | "RN" | "RS" | "RO" | "RR" | "SC" | "SP" | "SE" | "TO";

export type Periodo = {
  ano: number;
  semestre?: 1 | 2;
};

export type TipoIndicador = "desenvolvimento" | "educacao" | "saude" | "justica" | "trabalho" | "financas";

export interface DadosGeograficos {
  uf: UF;
  estado: string;
  regiao: "Norte" | "Nordeste" | "Sudeste" | "Sul" | "Centro-Oeste";
  populacao: number;
  area_km2: number;
  densidade_demografica: number;
}

export interface IndicadoresDesenvolvimento {
  idh_geral: number;
  idh_renda: number;
  idh_educacao: number;
  idh_longevidade: number;
  gini: number;
  pib_per_capita: number;
  pib_total_bi: number;
  renda_media: number;
  desemprego: number;
  informalidade: number;
}

export interface IndicadoresEducacao {
  ideb_fundamental_anos_iniciais: number;
  ideb_fundamental_anos_finais: number;
  ideb_medio: number;
  matricula_publica: number;
  matricula_privada: number;
  docentes: number;
  escolas: number;
  taxa_conclusao: number;
  distorcao_idade_serie: number;
  rede_escolar_por_10mil: number;
}

export interface IndicadoresSaude {
  leitos_hospitalares: number;
  estabelecimentos_sus: number;
  med_por_10mil: number;
  enfermeiros_por_10mil: number;
  cobertura_vacinal: number;
  mortalidade_infantil: number;
  internacoes_sih: number;
  partos_sih: number;
  unidades_saude_familia: number;
}

export interface IndicadoresJustica {
  varas_judiciais: number;
  defensorias_publicas: number;
  delegacias_especializadas: number;
  juizes_por_100mil: number;
  acesso_justica: number;
  processos_vara: number;
  decisoes_judiciais: number;
  recursos: number;
  execucoes_fiscais: number;
}

export interface IndicadoresTrabalho {
  formalizacao_caged: number;
  emprego_formal: number;
  renda_media: number;
  desemprego: number;
  informalidade: number;
  microcredito: number;
  programas_trabalho: number;
  aprendizes: number;
  salario_minimo: number;
}

export interface IndicadoresFinancas {
  repasses_federais: number;
  gastos_saude: number;
  gasto_educacao: number;
  arrecadacao_icms: number;
  divida_publica: number;
  transferencias_municipais: number;
  investimento_social: number;
  orcamento: number;
  despesa: number;
  superavit: number;
}

export interface DadosEstado {
  periodo: Periodo;
  uf: UF;
  estado: string;
  regiao: string;
  desenvolvimento: IndicadoresDesenvolvimento;
  educacao: IndicadoresEducacao;
  saude: IndicadoresSaude;
  justica: IndicadoresJustica;
  trabalho: IndicadoresTrabalho;
  financas: IndicadoresFinancas;
}

export interface ComparacaoEstados {
  estados: DadosEstado[];
  indicadores: {
    tipo: TipoIndicador;
    indicador: string;
    rotulo: string;
    unidade: string;
    maior_melhor: boolean;
  }[];
  resultados: {
    estado_a: string;
    estado_b: string;
    indicador: string;
    valor_a: number;
    valor_b: number;
    diferenca: number;
    percentual: number;
    maior: "A" | "B" | null;
  }[];
}

export type FonteDados = "ibge" | "inep" | "ms" | "cnj" | "tse" | "mec" | "cnpq" | "capes" | "inpi" | "transparencia";

export interface MetadadosFonte {
  nome: string;
  sigla: string;
  descricao: string;
  responsavel: string;
  atualizacao: string;
  periodicidade: string;
  cobertura: string;
  url: string;
}

export interface ConfiguracaoComparador {
  periodos_disponiveis: Periodo[];
  indicadores_disponiveis: {
    [key in TipoIndicador]: string[];
  };
  fontes: {
    [key in FonteDados]: MetadadosFonte;
  };
  limites: {
    max_estados: number;
    max_universidades: number;
    max_periodos: number;
  };
}