import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export const LICITACOES_PAGE_SIZE = 25;

export interface LicitacaoRow {
  id: string;
  numero_controle_pncp: string | null;
  orgao_nome: string | null;
  unidade_nome: string | null;
  modalidade_nome: string | null;
  objeto: string | null;
  situacao: string | null;
  valor_estimado: number | null;
  valor_homologado: number | null;
  data_publicacao_pncp: string | null;
  data_abertura: string | null;
  data_encerramento: string | null;
  link_sistema_origem: string | null;
}

export interface LicitacoesFilters {
  ano?: string;
  situacao?: string;
  modalidade?: string;
  q?: string;
  page?: number;
  /** Default `LICITACOES_PAGE_SIZE`. `prefeitura/licitacoes` pede um valor
   *  bem maior pra buscar a cidade inteira de uma vez — ver
   *  `app/[municipio]/prefeitura/licitacoes/dados/[arquivo]/route.ts`. */
  porPagina?: number;
}

export interface LicitacoesResult {
  rows: LicitacaoRow[];
  total: number;
  somaEstimado: number;
  /** false when DATABASE_URL is missing — data source not configured. */
  configured: boolean;
  /** false when configured but the query itself failed (e.g. table missing). */
  ok: boolean;
}

const VAZIO: LicitacoesResult = {
  rows: [],
  total: 0,
  somaEstimado: 0,
  configured: false,
  ok: false,
};

/** Mesmo motivo de `sanitizeSearchTerm` em `lib/betim/contratos.ts`: `%` é
 *  curinga do `ilike` e viraria busca por qualquer coisa. */
function sanitizeSearchTerm(termo: string | undefined): string | undefined {
  const trimmed = termo?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/%/g, "");
}

function filtrosParaQuery(filters: LicitacoesFilters) {
  return {
    ano: filters.ano ? Number(filters.ano) : undefined,
    situacao: filters.situacao,
    modalidade: filters.modalidade,
    q: sanitizeSearchTerm(filters.q),
  };
}

/**
 * Licitações (PNCP) de uma cidade — coletadas por `etl/betim/etl/pncp/
 * licitacoes.py` e, até esta função existir, sem consulta nenhuma que as
 * lesse (confirmado: `grep -rn "licitacoes" lib/db/queries/` não achava
 * nada). É a fase ANTERIOR ao contrato — o processo de compra, não o ajuste
 * já assinado —, por isso vive em página própria em vez de entrar no filtro
 * de `prefeitura/contratos`.
 *
 * Mesmo padrão de `fetchContratos`: degrada para resultado vazio, nunca
 * lança.
 */
export async function fetchLicitacoes(
  idMunicipio: IdMunicipio,
  filters: LicitacoesFilters = {}
): Promise<LicitacoesResult> {
  try {
    const filtros = filtrosParaQuery(filters);
    const linhas = await q.licitacoesPaginadas(idMunicipio, {
      ...filtros,
      pagina: filters.page,
      porPagina: filters.porPagina ?? LICITACOES_PAGE_SIZE,
    });
    if (!linhas) return VAZIO;

    const rows = linhas.map(({ total, soma_estimado, ...row }) => {
      void total;
      void soma_estimado;
      return row as LicitacaoRow;
    });

    // Mesmo motivo de `fetchContratos`: os agregados vêm por `over ()`
    // pendurados em cada linha, e somem quando a página não tem linha
    // nenhuma — o que acontece tanto com filtro que não casa nada quanto
    // numa página além da última.
    const agregados = linhas[0]
      ? { total: linhas[0].total, soma_estimado: linhas[0].soma_estimado }
      : ((await q.totaisDeLicitacoes(idMunicipio, filtros)) ?? { total: 0, soma_estimado: 0 });

    return {
      rows,
      total: agregados.total,
      somaEstimado: agregados.soma_estimado,
      configured: true,
      ok: true,
    };
  } catch {
    return { ...VAZIO, configured: true };
  }
}

/** Situações de licitação existentes no banco — sem chutar valores fixos. */
export async function getSituacoesLicitacoes(idMunicipio: IdMunicipio): Promise<string[]> {
  try {
    return await q.situacoesDeLicitacoesDisponiveis(idMunicipio);
  } catch {
    return [];
  }
}

/** Modalidades de licitação existentes no banco — sem chutar valores fixos. */
export async function getModalidadesLicitacoes(idMunicipio: IdMunicipio): Promise<string[]> {
  try {
    return await q.modalidadesDeLicitacoesDisponiveis(idMunicipio);
  } catch {
    return [];
  }
}
