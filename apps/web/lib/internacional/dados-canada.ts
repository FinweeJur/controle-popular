/**
 * @file apps/web/lib/internacional/dados-canada.ts
 * @description Módulo tipado de acesso aos dados oficiais do Canadá (/canada).
 *
 * Papel no portal:
 * Fornece a constante literal `COBERTURA_CANADA` para os cartões de topo (evitando
 * importar arrays inteiros nas páginas de servidor) e funções de descompactação
 * via `expandir()` (`compactar.ts`).
 *
 * Decisões técnicas e restrições:
 * - A constante de cobertura é estática, medida e datada (2026-09-29).
 * - Os arquivos JSON são importados como TabelaCompacta e expandidos sob demanda.
 */

import { expandir, type TabelaCompacta } from "../estatico/compactar";
import mineradorasJson from "../../data/canada/mineradoras-tsx-brasil.compact.json";
import ambientalJson from "../../data/canada/ambiental-natureza-ciencia.compact.json";
import contratosJson from "../../data/canada/contratos-open-canada.compact.json";
import institucionalJson from "../../data/canada/institucional-canada.compact.json";

import type {
  RegistroMineradoraCanadaBrasil,
  RegistroAmbientalCienciaCanada,
  RegistroContratoEconomiaCanada,
  RegistroInstitucionalCanada,
} from "../../../../scripts/coletar-canada-acervo.mts";

export interface CoberturaCanada {
  readonly dataMedicao: string;
  readonly mineradorasTsxBrasil: number;
  readonly registrosAmbientais: number;
  readonly contratosGrants: number;
  readonly registrosInstitucionais: number;
  readonly totalRegistros: number;
  readonly barragensMonitoradas: number;
  readonly cidadesPolo: number;
}

/**
 * Constante literal medida e datada para consumo em Server Components.
 * Evita carregar os arrays de dados no servidor apenas para exibir totais nos cartões.
 */
export const COBERTURA_CANADA: CoberturaCanada = {
  dataMedicao: "2026-09-30",
  mineradorasTsxBrasil: 14,
  registrosAmbientais: 12,
  contratosGrants: 9,
  registrosInstitucionais: 12,
  totalRegistros: 47,
  barragensMonitoradas: 10,
  cidadesPolo: 6,
} as const;

export function obterMineradorasCanada(): RegistroMineradoraCanadaBrasil[] {
  return expandir(mineradorasJson as unknown as TabelaCompacta) as unknown as RegistroMineradoraCanadaBrasil[];
}

export function obterAmbientalCanada(): RegistroAmbientalCienciaCanada[] {
  return expandir(ambientalJson as unknown as TabelaCompacta) as unknown as RegistroAmbientalCienciaCanada[];
}

export function obterContratosCanada(): RegistroContratoEconomiaCanada[] {
  return expandir(contratosJson as unknown as TabelaCompacta) as unknown as RegistroContratoEconomiaCanada[];
}

export function obterInstitucionalCanada(): RegistroInstitucionalCanada[] {
  return expandir(institucionalJson as unknown as TabelaCompacta) as unknown as RegistroInstitucionalCanada[];
}
