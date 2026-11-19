/**
 * @file estacao-lembrada.ts
 * @description Memória da última rádio tocada, entre visitas.
 *
 * POR QUE EXISTE (dono, 18/11/2026): quando a página recarregava (link que
 * abre documento novo, F5, voltar de outra aba) o player voltava vazio e o
 * leitor tinha de achar a estação no índice outra vez. O id fica em
 * `localStorage` e o botão volta nele; NÃO há autoplay — o navegador bloqueia
 * áudio com som sem gesto, então o primeiro toque retoma.
 *
 * `localStorage` pode lançar (modo privado, cota cheia); todas as funções
 * engolem o erro e o site segue sem memória.
 */

/** Chave única da estação lembrada (não trocar sem migrar o storage). */
export const CHAVE_ESTACAO = "cp_radio_estacao";

/** Id salvo, ou `null` quando não há memória legível. */
export function lerEstacaoLembrada(): string | null {
  try {
    return window.localStorage.getItem(CHAVE_ESTACAO);
  } catch {
    return null;
  }
}

/** Grava a estação atual; `null` não apaga a memória anterior. */
export function salvarEstacaoLembrada(id: string | null): void {
  if (!id) return;
  try {
    window.localStorage.setItem(CHAVE_ESTACAO, id);
  } catch {
    // Sem storage, nada quebra.
  }
}
