/**
 * Ordenação dos verbetes dentro de um mesmo dia da memória.
 *
 * Papel no portal: definir, em UM só lugar, "a ordem em que a mística do
 * dia apresenta" os fatos daquela data. Duas telas dependem dessa regra e
 * não podem divergir:
 *
 *   1. a "Mística do Dia" da home (`lib/memoria/mistica.ts`), que monta o
 *      índice dia → entradas; e
 *   2. a visão CALENDÁRIO da página `/memoria`
 *      (`app/memoria/CalendarioMemoria.tsx`), que agrupa por mês e dia
 *      ignorando o ano.
 *
 * Por que um módulo próprio (e não exportar de `mistica.ts`): `mistica.ts`
 * importa o `CALENDARIO` inteiro (centenas de verbetes). A visão calendário
 * é um componente de CLIENTE; importar `mistica.ts` arrastaria o acervo
 * inteiro para o bundle do navegador (AGENTS §5.1 — coleção nunca infla o
 * que vai ao cliente). Este arquivo é pura função de texto, sem dado.
 *
 * Regra de desempate (dono, 29/09/2026): entrada COM link primeiro (fonte
 * conferível), depois o ano mais antigo, depois a ordem alfabética do
 * título. Entrada sem ano vai para o fim (ano tratado como "9999"), porque
 * data desconhecida não pode fingir ser a mais antiga.
 */

/** Campos mínimos para ordenar um verbete como a mística do dia ordena. */
export interface OrdenavelNaMistica {
  /** Link da fonte; quando presente, ganha prioridade na lista do dia. */
  url?: string;
  /** Ano do fato em texto; vazio = a fonte não datou. */
  ano: string;
  /** Título do verbete, usado no desempate final. */
  titulo: string;
}

/**
 * Comparador determinístico da mística. Devolve negativo, zero ou positivo,
 * no contrato do `Array.prototype.sort`.
 *
 * Determinismo importa: a mesma data tem de dar sempre a mesma mística.
 * Por isso nada de `Math.random` nem de depender da ordem de entrada.
 */
export function compararNaMistica(a: OrdenavelNaMistica, b: OrdenavelNaMistica): number {
  // 0 = tem link (vem primeiro), 1 = não tem.
  const pesoLink = (e: OrdenavelNaMistica) => (e.url ? 0 : 1);
  if (pesoLink(a) !== pesoLink(b)) return pesoLink(a) - pesoLink(b);

  // Ano vazio vira "9999": vai para o fim, sem forjar antiguidade.
  const anoA = a.ano || "9999";
  const anoB = b.ano || "9999";
  if (anoA !== anoB) return anoA.localeCompare(anoB);

  return a.titulo.localeCompare(b.titulo, "pt-BR");
}

/** Ordena (sem mutar) uma lista de verbetes na ordem da mística do dia. */
export function ordenarNaMistica<T extends OrdenavelNaMistica>(lista: readonly T[]): T[] {
  return [...lista].sort(compararNaMistica);
}
