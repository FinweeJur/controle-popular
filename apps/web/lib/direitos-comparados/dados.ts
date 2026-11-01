/**
 * @file lib/direitos-comparados/dados.ts
 * @Dados para o módulo de Direitos Comparados.
 *
 * Dados de exemplo e estrutura para implementação do comparador.
 */

import { DesenhoDireitos, IndicadorBasico, FonteDados, RankingImpacto, RedeCooperacao, CasoDestaque } from "./tipos";

// Fontes de dados utilizadas
export const FONTES_DADOS: FonteDados[] = [
  {
    nome: "IBGE",
    sigla: "Instituto Brasileiro de Geografia e Estatística",
    url: "https://www.ibge.gov.br/",
    tipo: "oficial",
    cobertura: "Demográfico, econômico, social",
    atualizacao: "2024"
  },
  {
    nome: "INEP",
    sigla: "Instituto Nacional de Estudos e Pesquisas Educacionais",
    url: "https://www.gov.br/inep",
    tipo: "oficial",
    cobertura: "Educação básica e superior",
    atualizacao: "2023"
  },
  {
    nome: "MS",
    sigla: "Ministério da Saúde",
    url: "https://www.gov.br/saude",
    tipo: "oficial",
    cobertura: "Saúde pública, SUS",
    atualizacao: "2024"
  },
  {
    nome: "CNJ",
    sigla: "Conselho Nacional de Justiça",
    url: "https://www.cnj.jus.br",
    tipo: "oficial",
    cobertura: "Justiça, sistema judiciário",
    atualizacao: "2023"
  },
  {
    nome: "TSE",
    sigla: "Tribunal Superior Eleitoral",
    url: "https://www.tse.jus.br",
    tipo: "oficial",
    cobertura: "Eleições, financiamento",
    atualizacao: "2022"
  }
];

// Dados de indicadores por dimensão
export function getIndicadoresPorDimensao(dimensao: DesenhoDireitos, _estados: string[]): IndicadorBasico[] {
  const baseData: Record<DesenhoDireitos, IndicadorBasico[]> = {
    desenvolvimento: [
      { id: "idh_geral", nome: "IDH Geral", unidade: "", valor: 0.749, ano: 2023, fonte: "IBGE" },
      { id: "idh_renda", nome: "IDH Renda", unidade: "", valor: 0.736, ano: 2023, fonte: "IBGE" },
      { id: "idh_educacao", nome: "IDH Educação", unidade: "", valor: 0.739, ano: 2023, fonte: "IBGE" },
      { id: "idh_longevidade", nome: "IDH Longevidade", unidade: "", valor: 0.762, ano: 2023, fonte: "IBGE" },
      { id: "pib_per_capita", nome: "PIB per capita", unidade: "R$", valor: 33892, ano: 2022, fonte: "IBGE" },
      { id: "gini", nome: "Coeficiente Gini", unidade: "", valor: 0.513, ano: 2021, fonte: "IBGE" }
    ],
    educacao: [
      { id: "ideb_fundamental", nome: "IDEB Fundamental", unidade: "", valor: 5.88, ano: 2023, fonte: "INEP" },
      { id: "ideb_medio", nome: "IDEB Médio", unidade: "", valor: 5.32, ano: 2023, fonte: "INEP" },
      { id: "matriculas_fundamental", nome: "Matrículas Fundamental", unidade: "mil", valor: 23456, ano: 2023, fonte: "INEP" },
      { id: "matriculas_medio", nome: "Matrículas Médio", unidade: "mil", valor: 8923, ano: 2023, fonte: "INEP" },
      { id: "escolas_fundamental", nome: "Escolas Fundamental", unidade: "", valor: 178234, ano: 2023, fonte: "INEP" },
      { id: "taxa_conclusao", nome: "Taxa de Conclusão", unidade: "%", valor: 79.2, ano: 2023, fonte: "INEP" }
    ],
    saude: [
      { id: "leitos_sus", nome: "Leitos SUS", unidade: "", valor: 45234, ano: 2023, fonte: "MS" },
      { id: "estabelecimentos_sus", nome: "Estabelecimentos SUS", unidade: "", valor: 6789, ano: 2023, fonte: "MS" },
      { id: "profissionais_saude", nome: "Profissionais Saúde", unidade: "", valor: 234567, ano: 2023, fonte: "MS" },
      { id: "vacinal_covid", nome: "Vacinação COVID", unidade: "%", valor: 89.2, ano: 2023, fonte: "MS" },
      { id: "mortalidade_infantil", nome: "Mortalidade Infantil", unidade: "", valor: 13.4, ano: 2022, fonte: "MS" }
    ],
    justica: [
      { id: "varas_judiciais", nome: "Varas Judiciais", unidade: "", valor: 5678, ano: 2023, fonte: "CNJ" },
      { id: "defensorias", nome: "Defensorias Públicas", unidade: "", valor: 1234, ano: 2023, fonte: "CNJ" },
      { id: "delegacias", nome: "Delegacias Policiais", unidade: "", valor: 8901, ano: 2023, fonte: "CNJ" },
      { id: "juizes_100mil", nome: "Juízes por 100 mil", unidade: "", valor: 17.3, ano: 2023, fonte: "CNJ" },
      { id: "processos_anuais", nome: "Processos Anuais", unidade: "mil", valor: 12345, ano: 2023, fonte: "CNJ" }
    ],
    trabalho: [
      { id: "formalizacao_caged", nome: "Formalização CAGED", unidade: "mil", valor: 2345, ano: 2023, fonte: "TSE" },
      { id: "emprego_formal", nome: "Emprego Formal", unidade: "mil", valor: 45678, ano: 2023, fonte: "TSE" },
      { id: "renda_media", nome: "Renda Média", unidade: "R$", valor: 2850, ano: 2023, fonte: "TSE" },
      { id: "salario_minimo", nome: "Salário Mínimo", unidade: "R$", valor: 1320, ano: 2024, fonte: "TSE" }
    ],
    financas: [
      { id: "repasses_federais", nome: "Repasses Federais", unidade: "milhões R$", valor: 123456, ano: 2023, fonte: "Portal Transparência" },
      { id: "arrecadacao_icms", nome: "Arrecadação ICMS", unidade: "milhões R$", valor: 87654, ano: 2023, fonte: "Portal Transparência" },
      { id: "divida_publica", nome: "Dívida Pública", unidade: "milhões R$", valor: 234567, ano: 2023, fonte: "Portal Transparência" },
      { id: "orcamento", nome: "Orçamento", unidade: "milhões R$", valor: 345678, ano: 2024, fonte: "Portal Transparência" }
    ],
    inovacao: [
      { id: "patentes", nome: "Patentes", unidade: "", valor: 1234, ano: 2023, fonte: "INPI" },
      { id: "artigos_cientificos", nome: "Artigos Científicos", unidade: "", valor: 8765, ano: 2023, fonte: "Web of Science" },
      { id: "startups", nome: "Startups", unidade: "", valor: 234, ano: 2023, fonte: "ABStartups" }
    ],
    extensao: [
      { id: "projetos_extensao", nome: "Projetos de Extensão", unidade: "", valor: 5678, ano: 2023, fonte: "MEC" },
      { id: "beneficiarios", nome: "Beneficiários", unidade: "mil", valor: 89.2, ano: 2023, fonte: "MEC" },
      { id: "municipios_atendidos", nome: "Municípios Atendidos", unidade: "", valor: 456, ano: 2023, fonte: "MEC" }
    ],
    cultura: [
      { id: "eventos_culturais", nome: "Eventos Culturais", unidade: "", valor: 1234, ano: 2023, fonte: "MinC" },
      { id: "acervos_digitais", nome: "Acervos Digitais", unidade: "", valor: 567, ano: 2023, fonte: "MinC" },
      { id: "publicacoes_culturais", nome: "Publicações Culturais", unidade: "", valor: 890, ano: 2023, fonte: "MinC" }
    ]
  };

  return baseData[dimensao] || [];
}

// Rankings de impacto
export const RANKINGS_IMPACTO: RankingImpacto[] = [
  {
    instituicao: "UFMG",
    pontuacao: 9.2,
    impactos: ["educacao", "saude", "inovacao"],
    destaque: "Educação básica e saúde pública"
  },
  {
    instituicao: "USP",
    pontuacao: 8.9,
    impactos: ["educacao", "justica", "inovacao"],
    destaque: "Educação superior e assistência jurídica"
  },
  {
    instituicao: "UNICAMP",
    pontuacao: 8.7,
    impactos: ["inovacao", "extensao"],
    destaque: "Inovação tecnológica e extensão rural"
  },
  {
    instituicao: "UFRJ",
    pontuacao: 8.5,
    impactos: ["educacao", "cultura"],
    destaque: "Educação e cultura no Rio de Janeiro"
  },
  {
    instituicao: "UFPE",
    pontuacao: 8.3,
    impactos: ["saude", "educacao"],
    destaque: "Saúde pública e educação no Nordeste"
  }
];

// Redes de cooperação
export const REDES_COOPERACAO: RedeCooperacao[] = [
  {
    id: "rede-nordeste",
    nome: "Rede Nordeste de Pesquisa",
    instituicoes: ["UFPE", "UFC", "UFBA", "UFMG", "UFAL"],
    projetos: ["Projeto 1", "Projeto 2", "Projeto 3"],
    foco: "Ciências Humanas e Sociais",
    coordenacao: "CNPq"
  },
  {
    id: "crub",
    nome: "Conselho de Reitores das Universidades Brasileiras",
    instituicoes: ["USP", "UNICAMP", "UFRJ", "UFMG", "UNB"],
    projetos: ["Projeto A", "Projeto B", "Projeto C"],
    foco: "Geral",
    coordenacao: "CRUB"
  },
  {
    id: "rui",
    nome: "Rede Universitaria de Inovação",
    instituicoes: ["UNICAMP", "USP", "UFMG", "UFRJ"],
    projetos: ["Inovação 1", "Inovação 2"],
    foco: "Tecnologia e Inovação",
    coordenacao: "MEC"
  }
];

// Casos de destaque
export const CASOS_DESTAQUE: CasoDestaque[] = [
  {
    id: "ufvjm-educacao-campo",
    instituicao: "UFVJM",
    titulo: "Programa de Educação do Campo",
    descricao: "Atendimento a comunidades rurais do Norte de Minas",
    impacto: "Atendimento a 45 comunidades rurais",
    dimensao: "educacao",
    localizacao: "Norte de Minas Gerais",
    urlFonte: "https://ufvjm.edu.br"
  },
  {
    id: "ufrb-saude-indigena",
    instituicao: "UFRB",
    titulo: "Saúde Indígena",
    descricao: "Atendimento a populações indígenas da Bahia",
    impacto: "Atendimento a 12 etnias diferentes",
    dimensao: "saude",
    localizacao: "Bahia",
    urlFonte: "https://ufrb.edu.br"
  },
  {
    id: "usp-justica-trabalho",
    instituicao: "USP",
    titulo: "Justiça do Trabalho Voluntária",
    descricao: "Assistência jurídica gratuita para trabalhadores",
    impacto: "12.000 atendimentos anuais",
    dimensao: "justica",
    localizacao: "São Paulo",
    urlFonte: "https://www.usp.br"
  }
];

// Funções utilitárias
export function formatarValor(indicador: IndicadorBasico): string {
  if (indicador.unidade === "%") {
    return `${indicador.valor.toFixed(1)}%`;
  } else if (indicador.unidade === "R$") {
    return `R$ ${indicador.valor.toLocaleString("pt-BR")}`;
  } else if (indicador.unidade === "mil") {
    return `${(indicador.valor / 1000).toFixed(1)}k`;
  } else {
    return indicador.valor.toString();
  }
}

export function getDimensaoLabel(dimensao: DesenhoDireitos): string {
  const labels: Record<DesenhoDireitos, string> = {
    desenvolvimento: "Desenvolvimento Humano",
    educacao: "Educação",
    saude: "Saúde",
    justica: "Justiça",
    trabalho: "Trabalho",
    financas: "Finanças Públicas",
    inovacao: "Inovação",
    extensao: "Extensão",
    cultura: "Cultura"
  };
  return labels[dimensao];
}