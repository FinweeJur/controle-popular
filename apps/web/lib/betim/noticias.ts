import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

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
// externa) e a leitura degradava via `comColunaOpcional` pro select SEM
// elas — bug real de 2026-07-24: /noticias vinha vazia (4 posts no banco)
// porque a 0023 não tinha rodado e o 42703 derrubava a página inteira. A
// migration já rodou: as duas colunas existem na introspecção do banco,
// então o fallback era código morto e saiu junto com o Supabase.

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

export async function getNoticias(
  idMunicipio: IdMunicipio
): Promise<{ rows: NoticiaResumo[]; ok: boolean }> {
  try {
    const data = await q.listarNoticias(idMunicipio);
    if (!data) return { rows: [], ok: false };
    return { rows: (data as RowResumo[]).map(mapResumo), ok: true };
  } catch {
    return { rows: [], ok: false };
  }
}

export async function getNoticiaBySlug(
  idMunicipio: IdMunicipio,
  slug: string
): Promise<NoticiaCompleta | null> {
  try {
    const row = await q.noticiaPorSlug(idMunicipio, slug);
    if (!row) return null;
    return {
      ...mapResumo(row as RowResumo),
      conteudoHtml: (row as { conteudo_html: string }).conteudo_html,
    };
  } catch {
    return null;
  }
}
