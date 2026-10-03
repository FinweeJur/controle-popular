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
  // Duplicatas em dia errado — o verbete certo JÁ existe na data correta
  // (a triagem de `checar-datas-mistica.mts` pegou o par):
  // Olívio Albani morto em 12/06/1989 (a versão certa está em 06-12).
  "02-22|s/ano|1989: morte de olivio albani, lider sem-terra ol",
  // Massacre de Timóteo, em 07/10/1963 (a versão certa está em 10-07; esta
  // repetia o mesmo texto, sem resumo, guardada em 31/03/1964 pela menção ao
  // Golpe).
  "03-31|1964|para o padre abdala jorge, paroco de timoteo, o ",
  // Miguel Enríquez, morto em 05/10/1974 (a versão certa está em 10-05; esta
  // repetia o texto em 12-06).
  "12-06|s/ano|1974: morto em combate miguel enriquez, secretar",
]);
