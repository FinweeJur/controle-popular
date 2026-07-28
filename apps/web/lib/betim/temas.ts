import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";

/**
 * Tags temáticas (pedido do usuário 2026-07-22): requerimentos, projetos
 * de lei e contratos carregam tags de tema (Saúde, Educação, Segurança
 * Pública...) pra dar pra filtrar e entender as áreas de foco de atuação
 * de cada vereador/prefeitura — não só QUANTO cada um legisla (ranking
 * ponderado em `lib/vereadores.ts`), mas SOBRE O QUÊ.
 *
 * Classificação (por palavra-chave, feita no ETL — ver `etl/temas.py`)
 * roda uma vez na escrita; aqui é só o rótulo em português e a leitura
 * agregada. Espelha `TEMA_LABELS` do lado Python — mesma lista, mesmos
 * slugs, dois arquivos porque a classificação roda em Python (ETL) e a
 * exibição roda em TypeScript (app), igual ao par
 * `TIPO_MATERIA`/`TIPO_PROPOSICAO_LABELS` já existente pras proposições.
 */
export const TEMA_LABELS: Record<string, string> = {
  saude: "Saúde",
  educacao: "Educação",
  seguranca_publica: "Segurança Pública",
  assistencia_social: "Assistência Social",
  meio_ambiente: "Meio Ambiente",
  infraestrutura_obras: "Infraestrutura e Obras",
  mobilidade_transporte: "Mobilidade e Transporte",
  habitacao_urbanismo: "Habitação e Urbanismo",
  cultura_esporte_lazer: "Cultura, Esporte e Lazer",
  economia_desenvolvimento: "Economia e Desenvolvimento",
  administracao_publica: "Administração Pública",
  homenagens_datas: "Homenagens e Datas Comemorativas",
  agropecuaria: "Agropecuária",
};

/** Ordem alfabética (pelo label em português) pra listas/filtros. */
export const TEMAS_ORDENADOS: string[] = Object.keys(TEMA_LABELS).sort((a, b) =>
  TEMA_LABELS[a].localeCompare(TEMA_LABELS[b], "pt-BR")
);

export interface ContagemTema {
  tema: string;
  label: string;
  qtd: number;
}

/**
 * Conta ocorrências de cada tema numa lista de arrays `temas` (uma
 * proposição/contrato pode ter vários temas ao mesmo tempo — a soma das
 * contagens passa do total de linhas, isso é esperado, não um bug).
 * Ordenado por quantidade, maior primeiro; temas sem nenhuma ocorrência
 * ficam de fora (não aparece "Agropecuária: 0" numa lista que é sobre
 * ranquear o que É relevante).
 */
function contarTemas(listasDeTemas: (string[] | null)[]): ContagemTema[] {
  const contagem = new Map<string, number>();
  for (const temas of listasDeTemas) {
    for (const tema of temas ?? []) {
      contagem.set(tema, (contagem.get(tema) ?? 0) + 1);
    }
  }
  return [...contagem.entries()]
    .map(([tema, qtd]) => ({ tema, label: TEMA_LABELS[tema] ?? tema, qtd }))
    .sort((a, b) => b.qtd - a.qtd);
}

interface TemasResult {
  temas: ContagemTema[];
  /** `false` quando a coluna `temas` ainda não existe (migration 0012
   *  pendente) — degrada pra "sem dado" em vez de quebrar a página. */
  ok: boolean;
}

const SEM_SUPABASE: TemasResult = { temas: [], ok: false };

/** Áreas de atuação de UM vereador — conta os temas das proposições dele. */
export async function getTemasVereador(vereadorId: string): Promise<TemasResult> {
  const supabase = getSupabaseClient();
  if (!supabase) return SEM_SUPABASE;
  try {
    const { data, error } = await supabase
      .from("proposicoes")
      .select("temas")
      .eq("vereador_id", vereadorId);
    if (error) return SEM_SUPABASE;
    return { temas: contarTemas((data ?? []).map((r) => r.temas)), ok: true };
  } catch {
    return SEM_SUPABASE;
  }
}

/** Áreas de atuação da Câmara inteira — conta os temas de toda proposição. */
export async function getTemasCamara(): Promise<TemasResult> {
  const supabase = getSupabaseClient();
  if (!supabase) return SEM_SUPABASE;
  try {
    const todas: (string[] | null)[] = [];
    const PAGE = 1000;
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await supabase
        .from("proposicoes")
        .select("temas")
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
        .range(offset, offset + PAGE - 1);
      if (error) return SEM_SUPABASE;
      todas.push(...(data ?? []).map((r) => r.temas));
      if (!data || data.length < PAGE) break;
    }
    return { temas: contarTemas(todas), ok: true };
  } catch {
    return SEM_SUPABASE;
  }
}

/** Áreas de atuação da Prefeitura — conta os temas de todo contrato. */
export async function getTemasPrefeitura(): Promise<TemasResult> {
  const supabase = getSupabaseClient();
  if (!supabase) return SEM_SUPABASE;
  try {
    const todas: (string[] | null)[] = [];
    const PAGE = 1000;
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await supabase
        .from("contratos")
        .select("temas")
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
        .range(offset, offset + PAGE - 1);
      if (error) return SEM_SUPABASE;
      todas.push(...(data ?? []).map((r) => r.temas));
      if (!data || data.length < PAGE) break;
    }
    return { temas: contarTemas(todas), ok: true };
  } catch {
    return SEM_SUPABASE;
  }
}
