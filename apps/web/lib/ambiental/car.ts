/**
 * Cadastro Ambiental Rural (CAR) em Minas Gerais — IEF/MG e SICAR.
 *
 * Estrutura e disponibiliza dados consolidados das 14 URFBios (Unidades
 * Regionais de Florestas e Biodiversidade do IEF/MG) e uma amostragem
 * auditável de imóveis rurais com código CAR oficial e hiperlinks diretos.
 *
 * ═══ FONTES E CONTEXTO INSTITUCIONAL ═══
 *
 * Fonte oficial: Instituto Estadual de Florestas (IEF/MG), Secretaria de Estado
 * de Meio Ambiente e Desenvolvimento Sustentável (SEMAD/MG) e Sistema Nacional
 * de Cadastro Ambiental Rural (SICAR/Ministério da Agricultura e Pecuária).
 * Base de referência: Painel Sisema (DSR Power BI 2026-08-20) e Consulta Pública
 * do SICAR (consultapublica.car.gov.br).
 *
 * ═══ AS TRÊS RESSALVAS QUE VIAJAM COM O DADO ═══
 *
 * 1. O gargalo histórico de análise: em Minas Gerais, mais de 76% dos imóveis
 *    rurais encontram-se aguardando análise ou em análise pelo IEF. O tempo médio
 *    de espera supera 1.500 dias (~4 anos).
 * 2. Porte por Módulos Fiscais (MF): a legislação ambiental (Lei Federal
 *    12.651/2012) classifica em Pequeno (<= 4 MF), Médio (4 a 15 MF) e Grande
 *    (> 15 MF). O valor do hectare por MF varia entre 18 ha e 70 ha por município.
 * 3. Privacidade e Proteção de Dados: nenhum CPF de pessoa física é publicado
 *    neste acervo — apenas o código identificador público do CAR e metadados
 *    geográficos/ambientais auditáveis.
 */

import carDataBruto from "../../data/car-mg.json";

export type PorteImovelCar = "Pequeno" | "Médio" | "Grande";

export type SetorCar =
  | "Agropecuária"
  | "Silvicultura"
  | "Mineração"
  | "Energia"
  | "Misto";

export type StatusCar =
  | "Em Análise"
  | "Analisado com Pendências"
  | "Analisado Aprovado"
  | "Cancelado";

export interface DivisaoPorteCar {
  pequeno: number;
  medio: number;
  grande: number;
}

export interface ResumoUrfbioCar {
  id: string;
  nome: string;
  sede: string;
  totalImoveis: number;
  areaTotalHectares: number;
  tempoMedioAnaliseDias: number;
  percentualEmAnalise: number;
  principaisSetores: SetorCar[];
  divisaoPorte: DivisaoPorteCar;
}

export interface RegistroCar {
  codigoCar: string;
  municipio: string;
  codigoIbge: number;
  urfbio: string;
  areaHectares: number;
  modulosFiscais: number;
  porte: PorteImovelCar;
  setor: SetorCar;
  dataInscricao: string;
  status: StatusCar;
  tempoAnaliseDias: number;
  linkOficial: string;
}

export interface FiltroCar {
  urfbio?: string;
  municipio?: string;
  codigoIbge?: number;
  porte?: PorteImovelCar;
  setor?: SetorCar;
  status?: StatusCar;
  areaMinimaHa?: number;
  areaMaximaHa?: number;
  tempoMinimoDias?: number;
}

export interface EstatisticasCarMg {
  totalImoveis: number;
  areaTotalHectares: number;
  tempoMedioAnaliseDias: number;
  percentualEmAnalise: number;
  distribuicaoPorte: DivisaoPorteCar;
  distribuicaoStatusAmostragem: Record<StatusCar, number>;
  distribuicaoSetoresAmostragem: Record<SetorCar, number>;
  distribuicaoPorteAmostragem: DivisaoPorteCar;
  totalUrfbios: number;
  totalRegistrosAmostragem: number;
  tempoMedioAnaliseAmostragemDias: number;
  tempoMedioPorUrfbio: Record<string, number>;
}

// Normalizador seguro do JSON tipado
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
 * Retorna as 14 URFBios do IEF/MG com seus respectivos resumos consolidados.
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
 * Busca uma URFBio pelo ID de slug (ex: "metropolitana", "alto-paranaiba").
 */
export function obterUrfbioPorId(id: string): ResumoUrfbioCar | undefined {
  const normId = id.trim().toLowerCase();
  return obterUrfbiosCar().find((u) => u.id.toLowerCase() === normId);
}

/**
 * Busca uma URFBio pelo nome (ex: "Metropolitana", "Norte").
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
 * Retorna a lista de registros de amostragem do CAR em MG, aplicando filtros opcionais.
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
 * Busca um registro pelo código CAR exato.
 */
export function obterRegistroPorCodigoCar(codigoCar: string): RegistroCar | undefined {
  const normCodigo = codigoCar.trim().toUpperCase();
  return listarRegistrosCar().find(
    (r) => r.codigoCar.toUpperCase() === normCodigo
  );
}

/**
 * Calcula o tempo médio de análise geral do estado de Minas Gerais.
 *
 * @param modo 'ponderado_estado' utiliza os totais ponderados de todas as 14 URFBios
 *             (1.164.209 imóveis); 'amostragem' calcula a média aritmética da amostra.
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
 * Calcula o tempo médio de análise de uma URFBio específica.
 *
 * @param urfbioNomeOuId Nome da regional (ex: "Sul", "Mata") ou id slug (ex: "sul")
 * @param modo 'oficial_urfbio' retorna o tempo médio consolidado da regional;
 *             'amostragem' calcula a média aritmética dos registros daquela regional.
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
 * Retorna um mapa com o tempo médio de análise de cada uma das 14 URFBios.
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
 * Retorna as estatísticas completas consolidadas do CAR em Minas Gerais.
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
