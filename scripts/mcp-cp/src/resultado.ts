/**
 * Contrato comum das ferramentas: paginação e erro de entrada.
 *
 * Toda ferramenta é somente leitura e devolve no máximo 20 itens por chamada —
 * teto fixo de propósito. Acervo grande não vira despejo de contexto.
 */

export const LIMITE_MAXIMO = 20;

export class ErroDeEntrada extends Error {
  override readonly name = "ErroDeEntrada";
}

export interface Paginacao {
  limite: number;
  deslocamento: number;
}

/** Valida `limite` (1..20, padrão 10) e `deslocamento` (>= 0) vindos do cliente. */
export function limitarPagina(
  limite: number | undefined,
  deslocamento: number | undefined,
  padrao = 10,
): Paginacao {
  const limitePedido = limite ?? padrao;
  if (!Number.isInteger(limitePedido) || limitePedido < 1) {
    throw new ErroDeEntrada("`limite` precisa ser inteiro de 1 a 20.");
  }
  if (limitePedido > LIMITE_MAXIMO) {
    throw new ErroDeEntrada(`\`limite\` máximo é ${LIMITE_MAXIMO}.`);
  }
  const deslocamentoPedido = deslocamento ?? 0;
  if (!Number.isInteger(deslocamentoPedido) || deslocamentoPedido < 0) {
    throw new ErroDeEntrada("`deslocamento` precisa ser inteiro maior ou igual a 0.");
  }
  return { limite: limitePedido, deslocamento: deslocamentoPedido };
}
