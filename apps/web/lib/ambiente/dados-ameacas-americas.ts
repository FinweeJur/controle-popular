/**
 * @file apps/web/lib/ambiente/dados-ameacas-americas.ts
 * @description Módulo de consulta, filtragem, agregação e exportação do acervo de Ameaças Ambientais nas Américas.
 *
 * Papel no portal:
 * Centraliza os dados estruturados de Espécies Ameaçadas, Rios Sob Pressão Crítica,
 * Serras Vulnerabilizadas e Territórios de Comunidades Tradicionais (Indígenas,
 * Quilombolas e Ribeirinhos) em todo o continente americano. Alimenta o painel cívico
 * `/ambiental/ameacas-americas`, o assistente cívico (Seu Nonô / Alceu Dispor) e
 * o Observatório Nacional Socioambiental (ONSA).
 *
 * Fontes oficiais:
 * - ICMBio (Portaria MMA 148/2022 / Livro Vermelho da Fauna Brasileira Ameaçada de Extinção)
 * - IUCN Red List of Threatened Species (2024.2 / Global Species Programme)
 * - ANA (Agência Nacional de Águas e Saneamento Básico — Conjuntura dos Recursos Hídricos)
 * - IGAM (Instituto Mineiro de Gestão das Águas — Monitoramento de Qualidade das Águas de MG)
 * - FUNAI (Fundação Nacional dos Povos Indígenas — Geoprocessamento e Dados Abertos)
 * - Fundação Cultural Palmares & INCRA (Comunidades Remanescentes de Quilombos)
 * - US EPA, USGS & US Fish and Wildlife Service (USFWS)
 * - Environment and Climate Change Canada (ECCC) & Fisheries and Oceans Canada (DFO)
 * - SEMARNAT & CONANP (México), OEFA & Defensoría del Pueblo (Peru), INDH (Chile)
 *
 * Decisões técnicas e restrições:
 * - Padrão das Seis Qualidades do Controle Popular (AGENTS.md §8): links diretos canônicos,
 *   busca tolerante, filtros multifacetados, ordenação por coluna, resumo objetivo e exportação CSV com BOM UTF-8.
 * - Leitura sob demanda do JSON compactado (`apps/web/data/ambiente/ameacas-americas.compact.json`)
 *   via `expandir()` com cache local em memória para evitar releitura e overhead no runtime.
 * - Constante estática `COBERTURA_AMEACAS_AMERICAS` medida e datada para consumo leve em Server Components (AGENTS.md §5.1).
 * - Sem dados pessoais (Zero CPF Mod-11, zero documentos civis).
 */

import { expandir, type TabelaCompacta } from "../estatico/compactar";
import jsonAmeacas from "../../data/ambiente/ameacas-americas.compact.json";
import { semAcento } from "../busca/normalizar";

export type CategoriaAmeaca = "especie" | "rio" | "serra" | "comunidade";
export type GrauRisco = "Crítico" | "Alto" | "Moderado";

export interface RegistroAmeacaAmericas extends Record<string, unknown> {
  id: string;
  categoria: CategoriaAmeaca;
  nome: string;
  subtitulo: string;
  pais: string;
  regiao: string;
  bioma: string;
  statusConservacao: string;
  grauRisco: GrauRisco;
  vetoresPressao: string;
  extensaoOuPopulacao: string;
  anoReferencia: number;
  orgaoResponsavel: string;
  fonteOficial: string;
  urlFonte: string;
  descricaoImpacto: string;
}

export interface FiltrosAmeacas {
  busca?: string;
  categoria?: CategoriaAmeaca | "todas";
  grauRisco?: GrauRisco | "todos";
  pais?: string;
  bioma?: string;
}

export interface EstatisticasAmeacas {
  totalRegistros: number;
  totalEspecies: number;
  totalRios: number;
  totalSerras: number;
  totalComunidades: number;
  totalPaises: number;
  contagemPorRisco: Record<GrauRisco, number>;
  contagemPorPais: Record<string, number>;
}

export interface CoberturaAmeacasAmericas {
  readonly dataMedicao: string;
  readonly totalAmeacas: number;
  readonly totalEspecies: number;
  readonly totalRios: number;
  readonly totalSerras: number;
  readonly totalComunidades: number;
  readonly totalPaises: number;
  readonly contagemPorCategoria: {
    readonly especie: number;
    readonly rio: number;
    readonly serra: number;
    readonly comunidade: number;
  };
  readonly paises: readonly string[];
  readonly categorias: readonly CategoriaAmeaca[];
  readonly fontesOficiais: readonly string[];
}

/**
 * Agregados estáticos auditados em 01/10/2026.
 * Usados diretamente nos cartões de topo da página SSR para garantir conformidade
 * com a regra AGENTS.md §5.1 (payload leve sem trânsito de array bruto pelo servidor).
 */
export const COBERTURA_AMEACAS_AMERICAS: CoberturaAmeacasAmericas = {
  dataMedicao: "2026-10-01",
  totalAmeacas: 90,
  totalEspecies: 32,
  totalRios: 16,
  totalSerras: 16,
  totalComunidades: 26,
  totalPaises: 11,
  contagemPorCategoria: {
    especie: 32,
    rio: 16,
    serra: 16,
    comunidade: 26,
  },
  paises: [
    "Argentina",
    "Bolívia",
    "Brasil",
    "Canadá",
    "Chile",
    "Colômbia",
    "Equador",
    "Estados Unidos",
    "México",
    "Panamá",
    "Peru",
  ],
  categorias: ["especie", "rio", "serra", "comunidade"],
  fontesOficiais: [
    "ICMBio (Portaria MMA 148/2022 / Livro Vermelho da Fauna)",
    "IUCN Red List of Threatened Species 2024.2",
    "ANA (Agência Nacional de Águas e Saneamento Básico)",
    "IGAM (Instituto Mineiro de Gestão das Águas)",
    "FUNAI (Fundação Nacional dos Povos Indígenas)",
    "Fundação Cultural Palmares & INCRA",
    "US EPA, USGS & US Fish and Wildlife Service (USFWS)",
    "Environment and Climate Change Canada (ECCC) & DFO",
    "SEMARNAT & CONANP (México)",
    "OEFA & Defensoría del Pueblo (Peru)",
    "INDH (Chile)",
  ],
} as const;

export const CATEGORIA_LABEL: Record<CategoriaAmeaca, string> = {
  especie: "Espécie Ameaçada",
  rio: "Rio & Bacia Hidrográfica",
  serra: "Serra & Cordilheira",
  comunidade: "Comunidade Tradicional",
};

export const CATEGORIA_ICONE: Record<CategoriaAmeaca, string> = {
  especie: "🐾",
  rio: "🌊",
  serra: "⛰️",
  comunidade: "🏹",
};

export const GRAU_RISCO_COR: Record<GrauRisco, string> = {
  Crítico: "var(--color-danger, #e11d48)",
  Alto: "var(--color-warning, #d97706)",
  Moderado: "var(--color-info, #0284c7)",
};

let cacheAmeacas: RegistroAmeacaAmericas[] | null = null;

/**
 * Retorna todos os registros de ameaças ambientais nas Américas.
 * Utiliza cache em memória após a primeira descompactação.
 *
 * @returns Lista completa de registros decodificados.
 */
export function obterTodasAmeacas(): RegistroAmeacaAmericas[] {
  if (!cacheAmeacas) {
    cacheAmeacas = expandir(
      jsonAmeacas as unknown as TabelaCompacta
    ) as unknown as RegistroAmeacaAmericas[];
  }
  return cacheAmeacas;
}

/**
 * Retorna os registros filtrados por uma categoria específica.
 *
 * @param categoria Categoria desejada ("especie", "rio", "serra", "comunidade")
 * @returns Lista de registros da categoria solicitada.
 */
export function obterAmeacasPorCategoria(categoria: CategoriaAmeaca): RegistroAmeacaAmericas[] {
  return obterTodasAmeacas().filter((item) => item.categoria === categoria);
}

/**
 * Retorna as espécies ameaçadas catalogadas (fauna silvestre das Américas).
 */
export function obterEspeciesAmeacadas(): RegistroAmeacaAmericas[] {
  return obterAmeacasPorCategoria("especie");
}

/**
 * Retorna os rios e bacias hidrográficas ameaçadas catalogadas.
 */
export function obterRiosAmeacados(): RegistroAmeacaAmericas[] {
  return obterAmeacasPorCategoria("rio");
}

/**
 * Retorna as serras e cordilheiras ameaçadas catalogadas.
 */
export function obterSerrasAmeacadas(): RegistroAmeacaAmericas[] {
  return obterAmeacasPorCategoria("serra");
}

/**
 * Retorna as comunidades tradicionais vulnerabilizadas catalogadas.
 */
export function obterComunidadesTradicionais(): RegistroAmeacaAmericas[] {
  return obterAmeacasPorCategoria("comunidade");
}

/**
 * Retorna uma ameaça específica pelo identificador único.
 *
 * @param id Identificador do registro (ex.: "esp-onca-pintada")
 * @returns Registro correspondente ou undefined.
 */
export function obterAmeacaPorId(id: string): RegistroAmeacaAmericas | undefined {
  return obterTodasAmeacas().find((item) => item.id === id);
}

/**
 * Retorna os registros filtrados por grau de risco ("Crítico", "Alto", "Moderado").
 */
export function obterAmeacasPorGrauRisco(grau: GrauRisco): RegistroAmeacaAmericas[] {
  return obterTodasAmeacas().filter((item) => item.grauRisco === grau);
}

/**
 * Retorna os registros filtrados por país.
 */
export function obterAmeacasPorPais(pais: string): RegistroAmeacaAmericas[] {
  const paisNorm = semAcento(pais.trim());
  return obterTodasAmeacas().filter((item) => semAcento(item.pais).includes(paisNorm));
}

/**
 * Aplica múltiplos filtros em tempo real de forma combinada.
 * Busca textual tolerante a acentos e maiúsculas/minúsculas.
 *
 * @param filtros Critérios de filtragem
 * @param base Conjunto inicial opcional de registros
 * @returns Lista filtrada de ameaças
 */
export function filtrarAmeacas(
  filtros: FiltrosAmeacas,
  base?: RegistroAmeacaAmericas[]
): RegistroAmeacaAmericas[] {
  const lista = base ?? obterTodasAmeacas();
  const buscaTermo = filtros.busca ? semAcento(filtros.busca.trim()) : "";

  return lista.filter((item) => {
    // Filtro por Categoria
    if (filtros.categoria && filtros.categoria !== "todas" && item.categoria !== filtros.categoria) {
      return false;
    }

    // Filtro por Grau de Risco
    if (filtros.grauRisco && filtros.grauRisco !== "todos" && item.grauRisco !== filtros.grauRisco) {
      return false;
    }

    // Filtro por País
    if (filtros.pais && filtros.pais !== "todos") {
      if (item.pais !== filtros.pais && !item.pais.includes(filtros.pais)) {
        return false;
      }
    }

    // Filtro por Bioma
    if (filtros.bioma && filtros.bioma !== "todos") {
      if (!semAcento(item.bioma).includes(semAcento(filtros.bioma))) {
        return false;
      }
    }

    // Busca textual multirrelevante
    if (buscaTermo) {
      const corpus = semAcento(
        `${item.nome} ${item.subtitulo} ${item.pais} ${item.regiao} ${item.bioma} ${item.vetoresPressao} ${item.orgaoResponsavel} ${item.statusConservacao} ${item.descricaoImpacto}`
      );
      if (!corpus.includes(buscaTermo)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calcula os agregados quantitativos de uma lista de ameaças.
 *
 * @param registros Lista de registros ou acervo completo
 * @returns Estatísticas consolidadas
 */
export function calcularEstatisticasAmeacas(
  registros?: RegistroAmeacaAmericas[]
): EstatisticasAmeacas {
  const dados = registros ?? obterTodasAmeacas();

  const contagemPorRisco: Record<GrauRisco, number> = {
    Crítico: 0,
    Alto: 0,
    Moderado: 0,
  };

  const contagemPorPais: Record<string, number> = {};
  const conjuntoPaises = new Set<string>();

  let totalEspecies = 0;
  let totalRios = 0;
  let totalSerras = 0;
  let totalComunidades = 0;

  for (const item of dados) {
    if (item.categoria === "especie") totalEspecies++;
    if (item.categoria === "rio") totalRios++;
    if (item.categoria === "serra") totalSerras++;
    if (item.categoria === "comunidade") totalComunidades++;

    if (item.grauRisco in contagemPorRisco) {
      contagemPorRisco[item.grauRisco]++;
    }

    conjuntoPaises.add(item.pais);
    contagemPorPais[item.pais] = (contagemPorPais[item.pais] || 0) + 1;
  }

  return {
    totalRegistros: dados.length,
    totalEspecies,
    totalRios,
    totalSerras,
    totalComunidades,
    totalPaises: conjuntoPaises.size,
    contagemPorRisco,
    contagemPorPais,
  };
}

/**
 * Escapa uma célula individual para o padrão CSV brasileiro.
 */
function escaparCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor).replace(/\r?\n/g, " ");
  if (/[";]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

/**
 * Exporta a lista filtrada de ameaças para CSV com BOM UTF-8 e separador `;`
 * em estrita conformidade com a Regra das Seis Qualidades (AGENTS.md §8).
 *
 * @param registros Lista de ameaças visíveis/filtradas na tela
 * @returns String formatada pronta para download
 */
export function gerarCsvAmeacas(registros: RegistroAmeacaAmericas[]): string {
  const BOM = "\uFEFF";
  const colunas = [
    "Categoria",
    "Nome",
    "Subtítulo / Nome Científico / Bacia",
    "País",
    "Região / Estado",
    "Bioma",
    "Grau de Risco",
    "Status de Conservação",
    "Vetores de Pressão",
    "Extensão ou População",
    "Ano Referência",
    "Órgão Responsável",
    "Fonte Oficial",
    "Link Oficial",
    "Resumo do Impacto",
  ];

  const cabecalho = colunas.join(";");
  const linhas = registros.map((r) =>
    [
      CATEGORIA_LABEL[r.categoria],
      r.nome,
      r.subtitulo,
      r.pais,
      r.regiao,
      r.bioma,
      r.grauRisco,
      r.statusConservacao,
      r.vetoresPressao,
      r.extensaoOuPopulacao,
      r.anoReferencia,
      r.orgaoResponsavel,
      r.fonteOficial,
      r.urlFonte,
      r.descricaoImpacto,
    ]
      .map(escaparCsv)
      .join(";")
  );

  return BOM + [cabecalho, ...linhas].join("\r\n") + "\r\n";
}
