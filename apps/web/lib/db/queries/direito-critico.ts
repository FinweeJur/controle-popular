import { getDb } from "@/lib/db/client";
import { direito_critico_normas, direito_critico_precedentes } from "@/lib/db/schema";

/**
 * Queries de `/ambiental/direito-critico` — seção "legislação e precedentes
 * por tema de direito protegido", migration `0067`. Fonte, ingestor e a
 * decisão de sanitização de HTML estão documentados na migration e em
 * `etl/betim/etl/apis/direito_critico_popular.py`; este arquivo só lê.
 *
 * ═══ POR QUE `listar*` TRAZ TUDO, SEM FILTRO NO SERVIDOR ═══
 *
 * 45 linhas ao todo — mesma decisão (e mesmo motivo: evitar `searchParams`
 * em Server Component, que quebra `output: 'export'`) de
 * `listarLegislacaoAmbiental` em `legislacao-ambiental.ts`.
 */

export type NaturezaDireitoCritico = "nacional" | "internacional";

export interface ArtigoNorma {
  id: string;
  destaque: boolean;
  titulo: string;
  /** Texto puro — o widget de tooltip de glossário da fonte foi descartado
   *  no ingestor, não reproduzido (ver docstring do ingestor). */
  texto: string;
}

export interface NormaDireitoCriticoRow {
  idFonte: number;
  numero: string | null;
  nomeCurto: string;
  nomeCompleto: string;
  natureza: NaturezaDireitoCritico;
  destaque: boolean;
  linkOficial: string;
  /** HTML já sanitizado no ingestor (só `<strong>` sobrevive) — pode ir
   *  direto num `dangerouslySetInnerHTML` controlado, nunca em texto cru
   *  vindo de outro lugar. */
  relevanciaHtml: string;
  artigos: ArtigoNorma[];
  temas: string[];
}

export interface PrecedenteDireitoCriticoRow {
  idFonte: number;
  tribunal: string;
  natureza: NaturezaDireitoCritico;
  destaque: boolean;
  linkOficial: string | null;
  titulo: string;
  referencia: string | null;
  /** Texto puro — a fonte não tem HTML nestes campos (medido: zero `<` nas
   *  15 entradas). Renderizar como texto, nunca com `dangerouslySetInnerHTML`. */
  ementa: string;
  relevancia: string;
  tags: string[];
  temas: string[];
}

function paraNorma(r: typeof direito_critico_normas.$inferSelect): NormaDireitoCriticoRow {
  return {
    idFonte: r.id_fonte,
    numero: r.numero,
    nomeCurto: r.nome_curto,
    nomeCompleto: r.nome_completo,
    natureza: r.natureza as NaturezaDireitoCritico,
    destaque: r.destaque,
    linkOficial: r.link_oficial,
    relevanciaHtml: r.relevancia_html,
    artigos: (r.artigos as ArtigoNorma[] | null) ?? [],
    temas: r.temas ?? [],
  };
}

function paraPrecedente(
  r: typeof direito_critico_precedentes.$inferSelect
): PrecedenteDireitoCriticoRow {
  return {
    idFonte: r.id_fonte,
    tribunal: r.tribunal,
    natureza: r.natureza as NaturezaDireitoCritico,
    destaque: r.destaque,
    linkOficial: r.link_oficial,
    titulo: r.titulo,
    referencia: r.referencia,
    ementa: r.ementa,
    relevancia: r.relevancia,
    tags: r.tags ?? [],
    temas: r.temas ?? [],
  };
}

export async function listarNormasDireitoCritico(): Promise<NormaDireitoCriticoRow[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db.select().from(direito_critico_normas);
  return linhas.map(paraNorma).sort((a, b) => a.idFonte - b.idFonte);
}

export async function listarPrecedentesDireitoCritico(): Promise<
  PrecedenteDireitoCriticoRow[]
> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db.select().from(direito_critico_precedentes);
  return linhas.map(paraPrecedente).sort((a, b) => a.idFonte - b.idFonte);
}

export interface ContagemDireitoCritico {
  normas: number;
  precedentes: number;
}

/** Card da home de `/ambiental` — número real, não estimativa. */
export async function contarDireitoCritico(): Promise<ContagemDireitoCritico> {
  const [normas, precedentes] = await Promise.all([
    listarNormasDireitoCritico(),
    listarPrecedentesDireitoCritico(),
  ]);
  return { normas: normas.length, precedentes: precedentes.length };
}
