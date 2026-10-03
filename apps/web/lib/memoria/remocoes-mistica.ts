/**
 * Remoções da memória — verbetes cuja data guardada está errada.
 *
 * POR QUE EXISTE: o `calendario.ts` é gerado e não se edita à mão; o gerador
 * às vezes cola um fato no dia errado. Aqui a curadoria REMOVE o verbete pelo
 * `chaveCorrecao()` (dia/mês + ano + início do título) e, quando o fato não se
 * perde, ele volta corrigido em `recolocados-mistica.ts`.
 *
 * Caso que abriu isto (dono, 03/10/2026): o verbete do Dom Hélder morava em
 * 21/12 mas o texto diz que ele faleceu em 27 de agosto de 1999 — data errada
 * na tela é dano.
 */

export const REMOVIDOS = new Set<string>([
  // Nascimento do Dom Hélder: guardado em 09/13, nascido em 07/02/1909.
  "09-13|s/ano|dom helder pessoa camara nasceu em fortaleza, ce",
  // Morte do Dom Hélder: guardado em 12/21, falecido em 27/08/1999.
  "12-21|s/ano|as posicoes de dom helder camara frente a ditadu",
]);
