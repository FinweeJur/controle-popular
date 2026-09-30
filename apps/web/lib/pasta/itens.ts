/**
 * Pasta de dossiê — lógica pura do "carrinho" de páginas, sem cadastro.
 *
 * ═══ O QUE É ═══
 *
 * Funções que administram uma lista de itens que o leitor junta ao navegar
 * (uma página, uma tabela, uma lei) para, no fim, exportar tudo junto — o
 * dossiê. A lista mora no `localStorage` do próprio aparelho; nada vai para
 * servidor e ninguém precisa de conta.
 *
 * ═══ POR QUE "CARRINHO" ═══
 *
 * É o mesmo gesto de uma loja: escolher, guardar, fechar o pedido. Aqui o
 * "pedido" é um relatório com a fonte de cada item. Juntar documentos de
 * páginas diferentes num arquivo só é o que jornalista, vereador e defensor
 * público fazem à mão hoje — a pasta automatiza isso.
 *
 * ═══ ROBUSTEZ ═══
 *
 * `desserializar` nunca confia no `localStorage`: item sem campos mínimos é
 * descartado, tipo desconhecido vira "pagina", e a lista é truncada no
 * limite. Guarda que confia quebra a página inteira.
 *
 * ═══ EDITORIAL ═══
 *
 * O item guarda só o endereço e o título. O conteúdo continua vindo da
 * página oficial, com a fonte e a data — a pasta junta, não copia.
 */

export type TipoItemPasta = "pagina" | "tabela" | "documento" | "lei" | "nota";

/** Tipos aceitos, para validar o que volta do `localStorage`. */
export const TIPOS_ITEM: TipoItemPasta[] = ["pagina", "tabela", "documento", "lei", "nota"];

export interface ItemPasta {
  /** Chave estável — o endereço (rota + busca). */
  id: string;
  /** Título de exibição. */
  titulo: string;
  /** Rota interna para reabrir o item. */
  href: string;
  tipo: TipoItemPasta;
  /** Data ISO em que entrou na pasta. */
  adicionadoEm: string;
}

/** Teto de itens na pasta — evita lista infinita. */
export const LIMITE_ITENS = 100;

/** Diz se o item já está na pasta, pelo endereço. */
export function contemItem(lista: ItemPasta[], id: string): boolean {
  return lista.some((i) => i.id === id);
}

/**
 * Adiciona um item no topo da lista (sem duplicar), respeitando o limite.
 * Se o item já existe, a lista volta igual — a tela avisa "já estava".
 */
export function adicionarItem(lista: ItemPasta[], item: ItemPasta): ItemPasta[] {
  if (contemItem(lista, item.id)) return lista;
  return [item, ...lista].slice(0, LIMITE_ITENS);
}

/** Remove o item pelo endereço. */
export function removerItem(lista: ItemPasta[], id: string): ItemPasta[] {
  return lista.filter((i) => i.id !== id);
}

/** Serializa a pasta para guardar no `localStorage`. */
export function serializar(lista: ItemPasta[]): string {
  return JSON.stringify(lista);
}

/** Lê a pasta do `localStorage`, tolerando lixo e truncando no limite. */
export function desserializar(bruto: string | null): ItemPasta[] {
  if (!bruto) return [];
  try {
    const dados: unknown = JSON.parse(bruto);
    if (!Array.isArray(dados)) return [];
    return dados
      .filter((d): d is Record<string, unknown> => !!d && typeof d === "object")
      .map((d) => ({
        id: typeof d.id === "string" ? d.id : "",
        titulo: typeof d.titulo === "string" ? d.titulo : "",
        href: typeof d.href === "string" ? d.href : "",
        tipo: (TIPOS_ITEM as string[]).includes(String(d.tipo))
          ? (d.tipo as TipoItemPasta)
          : "pagina",
        adicionadoEm: typeof d.adicionadoEm === "string" ? d.adicionadoEm : "",
      }))
      .filter((i) => i.id !== "" && i.titulo !== "" && i.href !== "")
      .slice(0, LIMITE_ITENS);
  } catch {
    return [];
  }
}
