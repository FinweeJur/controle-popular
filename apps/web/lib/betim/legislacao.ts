import { getSupabaseClient, ID_MUNICIPIO_DEFAULT, comColunaOpcional } from "@/lib/betim/supabase";
import { TEMA_LABELS, type ContagemTema } from "@/lib/betim/temas";

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
  temas?: string[] | null;
}

const COLUNAS_BASE = "tipo, numero, ano, ementa, data_publicacao";

/**
 * Legislação municipal (`etl/prefeitura/legislacao.py` — dataset de dados
 * abertos de Betim: leis, decretos, resoluções, instruções normativas).
 * `temas` vem da classificação por palavra-chave da ementa (migration
 * 0025) — degrada pro select sem ela enquanto a 0025 não roda, então a
 * página funciona (sem o ranking por tema) mesmo antes da migration.
 * Dataset pequeno (~660) — busca tudo e filtra no componente.
 */
export async function getLegislacao(opts: {
  categoria?: string;
  tema?: string;
  ano?: number;
}): Promise<LegislacaoData> {
  const supabase = getSupabaseClient();
  if (!supabase) return EMPTY;

  try {
    const { data, error } = await comColunaOpcional(
      () =>
        supabase
          .from("atos_oficiais")
          .select(`${COLUNAS_BASE}, temas`)
          .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
          .order("data_publicacao", { ascending: false, nullsFirst: false }),
      () =>
        supabase
          .from("atos_oficiais")
          .select(COLUNAS_BASE)
          .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
          .order("data_publicacao", { ascending: false, nullsFirst: false })
    );
    if (error) return { ...EMPTY, configured: true };

    const todos = ((data ?? []) as RawRow[]).map((r) => ({
      tipo: r.tipo,
      numero: r.numero,
      ano: r.ano,
      ementa: r.ementa,
      dataPublicacao: r.data_publicacao,
      temas: r.temas ?? null,
    }));
    if (todos.length === 0) return { ...EMPTY, configured: true };

    const categoriasDisponiveis = [
      ...new Set(todos.map((a) => a.tipo).filter((t): t is string => Boolean(t))),
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const anosDisponiveis = [
      ...new Set(todos.map((a) => a.ano).filter((a): a is number => a != null)),
    ].sort((a, b) => b - a);

    // Ranking de temas de TODOS os atos (não muda com o filtro — é "sobre o
    // que a Prefeitura legisla no geral").
    const contagem = new Map<string, number>();
    for (const a of todos) {
      for (const t of a.temas ?? []) contagem.set(t, (contagem.get(t) ?? 0) + 1);
    }
    const temas: ContagemTema[] = [...contagem.entries()]
      .map(([tema, qtd]) => ({ tema, label: TEMA_LABELS[tema] ?? tema, qtd }))
      .sort((a, b) => b.qtd - a.qtd);

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
