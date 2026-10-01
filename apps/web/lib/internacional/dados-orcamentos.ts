/**
 * @file apps/web/lib/internacional/dados-orcamentos.ts
 * @description Módulo de consulta e análise comparativa de orçamentos públicos das grandes potências:
 * Estados Unidos (EUA), Canadá e Europa (União Europeia, Reino Unido, Alemanha, França e Itália).
 *
 * Papel no portal:
 * Alimenta a nova rota `/internacional/orcamentos` no Padrão das Seis Qualidades do Controle Popular,
 * fornecendo auditoria cívica sobre os orçamentos militar, de inteligência, econômico, tecnológico,
 * hídrico, energético e de combate à crise climática.
 *
 * Fontes oficiais primárias:
 * - EUA: Office of the Under Secretary of Defense (Comptroller), DNI, US Treasury, USACE, DoE LPO, EPA e CHIPS.gov.
 * - Canadá: Treasury Board of Canada, DND, CSIS, Finance Canada, Canada Water Agency, NRCan e ECCC.
 * - União Europeia: European Commission (Budget Online, MFF, NextGenerationEU, Horizon Europe, EDF, REPowerEU).
 * - Reino Unido, Alemanha, França e Itália: HM Treasury, BMVg, Bundesfinanzministerium, LPM França e MEF Itália.
 *
 * Decisões técnicas e conformidade:
 * - Leitura e descompactação em tempo de execução via `apps/web/lib/estatico/compactar.ts`.
 * - Cache em memória para evitar releitura de arquivo durante o ciclo de vida do processo.
 * - Ausência total de dados pessoais (zero CPF, SSN ou SIN) conforme AGENTS.md § 5.2.
 */

import { expandir, type TabelaCompacta } from "@/lib/estatico/compactar";
import jsonOrcamentos from "@/data/internacional/orcamentos-comparados.compact.json";

export type BlocoGeopolitico = "EUA" | "Canada" | "Europa";

export type EixoOrcamentario =
  | "militar"
  | "inteligencia"
  | "economico"
  | "tecnologico"
  | "hidrico"
  | "energetico"
  | "clima";

export interface RegistroOrcamentoGlobal extends Record<string, unknown> {
  id: string;
  bloco: BlocoGeopolitico;
  pais: string;
  codigoIso3: string;
  eixo: EixoOrcamentario;
  eixoRotulo: string;
  programaAgencia: string;
  descricao: string;
  valorUsdBi: number;
  valorMoedaOriginal: string;
  moeda: "USD" | "CAD" | "EUR" | "GBP";
  pctPib: number;
  anoExercicio: string;
  destaqueProjetos: string[];
  orgaoExecutor: string;
  fonteOficialNome: string;
  urlFonteOficial: string;
  cruzamentoBrasil: string;
}

export const ROTULOS_EIXOS: Record<EixoOrcamentario, string> = {
  militar: "Orçamento Militar",
  inteligencia: "Inteligência & Espionagem",
  economico: "Fomento Econômico",
  tecnologico: "P&D & Tecnologia",
  hidrico: "Recursos Hídricos",
  energetico: "Matriz & Transição Energética",
  clima: "Combate à Crise Climática",
};

export const ROTULOS_BLOCOS: Record<BlocoGeopolitico, string> = {
  EUA: "Estados Unidos (EUA)",
  Canada: "Canadá",
  Europa: "Europa (UE & Países)",
};

/**
 * Agregados medidos e datados do acervo de orçamentos internacionais.
 * Padrão das Seis Qualidades: cartões de topo abastecidos por constantes auditadas.
 */
export const COBERTURA_ORCAMENTOS = {
  totalRegistros: 30,
  totalPaisesBlocos: 7,
  somaMilitarUsdBi: 1100.2,
  somaInteligenciaUsdBi: 106.2,
  somaClimaUsdBi: 187.4,
  somaTecnologiaUsdBi: 98.0,
  somaHidricoUsdBi: 25.5,
  somaEnergeticoUsdBi: 121.4,
  somaEconomicoUsdBi: 1124.2,
  razaoMilitarVsClimaEua: 18.1,
  dataAtualizacao: "2026-10-01",
  fontesOficiais: [
    "DoD Comptroller",
    "ODNI Public Release",
    "US Treasury Fiscal Data",
    "Treasury Board of Canada",
    "European Commission Budget",
    "HM Treasury (UK)",
    "BMVg / Bundeshaushalt (Alemanha)",
    "Ministère des Armées (França)",
    "Ministero della Difesa (Itália)",
  ],
};

let CACHE_ORCAMENTOS: RegistroOrcamentoGlobal[] | null = null;

/**
 * Retorna todos os registros do catálogo comparativo de orçamentos globais.
 *
 * @returns Lista descompactada e tipada de registros orçamentários.
 */
export function obterTodosOrcamentos(): RegistroOrcamentoGlobal[] {
  if (CACHE_ORCAMENTOS) {
    return CACHE_ORCAMENTOS;
  }

  try {
    CACHE_ORCAMENTOS = expandir<RegistroOrcamentoGlobal>(jsonOrcamentos as unknown as TabelaCompacta);
    return CACHE_ORCAMENTOS;
  } catch (erro) {
    console.error("Falha ao expandir orçamentos comparados:", erro);
    return [];
  }
}

/**
 * Filtra registros por bloco geopolítico.
 *
 * @param bloco - "EUA" | "Canada" | "Europa"
 * @returns Registros correspondentes ao bloco solicitado.
 */
export function obterOrcamentosPorBloco(bloco: BlocoGeopolitico): RegistroOrcamentoGlobal[] {
  const todos = obterTodosOrcamentos();
  return todos.filter((item) => item.bloco === bloco);
}

/**
 * Filtra registros por eixo temático orçamentário.
 *
 * @param eixo - Um dos 7 eixos orçamentários estratégicos.
 * @returns Registros correspondentes ao eixo solicitado.
 */
export function obterOrcamentosPorEixo(eixo: EixoOrcamentario): RegistroOrcamentoGlobal[] {
  const todos = obterTodosOrcamentos();
  return todos.filter((item) => item.eixo === eixo);
}

/**
 * Busca um registro específico pelo seu identificador único.
 *
 * @param id - Identificador único do registro (ex.: 'orc-eua-militar-dod').
 * @returns O registro correspondente ou undefined.
 */
export function obterOrcamentoPorId(id: string): RegistroOrcamentoGlobal | undefined {
  const todos = obterTodosOrcamentos();
  return todos.find((item) => item.id === id);
}

/**
 * Estrutura um comparativo direto entre orçamento militar e orçamento climático
 * por país e bloco, evidenciando as prioridades de alocação de recursos públicos.
 *
 * @returns Lista comparativa com o ratio Militar / Clima.
 */
export function obterComparativoMilitarVsClima(): {
  pais: string;
  bloco: BlocoGeopolitico;
  militarUsdBi: number;
  climaUsdBi: number;
  razaoMilitarSobreClima: number;
}[] {
  const todos = obterTodosOrcamentos();
  const paises = Array.from(new Set(todos.map((item) => item.pais)));

  const resultado = [];

  for (const pais of paises) {
    const militar = todos.find((item) => item.pais === pais && item.eixo === "militar");
    const clima = todos.find((item) => item.pais === pais && item.eixo === "clima");

    if (militar && clima && clima.valorUsdBi > 0) {
      resultado.push({
        pais,
        bloco: militar.bloco,
        militarUsdBi: militar.valorUsdBi,
        climaUsdBi: clima.valorUsdBi,
        razaoMilitarSobreClima: Number((militar.valorUsdBi / clima.valorUsdBi).toFixed(1)),
      });
    }
  }

  return resultado.sort((a, b) => b.razaoMilitarSobreClima - a.razaoMilitarSobreClima);
}
