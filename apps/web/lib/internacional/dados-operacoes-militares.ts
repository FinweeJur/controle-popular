/**
 * @file apps/web/lib/internacional/dados-operacoes-militares.ts
 * @description Modulo de consulta, decodificacao e agregacao do acervo de operacoes militares, contratos de defesa e PMCs.
 *
 * Papel no portal:
 * Centraliza as operacoes militares formais, deposicoes de regime, atuacao de empresas militares privadas
 * (PMCs / mercenarios) e mega-contratos armamentistas das potencias da America do Norte e Europa.
 * Fornece metadados historicos, teatro de operacoes geolocalizado, resumo civico e agregados medidos de topo.
 *
 * Fontes oficiais:
 * - Congressional Research Service (CRS Report R42738 - Instances of Use of US Armed Forces Abroad)
 * - Conselho de Seguranca das Nacoes Unidas (Resolucoes e Relatorios do Painel de Peritos)
 * - National Security Archive (George Washington University)
 * - US Department of Defense (DoD Historical Records e Special Inspector General SIGIR/SIGAR)
 * - Corte Internacional de Justica (CIJ / ICJ em Haia)
 * - International Committee of the Red Cross (ICRC / Documento de Montreux sobre PMCs)
 * - SIPRI (Stockholm International Peace Research Institute - Arms Transfers Database)
 * - Tribunal de Contas da Uniao (TCU / Brasil) e FAB
 *
 * Decisoes tecnicas:
 * - Leitura e decodificacao de JSON compacto via lib/estatico/compactar.ts.
 * - Cobertura agregada COBERTURA_OPERACOES_MILITARES pre-calculada para Server Components.
 * - Todos os registros georreferenciados com latitude e longitude decimais.
 */

import { expandir, type TabelaCompacta } from "../estatico/compactar";
import jsonOperacoes from "../../data/internacional/operacoes-militares.compact.json";

export type TipoOperacaoMilitar =
  | "intervencao_militar_direta"
  | "deposicao_regime_golpe"
  | "pmc_milicia_privada"
  | "guerra_proxy_apoio_rebelde"
  | "contrato_defesa_armamento"
  | "operacao_paz_mandato_onu";

export interface OperacaoMilitarGlobal {
  id: string;
  codinome: string;
  titulo: string;
  resumo: string;
  tipoOperacao: TipoOperacaoMilitar;
  anoInicio: number;
  anoFim: number | null;
  duracaoEstimada: string;
  paisesPatrocinadores: string[];
  orgaosForcasEnvolvidas: string[];
  pmcsEnvolvidas: string[];
  principaisContratadasDefesa: string[];
  paisTeatro: string;
  continenteTeatro:
    | "América do Sul"
    | "América Central e Caribe"
    | "América do Norte"
    | "Europa"
    | "Oriente Médio"
    | "África"
    | "Ásia e Oceania";
  localidadeFoco: string;
  latitude: number;
  longitude: number;
  baixasEstimadas: string;
  custoFinanceiroEstimado: string;
  desfechoSoberania: string;
  conexaoBrasilOuAmericaLatina: string;
  fonteOficialNome: string;
  urlFonteOficial: string;
  urlDocumentoOriginalPdf: string;
  identificadorOficialDoc: string;
  assuntos: string[];
}

/** Cache em memoria para evitar expansao repetida */
let cacheOperacoes: OperacaoMilitarGlobal[] | null = null;

/**
 * Retorna todas as operacoes militares decodificadas.
 *
 * @returns Array de operacoes militares tipadas
 */
export function obterOperacoesMilitares(): OperacaoMilitarGlobal[] {
  if (!cacheOperacoes) {
    cacheOperacoes = expandir(
      jsonOperacoes as unknown as TabelaCompacta
    ) as unknown as OperacaoMilitarGlobal[];
  }
  return cacheOperacoes;
}

/**
 * Retorna as operacoes militares que possuem coordenadas geograficas validas.
 */
export function obterOperacoesMilitaresGeolocalizadas(): (OperacaoMilitarGlobal & {
  latitude: number;
  longitude: number;
})[] {
  const ops = obterOperacoesMilitares();
  return ops.filter(
    (op): op is OperacaoMilitarGlobal & { latitude: number; longitude: number } =>
      typeof op.latitude === "number" &&
      typeof op.longitude === "number" &&
      !isNaN(op.latitude) &&
      !isNaN(op.longitude)
  );
}

/**
 * Busca uma operacao militar especifica pelo identificador canonico.
 *
 * @param id Identificador da operacao (ex: OP-1953-IRN-AJAX)
 */
export function obterOperacaoMilitarPorId(id: string): OperacaoMilitarGlobal | undefined {
  const ops = obterOperacoesMilitares();
  const idNormalizado = String(id || "").trim().toLowerCase();
  return ops.find((op) => op.id.toLowerCase() === idNormalizado);
}

// Calculo dos agregados medidos para exportacao ultraleve em Server Components
const opsCalculo = obterOperacoesMilitares();

const paisesTeatroSet = new Set(opsCalculo.map((o) => o.paisTeatro));
const paisesPatrocinadoresSet = new Set(opsCalculo.flatMap((o) => o.paisesPatrocinadores));
const continentesTeatroSet = new Set(opsCalculo.map((o) => o.continenteTeatro));
const pmcsSet = new Set(opsCalculo.flatMap((o) => o.pmcsEnvolvidas).filter(Boolean));
const contratadasSet = new Set(opsCalculo.flatMap((o) => o.principaisContratadasDefesa).filter(Boolean));
const tiposSet = new Set(opsCalculo.map((o) => o.tipoOperacao));

const anosInicio = opsCalculo.map((o) => o.anoInicio).filter((a) => !isNaN(a));

/**
 * Constantes agregadas de cobertura para importacao leve em Server Components
 */
export const COBERTURA_OPERACOES_MILITARES = {
  totalOperacoes: opsCalculo.length,
  totalPaisesTeatro: paisesTeatroSet.size,
  totalPaisesPatrocinadores: paisesPatrocinadoresSet.size,
  totalPMCs: pmcsSet.size,
  totalContratadasDefesa: contratadasSet.size,
  totalComConexaoBrasilOuLatam: opsCalculo.filter(
    (o) =>
      o.continenteTeatro === "América do Sul" ||
      o.continenteTeatro === "América Central e Caribe" ||
      o.conexaoBrasilOuAmericaLatina.length > 0
  ).length,
  paisesTeatro: Array.from(paisesTeatroSet).sort(),
  paisesPatrocinadores: Array.from(paisesPatrocinadoresSet).sort(),
  continentesTeatro: Array.from(continentesTeatroSet).sort(),
  pmcsCatalogadas: Array.from(pmcsSet).sort(),
  contratadasDefesa: Array.from(contratadasSet).sort(),
  tiposOperacao: Array.from(tiposSet).sort(),
  anoMaisAntigo: anosInicio.length > 0 ? Math.min(...anosInicio) : 1950,
  anoMaisRecente: anosInicio.length > 0 ? Math.max(...anosInicio) : 2024,
  dataMedicao: "2026-09-30",
} as const;
