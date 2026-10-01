/**
 * @file apps/web/lib/empresas/dados-fortunas.ts
 * @description Módulo de inteligência e acesso tipado ao acervo das 1.000 Maiores Fortunas Mundiais.
 *
 * Papel no portal:
 * 1. Fornece dados consolidados para a página `/empresas/fortunas` no Padrão das Seis Qualidades.
 * 2. Mapeia a extrema concentração de riqueza global entre indivíduos e dinastias familiares.
 * 3. Estabelece a correlação matemática entre rendimento mensal do grande capital e equivalência
 *    em número de pessoas vivendo na linha de extrema pobreza do Banco Mundial (US$ 2,15/dia).
 * 4. Serve de contexto cívico para o assistente Seu Nonô / Alceu Dispor responder com rigor sobre
 *    desigualdade, bilionários e oligopólios mundiais.
 *
 * Fontes oficiais primárias e metodologia:
 * - World Inequality Database (WID.world / Paris School of Economics) — Relatórios Globais de Desigualdade.
 * - SEC EDGAR (EUA) — Declarações de participação acionária e relatórios Form 4 e DEF 14A.
 * - CVM (Comissão de Valores Mobiliários) e B3 — Formulários de Referência e participações de controle.
 * - Bloomberg Billionaires Index e Forbes Wealth Tracking — Estimativas consolidadas de patrimônio líquido.
 * - Banco Mundial — Linha Internacional de Pobreza Extrema (US$ 2,15/dia = US$ 64,50/mês).
 *
 * Decisões técnicas e conformidade:
 * - Importação direta de JSON compacto versionado (`fortunas-mundiais.compact.json`) via `compactar.ts`.
 * - Zero bibliotecas externas pesadas e ausência de chamadas a `node:fs`, assegurando compatibilidade
 *   tanto no Server Component quanto em bundles client-side.
 * - Cache singleton em memória para decodificação instantânea.
 * - Rigorosa observância da LGPD: apenas figuras públicas notórias de relevância econômica internacional.
 */

import { expandir, type TabelaCompacta } from "@/lib/estatico/compactar";
import fortunasJson from "../../data/empresas/fortunas-mundiais.compact.json";

export type TipoFortuna = "individual" | "familia";

export interface FortunaMundial extends Record<string, unknown> {
  id: string;
  rank: number;
  nome: string;
  tipo: TipoFortuna;
  paisOrigem: string;
  codigoIsoPais: string;
  patrimonioLiquidoUsdBi: number;
  patrimonioLiquidoBrlBi: number;
  rendimentoMensalEstimadoUsdMi: number;
  rendimentoMensalEstimadoBrlMi: number;
  equivalenciaPessoasPobrezaExtrema: number;
  equivalenciaSalariosMinimosBrasil: number;
  setorAtuacao: string;
  principaisEmpresas: string[];
  fontePatrimonio: string;
  fonteOficialNome: string;
  urlFonteOficial: string;
}

/**
 * Cobertura oficial medida e datada do acervo das 1.000 maiores fortunas.
 * Padrão das Seis Qualidades: exibição direta nos cartões de topo sem reprocessamento em tempo de execução.
 */
export const COBERTURA_FORTUNAS = {
  totalRegistros: 1000,
  patrimonioTotalUsdBi: 13390.4,
  patrimonioTotalBrlBi: 73647.2,
  rendimentoMensalTotalUsdMi: 50214.0,
  rendimentoMensalTotalBrlMi: 276177.0,
  equivalenciaTotalPobrezaExtrema: 778513170,
  totalIndividuais: 770,
  totalFamilias: 230,
  totalPaises: 16,
  totalSetores: 12,
  dataAtualizacao: "2026-10-01",
  fontesPrimarias: [
    "World Inequality Database (WID.world)",
    "SEC EDGAR (EUA)",
    "CVM (Brasil)",
    "Bloomberg Billionaires Index",
    "Banco Mundial",
  ],
};

/** Cache em memória para evitar decodificação repetida no ciclo de vida da aplicação */
let CACHE_FORTUNAS: FortunaMundial[] | null = null;

/**
 * Retorna a lista completa das 1.000 maiores fortunas mundiais decodificadas e ordenadas por rank.
 *
 * @returns Lista tipada de fortunas mundiais.
 */
export function obterFortunasMundiais(): FortunaMundial[] {
  if (CACHE_FORTUNAS) {
    return CACHE_FORTUNAS;
  }

  try {
    CACHE_FORTUNAS = expandir<FortunaMundial>(fortunasJson as unknown as TabelaCompacta);
    return CACHE_FORTUNAS;
  } catch (erro) {
    console.error("Falha ao carregar catálogo das fortunas mundiais:", erro);
    return [];
  }
}

/**
 * Localiza uma fortuna específica a partir do seu rank na classificação global.
 *
 * @param rank - Posição de 1 a 1000 na listagem.
 * @returns Registro da fortuna ou null caso não encontrado.
 */
export function obterFortunaPorRank(rank: number): FortunaMundial | null {
  const lista = obterFortunasMundiais();
  return lista.find((item) => item.rank === rank) || null;
}

/**
 * Filtra fortunas vinculadas a um determinado país de origem.
 *
 * @param paisOuIso - Nome do país (ex.: 'Brasil', 'Estados Unidos') ou código ISO (ex.: 'BR', 'US').
 * @returns Lista de fortunas correspondentes ao país.
 */
export function obterFortunasPorPais(paisOuIso: string): FortunaMundial[] {
  const lista = obterFortunasMundiais();
  const termo = paisOuIso.trim().toLowerCase();
  return lista.filter(
    (item) =>
      item.paisOrigem.toLowerCase() === termo ||
      item.codigoIsoPais.toLowerCase() === termo
  );
}

/**
 * Filtra fortunas atuantes em um determinado setor econômico.
 *
 * @param setor - Nome ou fragmento do setor (ex.: 'Tecnologia', 'Mineração', 'Finanças').
 * @returns Lista de fortunas atuantes no setor.
 */
export function obterFortunasPorSetor(setor: string): FortunaMundial[] {
  const lista = obterFortunasMundiais();
  const termo = setor.trim().toLowerCase();
  return lista.filter((item) => item.setorAtuacao.toLowerCase().includes(termo));
}

/**
 * Estrutura agregada de distribuição por setor econômico.
 */
export interface ResumoSetorialFortunas {
  setor: string;
  totalPatrimonioUsdBi: number;
  totalPessoasOuFamilias: number;
  rendimentoMensalUsdMi: number;
}

/**
 * Consolida as fortunas por setor de atuação econômica para subsidiar gráficos e análises setoriais.
 *
 * @returns Lista ordenada dos setores por patrimônio total acumulado.
 */
export function obterAgregadosSetoriais(): ResumoSetorialFortunas[] {
  const lista = obterFortunasMundiais();
  const mapa = new Map<string, { patrimonio: number; contagem: number; rendimento: number }>();

  for (const item of lista) {
    const atual = mapa.get(item.setorAtuacao) || { patrimonio: 0, contagem: 0, rendimento: 0 };
    atual.patrimonio += item.patrimonioLiquidoUsdBi;
    atual.contagem += 1;
    atual.rendimento += item.rendimentoMensalEstimadoUsdMi;
    mapa.set(item.setorAtuacao, atual);
  }

  const resultado: ResumoSetorialFortunas[] = [];
  for (const [setor, valores] of mapa.entries()) {
    resultado.push({
      setor,
      totalPatrimonioUsdBi: Number(valores.patrimonio.toFixed(1)),
      totalPessoasOuFamilias: valores.contagem,
      rendimentoMensalUsdMi: Number(valores.rendimento.toFixed(1)),
    });
  }

  resultado.sort((a, b) => b.totalPatrimonioUsdBi - a.totalPatrimonioUsdBi);
  return resultado;
}
