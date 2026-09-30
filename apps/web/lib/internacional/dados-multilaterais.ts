/**
 * @file apps/web/lib/internacional/dados-multilaterais.ts
 * @description Modulo de consulta e agregacao de dados multilaterais (ONU, UNESCO, OMS, OMC e Territorios).
 *
 * Papel no portal:
 * Centraliza os indicadores sociais, fluxos comerciais de commodities e terras indigenas
 * comparando o Brasil com potencias do G8 e G20 (EUA, Canada, Europa, China, Australia, etc.).
 * Alimenta o novo hub /internacional, o Laboratorio de Dados e o motor aberto NotebookLM do Seu Nono.
 *
 * Fontes oficiais:
 * - ONU / PNUD: Human Development Report (IDH, IHDI, GDI, GII).
 * - Banco Mundial: World Bank Open Data (Gini, PIB per capita, Gastos em Saude).
 * - UNESCO UIS: Institute for Statistics (Gastos em Educacao % PIB, Alfabetizacao).
 * - OMS / WHO: Global Health Observatory (Expectativa de vida, Mortalidade ambiental).
 * - OMC / UN Comtrade / MDIC Comex Stat: Fluxos transnacionais de commodities.
 * - Funai, BIA e CIRNAC: Demarcacoes de terras indigenas e sobreposicoes minerarias.
 *
 * Decisoes tecnicas e restricoes:
 * - Dados compactados lidos em tempo de execucao com lib/estatico/compactar.ts.
 * - Cobertura agregada COBERTURA_MULTILATERAL para importacao leve em server components.
 * - Zero dado pessoal (sem CPF Mod-11, SSN ou SIN).
 */

import { expandir, type TabelaCompacta } from "../estatico/compactar";
import jsonIndicadores from "../../data/internacional/indicadores-sociais.compact.json";
import jsonComercio from "../../data/internacional/comercio-commodities.compact.json";
import jsonTerritorios from "../../data/internacional/terra-territorios-global.compact.json";

export interface IndicadorSocialMultilateral {
  pais: string;
  codigoIso3: string;
  bandeira: string;
  anoReferencia: number;
  idh: number;
  gini: number;
  desigualdadeGeneroGii: number;
  gastoEducacaoPib: number;
  gastoSaudePib: number;
  expectativaVida: number;
  fonteOficial: string;
  urlOficial: string;
  resumoContexto: string;
}

export interface ComercioCommodityMultilateral {
  mineralOuCommodity: string;
  codigoHs: string;
  origemPais: string;
  destinoPais: string;
  volumeAnualToneladas: number;
  valorFobUsdMilhoes: number;
  portoEmbarqueBrasil: string;
  portoDestino: string;
  fonteNome: string;
  urlOficial: string;
}

export interface TerritorioGlobal {
  id: string;
  pais: string;
  nomeTerritorio: string;
  povoOriginario: string;
  areaHectares: number;
  statusDemarcacao: string;
  concessoesMinerariasSobrepostas: number;
  focosCalorAnuaisSat: number;
  orgaoResponsavel: string;
  urlOficial: string;
}

/**
 * Constantes de cobertura medidas e datadas para importacao sem inflacao de payload.
 */
export const COBERTURA_MULTILATERAL = {
  dataMedicao: "2026-09-29",
  totalPaisesMapeados: 14,
  paises: [
    "Brasil", "Alemanha", "Canadá", "Estados Unidos", "Reino Unido",
    "França", "Itália", "Espanha", "Portugal", "Holanda",
    "China", "Austrália", "Arábia Saudita", "Japão"
  ],
  indicadoresDisponiveis: [
    "IDH (ONU/PNUD)", "Gini de Desigualdade de Renda (Banco Mundial)",
    "Desigualdade de Gênero GII", "Gastos em Educação (% PIB UNESCO)",
    "Gastos em Saúde (% PIB OMS)", "Expectativa de Vida ao Nascer"
  ],
  totalFluxosCommodities: 6,
  volumeTotalMineraisToneladas: 292904000,
  valorTotalFobUsdMilhoes: 39930,
  totalTerritoriosIndigenasMapeados: 5,
  areaTotalTerritoriosHectares: 24906978,
  concessoesSobrepostasTotal: 1128,
};

/**
 * Retorna os indicadores sociais multilaterais de todos os paises mapeados.
 */
export function obterIndicadoresSociais(): IndicadorSocialMultilateral[] {
  return expandir(jsonIndicadores as unknown as TabelaCompacta) as unknown as IndicadorSocialMultilateral[];
}

/**
 * Retorna os fluxos comerciais transnacionais de commodities estrategicas.
 */
export function obterComercioCommodities(): ComercioCommodityMultilateral[] {
  return expandir(jsonComercio as unknown as TabelaCompacta) as unknown as ComercioCommodityMultilateral[];
}

/**
 * Retorna os territorios indigenas e salvaguardas socioambientais globais.
 */
export function obterTerritoriosGlobais(): TerritorioGlobal[] {
  return expandir(jsonTerritorios as unknown as TabelaCompacta) as unknown as TerritorioGlobal[];
}
