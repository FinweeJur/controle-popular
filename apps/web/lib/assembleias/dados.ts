/**
 * Módulo de consulta e agregação de dados das Assembleias Legislativas Estaduais.
 *
 * Papel no portal:
 * Centraliza as operações de leitura, filtragem e agregação estatística para
 * as 27 Casas Legislativas estaduais brasileiras (26 estados e Distrito Federal),
 * alimentando as interfaces cívicas do portal Controle Popular, ferramentas de busca,
 * auditoria de gastos e o assistente cívico (RAG).
 *
 * Fontes oficiais:
 * - Dataset estruturado em `apps/web/data/assembleias-estaduais.json`, compilado
 *   a partir de portais oficiais de transparência e dados abertos estaduais.
 * - Constituição Federal de 1988, art. 27 (fixação do número de 1.059 deputados estaduais).
 * - Portais de dados abertos da ALESP, ALMG, ALERJ, ALBA, ALECE, ALEPE, ALEP, ALRS e demais Casas.
 *
 * Decisões de arquitetura:
 * - Leitura direta em memória do dataset versionado com tipagem TypeScript estrita.
 * - Buscas resilientes por UF (insensíveis a maiúsculas/minúsculas e espaços excedentes).
 * - Filtros combináveis em proposições legislativas (termo textual, tipo de ato, ano e situação).
 * - Conformidade estrita com AGENTS.md § 5.2 (ausência total de CPFs e blindagem de dados privados).
 */

import assembleiasRaw from "@/data/assembleias-estaduais.json";
import type {
  AssembleiaEstadual,
  AudienciaPublicaEstadual,
  ComissaoEstadual,
  DeputadoEstadual,
  FiltrosProposicoesEstaduais,
  MetricasNacionais,
  ProposicaoEstadual,
} from "./types";

/**
 * Base de dados em memória tipada com todas as assembleias catalogadas.
 */
const ASSEMBLEIAS: AssembleiaEstadual[] = assembleiasRaw as AssembleiaEstadual[];

/**
 * Normaliza string para comparação textual insensível a acentuação e caixa alta.
 *
 * @param texto - Texto de entrada a ser normalizado.
 * @returns Texto em caixa baixa e sem diacríticos.
 */
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Retorna a lista completa com todas as 27 Assembleias Legislativas catalogadas no Brasil.
 *
 * @returns Lista contendo todas as Casas Legislativas estaduais e distrital.
 */
export function listarTodasAssembleias(): AssembleiaEstadual[] {
  return [...ASSEMBLEIAS];
}

/**
 * Recupera os dados detalhados de uma Assembleia Legislativa a partir da sigla de sua UF.
 *
 * @param uf - Sigla da Unidade Federativa com 2 caracteres (ex: 'SP', 'MG', 'DF').
 * @returns Objeto completo da Assembleia ou null se a UF não for encontrada.
 */
export function obterAssembleiaPorUf(uf: string): AssembleiaEstadual | null {
  if (!uf || typeof uf !== "string") {
    return null;
  }
  const ufNormalizada = uf.trim().toUpperCase();
  const encontrada = ASSEMBLEIAS.find((item) => item.uf.toUpperCase() === ufNormalizada);
  return encontrada ?? null;
}

/**
 * Lista as proposições legislativas de uma UF específica, aplicando filtros opcionais.
 *
 * @param uf - Sigla da UF desejada.
 * @param filtros - Critérios opcionais de filtragem (q, tipo, ano, situacao, autor).
 * @returns Lista de proposições que atendem aos filtros especificados.
 */
export function listarProposicoesPorUf(
  uf: string,
  filtros?: FiltrosProposicoesEstaduais
): ProposicaoEstadual[] {
  const assembleia = obterAssembleiaPorUf(uf);
  if (!assembleia || !assembleia.proposicoes) {
    return [];
  }

  let resultado = [...assembleia.proposicoes];

  if (!filtros) {
    return resultado;
  }

  // Filtro por termo de busca textual (q) em código ou ementa
  if (filtros.q && filtros.q.trim()) {
    const termo = normalizarTexto(filtros.q);
    resultado = resultado.filter((p) => {
      const ementaNorm = normalizarTexto(p.ementa);
      const codigoNorm = normalizarTexto(p.codigo);
      return ementaNorm.includes(termo) || codigoNorm.includes(termo);
    });
  }

  // Filtro por tipo de proposição (PL, PLC, PEC, etc.)
  if (filtros.tipo && filtros.tipo.trim()) {
    const tipoFiltro = filtros.tipo.trim().toUpperCase();
    resultado = resultado.filter((p) => p.tipo.toUpperCase() === tipoFiltro);
  }

  // Filtro por ano de apresentação
  if (filtros.ano && typeof filtros.ano === "number") {
    resultado = resultado.filter((p) => p.ano === filtros.ano);
  }

  // Filtro por situação de tramitação
  if (filtros.situacao && filtros.situacao.trim()) {
    const situacaoFiltro = normalizarTexto(filtros.situacao);
    resultado = resultado.filter((p) => normalizarTexto(p.situacao).includes(situacaoFiltro));
  }

  // Filtro por parlamentar autor
  if (filtros.autor && filtros.autor.trim()) {
    const autorFiltro = normalizarTexto(filtros.autor);
    resultado = resultado.filter((p) =>
      p.autores.some((autor) => normalizarTexto(autor.nome).includes(autorFiltro))
    );
  }

  return resultado;
}

/**
 * Obtém a relação de comissões permanentes e especiais de uma Assembleia Legislativa.
 *
 * @param uf - Sigla da UF.
 * @returns Lista de comissões registradas para o estado.
 */
export function obterComissoesPorUf(uf: string): ComissaoEstadual[] {
  const assembleia = obterAssembleiaPorUf(uf);
  if (!assembleia || !assembleia.comissoes) {
    return [];
  }
  return [...assembleia.comissoes];
}

/**
 * Obtém a relação de audiências públicas cadastradas para uma Casa Legislativa.
 *
 * @param uf - Sigla da UF.
 * @returns Lista de audiências públicas.
 */
export function obterAudienciasPorUf(uf: string): AudienciaPublicaEstadual[] {
  const assembleia = obterAssembleiaPorUf(uf);
  if (!assembleia || !assembleia.audienciasPublicas) {
    return [];
  }
  return [...assembleia.audienciasPublicas];
}

/**
 * Obtém a listagem do ranking de deputados da Casa, ordenado por pontuação cívica decrescente.
 *
 * @param uf - Sigla da UF.
 * @returns Lista de deputados ordenados do maior índice cívico para o menor.
 */
export function obterRankingDeputados(uf: string): DeputadoEstadual[] {
  const assembleia = obterAssembleiaPorUf(uf);
  if (!assembleia || !assembleia.deputadosRanking) {
    return [];
  }
  return [...assembleia.deputadosRanking].sort((a, b) => b.pontuacaoCivica - a.pontuacaoCivica);
}

/**
 * Calcula os indicadores e métricas consolidadas em nível nacional sobre as 27 Assembleias.
 *
 * @returns Objeto com os totais de deputados (1.059), comissões, proposições e orçamento consolidado.
 */
export function obterMetricasNacionaisAssembleias(): MetricasNacionais {
  const totalAssembleias = ASSEMBLEIAS.length;
  let totalDeputados = 0;
  let totalComissoes = 0;
  let totalProposicoes = 0;
  let totalAudiencias = 0;
  let somaOrcamento = 0;

  for (const assembleia of ASSEMBLEIAS) {
    totalDeputados += assembleia.totalDeputados;
    totalComissoes += assembleia.comissoes ? assembleia.comissoes.length : 0;
    totalProposicoes += assembleia.proposicoes ? assembleia.proposicoes.length : 0;
    totalAudiencias += assembleia.audienciasPublicas ? assembleia.audienciasPublicas.length : 0;
    if (assembleia.orcamentoAnual && typeof assembleia.orcamentoAnual.valorMilhoes === "number") {
      somaOrcamento += assembleia.orcamentoAnual.valorMilhoes;
    }
  }

  return {
    totalAssembleias,
    totalDeputados,
    totalComissoes,
    totalProposicoes,
    totalAudiencias,
    orcamentoTotalMilhoes: Math.round(somaOrcamento * 10) / 10,
  };
}
