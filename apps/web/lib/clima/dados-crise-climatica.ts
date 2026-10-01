/**
 * @file apps/web/lib/clima/dados-crise-climatica.ts
 * @description Módulo de consulta, decodificação de tabelas compactadas, filtros facetados,
 * cálculo de proporções de emissão, equivalências veiculares e exportação CSV do Acervo Global da Crise Climática.
 *
 * Papel no portal:
 * Alimenta a rota pública /ambiental/crise-climatica no portal Controle Popular, fornecendo
 * inteligência cívica sobre:
 * 1. Emissões territoriais de gases de efeito estufa dos países do G20 (Climate TRACE e IPCC AR6);
 * 2. As maiores instalações e operações industriais pontuais poluidoras do planeta (Climate TRACE e GEM);
 * 3. Anomalias históricas de temperatura, secas severas e eventos meteorológicos extremos (Copernicus ECMWF e WMO);
 * 4. Metas das NDCs (Acordo de Paris) e intensidade de carbono por setor produtivo (UNFCCC e IEA).
 *
 * Fontes oficiais:
 * - Climate TRACE (Inventário global independente com monitoramento satelital e IA): https://climatetrace.org/
 * - IPCC AR6 WG3 (Painel Intergovernamental sobre Mudanças Climáticas - Mitigação): https://www.ipcc.ch/report/ar6/wg3/
 * - Copernicus Climate Change Service / ECMWF (Reanálise ERA5): https://climate.copernicus.eu/
 * - WMO / OMM (Organização Meteorológica Mundial - State of the Global Climate): https://wmo.int/
 * - UNFCCC NDC Registry (Contribuições Nacionalmente Determinadas): https://unfccc.int/NDCREG
 * - Global Energy Monitor / GEM (Global Coal, Gas & Steel Trackers): https://globalenergymonitor.org/
 * - SEEG / Observatório do Clima (Emissões e Remoções de GEE no Brasil): https://seeg.eco.br/
 *
 * Decisões técnicas e restrições:
 * - Leitura e decodificação em memória do arquivo JSON compacto via lib/estatico/compactar.ts.
 * - Cobertura agregada COBERTURA_CRISE_CLIMATICA pré-calculada para importação leve por Server Components (Regra §8 AGENTS.md).
 * - Equivalência veicular baseada na metodologia EPA (1 veículo de passeio médio a gasolina emite ~4,6 toneladas de CO₂e/ano).
 * - Exportação de planilhas em formato CSV com BOM UTF-8 (\uFEFF) e separador ponto-e-vírgula (;) para perfeita compatibilidade com o Excel brasileiro.
 */

import { expandir, type TabelaCompacta } from "../estatico/compactar";
import jsonCrise from "../../data/clima/crise-climatica-global.compact.json";

export interface PaisEmissaoG20 extends Record<string, unknown> {
  id: string;
  pais: string;
  codigoIso3: string;
  bandeira: string;
  continente: string;
  emissoesTotaisMtCo2e: number;
  emissoesPerCapitaTCo2e: number;
  participacaoGlobalPct: number;
  setorLiderEmissao: string;
  pctSetorLider: number;
  variacaoDecenalPct: number;
  metaNdc2030: string;
  anoNetZero: number;
  classificacaoCat: string;
  fonteOficial: string;
  urlFonteOficial: string;
  observacaoCivica: string;
}

export interface InstalacaoPoluidoraGlobal extends Record<string, unknown> {
  id: string;
  nomeInstalacao: string;
  operadorControlador: string;
  pais: string;
  codigoIso3: string;
  cidadeEstado: string;
  tipoAtividade: string;
  emissoesAnuaisMtCo2e: number;
  anoReferencia: number;
  combustivelPrincipal: string;
  capacidadeInstalada: string;
  equivalenciaCarrosPasseioMilhoes: number;
  latitude: number;
  longitude: number;
  fonteOficial: string;
  urlFonteOficial: string;
  contextoImpacto: string;
}

export interface AnomaliaEventoExtremo extends Record<string, unknown> {
  id: string;
  tituloEvento: string;
  categoria: string;
  regiaoAfetada: string;
  paisesAbrangidos: string;
  anoInicio: number;
  anoFim: number;
  anomaliaOuMagnitude: string;
  populacaoOuAreaImpactada: string;
  danosEconomicosUsdBilhoes: number;
  orgaoMonitoramento: string;
  urlBoletimOficial: string;
  sumarioCientifico: string;
}

export interface NdcSetorGlobal extends Record<string, unknown> {
  id: string;
  setorEconomico: string;
  subsetor: string;
  intensidadeCarbonoUnidade: string;
  valorIntensidadeFossil: number;
  valorIntensidadeLimpa: number;
  potencialReducaoPct: number;
  emissaoGlobalAnualGtCo2e: number;
  participacaoEmissoesGlobaisPct: number;
  metaDescarbonizacao2030: string;
  metaNetZero2050: string;
  tecnologiaChaveTransicao: string;
  fonteOficial: string;
  urlFonteOficial: string;
  desafioTransição: string;
}

// Caches de memória para descompactação preguiçosa (lazy)
let cachePaises: PaisEmissaoG20[] | null = null;
let cacheInstalacoes: InstalacaoPoluidoraGlobal[] | null = null;
let cacheAnomalias: AnomaliaEventoExtremo[] | null = null;
let cacheNdcs: NdcSetorGlobal[] | null = null;

/**
 * Retorna as emissões de gases de efeito estufa dos 20 países/blocos do G20.
 */
export function obterEmissoesG20(): PaisEmissaoG20[] {
  if (!cachePaises) {
    cachePaises = expandir(
      jsonCrise.paisesG20 as unknown as TabelaCompacta
    ) as unknown as PaisEmissaoG20[];
  }
  return cachePaises;
}

/**
 * Retorna o acervo das maiores instalações industriais poluidoras globais.
 */
export function obterInstalacoesPoluidoras(): InstalacaoPoluidoraGlobal[] {
  if (!cacheInstalacoes) {
    cacheInstalacoes = expandir(
      jsonCrise.instalacoesPoluidoras as unknown as TabelaCompacta
    ) as unknown as InstalacaoPoluidoraGlobal[];
  }
  return cacheInstalacoes;
}

/**
 * Retorna o catálogo de anomalias térmicas globais e eventos meteorológicos extremos.
 */
export function obterAnomaliasEventosExtremos(): AnomaliaEventoExtremo[] {
  if (!cacheAnomalias) {
    cacheAnomalias = expandir(
      jsonCrise.anomaliasExtremos as unknown as TabelaCompacta
    ) as unknown as AnomaliaEventoExtremo[];
  }
  return cacheAnomalias;
}

/**
 * Retorna as metas de NDCs e intensidades de carbono por setor econômico global.
 */
export function obterNdcsESetores(): NdcSetorGlobal[] {
  if (!cacheNdcs) {
    cacheNdcs = expandir(
      jsonCrise.ndcsSetores as unknown as TabelaCompacta
    ) as unknown as NdcSetorGlobal[];
  }
  return cacheNdcs;
}

/**
 * Normaliza strings para busca em texto livre tolerante a acentos e maiúsculas.
 */
function normalizar(texto: string): string {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export interface FiltroEmissoesG20 {
  busca?: string;
  continente?: string;
  classificacaoCat?: string;
}

/**
 * Filtra a lista de países do G20 por termos de busca, continente e ambição NDC.
 */
export function filtrarEmissoesG20(filtro: FiltroEmissoesG20 = {}): PaisEmissaoG20[] {
  const lista = obterEmissoesG20();
  const termo = filtro.busca ? normalizar(filtro.busca) : "";

  return lista.filter((p) => {
    if (filtro.continente && filtro.continente !== "todos" && p.continente !== filtro.continente) {
      return false;
    }
    if (
      filtro.classificacaoCat &&
      filtro.classificacaoCat !== "todos" &&
      p.classificacaoCat !== filtro.classificacaoCat
    ) {
      return false;
    }
    if (termo) {
      const matchPais = normalizar(p.pais).includes(termo);
      const matchIso = normalizar(p.codigoIso3).includes(termo);
      const matchSetor = normalizar(p.setorLiderEmissao).includes(termo);
      const matchObs = normalizar(p.observacaoCivica).includes(termo);
      if (!matchPais && !matchIso && !matchSetor && !matchObs) return false;
    }
    return true;
  });
}

export interface FiltroInstalacoes {
  busca?: string;
  tipoAtividade?: string;
  pais?: string;
}

/**
 * Filtra as instalações industriais poluidoras globais.
 */
export function filtrarInstalacoes(filtro: FiltroInstalacoes = {}): InstalacaoPoluidoraGlobal[] {
  const lista = obterInstalacoesPoluidoras();
  const termo = filtro.busca ? normalizar(filtro.busca) : "";

  return lista.filter((i) => {
    if (filtro.tipoAtividade && filtro.tipoAtividade !== "todos" && i.tipoAtividade !== filtro.tipoAtividade) {
      return false;
    }
    if (filtro.pais && filtro.pais !== "todos" && i.pais !== filtro.pais) {
      return false;
    }
    if (termo) {
      const matchNome = normalizar(i.nomeInstalacao).includes(termo);
      const matchOp = normalizar(i.operadorControlador).includes(termo);
      const matchPais = normalizar(i.pais).includes(termo);
      const matchCidade = normalizar(i.cidadeEstado).includes(termo);
      const matchComb = normalizar(i.combustivelPrincipal).includes(termo);
      if (!matchNome && !matchOp && !matchPais && !matchCidade && !matchComb) return false;
    }
    return true;
  });
}

export interface FiltroAnomalias {
  busca?: string;
  categoria?: string;
}

/**
 * Filtra anomalias térmicas e desastres climáticos.
 */
export function filtrarAnomalias(filtro: FiltroAnomalias = {}): AnomaliaEventoExtremo[] {
  const lista = obterAnomaliasEventosExtremos();
  const termo = filtro.busca ? normalizar(filtro.busca) : "";

  return lista.filter((a) => {
    if (filtro.categoria && filtro.categoria !== "todos" && a.categoria !== filtro.categoria) {
      return false;
    }
    if (termo) {
      const matchTit = normalizar(a.tituloEvento).includes(termo);
      const matchReg = normalizar(a.regiaoAfetada).includes(termo);
      const matchSum = normalizar(a.sumarioCientifico).includes(termo);
      const matchPaises = normalizar(a.paisesAbrangidos).includes(termo);
      if (!matchTit && !matchReg && !matchSum && !matchPaises) return false;
    }
    return true;
  });
}

export interface FiltroNdcs {
  busca?: string;
}

/**
 * Filtra metas setoriais e intensidades de carbono.
 */
export function filtrarNdcsSetores(filtro: FiltroNdcs = {}): NdcSetorGlobal[] {
  const lista = obterNdcsESetores();
  const termo = filtro.busca ? normalizar(filtro.busca) : "";

  if (!termo) return lista;

  return lista.filter((s) => {
    const matchSetor = normalizar(s.setorEconomico).includes(termo);
    const matchSub = normalizar(s.subsetor).includes(termo);
    const matchTec = normalizar(s.tecnologiaChaveTransicao).includes(termo);
    const matchDesafio = normalizar(s.desafioTransição).includes(termo);
    return matchSetor || matchSub || matchTec || matchDesafio;
  });
}

/**
 * Calcula a equivalência de emissões em milhões de veículos de passeio médios
 * (fator EPA: 4,6 toneladas de CO₂e por veículo/ano).
 */
export function calcularEquivalenciaCarrosPasseio(emissoesMtCo2e: number): number {
  if (!emissoesMtCo2e || emissoesMtCo2e <= 0) return 0;
  return Number(((emissoesMtCo2e * 1_000_000) / 4.6 / 1_000_000).toFixed(1));
}

// ══════════════════════════════════════════════════════════════════════════
// EXPORTAÇÕES CSV (BOM UTF-8 \uFEFF E SEPARADOR ;)
// ══════════════════════════════════════════════════════════════════════════

const sanitizarCsv = (v: unknown): string =>
  String(v ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/"/g, '""');

/**
 * Exporta os países do G20 em CSV compatível com o Excel brasileiro.
 */
export function exportarCsvEmissoesG20(registros: PaisEmissaoG20[]): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "País",
    "Código ISO-3",
    "Continente",
    "Emissões Totais (Mt CO₂e/ano)",
    "Emissões Per Capita (t CO₂e/hab)",
    "Participação Global (%)",
    "Setor Líder de Emissão",
    "% Setor Líder",
    "Variação Decenal (%)",
    "Meta NDC 2030",
    "Ano Net-Zero",
    "Classificação CAT",
    "Fonte Oficial",
    "URL Fonte Oficial",
  ].join(";");

  const linhas = registros.map((r) =>
    [
      `"${sanitizarCsv(r.pais)}"`,
      `"${sanitizarCsv(r.codigoIso3)}"`,
      `"${sanitizarCsv(r.continente)}"`,
      r.emissoesTotaisMtCo2e,
      r.emissoesPerCapitaTCo2e,
      r.participacaoGlobalPct,
      `"${sanitizarCsv(r.setorLiderEmissao)}"`,
      r.pctSetorLider,
      r.variacaoDecenalPct,
      `"${sanitizarCsv(r.metaNdc2030)}"`,
      r.anoNetZero,
      `"${sanitizarCsv(r.classificacaoCat)}"`,
      `"${sanitizarCsv(r.fonteOficial)}"`,
      `"${sanitizarCsv(r.urlFonteOficial)}"`,
    ].join(";")
  );

  return BOM + [cabecalho, ...linhas].join("\r\n");
}

/**
 * Exporta as mega-instalações poluidoras em CSV.
 */
export function exportarCsvInstalacoes(registros: InstalacaoPoluidoraGlobal[]): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "Instalação / Complexo",
    "Operador / Controlador",
    "País",
    "Localidade",
    "Tipo de Atividade",
    "Emissões Anuais (Mt CO₂e)",
    "Ano Referência",
    "Combustível Principal",
    "Capacidade Instalada",
    "Equivalência Veicular (Milhões de Carros)",
    "Latitude",
    "Longitude",
    "Fonte Oficial",
    "URL Fonte Oficial",
  ].join(";");

  const linhas = registros.map((r) =>
    [
      `"${sanitizarCsv(r.nomeInstalacao)}"`,
      `"${sanitizarCsv(r.operadorControlador)}"`,
      `"${sanitizarCsv(r.pais)}"`,
      `"${sanitizarCsv(r.cidadeEstado)}"`,
      `"${sanitizarCsv(r.tipoAtividade)}"`,
      r.emissoesAnuaisMtCo2e,
      r.anoReferencia,
      `"${sanitizarCsv(r.combustivelPrincipal)}"`,
      `"${sanitizarCsv(r.capacidadeInstalada)}"`,
      r.equivalenciaCarrosPasseioMilhoes,
      r.latitude,
      r.longitude,
      `"${sanitizarCsv(r.fonteOficial)}"`,
      `"${sanitizarCsv(r.urlFonteOficial)}"`,
    ].join(";")
  );

  return BOM + [cabecalho, ...linhas].join("\r\n");
}

/**
 * Exporta anomalias e eventos climáticos extremos em CSV.
 */
export function exportarCsvAnomalias(registros: AnomaliaEventoExtremo[]): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "Título do Evento",
    "Categoria",
    "Região Afetada",
    "Países Abrangidos",
    "Ano Início",
    "Ano Fim",
    "Anomalia / Magnitude",
    "População / Área Impactada",
    "Prejuízos Econômicos (Bilhões USD)",
    "Órgão de Monitoramento",
    "URL Boletim Oficial",
  ].join(";");

  const linhas = registros.map((r) =>
    [
      `"${sanitizarCsv(r.tituloEvento)}"`,
      `"${sanitizarCsv(r.categoria)}"`,
      `"${sanitizarCsv(r.regiaoAfetada)}"`,
      `"${sanitizarCsv(r.paisesAbrangidos)}"`,
      r.anoInicio,
      r.anoFim,
      `"${sanitizarCsv(r.anomaliaOuMagnitude)}"`,
      `"${sanitizarCsv(r.populacaoOuAreaImpactada)}"`,
      r.danosEconomicosUsdBilhoes,
      `"${sanitizarCsv(r.orgaoMonitoramento)}"`,
      `"${sanitizarCsv(r.urlBoletimOficial)}"`,
    ].join(";")
  );

  return BOM + [cabecalho, ...linhas].join("\r\n");
}

/**
 * Exporta metas setoriais e intensidades em CSV.
 */
export function exportarCsvNdcsSetores(registros: NdcSetorGlobal[]): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "Setor Econômico",
    "Subsetor",
    "Unidade de Intensidade",
    "Intensidade Fóssil Atual",
    "Intensidade Meta Limpa",
    "Potencial de Redução (%)",
    "Emissão Global Anual (Gt CO₂e)",
    "Participação Global (%)",
    "Meta Descarbonização 2030",
    "Meta Net-Zero 2050",
    "Tecnologia Chave",
    "Fonte Oficial",
    "URL Fonte Oficial",
  ].join(";");

  const linhas = registros.map((r) =>
    [
      `"${sanitizarCsv(r.setorEconomico)}"`,
      `"${sanitizarCsv(r.subsetor)}"`,
      `"${sanitizarCsv(r.intensidadeCarbonoUnidade)}"`,
      r.valorIntensidadeFossil,
      r.valorIntensidadeLimpa,
      r.potencialReducaoPct,
      r.emissaoGlobalAnualGtCo2e,
      r.participacaoEmissoesGlobaisPct,
      `"${sanitizarCsv(r.metaDescarbonizacao2030)}"`,
      `"${sanitizarCsv(r.metaNetZero2050)}"`,
      `"${sanitizarCsv(r.tecnologiaChaveTransicao)}"`,
      `"${sanitizarCsv(r.fonteOficial)}"`,
      `"${sanitizarCsv(r.urlFonteOficial)}"`,
    ].join(";")
  );

  return BOM + [cabecalho, ...linhas].join("\r\n");
}

// ══════════════════════════════════════════════════════════════════════════
// AGREGADOS CONSOLIDADOS PARA SERVER COMPONENTS (REGRA §8 AGENTS.MD)
// ══════════════════════════════════════════════════════════════════════════

const listaPaisesCalc = obterEmissoesG20();
const listaInstalacoesCalc = obterInstalacoesPoluidoras();
const listaAnomaliasCalc = obterAnomaliasEventosExtremos();
const listaNdcsCalc = obterNdcsESetores();

const somaEmissoesG20Mt = listaPaisesCalc.reduce((acc, p) => acc + p.emissoesTotaisMtCo2e, 0);
const somaInstalacoesMt = listaInstalacoesCalc.reduce((acc, i) => acc + i.emissoesAnuaisMtCo2e, 0);
const somaDanosAnomaliasUsdBilhoes = listaAnomaliasCalc.reduce(
  (acc, a) => acc + a.danosEconomicosUsdBilhoes,
  0
);
const somaEmissoesSetoriaisGt = listaNdcsCalc.reduce(
  (acc, s) => acc + s.emissaoGlobalAnualGtCo2e,
  0
);

export const COBERTURA_CRISE_CLIMATICA = {
  totalPaisesG20: listaPaisesCalc.length,
  totalInstalacoesPoluidoras: listaInstalacoesCalc.length,
  totalEventosAnomalias: listaAnomaliasCalc.length,
  totalAnomaliasEventos: listaAnomaliasCalc.length,
  totalSetoresNdc: listaNdcsCalc.length,
  somaEmissoesG20MtCo2e: somaEmissoesG20Mt,
  participacaoG20GlobalPct: Number(
    listaPaisesCalc.reduce((acc, p) => acc + p.participacaoGlobalPct, 0).toFixed(1)
  ),
  maiorEmissorPais: "China (14.320 Mt CO₂e/ano)",
  maiorEmissorPerCapitaPais: "Arábia Saudita (21,6 t CO₂e/hab)",
  emissaoBrasilMtCo2e: 2320,
  posicaoBrasilGlobal: "6º maior emissor global (4,3% mundial)",
  maiorInstalacaoPoluidora: "Complexo Secunda Synfuels (Sasol - África do Sul, 51,5 Mt CO₂e/ano)",
  somaInstalacoesMapeadasMtCo2e: Number(somaInstalacoesMt.toFixed(1)),
  anomaliaMediaGlobal2024: "+1,64°C acima da era pré-industrial (Copernicus ERA5)",
  totalDanosEconomicosEventosUsdBilhoes: Number(somaDanosAnomaliasUsdBilhoes.toFixed(1)),
  somaEmissoesSetoriaisGtCo2e: Number(somaEmissoesSetoriaisGt.toFixed(1)),
  dataMedicao: "2026-10-01",
} as const;
