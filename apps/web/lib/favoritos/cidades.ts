/**
 * Cidades favoritas — lógica pura da lista "Minhas cidades", sem cadastro.
 *
 * ═══ O QUE É ═══
 *
 * Funções que ligam e desligam uma cidade de uma lista e que (de)serializam
 * essa lista para o `localStorage` do navegador. A lista é do LEITOR: mora no
 * aparelho dele, não no servidor. Nenhuma conta, nenhum rastro.
 *
 * ═══ POR QUE FICA NO NAVEGADOR ═══
 *
 * É o que sustenta a promessa "sem catraca" (plano do ecossistema): o vínculo
 * com as cidades não exige login nem banco. O custo é zero e a privacidade é
 * total. O trade-off conhecido — trocar de aparelho perde a lista — está
 * declarado na tela, não escondido.
 *
 * ═══ ROBUSTEZ DA LEITURA ═══
 *
 * `desserializar` nunca confia no que veio do `localStorage`: ele pode ter
 * sido editado à mão, corrompido ou gravado por uma versão antiga. Lixo vira
 * lista vazia; item sem os campos mínimos é descartado; a lista é truncada no
 * limite. Guarda que confia é guarda que quebra a página inteira.
 */

export interface CidadeFavorita {
  /** Código IBGE de 7 dígitos — a chave estável (nunca casar por nome). */
  id: string;
  /** Nome de exibição. */
  nome: string;
  /** Unidade federativa. */
  uf: string;
  /** Rota para abrir a cidade. */
  href: string;
}

/** Teto de cidades seguidas — evita lista infinita e payload absurdo. */
export const LIMITE_FAVORITOS = 30;

/** Diz se a cidade já está na lista. */
export function contemFavorito(lista: CidadeFavorita[], id: string): boolean {
  return lista.some((c) => c.id === id);
}

/**
 * Liga/desliga uma cidade da lista (toggle).
 * Cidade nova entra no topo; a lista respeita `LIMITE_FAVORITOS`.
 */
export function alternarFavorito(
  lista: CidadeFavorita[],
  cidade: CidadeFavorita,
): CidadeFavorita[] {
  if (contemFavorito(lista, cidade.id)) {
    return lista.filter((c) => c.id !== cidade.id);
  }
  return [cidade, ...lista].slice(0, LIMITE_FAVORITOS);
}

/** Serializa a lista para guardar no `localStorage`. */
export function serializar(lista: CidadeFavorita[]): string {
  return JSON.stringify(lista);
}

/** Lê a lista do `localStorage`, tolerando lixo e truncando no limite. */
export function desserializar(bruto: string | null): CidadeFavorita[] {
  if (!bruto) return [];
  try {
    const dados: unknown = JSON.parse(bruto);
    if (!Array.isArray(dados)) return [];
    return dados
      .filter((d): d is Record<string, unknown> => !!d && typeof d === "object")
      .map((d) => ({
        id: typeof d.id === "string" ? d.id : "",
        nome: typeof d.nome === "string" ? d.nome : "",
        uf: typeof d.uf === "string" ? d.uf : "",
        href: typeof d.href === "string" ? d.href : "",
      }))
      .filter((c) => c.id !== "" && c.nome !== "" && c.href !== "")
      .slice(0, LIMITE_FAVORITOS);
  } catch {
    return [];
  }
}
