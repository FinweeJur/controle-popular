/**
 * @file apps/web/lib/internacional/dados-eua.ts
 * @description Módulo tipado de acesso aos dados oficiais dos Estados Unidos (/eua).
 *
 * Papel no portal:
 * Fornece a constante literal `COBERTURA_EUA` para os cartões de topo (evitando
 * importar arrays inteiros nas páginas de servidor) e funções de descompactação
 * via `expandir()` (`compactar.ts`).
 *
 * Decisões técnicas e restrições:
 * - A constante de cobertura é estática, medida e datada (2026-09-29).
 * - Os arquivos JSON são importados como TabelaCompacta e expandidos sob demanda.
 */

import { expandir, type TabelaCompacta } from "../estatico/compactar";
import empresasSecJson from "../../data/eua/empresas-sec.compact.json";
import ambientalJson from "../../data/eua/ambiental-natureza-eua.compact.json";
import contratosJson from "../../data/eua/contratos-usaspending.compact.json";
import institucionalJson from "../../data/eua/institucional-eua.compact.json";
import geoEuaJson from "../../data/internacional/eua-geo.compact.json";

import type {
  RegistroEmpresaSecEua,
  RegistroAmbientalEua,
  RegistroContratosEconomiaEua,
  RegistroInstitucionalEua,
} from "../../../../scripts/coletar-eua-acervo.mts";

export type TipoPontoEua =
  | "sede_corporativa"
  | "fundo_investimento"
  | "bolsa_valores"
  | "orgao_regulador"
  | "mina_estrategica";

export interface PontoGeoEua {
  id: string;
  nome: string;
  entidade: string;
  tipo: TipoPontoEua;
  setor: string;
  cidade: string;
  estadoUsa: string;
  latitude: number;
  longitude: number;
  regulador: string;
  fonteOficial: string;
  descricao: string;
}

export interface CoberturaEua {
  readonly dataMedicao: string;
  readonly empresasSecCatalogadas: number;
  readonly registrosAmbientais: number;
  readonly contratosEconomia: number;
  readonly registrosInstitucionais: number;
  readonly sedesCapitaisGeo: number;
  readonly totalRegistros: number;
  readonly barragensHighHazardNid: number;
  readonly cidadesPolo: number;
}

/**
 * Constante literal medida e datada para consumo em Server Components.
 * Evita carregar os arrays de dados no servidor apenas para exibir totais nos cartões.
 */
export const COBERTURA_EUA: CoberturaEua = {
  dataMedicao: "2026-09-30",
  empresasSecCatalogadas: 18,
  registrosAmbientais: 9,
  contratosEconomia: 7,
  registrosInstitucionais: 10,
  sedesCapitaisGeo: 29,
  totalRegistros: 44,
  barragensHighHazardNid: 15600,
  cidadesPolo: 2,
} as const;

export function obterEmpresasSecEua(): RegistroEmpresaSecEua[] {
  return expandir(empresasSecJson as unknown as TabelaCompacta) as unknown as RegistroEmpresaSecEua[];
}

export function obterAmbientalEua(): RegistroAmbientalEua[] {
  return expandir(ambientalJson as unknown as TabelaCompacta) as unknown as RegistroAmbientalEua[];
}

export function obterContratosEua(): RegistroContratosEconomiaEua[] {
  return expandir(contratosJson as unknown as TabelaCompacta) as unknown as RegistroContratosEconomiaEua[];
}

export function obterInstitucionalEua(): RegistroInstitucionalEua[] {
  return expandir(institucionalJson as unknown as TabelaCompacta) as unknown as RegistroInstitucionalEua[];
}

/**
 * Retorna todos os pontos georreferenciados dos EUA (sedes, fundos, bolsas, órgãos reguladores e minas).
 */
export function obterPontosGeoEua(): PontoGeoEua[] {
  return expandir(geoEuaJson as unknown as TabelaCompacta) as unknown as PontoGeoEua[];
}

/**
 * Busca um ponto geoespacial dos EUA pelo ID único.
 */
export function obterPontoGeoEuaPorId(id: string): PontoGeoEua | undefined {
  return obterPontosGeoEua().find((p) => p.id === id);
}

