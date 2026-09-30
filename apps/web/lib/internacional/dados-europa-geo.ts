/**
 * @file apps/web/lib/internacional/dados-europa-geo.ts
 * @description Módulo tipado de acesso e consulta ao acervo geoespacial de tribunais, sedes, portos e órgãos da Europa.
 *
 * Papel no portal:
 * Fornece a constante literal `COBERTURA_EUROPA_GEO` para cartões de topo (evitando importar
 * arrays inteiros nas páginas de servidor conforme AGENTS.md §5.1 e §8) e funções de descompactação
 * e consulta sob demanda via `expandir()` (`compactar.ts`).
 *
 * Fontes oficiais mapeadas:
 * - High Court of Justice & UK Supreme Court (Find Case Law / The National Archives).
 * - Rechtbank Rotterdam (De Rechtspraak / rechtspraak.nl).
 * - Tribunal Judiciaire de Paris & Ministère de la Justice (data.gouv.fr).
 * - BAFA Alemanha (Lieferkettensorgfaltspflichtengesetz - LkSG).
 * - Comissão Europeia (TRACES-NT / Regulamento EUDR 2023/1115 e Diretiva CSDDD 2024/1760).
 * - DCIAP / Procuradoria-Geral da República Portuguesa.
 * - Registros corporativos oficiais: Companies House (UK), Zefix (Suíça), RCS (Luxemburgo),
 *   Registro Mercantil (Espanha), Registro Imprese (Itália), Brønnøysundregistrene (Noruega).
 * - Autoridades portuárias: Port of Rotterdam Authority, Port of Antwerp-Bruges, Hamburg Port Authority.
 *
 * Decisões técnicas e restrições:
 * - Padrão das Seis Qualidades do Controle Popular (AGENTS.md §8): links oficiais, busca textual,
 *   ordenação, cartões medidos, contexto cívico em orações curtas e exportação CSV com BOM UTF-8.
 * - Zero dados pessoais / sem CPFs (AGENTS.md §5.2).
 * - Cache em memória do módulo para evitar expansões repetidas no runtime do Next.js.
 */

import { expandir, type TabelaCompacta } from "../estatico/compactar";
import jsonEuropaGeo from "../../data/internacional/europa-geo.compact.json";

export type TipoEntidadeEuropa =
  | "tribunal_litigio"
  | "sede_corporativa"
  | "porto_hub"
  | "orgao_regulador";

export interface PontoGeoEuropa extends Record<string, unknown> {
  id: string;
  nome: string;
  entidade: string;
  tipo: TipoEntidadeEuropa;
  pais: string;
  cidade: string;
  latitude: number;
  longitude: number;
  marcoLegalOuProcesso: string;
  fonteOficial: string;
  descricao: string;
}

export interface CoberturaEuropaGeo {
  readonly dataMedicao: string;
  readonly totalPontos: number;
  readonly totalPaises: number;
  readonly totalTribunaisLitigios: number;
  readonly totalSedesCorporativas: number;
  readonly totalPortosHubs: number;
  readonly totalOrgaosReguladores: number;
}

/**
 * Constante literal medida e datada para consumo em Server Components (AGENTS.md §5.1 e §8).
 */
export const COBERTURA_EUROPA_GEO: CoberturaEuropaGeo = {
  dataMedicao: "2026-09-30",
  totalPontos: 23,
  totalPaises: 11,
  totalTribunaisLitigios: 4,
  totalSedesCorporativas: 12,
  totalPortosHubs: 4,
  totalOrgaosReguladores: 3,
} as const;

/** Cache em memória para evitar decodificação repetida */
let cachePontosEuropa: PontoGeoEuropa[] | null = null;

/**
 * Retorna todos os 23 pontos georreferenciados da Europa e Reino Unido decodificados.
 *
 * @returns Array de pontos geográficos europeus
 */
export function obterPontosGeoEuropa(): PontoGeoEuropa[] {
  if (!cachePontosEuropa) {
    cachePontosEuropa = expandir(
      jsonEuropaGeo as unknown as TabelaCompacta
    ) as unknown as PontoGeoEuropa[];
  }
  return cachePontosEuropa;
}

/**
 * Filtra pontos por tipo de entidade ('tribunal_litigio' | 'sede_corporativa' | 'porto_hub' | 'orgao_regulador').
 *
 * @param tipo Categoria da entidade geográfica
 * @returns Pontos filtrados pela categoria
 */
export function obterPontosPorTipo(tipo: TipoEntidadeEuropa): PontoGeoEuropa[] {
  return obterPontosGeoEuropa().filter((p) => p.tipo === tipo);
}

/**
 * Filtra pontos por país de localização na Europa.
 *
 * @param pais Nome do país (ex.: "Reino Unido", "Alemanha", "Países Baixos")
 * @returns Pontos situados no país especificado
 */
export function obterPontosPorPais(pais: string): PontoGeoEuropa[] {
  const normalizado = pais.trim().toLowerCase();
  return obterPontosGeoEuropa().filter((p) => p.pais.toLowerCase() === normalizado);
}

/**
 * Filtra pontos por cidade na Europa.
 *
 * @param cidade Nome da cidade (ex.: "Londres", "Roterdã", "Paris", "Bruxelas")
 * @returns Pontos situados na cidade especificada
 */
export function obterPontosPorCidade(cidade: string): PontoGeoEuropa[] {
  const normalizado = cidade.trim().toLowerCase();
  return obterPontosGeoEuropa().filter((p) => p.cidade.toLowerCase() === normalizado);
}

/**
 * Escapa valores para CSV com delimitador ponto e vírgula (;).
 */
function escaparCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const str = String(valor).trim();
  if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exporta pontos da Europa em formato CSV com codificação UTF-8 e BOM (\uFEFF) para compatibilidade com Excel.
 *
 * @param dados Lista de pontos a exportar
 * @returns String formatada em CSV compatível com padrão ABNT
 */
export function gerarCsvEuropaGeo(dados: PontoGeoEuropa[] = obterPontosGeoEuropa()): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "id",
    "nome",
    "entidade",
    "tipo",
    "pais",
    "cidade",
    "latitude",
    "longitude",
    "marco_legal_ou_processo",
    "fonte_oficial",
    "descricao",
  ].join(";");

  const linhas = dados.map((d) =>
    [
      escaparCsv(d.id),
      escaparCsv(d.nome),
      escaparCsv(d.entidade),
      escaparCsv(d.tipo),
      escaparCsv(d.pais),
      escaparCsv(d.cidade),
      escaparCsv(d.latitude),
      escaparCsv(d.longitude),
      escaparCsv(d.marcoLegalOuProcesso),
      escaparCsv(d.fonteOficial),
      escaparCsv(d.descricao),
    ].join(";")
  );

  return BOM + [cabecalho, ...linhas].join("\r\n");
}
