import temasJson from "./rubrica/temas.json";

/**
 * Temas editoriais do portal — espelho fino de `rubrica/temas.json`.
 *
 * A definição não mora aqui: ver a `_nota`/`_nota_fontes` no JSON para o
 * porquê de três fontes por tema e o histórico de calibração dos regex.
 * `etl/temas.py` lê o MESMO arquivo para selecionar lotes de análise — os
 * dois lados nunca podem divergir na definição de um tema.
 */

export interface Tema {
  slug: string;
  nome: string;
  descricao: string;
  temasOficiais?: string[];
  direitos?: string[];
  padrao?: string;
}

export const TEMAS: Tema[] = temasJson.temas as Tema[];

export function temaPorSlug(slug: string): Tema | undefined {
  return TEMAS.find((t) => t.slug === slug);
}

export function regexDoTema(tema: Tema): RegExp | null {
  return tema.padrao ? new RegExp(tema.padrao, "i") : null;
}

/** Uma proposição pertence ao tema? Avaliado em memória, ver `lib/destaques.ts`. */
export function casaComTema(
  tema: Tema,
  prop: { ementa?: string | null; keywords?: string | null; temas_oficiais?: string[] | null },
  direitosDaAnalise: string[] = []
): boolean {
  if (tema.temasOficiais?.some((t) => (prop.temas_oficiais ?? []).includes(t))) return true;
  if (tema.direitos?.some((d) => direitosDaAnalise.includes(d))) return true;
  const rx = regexDoTema(tema);
  if (rx && rx.test(`${prop.ementa ?? ""} ${prop.keywords ?? ""}`)) return true;
  return false;
}
