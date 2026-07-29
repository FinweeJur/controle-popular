import * as q from "@/lib/db/queries/betim";
import { TEMA_LABELS, type ContagemTema } from "@/lib/betim/temas";
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
  temas: string[] | null;
}

/**
 * Legislação municipal (`etl/prefeitura/legislacao.py` — dataset de dados
 * abertos de Betim: leis, decretos, resoluções, instruções normativas).
 * Dataset pequeno (~660) — busca tudo e filtra no componente.
 *
 * O ranking por área e o filtro `?tema=` estiveram MORTOS desde que foram
 * escritos: a migration 0025, que cria `atos_oficiais.temas`, nunca tinha
 * rodado, e o `comColunaOpcional()` que protegia o select degradava em
 * silêncio para o ramo sem a coluna. A 0025 foi aplicada nos dois bancos e
 * as ementas classificadas com o classificador real do ETL
 * (`etl/temas.py`) — a mesma regra por palavra-chave das proposições e dos
 * contratos.
 *
 * 76 dos 660 atos pegam tema. Os outros são decretos de crédito
 * orçamentário, sem assunto identificável; a docstring do ETL registra
 * isso como esperado, não como falha do classificador.
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
      temas: r.temas,
    }));
    if (todos.length === 0) return { ...EMPTY, configured: true };

    const categoriasDisponiveis = [
      ...new Set(todos.map((a) => a.tipo).filter((t): t is string => Boolean(t))),
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const anosDisponiveis = [
      ...new Set(todos.map((a) => a.ano).filter((a): a is number => a != null)),
    ].sort((a, b) => b - a);

    // Ranking de áreas sobre TODOS os atos, não sobre o filtro: a leitura
    // é "sobre o que a Prefeitura legisla no geral", e mudaria de sentido
    // se acompanhasse a categoria selecionada na tabela abaixo.
    const contagem = new Map<string, number>();
    for (const a of todos) {
      for (const t of a.temas ?? []) contagem.set(t, (contagem.get(t) ?? 0) + 1);
    }
    const temas: ContagemTema[] = [...contagem.entries()]
      .map(([tema, qtd]) => ({ tema, label: TEMA_LABELS[tema] ?? tema, qtd }))
      // Desempate por nome: sem ele, áreas com a mesma contagem saem na
      // ordem de aparição das linhas, e com SSG o gráfico muda a cada build.
      .sort((a, b) => b.qtd - a.qtd || a.tema.localeCompare(b.tema));

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
