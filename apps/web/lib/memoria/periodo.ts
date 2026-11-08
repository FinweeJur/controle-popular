/**
 * @file periodo.ts
 * @description Ordenação cronológica dos períodos da vitrine de lutas.
 *
 * O campo `periodo` é TEXTO livre ("1983-1984", "década de 1970-1980",
 * "séculos XX e XXI") — ordenar por string coloca "1888" depois de "1979".
 * A função extrai o primeiro ano de quatro dígitos; sem dígitos, converte o
 * século romano para o primeiro ano dele; sem nada, manda para o fim (9999).
 *
 * Pedido do dono (08/11/2026): a linha do tempo de fatos de
 * `/direitos-em-movimento` tem de seguir ordem cronológica.
 */

const ROMANOS: Record<string, number> = {
  I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000,
};

function romanoParaNumero(texto: string): number {
  let total = 0;
  for (let i = 0; i < texto.length; i++) {
    const atual = ROMANOS[texto[i]] ?? 0;
    const proximo = ROMANOS[texto[i + 1]] ?? 0;
    total += atual < proximo ? -atual : atual;
  }
  return total;
}

/** Ano de início do período, para ordenar. Sem data reconhecível = 9999. */
export function anoDoPeriodo(periodo: string): number {
  const texto = String(periodo ?? "").toLowerCase();
  const ano = texto.match(/\d{4}/);
  if (ano) return Number(ano[0]);
  const seculo = texto.match(/s[eé]culos?\s+([ivxlcdm]+)/i);
  if (seculo) {
    const numero = romanoParaNumero(seculo[1].toUpperCase());
    if (numero > 0) return (numero - 1) * 100 + 1;
  }
  return 9999;
}
