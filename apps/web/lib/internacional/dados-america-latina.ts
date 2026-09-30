/**
 * @file apps/web/lib/internacional/dados-america-latina.ts
 * @description Módulo tipado de acesso, consulta e agregados para o Observatório de Mineração na América Latina (/america-latina).
 *
 * Papel no portal:
 * Fornece a constante agregada `COBERTURA_AMERICA_LATINA` para cartões de topo no SSR sem inflação
 * de bundle (atendendo AGENTS.md §5.1 e §8) e métodos sob demanda para decodificar acervos compactos
 * gerados via `compactar.ts`.
 *
 * Fontes oficiais mapeadas (auditoria direta e canônica):
 * - Brasil: Agência Nacional de Mineração (ANM) / SIGMINE / Cadastro Nacional de Barragens.
 * - Chile: Serviço Nacional de Geologia e Mineração (SERNAGEOMIN) / Comisión Chilena del Cobre (Cochilco).
 * - Peru: Instituto Geológico, Minero y Metalúrgico (INGEMMET) / Ministério de Energia e Minas (MINEM).
 * - Argentina: Secretaría de Minería de la Nación / SEGEMAR / Ministérios Provinciais de San Juan, Jujuy e Catamarca.
 * - México: Secretaría de Economía (DGM) / SEMARNAT / PROFEPA.
 * - Colômbia: Agencia Nacional de Minería (ANM Colombia) / ANLA.
 * - Bolívia: Corporación Minera de Bolivia (COMIBOL) / Yacimientos de Litio Bolivianos (YLB) / SERGEOMIN.
 * - Equador: Ministerio de Energía y Minas / EcuaCorriente / Lundin Gold.
 * - Panamá: Ministerio de Comercio e Industrias (MICI) / Corte Suprema de Justicia de Panamá.
 *
 * Decisões técnicas e restrições:
 * - Regra das Seis Qualidades do Controle Popular (AGENTS.md §8): links oficiais, busca tolerante,
 *   ordenação, cartões medidos em 30/09/2026, assistente cívico e exportação CSV formatada com BOM UTF-8.
 * - Descompactação via `expandir()` com cache local em memória para evitar releitura e overhead no runtime.
 */

import { expandir, type TabelaCompacta } from "../estatico/compactar";
import jsonInstalacoes from "../../data/america-latina/instalacoes-latam.compact.json";
import jsonMineradoras from "../../data/america-latina/mineradoras-latam.compact.json";

export type TipoInstalacaoLatam =
  | "mina_operacao"
  | "projeto_litio"
  | "porto_minerario"
  | "sede_corporativa"
  | "complexo_beneficiamento";

export interface InstalacaoMineradoraLatam extends Record<string, unknown> {
  id: string;
  nome: string;
  empresa: string;
  pais: string;
  tipo: TipoInstalacaoLatam;
  mineralPrincipal: string;
  status: string;
  latitude: number;
  longitude: number;
  baciaOuRegiao: string;
  fonteOficial: string;
  descricao: string;
}

export interface ReferenciaInstalacaoEmpresa {
  id: string;
  nome: string;
  tipo: string;
}

export interface MineradoraLatam extends Record<string, unknown> {
  empresa: string;
  totalInstalacoes: number;
  paises: string[];
  minerais: string[];
  instalacoes: ReferenciaInstalacaoEmpresa[];
}

export interface CoberturaAmericaLatina {
  readonly dataMedicao: string;
  readonly totalInstalacoes: number;
  readonly totalMineradoras: number;
  readonly totalPaises: number;
  readonly paises: readonly string[];
  readonly principaisMinerais: readonly string[];
  readonly totalProjetosLitio: number;
  readonly totalMegaminasCobre: number;
  readonly totalPortosExportadores: number;
  readonly totalSedesCorporativas: number;
}

/**
 * Agregados estáticos e auditados em 30/09/2026.
 * Usados diretamente nos cartões de topo da página SSR para garantir conformidade
 * com a política de não serializar coleções inteiras em server components (AGENTS.md §5.1 e §8).
 */
export const COBERTURA_AMERICA_LATINA: CoberturaAmericaLatina = {
  dataMedicao: "2026-09-30",
  totalInstalacoes: 51,
  totalMineradoras: 45,
  totalPaises: 9,
  paises: [
    "Brasil",
    "Chile",
    "Peru",
    "Argentina",
    "México",
    "Colômbia",
    "Bolívia",
    "Equador",
    "Panamá",
  ],
  principaisMinerais: [
    "Cobre",
    "Lítio",
    "Minério de Ferro",
    "Ouro",
    "Prata",
    "Carvão Térmico",
    "Níquel",
    "Nióbio",
  ],
  totalProjetosLitio: 7,
  totalMegaminasCobre: 18,
  totalPortosExportadores: 5,
  totalSedesCorporativas: 5,
};

let cacheInstalacoes: InstalacaoMineradoraLatam[] | null = null;
let cacheMineradoras: MineradoraLatam[] | null = null;

/**
 * Retorna o acervo completo descompactado de instalações e sedes corporativas na América Latina.
 */
export function obterInstalacoesAmericaLatina(): InstalacaoMineradoraLatam[] {
  if (!cacheInstalacoes) {
    cacheInstalacoes = expandir<InstalacaoMineradoraLatam>(
      jsonInstalacoes as unknown as TabelaCompacta
    );
  }
  return cacheInstalacoes;
}

/**
 * Retorna a lista de empresas mineradoras consolidadas e suas instalações mapeadas.
 */
export function obterMineradorasAmericaLatina(): MineradoraLatam[] {
  if (!cacheMineradoras) {
    cacheMineradoras = expandir<MineradoraLatam>(
      jsonMineradoras as unknown as TabelaCompacta
    );
  }
  return cacheMineradoras;
}

/**
 * Busca uma instalação pelo ID único para abertura na ficha do globo 3D ou painel.
 */
export function obterInstalacaoPorId(id: string): InstalacaoMineradoraLatam | undefined {
  return obterInstalacoesAmericaLatina().find((item) => item.id === id);
}

export interface FiltrosInstalacoesLatam {
  pais?: string;
  tipo?: TipoInstalacaoLatam | "todos";
  mineral?: string;
  termoBusca?: string;
}

/**
 * Filtra as instalações da América Latina por facetas e busca textual tolerante a acentos.
 */
export function filtrarInstalacoesLatam(
  instalacoes: InstalacaoMineradoraLatam[],
  filtros: FiltrosInstalacoesLatam
): InstalacaoMineradoraLatam[] {
  let resultado = instalacoes;

  if (filtros.pais && filtros.pais !== "todos") {
    resultado = resultado.filter((item) => item.pais === filtros.pais);
  }

  if (filtros.tipo && filtros.tipo !== "todos") {
    resultado = resultado.filter((item) => item.tipo === filtros.tipo);
  }

  if (filtros.mineral && filtros.mineral !== "todos") {
    const min = filtros.mineral.toLowerCase();
    resultado = resultado.filter((item) =>
      item.mineralPrincipal.toLowerCase().includes(min)
    );
  }

  if (filtros.termoBusca && filtros.termoBusca.trim() !== "") {
    const termo = filtros.termoBusca
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    resultado = resultado.filter((item) => {
      const nomeNorm = item.nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const empNorm = item.empresa
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const baciaNorm = item.baciaOuRegiao
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const descNorm = item.descricao
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      return (
        nomeNorm.includes(termo) ||
        empNorm.includes(termo) ||
        baciaNorm.includes(termo) ||
        descNorm.includes(termo)
      );
    });
  }

  return resultado;
}
