/**
 * Módulo de Polos Regionais e Expansão Municipal de Minas Gerais
 *
 * Papel: Catalogar os 10 municípios polo de MG usados como frente de expansão
 * do portal (cidades-beta), com código IBGE canônico e população do Censo.
 *
 * Fontes oficiais:
 * - IBGE, Divisão Territorial Brasileira: códigos de município (7 dígitos) e
 *   o de 6 dígitos (o de 7 sem o dígito verificador).
 * - IBGE, Censo 2022, agregado 4714, variável 93 (População residente):
 *   https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93
 *
 * Decisão técnica:
 * - `populacaoCenso2022` é o número EXATO apurado pelo IBGE no Censo 2022,
 *   não uma estimativa. Numeros foram lidos da API em 29/09/2026; a data e a
 *   URL ficam em `FONTE_POPULACAO` para auditoria e recarga futura.
 * - Sem campo de "cobertura de dados": afirmar que um polo "tem PNCP" sem
 *   medir seria insinuacao, e insinuacao e dano (AGENTS.md, regra editorial).
 */

/** Fonte oficial da população usada em `populacaoCenso2022`. */
export const FONTE_POPULACAO = {
  orgao: "IBGE - Instituto Brasileiro de Geografia e Estatística",
  pesquisa: "Censo Demográfico 2022 - População residente (agregado 4714, variável 93)",
  url: "https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93",
  dataAcesso: "2026-09-29",
} as const;

export interface PoloRegionalMG {
  ibge7: string;
  ibge6: string;
  nome: string;
  slug: string;
  mesorregiao: string;
  microrregiao: string;
  /** População residente exata do Censo 2022 (IBGE). */
  populacaoCenso2022: number;
  papelRegional: string;
}

/**
 * Os 10 polos de Minas Gerais para expansão e validação inicial.
 * População: IBGE, Censo 2022 (ver `FONTE_POPULACAO`).
 */
export const POLOS_MG: readonly PoloRegionalMG[] = [
  {
    ibge7: "3106705",
    ibge6: "310670",
    nome: "Betim",
    slug: "betim",
    mesorregiao: "Metropolitana de Belo Horizonte",
    microrregiao: "Belo Horizonte",
    populacaoCenso2022: 411846,
    papelRegional: "Polo industrial e laboratório de dados cívicos",
  },
  {
    ibge7: "3106200",
    ibge6: "310620",
    nome: "Belo Horizonte",
    slug: "belo-horizonte",
    mesorregiao: "Metropolitana de Belo Horizonte",
    microrregiao: "Belo Horizonte",
    populacaoCenso2022: 2315560,
    papelRegional: "Capital do Estado e centro decisório estadual",
  },
  {
    ibge7: "3118601",
    ibge6: "311860",
    nome: "Contagem",
    slug: "contagem",
    mesorregiao: "Metropolitana de Belo Horizonte",
    microrregiao: "Belo Horizonte",
    populacaoCenso2022: 621863,
    papelRegional: "Centro industrial e logístico da Região Metropolitana",
  },
  {
    ibge7: "3136702",
    ibge6: "313670",
    nome: "Juiz de Fora",
    slug: "juiz-de-fora",
    mesorregiao: "Zona da Mata",
    microrregiao: "Juiz de Fora",
    populacaoCenso2022: 540756,
    papelRegional: "Polo econômico e universitário da Zona da Mata",
  },
  {
    ibge7: "3170206",
    ibge6: "317020",
    nome: "Uberlândia",
    slug: "uberlandia",
    mesorregiao: "Triângulo Mineiro e Alto Paranaíba",
    microrregiao: "Uberlândia",
    populacaoCenso2022: 713224,
    papelRegional: "Polo do agronegócio, serviços e tecnologia do Triângulo",
  },
  {
    ibge7: "3143302",
    ibge6: "314330",
    nome: "Montes Claros",
    slug: "montes-claros",
    mesorregiao: "Norte de Minas",
    microrregiao: "Montes Claros",
    populacaoCenso2022: 414240,
    papelRegional: "Polo industrial, universitário e médico do Norte de MG",
  },
  {
    ibge7: "3127701",
    ibge6: "312770",
    nome: "Governador Valadares",
    slug: "governador-valadares",
    mesorregiao: "Vale do Rio Doce",
    microrregiao: "Governador Valadares",
    populacaoCenso2022: 257171,
    papelRegional: "Polo comercial do Vale do Rio Doce e bacia atingida",
  },
  {
    ibge7: "3131307",
    ibge6: "313130",
    nome: "Ipatinga",
    slug: "ipatinga",
    mesorregiao: "Vale do Rio Doce",
    microrregiao: "Ipatinga",
    populacaoCenso2022: 227731,
    papelRegional: "Polo siderúrgico do Vale do Aço",
  },
  {
    ibge7: "3121605",
    ibge6: "312160",
    nome: "Diamantina",
    slug: "diamantina",
    mesorregiao: "Jequitinhonha",
    microrregiao: "Diamantina",
    populacaoCenso2022: 47702,
    papelRegional: "Polo histórico, universitário e cultural do Alto Jequitinhonha",
  },
  {
    ibge7: "3103405",
    ibge6: "310340",
    nome: "Araçuaí",
    slug: "aracuai",
    mesorregiao: "Jequitinhonha",
    microrregiao: "Araçuaí",
    populacaoCenso2022: 34297,
    papelRegional: "Polo do Médio Jequitinhonha e fronteira do Vale do Lítio",
  },
];

/**
 * Obtém os dados de um polo regional de MG a partir do código IBGE de 6 ou 7 dígitos
 * @param codigoIbge Código IBGE (6 ou 7 dígitos)
 * @returns PoloRegionalMG ou undefined
 */
export function buscarPoloMgPorIbge(codigoIbge: string): PoloRegionalMG | undefined {
  if (!codigoIbge) return undefined;
  const limpo = codigoIbge.trim();
  return POLOS_MG.find((p) => p.ibge7 === limpo || p.ibge6 === limpo);
}

/**
 * Obtém os dados de um polo regional de MG a partir do slug
 * @param slug Identificador textual do município (ex: 'betim')
 * @returns PoloRegionalMG ou undefined
 */
export function buscarPoloMgPorSlug(slug: string): PoloRegionalMG | undefined {
  if (!slug) return undefined;
  const normalizado = slug.trim().toLowerCase();
  return POLOS_MG.find((p) => p.slug === normalizado);
}

/**
 * Calcula o resumo dos polos regionais de MG.
 * A população total é a soma exata do Censo 2022 (IBGE), não estimativa.
 */
export function calcularResumoPolosMg() {
  const totalPolos = POLOS_MG.length;
  const populacaoTotal = POLOS_MG.reduce((acc, curr) => acc + curr.populacaoCenso2022, 0);

  return {
    totalPolos,
    populacaoTotal,
    fontePopulacao: FONTE_POPULACAO,
  };
}
