import { getSupabaseClient, ID_MUNICIPIO_DEFAULT, comColunaOpcional } from "@/lib/betim/supabase";

export interface NoticiaResumo {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: "achado" | "explicador" | "nota" | "curadoria";
  temas: string[] | null;
  autor: string;
  publicadoEm: string;
  fonteExternaNome: string | null;
  fonteExternaUrl: string | null;
}

export interface NoticiaCompleta extends NoticiaResumo {
  conteudoHtml: string;
}

export const CATEGORIA_LABELS: Record<string, string> = {
  achado: "Achado",
  explicador: "Explicador",
  nota: "Nota",
  curadoria: "Repercussão",
};

// As colunas `fonte_externa_*` vêm da migration 0023 (curadoria de fonte
// externa). Se ela ainda não rodou no banco, um `select` que as inclui
// falha com 42703 e derruba a página inteira de notícias -- por isso a
// leitura degrada via `comColunaOpcional` pro select SEM elas. Bug real
// achado 2026-07-24: /noticias vinha vazia (4 posts no banco) porque a
// 0023 não tinha rodado.
const COLUNAS_BASE = "slug, titulo, resumo, categoria, temas, autor, publicado_em";
const SELECT_RESUMO = `${COLUNAS_BASE}, fonte_externa_nome, fonte_externa_url`;
const SELECT_RESUMO_SEM_FONTE = COLUNAS_BASE;
const SELECT_COMPLETA = `${SELECT_RESUMO}, conteudo_html`;
const SELECT_COMPLETA_SEM_FONTE = `${SELECT_RESUMO_SEM_FONTE}, conteudo_html`;

interface RowResumo {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string;
  temas: string[] | null;
  autor: string;
  publicado_em: string;
  fonte_externa_nome?: string | null;
  fonte_externa_url?: string | null;
}

function mapResumo(r: RowResumo): NoticiaResumo {
  return {
    slug: r.slug,
    titulo: r.titulo,
    resumo: r.resumo,
    categoria: r.categoria as NoticiaResumo["categoria"],
    temas: r.temas,
    autor: r.autor,
    publicadoEm: r.publicado_em,
    fonteExternaNome: r.fonte_externa_nome ?? null,
    fonteExternaUrl: r.fonte_externa_url ?? null,
  };
}

export async function getNoticias(): Promise<{ rows: NoticiaResumo[]; ok: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { rows: [], ok: false };
  try {
    const { data, error } = await comColunaOpcional(
      () =>
        supabase
          .from("noticias")
          .select(SELECT_RESUMO)
          .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
          .order("publicado_em", { ascending: false }),
      () =>
        supabase
          .from("noticias")
          .select(SELECT_RESUMO_SEM_FONTE)
          .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
          .order("publicado_em", { ascending: false })
    );
    if (error || !data) return { rows: [], ok: false };
    return { rows: (data as RowResumo[]).map(mapResumo), ok: true };
  } catch {
    return { rows: [], ok: false };
  }
}

export async function getNoticiaBySlug(slug: string): Promise<NoticiaCompleta | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await comColunaOpcional(
      () =>
        supabase
          .from("noticias")
          .select(SELECT_COMPLETA)
          .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
          .eq("slug", slug)
          .maybeSingle(),
      () =>
        supabase
          .from("noticias")
          .select(SELECT_COMPLETA_SEM_FONTE)
          .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
          .eq("slug", slug)
          .maybeSingle()
    );
    if (error || !data) return null;
    const row = data as RowResumo & { conteudo_html: string };
    return { ...mapResumo(row), conteudoHtml: row.conteudo_html };
  } catch {
    return null;
  }
}
