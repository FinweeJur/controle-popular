/**
 * Dados e lógica para o sistema de Direitos Comparados.
 *
 * ═══ OBJETIVO ═══
 *
 * Implementar a lógica de negócio para comparar indicadores de direitos fundamentais 
 * entre estados, instituições e períodos. Inclui carregamento de dados, cálculos 
 * e formatação para exibição na interface.
 */

import { 
  DadosEstado, 
  ComparacaoEstados, 
  TipoIndicador,
  UF,
  Periodo,
  ConfiguracaoComparador,
  MetadadosFonte,
  FonteDados
} from "./tipos";

// Configuração do sistema
const configuracao: ConfiguracaoComparador = {
  periodos_disponiveis: [
    { ano: 2023 },
    { ano: 2022 },
    { ano: 2021 },
    { ano: 2020 }
  ],
  indicadores_disponiveis: {
    desenvolvimento: [
      "idh_geral",
      "idh_renda", 
      "idh_educacao",
      "idh_longevidade",
      "gini",
      "pib_per_capita",
      "renda_media",
      "desemprego",
      "informalidade"
    ],
    educacao: [
      "ideb_fundamental_anos_iniciais",
      "ideb_fundamental_anos_finais", 
      "ideb_medio",
      "matricula_publica",
      "matricula_privada",
      "docentes",
      "escolas",
      "taxa_conclusao",
      "distorcao_idade_serie",
      "rede_escolar_por_10mil"
    ],
    saude: [
      "leitos_hospitalares",
      "estabelecimentos_sus",
      "med_por_10mil",
      "enfermeiros_por_10mil",
      "cobertura_vacinal",
      "mortalidade_infantil",
      "internacoes_sih",
      "partos_sih",
      "unidades_saude_familia"
    ],
    justica: [
      "varas_judiciais",
      "defensorias_publicas",
      "delegacias_especializadas",
      "juizes_por_100mil",
      "acesso_justica",
      "processos_vara",
      "decisoes_judiciais",
      "recursos",
      "execucoes_fiscais"
    ],
    trabalho: [
      "formalizacao_caged",
      "emprego_formal",
      "renda_media",
      "desemprego",
      "informalidade",
      "microcredito",
      "programas_trabalho",
      "aprendizes",
      "salario_minimo"
    ],
    financas: [
      "repasses_federais",
      "gastos_saude",
      "gasto_educacao",
      "arrecadacao_icms",
      "divida_publica",
      "transferencias_municipais",
      "investimento_social",
      "orcamento",
      "despesa",
      "superavit"
    ]
  },
  fontes: {
    ibge: {
      nome: "Instituto Brasileiro de Geografia e Estatística",
      sigla: "IBGE",
      descricao: "Dados demográficos, econômicos e sociais",
      responsavel: "Governo Federal",
      atualizacao: "2023",
      periodicidade: "Anual",
      cobertura: "Nacional",
      url: "https://www.ibge.gov.br"
    },
    inep: {
      nome: "Instituto Nacional de Estudos e Pesquisas Educacionais",
      sigla: "INEP",
      descricao: "Dados educacionais e avaliações",
      responsavel: "MEC",
      atualizacao: "2023",
      periodicidade: "Anual",
      cobertura: "Nacional",
      url: "https://www.inep.gov.br"
    },
    ms: {
      nome: "Ministério da Saúde",
      sigla: "MS",
      descricao: "Dados de saúde e sistema SUS",
      responsavel: "Governo Federal",
      atualizacao: "2023",
      periodicidade: "Anual",
      cobertura: "Nacional",
      url: "https://www.gov.br/saude"
    },
    cnj: {
      nome: "Conselho Nacional de Justiça",
      sigla: "CNJ",
      descricao: "Dados judiciais e sistema de justiça",
      responsavel: "Poder Judiciário",
      atualizacao: "2023",
      periodicidade: "Anual",
      cobertura: "Nacional",
      url: "https://www.cnj.jus.br"
    },
    tse: {
      nome: "Tribunal Superior Eleitoral",
      sigla: "TSE",
      descricao: "Dados eleitorais e eleições",
      responsavel: "Poder Judiciário",
      atualizacao: "2022",
      periodicidade: "Anual",
      cobertura: "Nacional",
      url: "https://www.tse.jus.br"
    },
    mec: {
      nome: "Ministério da Educação",
      sigla: "MEC",
      descricao: "Dados educacionais e institucionais",
      responsavel: "Governo Federal",
      atualizacao: "2023",
      periodicidade: "Anual",
      cobertura: "Nacional",
      url: "https://www.gov.br/educacao"
    },
    cnpq: {
      nome: "Conselho Nacional de Desenvolvimento Científico e Tecnológico",
      sigla: "CNPq",
      descricao: "Dados de pesquisa e grupos de pesquisa",
      responsavel: "Governo Federal",
      atualizacao: "2023",
      periodicidade: "Anual",
      cobertura: "Nacional",
      url: "https://www.cnpq.br"
    },
    capes: {
      nome: "Coordenação de Aperfeiçoamento de Pessoal de Nível Superior",
      sigla: "CAPES",
      descricao: "Dados pós-graduação e avaliação",
      responsavel: "MEC",
      atualizacao: "2023",
      periodicidade: "Anual",
      cobertura: "Nacional",
      url: "https://www.capes.gov.br"
    },
    inpi: {
      nome: "Instituto Nacional de Propriedade Industrial",
      sigla: "INPI",
      descricao: "Dados de patentes e propriedade intelectual",
      responsavel: "Governo Federal",
      atualizacao: "2023",
      periodicidade: "Anual",
      cobertura: "Nacional",
      url: "https://www.inpi.gov.br"
    },
    transparencia: {
      nome: "Portal da Transparência",
      sigla: "Portal da Transparência",
      descricao: "Dados de finanças públicas e gastos",
      responsavel: "Governo Federal",
      atualizacao: "2023",
      periodicidade: "Anual",
      cobertura: "Nacional",
      url: "https://www.portaldatransparencia.gov.br"
    }
  },
  limites: {
    max_estados: 5,
    max_universidades: 10,
    max_periodos: 3
  }
};

// Dados de exemplo para estados brasileiros
const dadosEstadosExemplo: DadosEstado[] = [
  {
    periodo: { ano: 2023 },
    uf: "MG",
    estado: "Minas Gerais",
    regiao: "Sudeste",
    desenvolvimento: {
      idh_geral: 0.749,
      idh_renda: 0.763,
      idh_educacao: 0.726,
      idh_longevidade: 0.759,
      gini: 0.53,
      pib_per_capita: 47362,
      pib_total_bi: 476.8,
      renda_media: 1870,
      desemprego: 7.8,
      informalidade: 42.3
    },
    educacao: {
      ideb_fundamental_anos_iniciais: 5.9,
      ideb_fundamental_anos_finais: 4.8,
      ideb_medio: 4.4,
      matricula_publica: 2847321,
      matricula_privada: 456789,
      docentes: 234567,
      escolas: 19876,
      taxa_conclusao: 72.3,
      distorcao_idade_serie: 18.7,
      rede_escolar_por_10mil: 35.2
    },
    saude: {
      leitos_hospitalares: 45678,
      estabelecimentos_sus: 8923,
      med_por_10mil: 18.7,
      enfermeiros_por_10mil: 45.3,
      cobertura_vacinal: 89.2,
      mortalidade_infantil: 13.4,
      internacoes_sih: 2345678,
      partos_sih: 456789,
      unidades_saude_familia: 12345
    },
    justica: {
      varas_judiciais: 567,
      defensorias_publicas: 45,
      delegacias_especializadas: 234,
      juizes_por_100mil: 18.7,
      acesso_justica: 78.9,
      processos_vara: 2345678,
      decisoes_judiciais: 1234567,
      recursos: 345678,
      execucoes_fiscais: 45678
    },
    trabalho: {
      formalizacao_caged: 1234567,
      emprego_formal: 5678901,
      renda_media: 1870,
      desemprego: 7.8,
      informalidade: 42.3,
      microcredito: 234567,
      programas_trabalho: 456,
      aprendizes: 12345,
      salario_minimo: 1320
    },
    financas: {
      repasses_federais: 45678.9,
      gastos_saude: 23456.7,
      gasto_educacao: 34567.8,
      arrecadacao_icms: 123456.7,
      divida_publica: 45678.9,
      transferencias_municipais: 23456.7,
      investimento_social: 12345.6,
      orcamento: 234567.8,
      despesa: 223456.7,
      superavit: 1111.1
    }
  },
  {
    periodo: { ano: 2023 },
    uf: "SP",
    estado: "São Paulo",
    regiao: "Sudeste",
    desenvolvimento: {
      idh_geral: 0.813,
      idh_renda: 0.831,
      idh_educacao: 0.792,
      idh_longevidade: 0.817,
      gini: 0.51,
      pib_per_capita: 67890,
      pib_total_bi: 1245.6,
      renda_media: 2450,
      desemprego: 6.2,
      informalidade: 38.5
    },
    educacao: {
      ideb_fundamental_anos_iniciais: 6.2,
      ideb_fundamental_anos_finais: 5.1,
      ideb_medio: 4.7,
      matricula_publica: 4567890,
      matricula_privada: 789012,
      docentes: 345678,
      escolas: 34567,
      taxa_conclusao: 78.9,
      distorcao_idade_serie: 15.2,
      rede_escolar_por_10mil: 42.1
    },
    saude: {
      leitos_hospitalares: 78901,
      estabelecimentos_sus: 12345,
      med_por_10mil: 22.3,
      enfermeiros_por_10mil: 56.7,
      cobertura_vacinal: 92.1,
      mortalidade_infantil: 10.8,
      internacoes_sih: 3456789,
      partos_sih: 678901,
      unidades_saude_familia: 18765
    },
    justica: {
      varas_judiciais: 891,
      defensorias_publicas: 67,
      delegacias_especializadas: 345,
      juizes_por_100mil: 22.1,
      acesso_justica: 85.6,
      processos_vara: 3456789,
      decisoes_judiciais: 1876543,
      recursos: 456789,
      execucoes_fiscais: 67890
    },
    trabalho: {
      formalizacao_caged: 1876543,
      emprego_formal: 8765432,
      renda_media: 2450,
      desemprego: 6.2,
      informalidade: 38.5,
      microcredito: 345678,
      programas_trabalho: 678,
      aprendizes: 23456,
      salario_minimo: 1320
    },
    financas: {
      repasses_federais: 78901.2,
      gastos_saude: 34567.8,
      gasto_educacao: 45678.9,
      arrecadacao_icms: 234567.8,
      divida_publica: 67890.1,
      transferencias_municipais: 34567.8,
      investimento_social: 23456.7,
      orcamento: 345678.9,
      despesa: 323456.7,
      superavit: 2222.2
    }
  },
  {
    periodo: { ano: 2023 },
    uf: "BA",
    estado: "Bahia",
    regiao: "Nordeste",
    desenvolvimento: {
      idh_geral: 0.668,
      idh_renda: 0.681,
      idh_educacao: 0.652,
      idh_longevidade: 0.671,
      gini: 0.58,
      pib_per_capita: 28765,
      pib_total_bi: 145.6,
      renda_media: 1320,
      desemprego: 11.2,
      informalidade: 48.7
    },
    educacao: {
      ideb_fundamental_anos_iniciais: 4.8,
      ideb_fundamental_anos_finais: 3.9,
      ideb_medio: 3.6,
      matricula_publica: 2345678,
      matricula_privada: 234567,
      docentes: 156789,
      escolas: 23456,
      taxa_conclusao: 65.4,
      distorcao_idade_serie: 25.8,
      rede_escolar_por_10mil: 28.7
    },
    saude: {
      leitos_hospitalares: 23456,
      estabelecimentos_sus: 5678,
      med_por_10mil: 12.3,
      enfermeiros_por_10mil: 34.5,
      cobertura_vacinal: 85.6,
      mortalidade_infantil: 18.7,
      internacoes_sih: 1567890,
      partos_sih: 345678,
      unidades_saude_familia: 8765
    },
    justica: {
      varas_judiciais: 234,
      defensorias_publicas: 23,
      delegacias_especializadas: 123,
      juizes_por_100mil: 12.8,
      acesso_justica: 68.9,
      processos_vara: 1567890,
      decisoes_judiciais: 890123,
      recursos: 234567,
      execucoes_fiscais: 23456
    },
    trabalho: {
      formalizacao_caged: 890123,
      emprego_formal: 3456789,
      renda_media: 1320,
      desemprego: 11.2,
      informalidade: 48.7,
      microcredito: 123456,
      programas_trabalho: 234,
      aprendizes: 8765,
      salario_minimo: 1320
    },
    financas: {
      repasses_federais: 34567.8,
      gastos_saude: 15678.9,
      gasto_educacao: 23456.7,
      arrecadacao_icms: 78901.2,
      divida_publica: 34567.8,
      transferencias_municipais: 15678.9,
      investimento_social: 8901.2,
      orcamento: 156789.0,
      despesa: 145678.9,
      superavit: 1110.1
    }
  }
];

// Funções utilitárias
function formatarNumero(valor: number, casasDecimais = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais
  }).format(valor);
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor);
}

function formatarPercentual(valor: number): string {
  return `${valor.toFixed(1)}%`;
}

// Funções principais do sistema

/**
 * Carregar dados de estados para um período específico
 */
export async function carregarDadosEstados(periodo: Periodo, ufs: UF[]): Promise<DadosEstado[]> {
  // Em uma implementação real, isso viria de um banco de dados ou API
  // Por agora, retorna dados de exemplo filtrados pelas UFs solicitadas
  return dadosEstadosExemplo.filter(estado => 
    estado.periodo.ano === periodo.ano && ufs.includes(estado.uf)
  );
}

/**
 * Realizar comparação entre estados
 */
export async function compararEstados(
  periodo: Periodo, 
  ufs: UF[], 
  tiposIndicadores: TipoIndicador[]
): Promise<ComparacaoEstados> {
  
  const estados = await carregarDadosEstados(periodo, ufs);
  
  // Definir indicadores a serem comparados
  const indicadores = tiposIndicadores.flatMap(tipo => 
    configuracao.indicadores_disponiveis[tipo].map(indicador => ({
      tipo,
      indicador,
      rotulo: getRotuloIndicador(indicador),
      unidade: getUnidadeIndicador(indicador),
      maior_melhor: isMaiorMelhor(indicador)
    }))
  );
  
  // Realizar comparações
  const resultados: ComparacaoEstados["resultados"] = [];
  
  for (let i = 0; i < estados.length; i++) {
    for (let j = i + 1; j < estados.length; j++) {
      const estadoA = estados[i];
      const estadoB = estados[j];
      
      indicadores.forEach(ind => {
        const valorA = getValorIndicador(estadoA, ind.indicador);
        const valorB = getValorIndicador(estadoB, ind.indicador);
        
        if (valorA !== null && valorB !== null) {
          const diferenca = valorA - valorB;
          const percentual = ((valorA - valorB) / Math.abs(valorB)) * 100;
          const maior = diferenca > 0 ? "A" : diferenca < 0 ? "B" : null;
          
          resultados.push({
            estado_a: estadoA.estado,
            estado_b: estadoB.estado,
            indicador: ind.rotulo,
            valor_a: valorA,
            valor_b: valorB,
            diferenca: Math.abs(diferenca),
            percentual: Math.abs(percentual),
            maior
          });
        }
      });
    }
  }
  
  return {
    estados,
    indicadores,
    resultados
  };
}

/**
 * Obter rótulo amigável para um indicador
 */
function getRotuloIndicador(indicador: string): string {
  const rotulos: Record<string, string> = {
    idh_geral: "IDH Geral",
    idh_renda: "IDH Renda",
    idh_educacao: "IDH Educação",
    idh_longevidade: "IDH Longevidade",
    gini: "Coeficiente Gini",
    pib_per_capita: "PIB per Capita",
    pib_total_bi: "PIB Total (R$ bi)",
    renda_media: "Renda Média",
    desemprego: "Taxa de Desemprego",
    informalidade: "Taxa de Informalidade",
    ideb_fundamental_anos_iniciais: "IDEB Fundamental Iniciais",
    ideb_fundamental_anos_finais: "IDEB Fundamental Finais",
    ideb_medio: "IDEB Médio",
    matricula_publica: "Matrícula Pública",
    matricula_privada: "Matrícula Privada",
    docentes: "Docentes",
    escolas: "Escolas",
    taxa_conclusao: "Taxa de Conclusão",
    distorcao_idade_serie: "Distorção Idade-Série",
    rede_escolar_por_10mil: "Rede Escolar por 10 mil hab.",
    leitos_hospitalares: "Leitos Hospitalares",
    estabelecimentos_sus: "Estabelecimentos SUS",
    med_por_10mil: "Médicos por 10 mil hab.",
    enfermeiros_por_10mil: "Enfermeiros por 10 mil hab.",
    cobertura_vacinal: "Cobertura Vacinal",
    mortalidade_infantil: "Mortalidade Infantil",
    internacoes_sih: "Internações SIH",
    partos_sih: "Partos SIH",
    unidades_saude_familia: "Unidades Saúde da Família",
    varas_judiciais: "Varas Judiciais",
    defensorias_publicas: "Defensorias Públicas",
    delegacias_especializadas: "Delegacias Especializadas",
    juizes_por_100mil: "Juízes por 100 mil hab.",
    acesso_justica: "Acesso à Justiça",
    processos_vara: "Processos por Vara",
    decisoes_judiciais: "Decisões Judiciais",
    recursos: "Recursos",
    execucoes_fiscais: "Execuções Fiscais",
    formalizacao_caged: "Formalização CAGED",
    emprego_formal: "Emprego Formal",
    microcredito: "Microcrédito",
    programas_trabalho: "Programas Trabalho",
    aprendizes: "Aprendizes",
    salario_minimo: "Salário Mínimo",
    repasses_federais: "Repasses Federais",
    gastos_saude: "Gastos Saúde",
    gasto_educacao: "Gasto Educação",
    arrecadacao_icms: "Arrecadação ICMS",
    divida_publica: "Dívida Pública",
    transferencias_municipais: "Transferências Municipais",
    investimento_social: "Investimento Social",
    orcamento: "Orçamento",
    despesa: "Despesa",
    superavit: "Superávit"
  };
  
  return rotulos[indicador] || indicador;
}

/**
 * Obter unidade de medida para um indicador
 */
function getUnidadeIndicador(indicador: string): string {
  const unidades: Record<string, string> = {
    idh_geral: "índice",
    idh_renda: "índice",
    idh_educacao: "índice",
    idh_longevidade: "índice",
    gini: "coeficiente",
    pib_per_capita: "R$",
    pib_total_bi: "R$ bi",
    renda_media: "R$",
    desemprego: "%",
    informalidade: "%",
    ideb_fundamental_anos_iniciais: "índice",
    ideb_fundamental_anos_finais: "índice",
    ideb_medio: "índice",
    matricula_publica: "alunos",
    matricula_privada: "alunos",
    docentes: "professores",
    escolas: "unidades",
    taxa_conclusao: "%",
    distorcao_idade_serie: "%",
    rede_escolar_por_10mil: "escolas/10mil hab.",
    leitos_hospitalares: "leitos",
    estabelecimentos_sus: "unidades",
    med_por_10mil: "médicos/10mil hab.",
    enfermeiros_por_10mil: "enfermeiros/10mil hab.",
    cobertura_vacinal: "%",
    mortalidade_infantil: "óbitos/1.000 nasc.",
    internacoes_sih: "internações",
    partos_sih: "partos",
    unidades_saude_familia: "unidades",
    varas_judiciais: "varas",
    defensorias_publicas: "defensorias",
    delegacias_especializadas: "delegacias",
    juizes_por_100mil: "juízes/100 mil hab.",
    acesso_justica: "índice",
    processos_vara: "processos",
    decisoes_judiciais: "decisões",
    recursos: "recursos",
    execucoes_fiscais: "execuções",
    formalizacao_caged: "admissões",
    emprego_formal: "empregos",
    microcredito: "créditos",
    programas_trabalho: "programas",
    aprendizes: "aprendizes",
    salario_minimo: "R$",
    repasses_federais: "R$ mi",
    gastos_saude: "R$ mi",
    gasto_educacao: "R$ mi",
    arrecadacao_icms: "R$ mi",
    divida_publica: "R$ mi",
    transferencias_municipais: "R$ mi",
    investimento_social: "R$ mi",
    orcamento: "R$ mi",
    despesa: "R$ mi",
    superavit: "R$ mi"
  };
  
  return unidades[indicador] || "unidade";
}

/**
 * Verificar se maior valor é melhor para um indicador
 */
function isMaiorMelhor(indicador: string): boolean {
  const melhoresMaiores = [
    "idh_geral", "idh_renda", "idh_educacao", "idh_longevidade",
    "ideb_fundamental_anos_iniciais", "ideb_fundamental_anos_finais", 
    "ideb_medio", "matricula_privada", "docentes", "escolas",
    "taxa_conclusao", "med_por_10mil", "enfermeiros_por_10mil",
    "cobertura_vacinal", "acesso_justica", "emprego_formal",
    "aprendizes", "arrecadacao_icms", "superavit"
  ];
  
  return melhoresMaiores.includes(indicador);
}

/**
 * Obter valor de um indicador específico de um estado
 */
function getValorIndicador(estado: DadosEstado, indicador: string): number | null {
  const caminhos: Record<string, string[]> = {
    idh_geral: ["desenvolvimento", "idh_geral"],
    idh_renda: ["desenvolvimento", "idh_renda"],
    idh_educacao: ["desenvolvimento", "idh_educacao"],
    idh_longevidade: ["desenvolvimento", "idh_longevidade"],
    gini: ["desenvolvimento", "gini"],
    pib_per_capita: ["desenvolvimento", "pib_per_capita"],
    pib_total_bi: ["desenvolvimento", "pib_total_bi"],
    renda_media: ["desenvolvimento", "renda_media"],
    // desemprego e informalidade estão em trabalho, não duplicar em desenvolvimento
    ideb_fundamental_anos_iniciais: ["educacao", "ideb_fundamental_anos_iniciais"],
    ideb_fundamental_anos_finais: ["educacao", "ideb_fundamental_anos_finais"],
    ideb_medio: ["educacao", "ideb_medio"],
    matricula_publica: ["educacao", "matricula_publica"],
    matricula_privada: ["educacao", "matricula_privada"],
    docentes: ["educacao", "docentes"],
    escolas: ["educacao", "escolas"],
    taxa_conclusao: ["educacao", "taxa_conclusao"],
    distorcao_idade_serie: ["educacao", "distorcao_idade_serie"],
    rede_escolar_por_10mil: ["educacao", "rede_escolar_por_10mil"],
    leitos_hospitalares: ["saude", "leitos_hospitalares"],
    estabelecimentos_sus: ["saude", "estabelecimentos_sus"],
    med_por_10mil: ["saude", "med_por_10mil"],
    enfermeiros_por_10mil: ["saude", "enfermeiros_por_10mil"],
    cobertura_vacinal: ["saude", "cobertura_vacinal"],
    mortalidade_infantil: ["saude", "mortalidade_infantil"],
    internacoes_sih: ["saude", "internacoes_sih"],
    partos_sih: ["saude", "partos_sih"],
    unidades_saude_familia: ["saude", "unidades_saude_familia"],
    varas_judiciais: ["justica", "varas_judiciais"],
    defensorias_publicas: ["justica", "defensorias_publicas"],
    delegacias_especializadas: ["justica", "delegacias_especializadas"],
    juizes_por_100mil: ["justica", "juizes_por_100mil"],
    acesso_justica: ["justica", "acesso_justica"],
    processos_vara: ["justica", "processos_vara"],
    decisoes_judiciais: ["justica", "decisoes_judiciais"],
    recursos: ["justica", "recursos"],
    execucoes_fiscais: ["justica", "execucoes_fiscais"],
    formalizacao_caged: ["trabalho", "formalizacao_caged"],
    emprego_formal: ["trabalho", "emprego_formal"],
    // renda_media está em desenvolvimento, não duplicar em trabalho
    desemprego: ["trabalho", "desemprego"],
    informalidade: ["trabalho", "informalidade"],
    microcredito: ["trabalho", "microcredito"],
    programas_trabalho: ["trabalho", "programas_trabalho"],
    aprendizes: ["trabalho", "aprendizes"],
    salario_minimo: ["trabalho", "salario_minimo"],
    repasses_federais: ["financas", "repasses_federais"],
    gastos_saude: ["financas", "gastos_saude"],
    gasto_educacao: ["financas", "gasto_educacao"],
    arrecadacao_icms: ["financas", "arrecadacao_icms"],
    divida_publica: ["financas", "divida_publica"],
    transferencias_municipais: ["financas", "transferencias_municipais"],
    investimento_social: ["financas", "investimento_social"],
    orcamento: ["financas", "orcamento"],
    despesa: ["financas", "despesa"],
    superavit: ["financas", "superavit"]
  };
  
  const caminho = caminhos[indicador];
  if (!caminho) return null;
  
  let valor: any = estado;
  for (const chave of caminho) {
    valor = valor[chave];
    if (valor === undefined) return null;
  }
  
  return typeof valor === "number" ? valor : null;
}

// Exportar configuração e utilitários
export { configuracao, formatarNumero, formatarMoeda, formatarPercentual };