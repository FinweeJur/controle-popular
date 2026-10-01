/**
 * @file apps/web/lib/ambiente/dados-barragens-globais.ts
 * @description Módulo de consulta, decodificação e agregação do acervo de Grandes Barragens Mundiais.
 *
 * Papel no portal:
 * Centraliza e sistematiza as informações sobre grandes barragens do mundo em três frentes críticas:
 * rejeitos de mineração (com histórico de rompimento e descaracterização), centrais hidrelétricas
 * de grande porte e reservatórios estratégicos de abastecimento de água e controle de cheias.
 *
 * Fontes oficiais consultadas:
 * - ICOLD (International Commission on Large Dams — World Register of Dams)
 * - Global Tailings Portal (GRID-Arendal / UNEP / Church of England Pensions Board)
 * - USACE NID (United States Army Corps of Engineers — National Inventory of Dams)
 * - ANM / SIGBM (Agência Nacional de Mineração — Sistema Integrado de Gestão de Segurança de Barragens)
 * - ANA (Agência Nacional de Águas e Saneamento Básico — Relatório de Segurança de Barragens)
 * - MITECO (Ministério para a Transição Ecológica da Espanha)
 * - BC Ministry of Energy, Mines and Low Carbon Innovation (Canadá)
 *
 * Decisões técnicas e conformidade:
 * - Leitura e decodificação sob demanda de JSON compacto versionado via lib/estatico/compactar.ts.
 * - Cache singleton em memória para evitar parses repetidos em Server Components ou rotas de API.
 * - Constante agregada COBERTURA_BARRAGENS_GLOBAIS pré-calculada para importação direta e ultraleve.
 * - Respeito integral à regra das Seis Qualidades (AGENTS.md §8) e sem dados pessoais (AGENTS.md §5.2).
 */

import { expandir, type TabelaCompacta } from "../estatico/compactar";
import jsonBarragens from "../../data/ambiente/barragens-mundiais.compact.json";

export type TipoBarragem =
  | "rejeitos_mineracao"
  | "hidreletrica"
  | "abastecimento_multiuso"
  | "controle_cheias";

export type StatusOperacional =
  | "em_operacao"
  | "desativada_descaracterizacao"
  | "rompida_historico"
  | "em_construcao";

export interface BarragemMundial {
  id: string;
  nome: string;
  tipoBarragem: TipoBarragem;
  tipoEstrutura: string;
  pais: string;
  continente:
    | "América do Sul"
    | "América do Norte"
    | "Europa"
    | "Ásia"
    | "África"
    | "Oceania";
  rioOuBacia: string;
  alturaMetros: number;
  volumeCapacidadeMm3: number;
  operador: string;
  classificacaoRiscoOuHazard: string;
  statusOperacional: StatusOperacional;
  anoConclusao: number;
  latitude: number;
  longitude: number;
  resumoCivico: string;
  orgaoReguladorOuBase: string;
  linkFonteOficial: string;
  tags: string[];
}

/** Cache em memória para evitar expansão repetida em chamadas subsequentes */
let cacheBarragens: BarragemMundial[] | null = null;

/**
 * Retorna todas as grandes barragens mundiais catalogadas.
 *
 * @returns Array com todas as barragens tipadas
 */
export function obterBarragensGlobais(): BarragemMundial[] {
  if (!cacheBarragens) {
    cacheBarragens = expandir(
      jsonBarragens as unknown as TabelaCompacta
    ) as unknown as BarragemMundial[];
  }
  return cacheBarragens;
}

/**
 * Retorna as barragens com coordenadas geográficas válidas para projeção em mapas e 3D.
 *
 * @returns Array de barragens geolocalizadas
 */
export function obterBarragensGlobaisGeolocalizadas(): (BarragemMundial & {
  latitude: number;
  longitude: number;
})[] {
  const barragens = obterBarragensGlobais();
  return barragens.filter(
    (b): b is BarragemMundial & { latitude: number; longitude: number } =>
      typeof b.latitude === "number" &&
      typeof b.longitude === "number" &&
      !isNaN(b.latitude) &&
      !isNaN(b.longitude)
  );
}

/**
 * Busca uma barragem pelo seu identificador único canônico.
 *
 * @param id Identificador da barragem (ex: 'BAR-BR-FUNDAO')
 * @returns A barragem correspondente ou undefined
 */
export function obterBarragemGlobalPorId(id: string): BarragemMundial | undefined {
  const barragens = obterBarragensGlobais();
  const idNormalizado = String(id || "").trim().toLowerCase();
  return barragens.find((b) => b.id.toLowerCase() === idNormalizado);
}

/**
 * Filtra barragens pelo tipo de finalidade ou conteúdo.
 *
 * @param tipo Categoria da barragem (ex: 'rejeitos_mineracao')
 * @returns Array de barragens da categoria
 */
export function obterBarragensPorTipo(tipo: TipoBarragem): BarragemMundial[] {
  const barragens = obterBarragensGlobais();
  return barragens.filter((b) => b.tipoBarragem === tipo);
}

/**
 * Filtra barragens pelo país de localização.
 *
 * @param pais Nome do país
 * @returns Array de barragens do país informado
 */
export function obterBarragensPorPais(pais: string): BarragemMundial[] {
  const barragens = obterBarragensGlobais();
  const paisNorm = pais.trim().toLowerCase();
  return barragens.filter((b) => b.pais.toLowerCase() === paisNorm);
}

// ==========================================
// CÁLCULO ESTRATÉGICO DOS AGREGADOS MEDIDOS
// ==========================================
const barragensBase = obterBarragensGlobais();

const paisesSet = new Set(barragensBase.map((b) => b.pais));
const continentesSet = new Set(barragensBase.map((b) => b.continente));
const operadoresSet = new Set(barragensBase.map((b) => b.operador));
const tiposSet = new Set(barragensBase.map((b) => b.tipoBarragem));

const alturas = barragensBase.map((b) => b.alturaMetros).filter((a) => typeof a === "number" && !isNaN(a));
const volumes = barragensBase.map((b) => b.volumeCapacidadeMm3).filter((v) => typeof v === "number" && !isNaN(v));

const volumeTotalAcumulado = volumes.reduce((acc, cur) => acc + cur, 0);

/**
 * Constantes agregadas de cobertura para importação ultraleve em Server Components.
 * Permite renderizar cartões e cabeçalhos sem transferir todo o array no bundle do cliente.
 */
export const COBERTURA_BARRAGENS_GLOBAIS = {
  totalBarragens: barragensBase.length,
  totalPaises: paisesSet.size,
  totalContinentes: continentesSet.size,
  totalOperadores: operadoresSet.size,
  totalRejeitos: barragensBase.filter((b) => b.tipoBarragem === "rejeitos_mineracao").length,
  totalHidreletricas: barragensBase.filter((b) => b.tipoBarragem === "hidreletrica").length,
  totalAbastecimentoMultiuso: barragensBase.filter((b) => b.tipoBarragem === "abastecimento_multiuso").length,
  totalControleCheias: barragensBase.filter((b) => b.tipoBarragem === "controle_cheias").length,
  totalRompidaHistorico: barragensBase.filter((b) => b.statusOperacional === "rompida_historico").length,
  totalDescaracterizacao: barragensBase.filter((b) => b.statusOperacional === "desativada_descaracterizacao").length,
  totalEmOperacao: barragensBase.filter((b) => b.statusOperacional === "em_operacao").length,
  totalEmConstrucao: barragensBase.filter((b) => b.statusOperacional === "em_construcao").length,
  volumeTotalMm3: Math.round(volumeTotalAcumulado),
  maiorAlturaMetros: alturas.length > 0 ? Math.max(...alturas) : 0,
  maiorVolumeMm3: volumes.length > 0 ? Math.max(...volumes) : 0,
  paises: Array.from(paisesSet).sort(),
  continentes: Array.from(continentesSet).sort(),
  operadores: Array.from(operadoresSet).sort(),
  tipos: Array.from(tiposSet).sort(),
  dataMedicao: "2026-10-01",
} as const;
