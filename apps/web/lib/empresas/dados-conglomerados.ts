/**
 * @file apps/web/lib/empresas/dados-conglomerados.ts
 * @description Módulo de inteligência corporativa e dados estruturados sobre
 * Conglomerados, Holdings, Monopólios, Cartéis e Trustes.
 *
 * Papel no portal:
 * Fornece a tipagem oficial, constante literal de cobertura `COBERTURA_CONGLOMERADOS`
 * para os cartões de topo dos Server Components, e métodos de consulta com
 * descompactação via `expandir()` (`compactar.ts`).
 *
 * Frentes cobertas:
 * 1. Big Three (BlackRock, Vanguard, State Street) e a propriedade comum horizontal.
 * 2. Cartel ABCD de Grãos (ADM, Bunge, Cargill, Louis Dreyfus).
 * 3. Big Mining (Vale, BHP, Rio Tinto, Glencore, Anglo American).
 * 4. Big Oil e Big Tech (Petrobras, Shell, TotalEnergies, AWS, Google, Microsoft).
 * 5. Índices Herfindahl-Hirschman (HHI) e critérios concorrenciais do CADE.
 *
 * Fontes oficiais:
 * - CVM (Comissão de Valores Mobiliários) — Formulários de Referência e Estruturas Societárias.
 * - SEC EDGAR (EUA) — Formulários 13F, 10-K e 20-F com códigos CIK auditáveis.
 * - CADE (Conselho Administrativo de Defesa Econômica) — Atos de Concentração e Guia HHI.
 * - ANM (Agência Nacional de Mineração) — SIGMINE e processos de concessão de lavra.
 * - ANP & ANTAQ — Rodadas de partilha do Pré-Sal e arrendamentos de terminais portuários.
 * - Banco Central do Brasil — Relatório de Estabilidade Financeira.
 *
 * Decisões técnicas e restrições:
 * - A constante `COBERTURA_CONGLOMERADOS` é estática, medida e datada (2026-10-01).
 * - Os dados brutos residem em arquivos compactos (`.compact.json`) para evitar sobrecarga de bundle.
 * - Zero dados pessoais (sem CPF): apenas pessoas jurídicas públicas e reguladas.
 */

import { expandir, type TabelaCompacta } from "../estatico/compactar";
import conglomeradosHoldingsJson from "../../data/empresas/conglomerados-holdings.compact.json";
import conglomeradosArestasJson from "../../data/empresas/conglomerados-arestas.compact.json";
import conglomeradosSetoresJson from "../../data/empresas/conglomerados-setores.compact.json";

export type TipoNoConglomerado =
  | "holding"
  | "investimento"
  | "subsidiaria"
  | "concessao";

export type SetorConglomerado =
  | "mineracao"
  | "agronegocio_graos"
  | "energia_petroleo"
  | "bancos_financas"
  | "tecnologia";

export type TipoRelacaoControle =
  | "propriedade_comum_big_three"
  | "controle_majoritario"
  | "participacao_significativa"
  | "subsidiaria_integral"
  | "joint_venture"
  | "concessao_exploracao"
  | "cartel_infraestrutura";

/**
 * Entidade corporativa individual dentro da rede de monopólios e cartéis.
 */
export interface NoConglomerado extends Record<string, unknown> {
  id: string;
  nome: string;
  siglaOuTicker: string;
  tipo: TipoNoConglomerado;
  tipoRotulo: string;
  setor: SetorConglomerado;
  setorRotulo: string;
  paisOrigem: string;
  jurisdicao: string;
  nivelHierarquico: number; // 1: Holding, 2: Investimento, 3: Subsidiária, 4: Concessão
  holdingPaiId: string;
  controladorPrincipal: string;
  participacaoControladorPct: number;
  valorMercadoOuAtivos: string;
  participacaoMercadoPct: number;
  faturamentoOuReceita: string;
  hhiSetorial: number;
  classificacaoHhi: string;
  posicaoRankingSetor: number;
  descricao: string;
  ativosEstrategicos: string;
  riscosAntitruste: string;
  fontesOficiais: string;
  urlOficial: string;
}

/**
 * Vínculo de controle societário, propriedade comum ou concessão entre dois nós.
 */
export interface ArestaControleAcionario extends Record<string, unknown> {
  id: string;
  origemId: string;
  destinoId: string;
  tipoRelacao: TipoRelacaoControle;
  tipoRotulo: string;
  participacaoPct: number;
  valorEstimado: string;
  detalhes: string;
  fonteOficial: string;
  urlOficial: string;
}

/**
 * Métrica de concentração setorial antitruste com base no Índice Herfindahl-Hirschman (HHI).
 */
export interface ConcentracaoSetorial extends Record<string, unknown> {
  setorId: SetorConglomerado;
  nome: string;
  hhi: number;
  classificacao: string;
  cr4Pct: number;
  descricaoConcorrencial: string;
  criterioCade: string;
  principaisPlayers: {
    nome: string;
    sigla: string;
    participacaoPct: number;
    tipo: string;
  }[];
  alertasAntitruste: string[];
  fonteOficial: string;
  urlOficial: string;
}

/**
 * Representação hierárquica em árvore para o Mapa Mental (Holding -> Investimento -> Subsidiária -> Concessão).
 */
export interface NoArvoreHierarquica extends NoConglomerado {
  filhos: NoArvoreHierarquica[];
}

/**
 * Grafo completo unificado para visualização interativa em Canvas e renderização de rede.
 */
export interface GrafoConglomerados {
  nos: NoConglomerado[];
  arestas: ArestaControleAcionario[];
  setores: ConcentracaoSetorial[];
}

/**
 * Metadados agregados para cartões de topo da página pública.
 */
export interface CoberturaConglomerados {
  readonly dataMedicao: string;
  readonly totalEntidades: number;
  readonly totalHoldings: number;
  readonly totalInvestimentos: number;
  readonly totalSubsidiarias: number;
  readonly totalConcessoes: number;
  readonly totalArestasControle: number;
  readonly totalSetoresMapeados: number;
  readonly mediaHhi: number;
  readonly maiorHhi: number;
  readonly setorMaiorHhi: string;
  readonly aumBigThreeUsdTrilhoes: number;
  readonly marketShareExportacaoValePct: number;
  readonly marketShareExportacaoAbcdPct: number;
  readonly marketShareRefinoPetrobrasPct: number;
}

/**
 * Constante literal medida e datada de cobertura para Server Components.
 * Evita carregar os arrays no servidor apenas para renderizar os cartões estáticos.
 */
export const COBERTURA_CONGLOMERADOS: CoberturaConglomerados = {
  dataMedicao: "2026-10-01",
  totalEntidades: 41,
  totalHoldings: 5,
  totalInvestimentos: 18,
  totalSubsidiarias: 9,
  totalConcessoes: 9,
  totalArestasControle: 40,
  totalSetoresMapeados: 5,
  mediaHhi: 3719,
  maiorHhi: 6303,
  setorMaiorHhi: "Petróleo, Refino & Combustíveis (Big Oil)",
  aumBigThreeUsdTrilhoes: 24.1,
  marketShareExportacaoValePct: 68.0,
  marketShareExportacaoAbcdPct: 77.0,
  marketShareRefinoPetrobrasPct: 78.0,
} as const;

/**
 * Retorna todos os nós corporativos catalogados, descompactando sob demanda.
 */
export function obterNosConglomerados(): NoConglomerado[] {
  return expandir<NoConglomerado>(
    conglomeradosHoldingsJson as unknown as TabelaCompacta
  );
}

/**
 * Retorna todas as arestas de controle e vínculos societários mapeados.
 */
export function obterArestasControle(): ArestaControleAcionario[] {
  return expandir<ArestaControleAcionario>(
    conglomeradosArestasJson as unknown as TabelaCompacta
  );
}

/**
 * Retorna as análises setoriais e índices HHI (Herfindahl-Hirschman).
 */
export function obterConcentracoesSetoriais(): ConcentracaoSetorial[] {
  return expandir<ConcentracaoSetorial>(
    conglomeradosSetoresJson as unknown as TabelaCompacta
  );
}

/**
 * Busca uma entidade corporativa por seu ID único.
 *
 * @param id - Identificador único em formato kebab-case (ex: "blackrock", "vale").
 * @returns Nó encontrado ou undefined.
 */
export function obterConglomeradoPorId(id: string): NoConglomerado | undefined {
  return obterNosConglomerados().find((n) => n.id === id);
}

/**
 * Retorna nós filtrados pelo nível hierárquico (1: Holding, 2: Investimento, 3: Subsidiária, 4: Concessão).
 *
 * @param nivel - Número inteiro de 1 a 4.
 */
export function obterNosPorNivel(nivel: number): NoConglomerado[] {
  return obterNosConglomerados().filter((n) => n.nivelHierarquico === nivel);
}

/**
 * Retorna nós pertencentes a um setor específico.
 *
 * @param setor - Chave do setor (ex: "mineracao", "agronegocio_graos").
 */
export function obterNosPorSetor(setor: SetorConglomerado | string): NoConglomerado[] {
  return obterNosConglomerados().filter((n) => n.setor === setor);
}

/**
 * Retorna o grafo corporativo completo contendo nós, arestas e métricas setoriais.
 */
export function obterGrafoCompleto(): GrafoConglomerados {
  return {
    nos: obterNosConglomerados(),
    arestas: obterArestasControle(),
    setores: obterConcentracoesSetoriais(),
  };
}

/**
 * Encontra todas as conexões diretas (controladores que investem no nó e subsidiárias/ativos controlados).
 *
 * @param noId - ID da entidade pesquisada.
 */
export function obterConexoesDoNo(noId: string): {
  controladores: { no: NoConglomerado; aresta: ArestaControleAcionario }[];
  controlados: { no: NoConglomerado; aresta: ArestaControleAcionario }[];
} {
  const nos = obterNosConglomerados();
  const arestas = obterArestasControle();
  const mapaNos = new Map(nos.map((n) => [n.id, n]));

  const controladores: { no: NoConglomerado; aresta: ArestaControleAcionario }[] = [];
  const controlados: { no: NoConglomerado; aresta: ArestaControleAcionario }[] = [];

  for (const aresta of arestas) {
    if (aresta.destinoId === noId) {
      const origem = mapaNos.get(aresta.origemId);
      if (origem) {
        controladores.push({ no: origem, aresta });
      }
    }
    if (aresta.origemId === noId) {
      const destino = mapaNos.get(aresta.destinoId);
      if (destino) {
        controlados.push({ no: destino, aresta });
      }
    }
  }

  return { controladores, controlados };
}

/**
 * Constrói a árvore hierárquica recursiva a partir de uma holding raiz (nível 1).
 *
 * @param holdingId - ID da holding (ex: "blackrock", "vanguard", "cosan", "j-and-f").
 */
export function obterArvoreHolding(holdingId: string): NoArvoreHierarquica | undefined {
  const nos = obterNosConglomerados();
  const arestas = obterArestasControle();
  const raiz = nos.find((n) => n.id === holdingId && n.nivelHierarquico === 1);
  if (!raiz) return undefined;

  function montarFilhos(paiId: string): NoArvoreHierarquica[] {
    // Busca nós que apontam diretamente para o paiId via aresta ou holdingPaiId
    const destinosArestas = arestas
      .filter((a) => a.origemId === paiId)
      .map((a) => a.destinoId);
    
    const filhosNos = nos.filter(
      (n) => n.id !== paiId && (destinosArestas.includes(n.id) || n.holdingPaiId === paiId)
    );

    // Evita ciclos
    const unicos = Array.from(new Set(filhosNos.map((f) => f.id)))
      .map((id) => filhosNos.find((f) => f.id === id)!)
      .filter((f) => f.nivelHierarquico > (nos.find((x) => x.id === paiId)?.nivelHierarquico ?? 0));

    return unicos.map((filho) => ({
      ...filho,
      filhos: montarFilhos(filho.id),
    }));
  }

  return {
    ...raiz,
    filhos: montarFilhos(raiz.id),
  };
}

/**
 * Constrói as árvores de todas as holdings principais registradas.
 */
export function obterArvoresTodasHoldings(): NoArvoreHierarquica[] {
  const holdings = obterNosPorNivel(1);
  const arvores: NoArvoreHierarquica[] = [];
  for (const h of holdings) {
    const arvore = obterArvoreHolding(h.id);
    if (arvore) arvores.push(arvore);
  }
  return arvores;
}

/**
 * Retorna estatísticas sintetizadas sobre os índices HHI.
 */
export function obterEstatisticasHhi(): {
  setores: ConcentracaoSetorial[];
  maiorHhi: ConcentracaoSetorial;
  mediaHhi: number;
  setoresAcima2500: number;
} {
  const setores = obterConcentracoesSetoriais();
  if (setores.length === 0) {
    throw new Error("Nenhum setor encontrado para calcular estatísticas HHI.");
  }

  let somaHhi = 0;
  let maiorHhi = setores[0];
  let acima2500 = 0;

  for (const s of setores) {
    somaHhi += s.hhi;
    if (s.hhi > maiorHhi.hhi) maiorHhi = s;
    if (s.hhi >= 2500) acima2500++;
  }

  return {
    setores,
    maiorHhi,
    mediaHhi: Math.round(somaHhi / setores.length),
    setoresAcima2500: acima2500,
  };
}
