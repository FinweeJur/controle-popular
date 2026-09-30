/**
 * Temas seguidos — a lista de assuntos que o leitor quer acompanhar.
 *
 * ═══ O QUE É ═══
 *
 * Um catálogo fixo de temas do portal e as funções puras que ligam/desligam um
 * tema de uma lista guardada no `localStorage`. A lista é do leitor e fica no
 * aparelho dele — sem cadastro.
 *
 * ═══ HONESTIDADE DO "ACOMPANHAR" ═══
 *
 * Seguir um tema aqui guarda um atalho pessoal, não assina um filtro que o
 * portal ainda não tem. O aviso de novidades é geral (Telegram ou e-mail). A
 * tela diz isso com todas as letras — prometer filtro por tema seria insinuação.
 *
 * ═══ ROBUSTEZ ═══
 *
 * `desserializarTemas` nunca confia no `localStorage`: lixo vira lista vazia,
 * id que não existe no catálogo é descartado e a lista é truncada no limite.
 */

export interface Tema {
  id: string;
  titulo: string;
  descricao: string;
  /** Rota para abrir o tema. */
  href: string;
}

/** Catálogo de temas acompanháveis. */
export const TEMAS: Tema[] = [
  { id: "cidades", titulo: "Cidades", descricao: "Contratos, orçamento e atos das prefeituras e câmaras.", href: "/cidades" },
  { id: "congresso", titulo: "Congresso Nacional", descricao: "Votações, proposições e gastos dos parlamentares.", href: "/congresso" },
  { id: "judiciario", titulo: "Judiciário", descricao: "Tribunais, vagas, indicações e contatos da Justiça.", href: "/judiciario" },
  { id: "ambiental", titulo: "Meio ambiente & ONSA", descricao: "Licenças, barragens, TACs e legislação ambiental.", href: "/ambiental" },
  { id: "paraopeba", titulo: "Paraopeba & Brumadinho", descricao: "A reparação, os repasses e a linha do tempo.", href: "/paraopeba" },
  { id: "terras", titulo: "Terra e territórios", descricao: "Terras públicas, indígenas e quilombolas; o globo 3D.", href: "/terra-e-territorios" },
  { id: "governo", titulo: "Governos & promessas", descricao: "Planos de governo e o que foi executado.", href: "/governo" },
  { id: "memoria", titulo: "Memória das lutas", descricao: "Resistências e revoltas, com data e fonte.", href: "/memoria" },
];

/** Teto de temas seguidos. */
export const LIMITE_TEMAS = 20;

/** Ids válidos do catálogo. */
function idsValidos(): Set<string> {
  return new Set(TEMAS.map((t) => t.id));
}

/** Diz se o tema já está na lista. */
export function contemTema(ids: string[], id: string): boolean {
  return ids.includes(id);
}

/** Liga/desliga um tema (mantém a ordem do catálogo). */
export function alternarTema(ids: string[], id: string): string[] {
  if (!idsValidos().has(id)) return ids;
  if (contemTema(ids, id)) return ids.filter((i) => i !== id);
  return TEMAS.map((t) => t.id).filter((t) => ids.includes(t) || t === id).slice(0, LIMITE_TEMAS);
}

/** Serializa a lista para o `localStorage`. */
export function serializarTemas(ids: string[]): string {
  return JSON.stringify(ids);
}

/** Lê a lista do `localStorage`, descartando lixo e ids fora do catálogo. */
export function desserializarTemas(bruto: string | null): string[] {
  if (!bruto) return [];
  try {
    const dados: unknown = JSON.parse(bruto);
    if (!Array.isArray(dados)) return [];
    const validos = idsValidos();
    return dados.filter((d): d is string => typeof d === "string" && validos.has(d)).slice(0, LIMITE_TEMAS);
  } catch {
    return [];
  }
}

/** Temas seguidos, na ordem do catálogo. */
export function temasSeguidos(ids: string[]): Tema[] {
  return TEMAS.filter((t) => ids.includes(t.id));
}
