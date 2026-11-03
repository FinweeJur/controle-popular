/**
 * @file estrela-scroll.ts
 * @description Cálculo puro da posição da estrela que desce pela linha do
 * tempo conforme o scroll (efeito "scroll-star", reimplementação própria —
 * o registry do Lightswind responde 401, não há código público para copiar).
 *
 * ═══ O QUE A ESTRELA FAZ (revisão do dono, 03/11/2026) ═══
 *
 * Ela não persegue o scroll de forma solta: fica CERTINHA no evento
 * relacionado — o item da linha que está sob a âncora de 55% da janela —,
 * centralizada verticalmente nesse item, e desce de evento em evento. Um
 * passo por evento, com a transição curta do CSS fazendo o "scroll
 * controlado": rolar devagar atravessa um item por vez; rolar o scroll
 * inteiro num pulo leva a estrela direto ao item que está sob a âncora,
 * presa nas pontas fora da seção.
 *
 * ═══ POR QUE FICA AQUI, FORA DO COMPONENTE ═══
 *
 * É aritmética sem DOM: mora em `lib/` ao lado do teste — o `vitest` deste
 * repo só executa testes sob `lib/` (medido em 03/11/2026). O componente
 * cliente `ScrollStar.tsx` mede as caixas e joga os números aqui; a fórmula
 * pode ser conferida sem navegador.
 */

/** Âncora da estrela: fração da altura da janela em que ela procura o evento. */
export const ANCORAGEM_DA_ESTRELA = 0.55;

/**
 * Índice do evento que está sob o alvo (coordenada do DOCUMENTO, px).
 *
 * O evento é o `<li>` cujo intervalo [topo, fim] contém o alvo. Alvo numa
 * brecha entre dois eventos (margem da lista) continua no anterior — é o
 * que impõe a "descida controlada": um salto só quando a âncora cruza o
 * próximo item, nunca fica trocando na borda.
 *
 * @param alvoDoc — posição da âncora em coordenadas de documento.
 * @param topos — topo de cada evento, em coordenadas de documento (crescente).
 * @param fins — fim de cada evento (mesmo índice de `topos`).
 * @returns índice em [0, n-1]; -1 quando não há eventos (lista vazia/filtro
 *          sem resultado — o componente prende a estrela no topo da trilha).
 */
export function eventoNoAlvo(
  alvoDoc: number,
  topos: readonly number[],
  fins: readonly number[],
): number {
  const n = topos.length;
  if (n === 0 || n !== fins.length) return -1;
  if (!Number.isFinite(alvoDoc)) return 0;
  if (alvoDoc <= topos[0]) return 0; // antes do primeiro: presa no primeiro
  if (alvoDoc >= fins[n - 1]) return n - 1; // depois do último: presa no último

  // Binária no maior topo ≤ alvo — as listas são longas (/memoria ~260 itens
  // na tela) e o quadro roda a cada scroll: O(log n) por projeto.
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (topos[mid] <= alvoDoc) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * Onde o CENTRO do ponto fica, em px dentro da trilha, para o ponto casar
 * com o centro vertical do evento — e nunca sair da trilha.
 *
 * @param centroEventoDoc — centro vertical do evento, em coordenadas de documento.
 * @param topoTrilhaDoc — topo da trilha, em coordenadas de documento.
 * @param alturaTrilha — altura da trilha, em px.
 * @param alturaPonto — altura do ponto, em px (lida do DOM: escala com a
 *        fonte maior que o leitor choose no controle de tamanho de texto).
 * @returns `top` em px do canto do ponto, limitado a [0, trilha − ponto].
 */
export function topoDoPonto(
  centroEventoDoc: number,
  topoTrilhaDoc: number,
  alturaTrilha: number,
  alturaPonto: number,
): number {
  if (!(alturaTrilha > 0) || !(alturaPonto > 0)) return 0;
  if (!Number.isFinite(centroEventoDoc) || !Number.isFinite(topoTrilhaDoc)) return 0;
  const bruto = centroEventoDoc - topoTrilhaDoc - alturaPonto / 2;
  return Math.min(Math.max(0, bruto), alturaTrilha - alturaPonto);
}
