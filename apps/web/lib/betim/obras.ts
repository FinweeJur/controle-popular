import * as q from "@/lib/db/queries/betim";

export interface ObraRow {
  nome: string;
  situacao: string | null;
  valor: number | null;
  percentualExecucao: number | null;
}

export interface ObrasData {
  obras: ObraRow[];
  situacoesDisponiveis: string[];
  total: number;
  valorTotal: number;
  configured: boolean;
  ok: boolean;
}

const EMPTY: ObrasData = {
  obras: [],
  situacoesDisponiveis: [],
  total: 0,
  valorTotal: 0,
  configured: false,
  ok: false,
};

interface RawRow {
  nome: string;
  situacao: string | null;
  valor: number | string | null;
  percentual_execucao: number | string | null;
}

/**
 * Obras públicas da Prefeitura (`etl/prefeitura/obras.py`, portal de
 * transparência de Betim). ~59 obras — busca tudo e filtra/ordena no
 * componente. `situacao` filtra pela situação real da obra.
 */
export async function getObras(
  idMunicipio: string,
  situacaoFiltro?: string
): Promise<ObrasData> {
  try {
    const data = await q.listarObras(idMunicipio);
    if (!data) return EMPTY;

    const todas = ((data ?? []) as RawRow[]).map((r) => ({
      nome: r.nome,
      situacao: r.situacao,
      valor: r.valor != null ? Number(r.valor) : null,
      percentualExecucao: r.percentual_execucao != null ? Number(r.percentual_execucao) : null,
    }));
    if (todas.length === 0) return { ...EMPTY, configured: true };

    const situacoesDisponiveis = [
      ...new Set(todas.map((o) => o.situacao).filter((s): s is string => Boolean(s))),
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));

    const obras = situacaoFiltro
      ? todas.filter((o) => o.situacao === situacaoFiltro)
      : todas;

    return {
      obras,
      situacoesDisponiveis,
      total: todas.length,
      valorTotal: todas.reduce((acc, o) => acc + (o.valor ?? 0), 0),
      configured: true,
      ok: true,
    };
  } catch {
    return { ...EMPTY, configured: true };
  }
}
