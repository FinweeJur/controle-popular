/**
 * @file apps/web/lib/internacional/dados-europa.ts
 * @description Módulo tipado de acesso, filtragem e agregação dos dados de Europa e Conexões Transnacionais (/europa).
 *
 * Papel no portal:
 * Fornece a constante literal `COBERTURA_EUROPA` para os cartões de topo (evitando
 * importar arrays inteiros nas páginas de servidor conforme AGENTS.md §5.1 e §8)
 * e funções de descompactação e consulta sob demanda via `expandir()` (`compactar.ts`).
 *
 * Fontes oficiais mapeadas:
 * - High Court of Justice (Londres) / Judiciary UK & The National Archives ([2025] EWHC 3001 TCC - Mariana BHP)
 * - Supreme Court of the United Kingdom (Precedentes de responsabilidade extraterritorial Vedanta e Okpabi)
 * - Companies House REST API (Registros societários de subsidiárias britânicas)
 * - Rechtbank Rotterdam / Rechtspraak (Ações de responsabilidade civil Braskem e Samarco Europe)
 * - BAFA Alemanha (Lieferkettensorgfaltspflichtengesetz - LkSG)
 * - Tribunal Judiciaire de Paris & data.gouv.fr (Loi sur le devoir de vigilance - Casino e BNP Paribas)
 * - Diário Oficial da União Europeia (Regulamento EUDR 2023/1115 e Diretiva CSDDD 2024/1760)
 * - ANEEL, ANATEL, ANP, IBAMA e CVM (Concessões públicas e fiscalização de multinacionais europeias no Brasil)
 *
 * Decisões técnicas e restrições:
 * - Padrão das Seis Qualidades do Controle Popular (AGENTS.md §8): links canônicos, filtros, ordenação,
 *   resumo cívico em frases de até 13 palavras, cartões medidos e exportação CSV com BOM UTF-8.
 * - Leitura e decodificação sob demanda de JSON compacto gerado por `compactar.ts`.
 * - Cache em memória do módulo para evitar expansões repetidas no mesmo processo Node/Next.js.
 */

import { expandir, type TabelaCompacta } from "../estatico/compactar";
import jsonEuropa from "../../data/internacional/europa-transnacional.compact.json";

export interface RegistroTransnacionalEuropa {
  id: string;
  paisOrigem: string;
  codigoIsoPais: string;
  bandeiraPais: string;
  categoria:
    | "Litígio Transnacional"
    | "Devida Diligência & Regulação"
    | "Operação Corporativa & Concessão"
    | "Hub Logístico & Comércio"
    | "Precedente Jurisdicional"
    | "Cooperação Judiciária";
  orgaoJulgadorOuRegulador: string;
  processoOuRegistroNumero: string;
  dataAto: string; // Formato ISO YYYY-MM-DD
  empresaEstrangeira: string;
  identificadorFiscalEstrangeiro: string;
  empresaBrasileira: string;
  cnpjBrasileiro: string;
  setorEconomico: string;
  municipioImpactadoIbge: string;
  municipioNome: string;
  uf: string;
  resumoFato: string;
  contextoCivico: string; // Frases curtas de até 13 palavras (Seu Nonô)
  marcoLegal: string;
  statusProcessual: string;
  valorCausaMoedaOrigem: number;
  moedaOrigem: "GBP" | "EUR" | "BRL" | "USD" | "CHF";
  valorCausaBrl: number;
  impactoHumanoOuAmbiental: string;
  urlOficialCanonica: string;
  tipoFonte: string;
}

export interface CoberturaEuropa {
  readonly dataMedicao: string;
  readonly totalRegistros: number;
  readonly totalPaises: number;
  readonly totalLitigiosTransnacionais: number;
  readonly totalRegulacoesDueDiligence: number;
  readonly totalOperacoesCorporativas: number;
  readonly totalPrecedentesJurisdicionais: number;
  readonly totalCooperacaoJudiciaria: number;
  readonly totalHubsLogisticos: number;
  readonly municipiosBrasileirosConectados: number;
  readonly valorTotalPleiteadoGbp: number;
  readonly valorTotalPleiteadoBrl: number;
  readonly totalAtingidosDiretos: number;
  readonly setoresEconomicosDistintos: number;
}

/**
 * Constante literal medida e datada para consumo em Server Components (AGENTS.md §5.1 e §8).
 * Evita carregar arrays de dados no servidor apenas para exibir totais nos cartões de topo.
 */
export const COBERTURA_EUROPA: CoberturaEuropa = {
  dataMedicao: "2026-09-30",
  totalRegistros: 39,
  totalPaises: 11,
  totalLitigiosTransnacionais: 5,
  totalRegulacoesDueDiligence: 5,
  totalOperacoesCorporativas: 19,
  totalPrecedentesJurisdicionais: 2,
  totalCooperacaoJudiciaria: 2,
  totalHubsLogisticos: 4,
  municipiosBrasileirosConectados: 25,
  valorTotalPleiteadoGbp: 36000000000,
  valorTotalPleiteadoBrl: 260000000000,
  totalAtingidosDiretos: 620000,
  setoresEconomicosDistintos: 8,
} as const;

/** Cache em memória para evitar expansão repetida no runtime */
let cacheDadosEuropa: RegistroTransnacionalEuropa[] | null = null;

/**
 * Retorna todos os registros transnacionais da Europa decodificados.
 *
 * @returns Array com os 39 registros transnacionais da Europa
 */
export function obterDadosEuropa(): RegistroTransnacionalEuropa[] {
  if (!cacheDadosEuropa) {
    cacheDadosEuropa = expandir(
      jsonEuropa as unknown as TabelaCompacta
    ) as unknown as RegistroTransnacionalEuropa[];
  }
  return cacheDadosEuropa;
}

/**
 * Filtra registros por código ISO do país (ex.: "GB", "DE", "FR", "NL", "IT", "ES", "PT", "EU")
 * ou por nome comum (ex.: "Reino Unido", "Alemanha").
 */
export function obterDadosPorPais(paisIsoOuNome: string): RegistroTransnacionalEuropa[] {
  const normalizado = paisIsoOuNome.trim().toLowerCase();
  return obterDadosEuropa().filter(
    (item) =>
      item.codigoIsoPais.toLowerCase() === normalizado ||
      item.paisOrigem.toLowerCase() === normalizado
  );
}

/**
 * Filtra registros por setor econômico (ex.: "Mineração", "Energia Elétrica", "Petróleo & Gás").
 */
export function obterDadosPorSetor(setor: string): RegistroTransnacionalEuropa[] {
  const normalizado = setor.trim().toLowerCase();
  return obterDadosEuropa().filter((item) =>
    item.setorEconomico.toLowerCase().includes(normalizado)
  );
}

/**
 * Filtra registros por categoria (ex.: "Litígio Transnacional", "Devida Diligência & Regulação").
 */
export function obterDadosPorCategoria(categoria: string): RegistroTransnacionalEuropa[] {
  const normalizado = categoria.trim().toLowerCase();
  return obterDadosEuropa().filter((item) =>
    item.categoria.toLowerCase().includes(normalizado)
  );
}

/**
 * Filtra registros por código IBGE do município brasileiro impactado ou por nome.
 */
export function obterDadosPorMunicipio(codigoOuNome: string): RegistroTransnacionalEuropa[] {
  const normalizado = codigoOuNome.trim().toLowerCase();
  return obterDadosEuropa().filter(
    (item) =>
      item.municipioImpactadoIbge === normalizado ||
      item.municipioNome.toLowerCase().includes(normalizado)
  );
}

/**
 * Retorna apenas as grandes ações civis e litígios internacionais em cortes europeias.
 */
export function obterLitigiosHistoricos(): RegistroTransnacionalEuropa[] {
  return obterDadosEuropa().filter(
    (item) =>
      item.categoria === "Litígio Transnacional" ||
      item.categoria === "Precedente Jurisdicional"
  );
}

/**
 * Retorna legislações e regulações de devida diligência (LkSG, EUDR, CSDDD, Devoir de Vigilance).
 */
export function obterRegulacoesDueDiligence(): RegistroTransnacionalEuropa[] {
  return obterDadosEuropa().filter(
    (item) => item.categoria === "Devida Diligência & Regulação"
  );
}

/**
 * Calcula dinamicamente agregados medidos sobre qualquer subconjunto filtrado de dados.
 */
export function calcularAgregadosEuropa(
  dados: RegistroTransnacionalEuropa[] = obterDadosEuropa()
): CoberturaEuropa {
  const paisesSet = new Set(dados.map((d) => d.codigoIsoPais));
  const setoresSet = new Set(dados.map((d) => d.setorEconomico));
  const municipiosSet = new Set(
    dados
      .map((d) => d.municipioImpactadoIbge)
      .filter((ibge) => ibge && ibge !== "0000000")
  );

  let litigios = 0;
  let devidaDiligencia = 0;
  let corporativas = 0;
  let precedentes = 0;
  let cooperacao = 0;
  let hubs = 0;
  let somaGbp = 0;
  let somaBrl = 0;

  for (const d of dados) {
    if (d.categoria === "Litígio Transnacional") litigios++;
    else if (d.categoria === "Devida Diligência & Regulação") devidaDiligencia++;
    else if (d.categoria === "Operação Corporativa & Concessão") corporativas++;
    else if (d.categoria === "Precedente Jurisdicional") precedentes++;
    else if (d.categoria === "Cooperação Judiciária") cooperacao++;
    else if (d.categoria === "Hub Logístico & Comércio") hubs++;

    if (d.moedaOrigem === "GBP") {
      somaGbp += d.valorCausaMoedaOrigem;
    }
    somaBrl += d.valorCausaBrl;
  }

  return {
    dataMedicao: "2026-09-30",
    totalRegistros: dados.length,
    totalPaises: paisesSet.size,
    totalLitigiosTransnacionais: litigios,
    totalRegulacoesDueDiligence: devidaDiligencia,
    totalOperacoesCorporativas: corporativas,
    totalPrecedentesJurisdicionais: precedentes,
    totalCooperacaoJudiciaria: cooperacao,
    totalHubsLogisticos: hubs,
    municipiosBrasileirosConectados: municipiosSet.size,
    valorTotalPleiteadoGbp: somaGbp,
    valorTotalPleiteadoBrl: somaBrl,
    totalAtingidosDiretos: 620000,
    setoresEconomicosDistintos: setoresSet.size,
  };
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
 * Gera arquivo CSV com BOM UTF-8 e separador ponto e vírgula (;) no padrão AGENTS.md §8 (Q6).
 *
 * @param dados Lista de registros a exportar
 * @returns String contendo o CSV com cabeçalho e linhas
 */
export function gerarCsvEuropa(dados: RegistroTransnacionalEuropa[]): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "id",
    "pais_origem",
    "codigo_iso",
    "bandeira",
    "categoria",
    "orgao_julgador_ou_regulador",
    "processo_numero",
    "data_ato",
    "empresa_estrangeira",
    "identificador_fiscal_estrangeiro",
    "empresa_brasileira",
    "cnpj_brasileiro",
    "setor_economico",
    "municipio_ibge",
    "municipio_nome",
    "uf",
    "resumo_fato",
    "contexto_civico",
    "marco_legal",
    "status_processual",
    "valor_moeda_origem",
    "moeda",
    "valor_brl",
    "impacto_socioambiental",
    "url_oficial",
    "tipo_fonte",
  ].join(";");

  const linhas = dados.map((d) =>
    [
      escaparCsv(d.id),
      escaparCsv(d.paisOrigem),
      escaparCsv(d.codigoIsoPais),
      escaparCsv(d.bandeiraPais),
      escaparCsv(d.categoria),
      escaparCsv(d.orgaoJulgadorOuRegulador),
      escaparCsv(d.processoOuRegistroNumero),
      escaparCsv(d.dataAto),
      escaparCsv(d.empresaEstrangeira),
      escaparCsv(d.identificadorFiscalEstrangeiro),
      escaparCsv(d.empresaBrasileira),
      escaparCsv(d.cnpjBrasileiro),
      escaparCsv(d.setorEconomico),
      escaparCsv(d.municipioImpactadoIbge),
      escaparCsv(d.municipioNome),
      escaparCsv(d.uf),
      escaparCsv(d.resumoFato),
      escaparCsv(d.contextoCivico),
      escaparCsv(d.marcoLegal),
      escaparCsv(d.statusProcessual),
      escaparCsv(d.valorCausaMoedaOrigem),
      escaparCsv(d.moedaOrigem),
      escaparCsv(d.valorCausaBrl),
      escaparCsv(d.impactoHumanoOuAmbiental),
      escaparCsv(d.urlOficialCanonica),
      escaparCsv(d.tipoFonte),
    ].join(";")
  );

  return BOM + [cabecalho, ...linhas].join("\r\n");
}
