/**
 * apps/web/lib/ambiental/car.ts
 *
 * Cadastro Ambiental Rural (CAR) em Minas Gerais — IEF/MG e SICAR.
 *
 * ═══ PAPEL NO PORTAL CÍVICO ═══
 * Este módulo estrutura, analisa e disponibiliza para fiscalização pública os dados do CAR
 * em Minas Gerais, cobrindo as 14 URFBios (Unidades Regionais de Florestas e Biodiversidade)
 * do IEF/MG e uma amostragem auditável de imóveis rurais com códigos oficiais e links de consulta.
 *
 * Permite ao cidadão, pesquisadores e movimentos do campo monitorar:
 * 1. O ritmo e a morosidade do processo de validação ambiental das propriedades rurais;
 * 2. A distribuição da posse da terra rural por Módulos Fiscais (pequeno, médio e grande porte);
 * 3. O represamento crônico de cadastros na fila de análise técnica governamental;
 * 4. A conformidade de empreendimentos agropecuários, minerários e silviculturais.
 *
 * ═══ FONTES E CONTEXTO INSTITUCIONAL ═══
 * - IEF/MG (Instituto Estadual de Florestas) e SEMAD/MG (Secretaria de Meio Ambiente e Desenvolvimento Sustentável);
 * - SICAR (Sistema Nacional de Cadastro Ambiental Rural / Ministério da Agricultura e Pecuária);
 * - Painel Sisema (DSR Power BI) e Consulta Pública Oficial do SICAR (consultapublica.car.gov.br).
 *
 * ═══ AS TRÊS RESSALVAS QUE VIAJAM COM O DADO (REGRA EDITORIAL DO PORTAL) ═══
 * 1. O gargalo histórico de análise: Em Minas Gerais, mais de 76% dos imóveis rurais encontram-se
 *    aguardando análise ou sob diligência no IEF. O tempo médio de espera ultrapassa 1.500 dias (~4 anos).
 * 2. Porte por Módulos Fiscais (MF): Conforme a Lei Federal 12.651/2012 (Código Florestal), a classificação
 *    adota: Pequeno (<= 4 MF), Médio (4 a 15 MF) e Grande (> 15 MF). A dimensão de 1 MF varia de 18 a 70 ha
 *    dependendo do município mineiro.
 * 3. Privacidade e Proteção de Dados (AGENTS.md §5.2): Nenhum CPF ou dado pessoal de pessoas físicas
 *    é publicado neste acervo — publicam-se exclusivamente o código público alfanumérico do CAR,
 *    a localização municipal e os atributos geográficos e ambientais do imóvel.
 *
 * ═══ DECISÕES DE ARQUITETURA E DESENHO TÉCNICO ═══
 * - Ponderação Estadual Real vs Amostragem: Para evitar que amostragens pontuais distorçam
 *   a realidade estatística de Minas Gerais, a função `calcularTempoMedioAnaliseGeral` oferece
 *   o cálculo ponderado sobre a totalidade dos 1.164.209 imóveis cadastrados no estado.
 * - Suporte a Slugs e Nomes Canônicos: Métodos de busca de regionais aceitam tanto o slug
 *   normalizado (ex: "alto-paranaiba") quanto a nomenclatura de exibição (ex: "Alto Paranaíba").
 */

import carDataBruto from "../../data/car-mg.json";

/**
 * Classificação fundiária por Módulos Fiscais (MF) segundo a Lei Federal 12.651/2012:
 * - Pequeno: Até 4 módulos fiscais (inclui agricultura familiar).
 * - Médio: De 4 a 15 módulos fiscais.
 * - Grande: Acima de 15 módulos fiscais.
 */
export type PorteImovelCar = "Pequeno" | "Médio" | "Grande";

/**
 * Atividade econômica principal declarada na propriedade rural.
 */
export type SetorCar =
  | "Agropecuária"
  | "Silvicultura"
  | "Mineração"
  | "Energia"
  | "Misto";

/**
 * Situação jurídica e administrativa da análise cadastral no órgão ambiental.
 */
export type StatusCar =
  | "Em Análise"
  | "Analisado com Pendências"
  | "Analisado Aprovado"
  | "Cancelado";

/**
 * Distribuição quantitativa ou proporcional de imóveis por faixa de porte.
 */
export interface DivisaoPorteCar {
  /** Quantidade de pequenos imóveis (<= 4 MF). */
  pequeno: number;
  /** Quantidade de médios imóveis (4 a 15 MF). */
  medio: number;
  /** Quantidade de grandes imóveis (> 15 MF). */
  grande: number;
}

/**
 * Resumo consolidado de uma das 14 Unidades Regionais de Florestas e Biodiversidade (URFBios).
 */
export interface ResumoUrfbioCar {
  /** Slug identificador único em minúsculas (ex: "metropolitana", "norte"). */
  id: string;
  /** Nome formal da regional do IEF. */
  nome: string;
  /** Município que abriga a sede administrativa regional. */
  sede: string;
  /** Total de imóveis rurais cadastrados na jurisdição da regional. */
  totalImoveis: number;
  /** Extensão territorial total cadastrada em hectares (ha). */
  areaTotalHectares: number;
  /** Tempo médio decorrido de tramitação e análise dos processos em dias. */
  tempoMedioAnaliseDias: number;
  /** Percentual de cadastros ainda pendentes de conclusão da análise técnica. */
  percentualEmAnalise: number;
  /** Setores produtivos predominantes na regional. */
  principaisSetores: SetorCar[];
  /** Distribuição de imóveis por faixa de porte na regional. */
  divisaoPorte: DivisaoPorteCar;
}

/**
 * Registro individual de um imóvel rural da amostragem auditável.
 */
export interface RegistroCar {
  /** Código alfanumérico público oficial no padrão SICAR (ex: "MG-3106705-..."). */
  codigoCar: string;
  /** Nome do município onde o imóvel está situado. */
  municipio: string;
  /** Código IBGE oficial do município. */
  codigoIbge: number;
  /** Nome da URFBio regional de vinculação. */
  urfbio: string;
  /** Área total declarada da propriedade em hectares. */
  areaHectares: number;
  /** Quantidade calculada de módulos fiscais da propriedade. */
  modulosFiscais: number;
  /** Porte do imóvel (Pequeno, Médio ou Grande). */
  porte: PorteImovelCar;
  /** Setor produtivo principal do imóvel. */
  setor: SetorCar;
  /** Data da inscrição original no formato ISO (AAAA-MM-DD). */
  dataInscricao: string;
  /** Situação atual do processo de análise no IEF. */
  status: StatusCar;
  /** Tempo decorrido em dias desde a inscrição sem aprovação final. */
  tempoAnaliseDias: number;
  /** Link direto para consulta oficial pública na base do SICAR. */
  linkOficial: string;
}

/**
 * Parâmetros de filtragem para consulta e pesquisa de registros do CAR.
 */
export interface FiltroCar {
  /** Filtrar por nome ou ID da regional URFBio. */
  urfbio?: string;
  /** Filtrar por nome parcial ou exato do município. */
  municipio?: string;
  /** Filtrar pelo código numérico do IBGE. */
  codigoIbge?: number;
  /** Filtrar pelo porte do imóvel rural. */
  porte?: PorteImovelCar;
  /** Filtrar pela atividade ou vocação produtiva. */
  setor?: SetorCar;
  /** Filtrar pelo status de tramitação da análise cadastral. */
  status?: StatusCar;
  /** Limite inferior da área do imóvel em hectares. */
  areaMinimaHa?: number;
  /** Limite superior da área do imóvel em hectares. */
  areaMaximaHa?: number;
  /** Quantidade mínima de dias aguardando análise técnica. */
  tempoMinimoDias?: number;
}

/**
 * Métricas analíticas completas e consolidadas sobre o CAR no estado de Minas Gerais.
 */
export interface EstatisticasCarMg {
  /** Total global de imóveis cadastrados no estado. */
  totalImoveis: number;
  /** Área territorial total coberta pelo cadastro em hectares. */
  areaTotalHectares: number;
  /** Média ponderada de dias de espera para análise em todo o estado. */
  tempoMedioAnaliseDias: number;
  /** Taxa percentual de imóveis em fila de espera em Minas Gerais. */
  percentualEmAnalise: number;
  /** Divisão fundiária consolidada em todo o estado. */
  distribuicaoPorte: DivisaoPorteCar;
  /** Distribuição por status na amostragem detalhada. */
  distribuicaoStatusAmostragem: Record<StatusCar, number>;
  /** Distribuição por setor produtivo na amostragem. */
  distribuicaoSetoresAmostragem: Record<SetorCar, number>;
  /** Distribuição por porte na amostragem detalhada. */
  distribuicaoPorteAmostragem: DivisaoPorteCar;
  /** Quantidade de regionais URFBios mapeadas (14 unidades). */
  totalUrfbios: number;
  /** Quantidade de registros na amostragem auditável. */
  totalRegistrosAmostragem: number;
  /** Tempo médio de análise computado sobre a amostragem em dias. */
  tempoMedioAnaliseAmostragemDias: number;
  /** Dicionário do tempo médio de análise individualizado por URFBio. */
  tempoMedioPorUrfbio: Record<string, number>;
}

/** Estrutura do arquivo físico JSON contendo o acervo do CAR-MG. */
interface DatasetCarJson {
  fonte: string;
  url_fonte: string;
  data_extracao: string;
  total_imoveis_estado: number;
  area_total_estado_ha: number;
  tempo_medio_analise_dias_estado: number;
  percentual_em_analise_estado: number;
  divisao_porte_estado: {
    pequeno: number;
    medio: number;
    grande: number;
  };
  urfbios: Array<{
    id: string;
    nome: string;
    sede: string;
    totalImoveis: number;
    areaTotalHectares: number;
    tempoMedioAnaliseDias: number;
    percentualEmAnalise: number;
    principaisSetores: string[];
    divisaoPorte: {
      pequeno: number;
      medio: number;
      grande: number;
    };
  }>;
  amostragem_registros: Array<{
    codigoCar: string;
    municipio: string;
    codigoIbge: number;
    urfbio: string;
    areaHectares: number;
    modulosFiscais: number;
    porte: string;
    setor: string;
    dataInscricao: string;
    status: string;
    tempoAnaliseDias: number;
    linkOficial: string;
  }>;
}

const DATASET = carDataBruto as unknown as DatasetCarJson;

/**
 * Retorna as 14 URFBios do IEF/MG com seus respectivos indicadores consolidados.
 *
 * @returns Vetor de objetos `ResumoUrfbioCar`.
 */
export function obterUrfbiosCar(): ResumoUrfbioCar[] {
  return DATASET.urfbios.map((u) => ({
    id: u.id,
    nome: u.nome,
    sede: u.sede,
    totalImoveis: u.totalImoveis,
    areaTotalHectares: u.areaTotalHectares,
    tempoMedioAnaliseDias: u.tempoMedioAnaliseDias,
    percentualEmAnalise: u.percentualEmAnalise,
    principaisSetores: u.principaisSetores as SetorCar[],
    divisaoPorte: {
      pequeno: u.divisaoPorte.pequeno,
      medio: u.divisaoPorte.medio,
      grande: u.divisaoPorte.grande,
    },
  }));
}

/**
 * Localiza uma regional URFBio pelo identificador em formato slug (ex: "metropolitana", "alto-paranaiba").
 *
 * @param id Slug identificador da regional.
 * @returns Objeto `ResumoUrfbioCar` correspondente ou `undefined`.
 */
export function obterUrfbioPorId(id: string): ResumoUrfbioCar | undefined {
  const normId = id.trim().toLowerCase();
  return obterUrfbiosCar().find((u) => u.id.toLowerCase() === normId);
}

/**
 * Localiza uma regional URFBio pelo nome formal (ex: "Metropolitana", "Norte").
 *
 * @param nome Nome da unidade regional.
 * @returns Objeto `ResumoUrfbioCar` correspondente ou `undefined`.
 */
export function obterUrfbioPorNome(nome: string): ResumoUrfbioCar | undefined {
  const normNome = nome.trim().toLowerCase();
  return obterUrfbiosCar().find(
    (u) =>
      u.nome.toLowerCase() === normNome ||
      u.nome.toLowerCase().replace(/-/g, " ") === normNome.replace(/-/g, " ")
  );
}

/**
 * Retorna os registros da amostragem do CAR em MG, aplicando filtros opcionais combinados.
 *
 * ═══ FILTROS PERMITIDOS ═══
 * - Regional URFBio;
 * - Nome do município;
 * - Código IBGE numérico;
 * - Porte do imóvel (Pequeno, Médio, Grande);
 * - Setor produtivo (Agropecuária, Silvicultura, Mineração, etc.);
 * - Status de tramitação cadastral;
 * - Faixas de área mínima e máxima em hectares;
 * - Limite mínimo de dias em análise (permite focar em casos de morosidade extrema).
 *
 * @param filtro Objeto opcional contendo os critérios desejados.
 * @returns Lista filtrada de objetos `RegistroCar`.
 */
export function listarRegistrosCar(filtro?: FiltroCar): RegistroCar[] {
  const registros: RegistroCar[] = DATASET.amostragem_registros.map((r) => ({
    codigoCar: r.codigoCar,
    municipio: r.municipio,
    codigoIbge: r.codigoIbge,
    urfbio: r.urfbio,
    areaHectares: r.areaHectares,
    modulosFiscais: r.modulosFiscais,
    porte: r.porte as PorteImovelCar,
    setor: r.setor as SetorCar,
    dataInscricao: r.dataInscricao,
    status: r.status as StatusCar,
    tempoAnaliseDias: r.tempoAnaliseDias,
    linkOficial: r.linkOficial,
  }));

  if (!filtro) return registros;

  return registros.filter((reg) => {
    if (filtro.urfbio) {
      const matchUrfbio =
        reg.urfbio.toLowerCase() === filtro.urfbio.toLowerCase() ||
        reg.urfbio.toLowerCase().replace(/-/g, " ") ===
          filtro.urfbio.toLowerCase().replace(/-/g, " ");
      if (!matchUrfbio) return false;
    }

    if (filtro.municipio) {
      if (
        !reg.municipio.toLowerCase().includes(filtro.municipio.toLowerCase())
      ) {
        return false;
      }
    }

    if (filtro.codigoIbge !== undefined && reg.codigoIbge !== filtro.codigoIbge) {
      return false;
    }

    if (filtro.porte && reg.porte !== filtro.porte) {
      return false;
    }

    if (filtro.setor && reg.setor !== filtro.setor) {
      return false;
    }

    if (filtro.status && reg.status !== filtro.status) {
      return false;
    }

    if (filtro.areaMinimaHa !== undefined && reg.areaHectares < filtro.areaMinimaHa) {
      return false;
    }

    if (filtro.areaMaximaHa !== undefined && reg.areaHectares > filtro.areaMaximaHa) {
      return false;
    }

    if (
      filtro.tempoMinimoDias !== undefined &&
      reg.tempoAnaliseDias < filtro.tempoMinimoDias
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Localiza um registro de imóvel rural pelo seu código alfanumérico único do CAR.
 *
 * @param codigoCar Código completo do CAR (ex: "MG-3106705-...").
 * @returns O imóvel correspondente ou `undefined` se não constar na amostragem.
 */
export function obterRegistroPorCodigoCar(codigoCar: string): RegistroCar | undefined {
  const normCodigo = codigoCar.trim().toUpperCase();
  return listarRegistrosCar().find(
    (r) => r.codigoCar.toUpperCase() === normCodigo
  );
}

/**
 * Calcula o tempo médio de análise cadastral no estado de Minas Gerais.
 *
 * ═══ MODOS DE CÁLCULO ═══
 * - 'ponderado_estado': Calcula a média ponderada pelo volume real de cadastros
 *   de cada uma das 14 URFBios (cobre a totalidade de mais de 1,16 milhão de imóveis do estado).
 * - 'amostragem': Calcula a média aritmética simples apenas entre os registros da amostragem auditável.
 *
 * @param modo 'ponderado_estado' (padrão) ou 'amostragem'.
 * @returns Tempo médio estimado em dias (arredondado).
 */
export function calcularTempoMedioAnaliseGeral(
  modo: "ponderado_estado" | "amostragem" = "ponderado_estado"
): number {
  if (modo === "amostragem") {
    const registros = listarRegistrosCar();
    if (registros.length === 0) return 0;
    const soma = registros.reduce((acc, r) => acc + r.tempoAnaliseDias, 0);
    return Math.round(soma / registros.length);
  }

  const urfbios = obterUrfbiosCar();
  const totalImoveis = urfbios.reduce((acc, u) => acc + u.totalImoveis, 0);
  if (totalImoveis === 0) return 0;
  const somaPonderada = urfbios.reduce(
    (acc, u) => acc + u.tempoMedioAnaliseDias * u.totalImoveis,
    0
  );
  return Math.round(somaPonderada / totalImoveis);
}

/**
 * Calcula ou obtém o tempo médio de análise de uma URFBio específica.
 *
 * @param urfbioNomeOuId Nome da regional (ex: "Sul", "Mata") ou id slug (ex: "sul").
 * @param modo 'oficial_urfbio' retorna o tempo médio apurado pelo IEF na regional;
 *             'amostragem' calcula a média aritmética entre os registros amostrados daquela regional.
 * @returns Quantidade de dias em média, ou `null` caso a regional não seja encontrada.
 */
export function calcularTempoMedioAnaliseRegional(
  urfbioNomeOuId: string,
  modo: "oficial_urfbio" | "amostragem" = "oficial_urfbio"
): number | null {
  const regional =
    obterUrfbioPorId(urfbioNomeOuId) ?? obterUrfbioPorNome(urfbioNomeOuId);

  if (!regional) return null;

  if (modo === "oficial_urfbio") {
    return regional.tempoMedioAnaliseDias;
  }

  const registros = listarRegistrosCar({ urfbio: regional.nome });
  if (registros.length === 0) return 0;
  const soma = registros.reduce((acc, r) => acc + r.tempoAnaliseDias, 0);
  return Math.round(soma / registros.length);
}

/**
 * Gera um mapa associativo contendo o tempo médio de análise de cada uma das 14 URFBios.
 *
 * @param modo Modo de apuração ('oficial_urfbio' ou 'amostragem').
 * @returns Dicionário mapeando `{ [nomeUrfbio]: tempoEmDias }`.
 */
export function obterTempoMedioPorRegional(
  modo: "oficial_urfbio" | "amostragem" = "oficial_urfbio"
): Record<string, number> {
  const urfbios = obterUrfbiosCar();
  const mapa: Record<string, number> = {};

  for (const u of urfbios) {
    const tempo = calcularTempoMedioAnaliseRegional(u.nome, modo);
    mapa[u.nome] = tempo ?? 0;
  }

  return mapa;
}

/**
 * Retorna o conjunto completo de estatísticas consolidadas do CAR em Minas Gerais.
 *
 * Compila totais de imóveis, área total em hectares, percentual em análise,
 * distribuições por status, setor e porte (tanto na base oficial quanto na amostragem),
 * além das médias por regional.
 *
 * @returns Objeto `EstatisticasCarMg` consolidado.
 */
export function obterEstatisticasCar(): EstatisticasCarMg {
  const urfbios = obterUrfbiosCar();
  const registros = listarRegistrosCar();

  const totalImoveis = DATASET.total_imoveis_estado;
  const areaTotalHectares = DATASET.area_total_estado_ha;
  const tempoMedioAnaliseDias = DATASET.tempo_medio_analise_dias_estado;
  const percentualEmAnalise = DATASET.percentual_em_analise_estado;

  const distribuicaoPorte: DivisaoPorteCar = {
    pequeno: DATASET.divisao_porte_estado.pequeno,
    medio: DATASET.divisao_porte_estado.medio,
    grande: DATASET.divisao_porte_estado.grande,
  };

  const distribuicaoStatusAmostragem: Record<StatusCar, number> = {
    "Em Análise": 0,
    "Analisado com Pendências": 0,
    "Analisado Aprovado": 0,
    Cancelado: 0,
  };

  const distribuicaoSetoresAmostragem: Record<SetorCar, number> = {
    Agropecuária: 0,
    Silvicultura: 0,
    Mineração: 0,
    Energia: 0,
    Misto: 0,
  };

  const distribuicaoPorteAmostragem: DivisaoPorteCar = {
    pequeno: 0,
    medio: 0,
    grande: 0,
  };

  for (const reg of registros) {
    if (distribuicaoStatusAmostragem[reg.status] !== undefined) {
      distribuicaoStatusAmostragem[reg.status]++;
    }
    if (distribuicaoSetoresAmostragem[reg.setor] !== undefined) {
      distribuicaoSetoresAmostragem[reg.setor]++;
    }
    if (reg.porte === "Pequeno") distribuicaoPorteAmostragem.pequeno++;
    else if (reg.porte === "Médio") distribuicaoPorteAmostragem.medio++;
    else if (reg.porte === "Grande") distribuicaoPorteAmostragem.grande++;
  }

  const tempoMedioAnaliseAmostragemDias = calcularTempoMedioAnaliseGeral("amostragem");
  const tempoMedioPorUrfbio = obterTempoMedioPorRegional("oficial_urfbio");

  return {
    totalImoveis,
    areaTotalHectares,
    tempoMedioAnaliseDias,
    percentualEmAnalise,
    distribuicaoPorte,
    distribuicaoStatusAmostragem,
    distribuicaoSetoresAmostragem,
    distribuicaoPorteAmostragem,
    totalUrfbios: urfbios.length,
    totalRegistrosAmostragem: registros.length,
    tempoMedioAnaliseAmostragemDias,
    tempoMedioPorUrfbio,
  };
}
