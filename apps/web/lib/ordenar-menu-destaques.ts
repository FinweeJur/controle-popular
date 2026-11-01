/**
 * @file Ordenação do índice expansível da navbar: destaques primeiro.
 *
 * O menu (`app/components/menu-portal.ts`) marca com `destaque: true` as portas
 * que o dono quer no topo de cada eixo. A curadoria é feita à mão no próprio
 * menu: não existe campo de data nem de `novo`, então não há critério de
 * novidade a calcular — o conjunto de destacados continua sendo o curado ali.
 *
 * O Eixo 1 já nasceu com os destaques no topo; nos Eixos 2 e 3 eles ficaram
 * intercalados com os demais (bug do dono, 30/10/2026). Esta função move o
 * grupo destacado para cima sem reordenar dentro dos grupos: a ordem relativa
 * de cada um é editorial e precisa ser preservada.
 */

export interface ItemComDestaque {
  destaque?: boolean;
}

/**
 * Devolve um novo array com os itens `destaque: true` primeiro e os demais
 * depois, mantendo a ordem relativa dentro de cada grupo. Não muta a entrada.
 *
 * O genérico não é restrito a `ItemComDestaque`: item sem a propriedade
 * `destaque` não pode ser barrado (o tipo é todo opcional, e o TS recusaria
 * o objeto por "no properties in common"). A leitura é pontual e segura.
 */
export function destacadosPrimeiro<T>(itens: readonly T[]): T[] {
  const destaques: T[] = [];
  const demais: T[] = [];

  for (const item of itens) {
    if ((item as ItemComDestaque).destaque === true) destaques.push(item);
    else demais.push(item);
  }

  return [...destaques, ...demais];
}
