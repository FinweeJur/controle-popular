/**
 * @file apps/web/lib/ambiente/dados-conflitos-globais.ts
 * @description Módulo de consulta e consolidação de Conflitos Socioambientais Globais.
 *
 * Papel no portal:
 * Fornece acesso estruturado ao acervo internacional de casos de injustiça e litígio
 * socioambiental nas Américas, África, Ásia, Europa e Oceania. Alimenta a rota
 * `/ambiental/conflitos-globais`, o assistente cívico e a visão espacial do Observatório
 * Nacional Socioambiental (ONSA).
 *
 * Fontes oficiais mapeadas:
 * - EJAtlas (Atlas Global de Justiça Ambiental - ICTA/Universitat Autònoma de Barcelona)
 * - Global Witness (Relatórios oficiais sobre violência contra defensores da terra)
 * - Comissão Pastoral da Terra (CPT Brasil)
 * - Corte Interamericana de Direitos Humanos (Corte IDH)
 * - Tribunal de Justiça da União Europeia (TJUE)
 * - Alto Comissariado das Nações Unidas para os Direitos Humanos (ACNUDH)
 *
 * Decisões técnicas e restrições:
 * - Padrão das Seis Qualidades do Controle Popular (AGENTS.md §8): links diretos canônicos,
 *   busca tolerante, filtros multifacetados, ordenação por coluna, resumo objetivo e exportação CSV com BOM UTF-8.
 * - Leitura sob demanda do JSON compactado (`apps/web/data/ambiente/conflitos-socioambientais.compact.json`)
 *   via `expandir()` com cache local em memória para evitar releitura e overhead no runtime.
 * - Constante estática `COBERTURA_CONFLITOS_GLOBAIS` medida e datada para consumo leve em Server Components (AGENTS.md §5.1).
 */

import { expandir, type TabelaCompacta } from "../estatico/compactar";
import { semAcento } from "../busca/normalizar";
import jsonConflitos from "../../data/ambiente/conflitos-socioambientais.compact.json";

export interface ConflitoSocioambientalGlobal extends Record<string, unknown> {
  id: string;
  nome: string;
  pais: string;
  continente: string;
  localidade: string;
  commodities: string;
  comunidades: string;
  empresas: string;
  tipoDano: string;
  status: string;
  latitude: number;
  longitude: number;
  fonteOficial: string;
  linkOficial: string;
  resumo: string;
}

export interface FiltrosConflitosGlobais {
  busca?: string;
  continente?: string;
  pais?: string;
  commodity?: string;
}

export interface EstatisticasConflitosGlobais {
  totalConflitos: number;
  totalPaises: number;
  totalContinentes: number;
  conflitosPorContinente: Record<string, number>;
  principaisCommodities: Record<string, number>;
}

export interface CoberturaConflitosGlobais {
  readonly dataMedicao: string;
  readonly totalConflitos: number;
  readonly totalPaises: number;
  readonly totalContinentes: number;
  readonly continentes: readonly string[];
  readonly principaisCommodities: readonly string[];
  readonly fontesMonitoradas: readonly string[];
}

/**
 * Agregados estáticos auditados em 01/10/2026.
 * Usados diretamente nos cartões de topo da página SSR para garantir conformidade
 * com a política de não serializar coleções inteiras em server components (AGENTS.md §5.1 e §8).
 */
export const COBERTURA_CONFLITOS_GLOBAIS: CoberturaConflitosGlobais = {
  dataMedicao: "2026-10-01",
  totalConflitos: 55,
  totalPaises: 26,
  totalContinentes: 5,
  continentes: [
    "América do Sul",
    "América Central",
    "América do Norte",
    "África",
    "Ásia e Oceania",
    "Europa",
  ],
  principaisCommodities: [
    "Minério de Ferro",
    "Cobre",
    "Ouro",
    "Petróleo",
    "Lítio",
    "Carvão",
    "Bauxita",
    "Cobalto",
    "Prata",
    "PFAS",
  ],
  fontesMonitoradas: [
    "EJAtlas (Atlas Global de Justiça Ambiental)",
    "Global Witness",
    "Comissão Pastoral da Terra (CPT)",
    "Corte Interamericana de Direitos Humanos (Corte IDH)",
    "Tribunal de Justiça da União Europeia (TJUE)",
    "ACNUDH / PNUMA (Organização das Nações Unidas)",
  ],
};

let cacheConflitos: ConflitoSocioambientalGlobal[] | null = null;

/**
 * Retorna todos os conflitos socioambientais globais mapeados e descompactados.
 * Aplica cache em memória local após a primeira descompactação.
 */
export function obterConflitosGlobais(): ConflitoSocioambientalGlobal[] {
  if (!cacheConflitos) {
    cacheConflitos = expandir<ConflitoSocioambientalGlobal>(
      jsonConflitos as unknown as TabelaCompacta
    );
  }
  return cacheConflitos;
}

/**
 * Localiza um conflito específico a partir de seu identificador canônico (slug).
 * @param id Identificador do conflito (ex: 'br-mariana-rio-doce')
 */
export function obterConflitoPorId(id: string): ConflitoSocioambientalGlobal | undefined {
  return obterConflitosGlobais().find((c) => c.id === id);
}

/**
 * Filtra os conflitos socioambientais com base em critérios de texto, continente, país e commodities.
 * A busca textual contempla nome, país, localidade, commodities, comunidades, empresas e resumo.
 * @param filtros Parâmetros opcionais de filtragem
 */
export function filtrarConflitosGlobais(
  filtros: FiltrosConflitosGlobais = {}
): ConflitoSocioambientalGlobal[] {
  const conflitos = obterConflitosGlobais();
  // Normaliza os DOIS lados: quem digita "mineracao" precisa achar
  // "mineração". `semAcento` também baixa as maiúsculas, então o
  // `toLowerCase()` de antes vira redundante (revisão Parte 24, 01/10/2026:
  // a busca devolvia 0 para "colombia" contra uma base que traz "Colômbia").
  const termo = filtros.busca ? semAcento(filtros.busca.trim()) : "";

  return conflitos.filter((c) => {
    if (filtros.continente && filtros.continente !== "todos" && c.continente !== filtros.continente) {
      return false;
    }

    if (filtros.pais && filtros.pais !== "todos" && c.pais !== filtros.pais) {
      return false;
    }

    if (filtros.commodity && filtros.commodity !== "todas") {
      if (!semAcento(c.commodities).includes(semAcento(filtros.commodity))) {
        return false;
      }
    }

    if (termo) {
      const textoConsolidado = semAcento(
        `${c.nome} ${c.pais} ${c.localidade} ${c.commodities} ${c.comunidades} ${c.empresas} ${c.tipoDano} ${c.status} ${c.resumo}`,
      );
      if (!textoConsolidado.includes(termo)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Retorna a lista ordenada e sem duplicatas de todos os continentes presentes na base.
 */
export function obterContinentesConflitos(): string[] {
  const continentes = new Set(obterConflitosGlobais().map((c) => c.continente));
  return Array.from(continentes).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/**
 * Retorna a lista ordenada e sem duplicatas de todos os países presentes na base.
 */
export function obterPaisesConflitos(): string[] {
  const paises = new Set(obterConflitosGlobais().map((c) => c.pais));
  return Array.from(paises).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/**
 * Retorna a lista padronizada das principais commodities e matérias-primas envolvidas nos conflitos.
 */
export function obterCommoditiesConflitos(): string[] {
  const commoditiesSet = new Set<string>();
  for (const c of obterConflitosGlobais()) {
    const itens = c.commodities.split(/,\s*/);
    for (const item of itens) {
      if (item.trim()) commoditiesSet.add(item.trim());
    }
  }
  return Array.from(commoditiesSet).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/**
 * Calcula estatísticas agregadas em tempo de execução para os conflitos globais.
 */
export function obterEstatisticasConflitos(): EstatisticasConflitosGlobais {
  const conflitos = obterConflitosGlobais();
  const paises = new Set<string>();
  const continentes = new Set<string>();
  const conflitosPorContinente: Record<string, number> = {};
  const principaisCommodities: Record<string, number> = {};

  for (const c of conflitos) {
    paises.add(c.pais);
    continentes.add(c.continente);

    conflitosPorContinente[c.continente] = (conflitosPorContinente[c.continente] || 0) + 1;

    const itens = c.commodities.split(/,\s*/);
    for (const item of itens) {
      const chave = item.trim();
      if (chave) {
        principaisCommodities[chave] = (principaisCommodities[chave] || 0) + 1;
      }
    }
  }

  return {
    totalConflitos: conflitos.length,
    totalPaises: paises.size,
    totalContinentes: continentes.size,
    conflitosPorContinente,
    principaisCommodities,
  };
}
