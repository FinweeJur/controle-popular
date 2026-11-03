/**
 * @file estrela-scroll.ts
 * @description Cálculo puro da posição da estrela que desce pela linha do
 * tempo conforme o scroll (efeito "scroll-star", reimplementação própria —
 * o registry do Lightswind responde 401, não há código público para copiar).
 *
 * ═══ O QUE A FUNÇÃO DECIDE ═══
 *
 * A estrela mora na altura de 55% da janela de visualização. Ela percorre a
 * trilha do primeiro ao último item exatamente enquanto a seção atravessa a
 * tela: quando o topo da trilha chega à âncora, o progresso é 0; quando o fim
 * da trilha passa da âncora, é 1. Fora disso fica presa nas pontas — por isso
 * o recorte em [0, 1]. A trilha nunca sai da própria seção, então a estrela
 * também nunca aparece em outro lugar.
 *
 * ═══ POR QUE FICA AQUI, FORA DO COMPONENTE ═══
 *
 * É aritmética sem DOM: mora em `lib/` ao lado do teste — o `vitest` deste
 * repo só executa testes sob `lib/` (medido em 03/11/2026). O componente
 * cliente `ScrollStar.tsx` mede `getBoundingClientRect()` e joga os números
 * aqui; a fórmula pode ser conferida sem navegador.
 */

/** Âncora da estrela: fração da altura da janela em que ela "mora". */
export const ANCORAGEM_DA_ESTRELA = 0.55;

/**
 * Progresso da estrela ao longo da trilha, de 0 (topo) a 1 (fim).
 *
 * @param topoDaTrilha — `rect.top` da trilha (px, relativo à janela; pode ser
 *        negativo quando o usuário já rolou além do topo da seção).
 * @param alturaDaTrilha — `rect.height` da trilha, em px.
 * @param alturaDaJanela — `window.innerHeight`, em px.
 * @returns progresso em [0, 1]; 0 em trilha degenerada (altura zero/negativa,
 *          NaN ou `Infinity` — tela em transição de layout).
 */
export function progressoDaEstrela(
  topoDaTrilha: number,
  alturaDaTrilha: number,
  alturaDaJanela: number,
): number {
  // Trilha sem altura (display:none, layout em curso) ou número não finito:
  // nada a percorrer — devolve 0 e deixa a estrela presa no topo.
  if (!Number.isFinite(alturaDaTrilha) || alturaDaTrilha <= 0) return 0;
  if (!Number.isFinite(topoDaTrilha) || !Number.isFinite(alturaDaJanela)) return 0;

  const ancora = alturaDaJanela * ANCORAGEM_DA_ESTRELA;
  const bruto = (ancora - topoDaTrilha) / alturaDaTrilha;
  if (!Number.isFinite(bruto)) return 0;
  return Math.min(1, Math.max(0, bruto));
}
