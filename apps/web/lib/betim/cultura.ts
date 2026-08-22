import { getDespesasPorFuncao, type DespesasPorFuncaoData } from "@/lib/betim/despesas";
import {
  fetchContratos,
  fetchContratosForExport,
  type ContratoRow,
  type ContratosFilters,
  type ContratosResult,
} from "@/lib/betim/contratos";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

/**
 * ═══ POR QUE ISTO NÃO MORA EM `lib/cultura/` ═══
 *
 * `lib/cultura/` já existe e é outra coisa: incentivo fiscal federal (Lei
 * Rouanet, dados SALIC/MinC — quem doa para projetos culturais e abate no
 * imposto). Este módulo é sobre o QUE A PREFEITURA GASTA em cultura — duas
 * fontes de dinheiro completamente diferentes (uma é renúncia fiscal
 * federal, a outra é despesa municipal direta) que por acaso compartilham a
 * palavra "cultura". Colocar as duas sob o mesmo diretório sem uma
 * separação clara é exatamente o tipo de "insinuação" que a regra de
 * completude do projeto trata como dano — dois números verdadeiros e
 * diferentes, um do lado do outro, sem rótulo que distinga. Por isso este
 * módulo fica em `lib/betim/` (ao lado de `contratos.ts`/`despesas.ts`,
 * mesma família de dado municipal por cidade) e nunca importa nada de
 * `lib/cultura/`.
 *
 * ═══ DUAS FONTES, DOIS SIGNIFICADOS DIFERENTES DE "CULTURA" ═══
 *
 * 1. `getGastosCulturaPorAno` — despesa paga na função orçamentária
 *    "Cultura" (Portaria MOG 42/1999, tabela `despesas`/SICONFI). É o
 *    número OFICIAL, publicado pelo próprio município ao Tesouro Nacional,
 *    e não mistura com esporte/lazer: "Cultura" e "Desporto e Lazer" são
 *    funções COFOG SEPARADAS (ver `FUNCOES_COFOG` em `despesas.ts`).
 * 2. `fetchContratosCultura` — contratos do PNCP com o tema
 *    `cultura_esporte_lazer` (classificação por texto do órgão/objeto, ver
 *    `etl/betim/etl/temas.py`). Aqui SIM entra esporte e lazer junto — é o
 *    balaio constitucional (CF/88, arts. 215-217), decisão deliberada do
 *    projeto (mesma calibração usada para classificar proposição
 *    legislativa), reaproveitada como está: nenhuma calibração nova.
 *
 * As duas nunca devem ser somadas nem comparadas como se fossem o mesmo
 * corte — a tela mostra as duas, cada uma com o rótulo e a fonte que já
 * carrega essa diferença.
 */

export const TEMA_CULTURA_ESPORTE_LAZER = "cultura_esporte_lazer";
const FUNCAO_CULTURA = "Cultura";

export interface GastoCulturaAno {
  ano: number;
  valor: number;
  /** Fatia do total das despesas por função NAQUELE ano — não comparável
   *  entre anos diferentes sem olhar o total de cada um. */
  pct: number;
}

export interface GastosCulturaPorAno {
  porAno: GastoCulturaAno[];
  /** false quando `DATABASE_URL` não está configurado. */
  configured: boolean;
  /** false quando configurado mas a função "Cultura" nunca apareceu nos
   *  anos disponíveis (cidade sem despesa registrada nessa função, ou
   *  banco fora do ar) — degrada para a lista vazia, nunca lança. */
  ok: boolean;
}

/**
 * Extrai a função "Cultura" de uma lista de anos de despesas já buscados —
 * função pura e testável (a busca em si, com o banco, fica em
 * `getGastosCulturaPorAno`).
 */
export function extrairGastosCultura(porAno: DespesasPorFuncaoData[]): GastoCulturaAno[] {
  return porAno
    .filter((d) => d.ok)
    .map((d) => {
      const linha = d.funcoes.find((f) => f.funcao === FUNCAO_CULTURA);
      return linha ? { ano: d.ano, valor: linha.valor, pct: linha.pct } : null;
    })
    .filter((x): x is GastoCulturaAno => x !== null)
    .sort((a, b) => b.ano - a.ano);
}

/**
 * Despesa paga na função "Cultura", um item por ano disponível (mais
 * recente primeiro) — mesma varredura por ano que `despesas/page.tsx` já
 * faz para o painel completo, aqui recortada só na função de interesse.
 */
export async function getGastosCulturaPorAno(idMunicipio: IdMunicipio): Promise<GastosCulturaPorAno> {
  const maisRecente = await getDespesasPorFuncao(idMunicipio);
  if (!maisRecente.configured) return { porAno: [], configured: false, ok: false };
  if (!maisRecente.ok || maisRecente.anosDisponiveis.length === 0) {
    return { porAno: [], configured: true, ok: false };
  }

  const todosOsAnos = await Promise.all(
    maisRecente.anosDisponiveis.map((ano) =>
      ano === maisRecente.ano ? maisRecente : getDespesasPorFuncao(idMunicipio, ano)
    )
  );

  const porAno = extrairGastosCultura(todosOsAnos);
  return { porAno, configured: true, ok: porAno.length > 0 };
}

export interface ContratosCulturaFilters {
  ano?: string;
  status?: string;
  valorMin?: number;
  valorMax?: number;
  page?: number;
  porPagina?: number;
}

function comTemaCultura(filters: ContratosCulturaFilters): ContratosFilters {
  return { ...filters, tema: TEMA_CULTURA_ESPORTE_LAZER };
}

/** Contratos do PNCP tagueados como Cultura, Esporte e Lazer — mesma
 *  paginação/alerta de `fetchContratos`, tema fixo. */
export async function fetchContratosCultura(
  idMunicipio: IdMunicipio,
  filters: ContratosCulturaFilters = {}
): Promise<ContratosResult> {
  return fetchContratos(idMunicipio, comTemaCultura(filters));
}

export async function fetchContratosCulturaForExport(
  idMunicipio: IdMunicipio,
  filters: Omit<ContratosCulturaFilters, "page" | "porPagina"> = {}
): Promise<{ rows: ContratoRow[]; configured: boolean; ok: boolean }> {
  return fetchContratosForExport(idMunicipio, comTemaCultura(filters));
}

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return /[;"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/**
 * CSV dos contratos de Cultura, Esporte e Lazer filtrados — separador `;` e
 * BOM UTF-8 (regra do dono, 2026-08-21: `AGENTS.md`, "Excel brasileiro abre
 * tudo numa coluna e com acento quebrado" sem os dois). BOM embutido aqui
 * porque quem serve isto é uma rota `.din.ts` que devolve o corpo pronto
 * (mesmo formato de `contratosToCsv`) — não um `Blob` montado no cliente.
 */
export function contratosCulturaToCsv(rows: ContratoRow[]): string {
  const BOM = "﻿";
  const cabecalho = ["fornecedor", "objeto", "valor", "status", "data_assinatura", "ano"].join(";");
  const linhas = rows.map((row) =>
    [row.fornecedor_nome, row.objeto, row.valor_global, row.status, row.data_assinatura, row.ano]
      .map(csvEscape)
      .join(";")
  );
  return BOM + [cabecalho, ...linhas].join("\r\n") + "\r\n";
}
