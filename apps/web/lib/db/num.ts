import { sql, type AnyColumn } from "drizzle-orm";

/**
 * Lê uma coluna `numeric` do Postgres como número JavaScript.
 *
 * O driver devolve `numeric` como STRING, para não perder precisão. O
 * PostgREST devolvia número, e o app inteiro foi escrito contra isso:
 * `valor - anterior`, `Math.abs(peso)`, `(a.score ?? 0) - (b.score ?? 0)`.
 * Sem converter, essas contas viram `NaN` ou concatenação de string —
 * **sem erro nenhum**, só o número errado na tela.
 *
 * Foi o modo de falha mais perigoso encontrado na migração: o TypeScript
 * pega quando a interface declara `number`, mas não pega onde o valor só
 * passeia por um `reduce` ou um `sort`.
 *
 * `double precision` é suficiente aqui — os valores são reais de orçamento
 * e coordenadas, não dinheiro que precise de aritmética exata. Onde
 * precisão decimal importar, ler como string e usar a string.
 */
export function num(coluna: AnyColumn) {
  return sql<number>`(${coluna})::double precision`;
}
