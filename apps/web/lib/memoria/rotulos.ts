/**
 * Rótulos e agrupamentos da linha do tempo da memória.
 *
 * Papel no portal: dar nome por extenso a cada tipo de luta e agrupar os
 * verbetes por século, para a página `/memoria` (linha do tempo da
 * história das lutas e resistências). Cor nunca é o único canal — por
 * isso o tipo vira texto, e não só etiqueta colorida (AGENTS.md §8).
 *
 * Fonte oficial das regras: `docs/planos/PLANO-MEMORIA-RESISTENCIAS.md`
 * (vocabulário de luta) e `apps/web/lib/memoria/tipos.ts` (o tipo
 * `TipoLuta`). Os rótulos abaixo são a tradução por extenso do
 * vocabulário do plano — se um tipo novo nascer em `tipos.ts`, nasce
 * aqui também (há teste de guarda que compara os dois).
 */

import type { TipoLuta } from "./tipos";

/**
 * Nome por extenso de cada tipo de luta. A ordem define a ordem de
 * exibição dos filtros na tela.
 */
export const ROTULO_TIPO: Record<TipoLuta, string> = {
  revolta: "Revolta",
  resistencia: "Resistência",
  greve: "Greve",
  quilombo: "Quilombo",
  indigena: "Povos indígenas",
  campo: "Luta no campo",
  direitos: "Direitos",
  anistia: "Anistia e ditadura",
};

/** A ordem canônica dos tipos (a mesma das chaves de `ROTULO_TIPO`). */
export const TIPOS_ORDEM = Object.keys(ROTULO_TIPO) as TipoLuta[];

/** Números romanos até o século XXI; acima disso, algarismo comum. */
const ROMANOS = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
  "XXI",
];

/**
 * Século do ano do fato, para agrupar a linha do tempo.
 *
 * Regra do calendário: o ano 1600 pertence ao século XVI (1501-1600),
 * por isso `Math.ceil(ano / 100)`. Fato sem ano não ganha século
 * inventado — volta "Sem data", e a tela declara a lacuna (AGENTS §7).
 */
export function seculoDe(ano: string): string {
  const n = Number(ano);
  if (!ano || !Number.isFinite(n) || n <= 0) return "Sem data";
  const seculo = Math.ceil(n / 100);
  return seculo <= ROMANOS.length ? `Século ${ROMANOS[seculo - 1]}` : `Século ${seculo}`;
}

/**
 * Número do século para ordenar (1 = século I; 0 = sem data).
 * "Sem data" fica por último na linha do tempo, sem forjar posição.
 */
export function numeroDoSeculo(ano: string): number {
  const n = Number(ano);
  if (!ano || !Number.isFinite(n) || n <= 0) return 0;
  return Math.ceil(n / 100);
}
