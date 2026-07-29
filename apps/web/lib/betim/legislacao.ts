import * as q from "@/lib/db/queries/betim";
import { type ContagemTema } from "@/lib/betim/temas";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export interface AtoRow {
  tipo: string | null;
  numero: string | null;
  ano: number | null;
  ementa: string | null;
  dataPublicacao: string | null;
  temas: string[] | null;
}

export interface LegislacaoData {
  atos: AtoRow[];
  categoriasDisponiveis: string[];
  anosDisponiveis: number[];
  /** Ranking de áreas (só dos atos que pegaram tema) — pro gráfico. */
  temas: ContagemTema[];
  total: number;
  configured: boolean;
  ok: boolean;
}

const EMPTY: LegislacaoData = {
  atos: [],
  categoriasDisponiveis: [],
  anosDisponiveis: [],
  temas: [],
  total: 0,
  configured: false,
  ok: false,
};

interface RawRow {
  tipo: string | null;
  numero: string | null;
  ano: number | null;
  ementa: string | null;
  data_publicacao: string | null;
}

/**
 * Legislação municipal (`etl/prefeitura/legislacao.py` — dataset de dados
 * abertos de Betim: leis, decretos, resoluções, instruções normativas).
 * Dataset pequeno (~660) — busca tudo e filtra no componente.
 *
 * `temas` (classificação por palavra-chave da ementa, migration 0025) sai
 * SEMPRE vazio, e isso não é regressão: a coluna `atos_oficiais.temas` não
 * existe no banco — a 0025 nunca rodou. O `comColunaOpcional()` que
 * protegia esse select caía sempre no ramo sem a coluna, então o ranking
 * por área e o filtro `?tema=` já nasciam vazios em produção. Verificado
 * dos dois lados: introspecção do Neon e `select=temas` no PostgREST do
 * Supabase, que responde 42703 (undefined_column). Os campos ficam no
 * contrato para a página não mudar; ligá-los é rodar a migration + ETL.
 */
export async function getLegislacao(
  idMunicipio: IdMunicipio,
  opts: { categoria?: string; tema?: string; ano?: number } = {}
): Promise<LegislacaoData> {
  try {
    const data = await q.atosOficiais(idMunicipio);
    if (!data) return EMPTY;

    const todos = ((data ?? []) as RawRow[]).map((r) => ({
      tipo: r.tipo,
      numero: r.numero,
      ano: r.ano,
      ementa: r.ementa,
      dataPublicacao: r.data_publicacao,
      temas: null as string[] | null,
    }));
    if (todos.length === 0) return { ...EMPTY, configured: true };

    const categoriasDisponiveis = [
      ...new Set(todos.map((a) => a.tipo).filter((t): t is string => Boolean(t))),
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const anosDisponiveis = [
      ...new Set(todos.map((a) => a.ano).filter((a): a is number => a != null)),
    ].sort((a, b) => b - a);

    // Ranking de áreas: vazio enquanto `atos_oficiais.temas` não existir —
    // ver o comentário da função. A página já trata `temas.length === 0`
    // escondendo o gráfico.
    const temas: ContagemTema[] = [];

    let atos = todos;
    if (opts.categoria) atos = atos.filter((a) => a.tipo === opts.categoria);
    if (opts.ano) atos = atos.filter((a) => a.ano === opts.ano);
    if (opts.tema) atos = atos.filter((a) => (a.temas ?? []).includes(opts.tema!));

    return {
      atos,
      categoriasDisponiveis,
      anosDisponiveis,
      temas,
      total: todos.length,
      configured: true,
      ok: true,
    };
  } catch {
    return { ...EMPTY, configured: true };
  }
}
