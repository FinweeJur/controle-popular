import DATASET, {
  ORDEM_ITENS,
  ROTULO_ITEM,
  ROTULO_STATUS,
  SLUGS_PRIORITARIOS,
  VERIFICADO_EM,
  type ChaveItem,
  type ItemLegislacao,
  type StatusItem,
} from "./dados";

/**
 * ═══ LÓGICA PURA DA TELA DE LEGISLAÇÃO (Sprint 4) ═══
 *
 * Mesmo molde de `cruzamentos-puro.ts`/`contratos-indicios.ts`: tudo aqui é
 * função pura, testável sem React nem rede; o componente de cliente só liga
 * estado e UI. As invariantes que a tela PROMETE ao leitor moram AQUI e são
 * pinçadas por teste:
 * - só `encontrado` tem link (e ele é de domínio oficial .gov.br);
 * - `nao_encontrado`/`nao_verificado` NUNCA renderizam link — ausência de
 *   link é a informação;
 * - todo item negativo carrega nota dizendo onde foi procurado/onde
 *   procurar;
 * - os cinco instrumentos aparecem SEMPRE, em ordem fixa, para qualquer
 *   município (não-prioritário entra como "não verificado" com nota padrão).
 */

export interface LinhaLegislacao {
  chave: ChaveItem;
  rotulo: string;
  status: StatusItem;
  statusLabel: string;
  /** URL pronta para `<a>` — null nos status negativos, por construção. */
  href: string | null;
  ano: number | null;
  fonteLabel: string | null;
  nota: string | null;
}

const ITENS_PADRAO: ItemLegislacao[] = ORDEM_ITENS.map((chave) => ({
  chave,
  status: "nao_verificado" as const,
}));

/** Itens do município na ordem canônica dos cinco instrumentos. */
export function itensDaCidade(slug: string): ItemLegislacao[] {
  const itens = DATASET[slug] ?? ITENS_PADRAO;
  return ORDEM_ITENS.map(
    (chave) =>
      itens.find((i) => i.chave === chave) ?? {
        chave,
        status: "nao_verificado" as const,
      }
  );
}

/** O município está no conjunto verificado desta sprint? */
export function ehPrioritario(slug: string): boolean {
  return (SLUGS_PRIORITARIOS as readonly string[]).includes(slug);
}

/**
 * O LINK da linha — ou null. É AQUI que a promessa editorial vira código:
 * sem status `encontrado`, não existe link, mesmo que o dado bruto traga
 * uma URL solta (defensiva contra erro futuro de digitação no dataset).
 */
export function linkDoItem(item: ItemLegislacao): string | null {
  if (item.status !== "encontrado") return null;
  return item.url ?? null;
}

/** Linha pronta para a tabela da tela. */
export function linhaDaTabela(item: ItemLegislacao): LinhaLegislacao {
  return {
    chave: item.chave,
    rotulo: ROTULO_ITEM[item.chave],
    status: item.status,
    statusLabel: ROTULO_STATUS[item.status],
    href: linkDoItem(item),
    ano: item.ano ?? null,
    fonteLabel: item.fonteLabel ?? null,
    nota: item.nota ?? null,
  };
}

export function linhasDaTabela(slug: string): LinhaLegislacao[] {
  return itensDaCidade(slug).map(linhaDaTabela);
}

export function filtrarPorStatus<T extends { status: StatusItem }>(
  linhas: T[],
  status: StatusItem | ""
): T[] {
  if (!status) return linhas;
  return linhas.filter((l) => l.status === status);
}

export function contagemPorStatus(linhas: LinhaLegislacao[]): Record<StatusItem, number> {
  const contagem: Record<StatusItem, number> = {
    encontrado: 0,
    nao_encontrado: 0,
    nao_verificado: 0,
  };
  for (const l of linhas) contagem[l.status] += 1;
  return contagem;
}

export { VERIFICADO_EM };
