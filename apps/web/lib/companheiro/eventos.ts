/**
 * Eventos globais do companheiro Seu Nonô — um canal, um estado.
 *
 * O companheiro vive no layout raiz (`app/components/CompanheiroFlutuante.tsx`)
 * e não desmonta ao navegar. Qualquer página pode conversar com ele por
 * `window`, sem prop drilling e sem importar o componente (que é de cliente).
 *
 * Mesmo padrão do rádio em `lib/radio/eventos.ts`: o emissor publica um evento
 * nomeado, o ouvinte único reage. Aqui o canal é o "404": quando a página não
 * existe, `app/not-found.tsx` (componente de servidor, que não pode usar hook)
 * monta `SinalizarErro404`, e este dispara `cp:companheiro-failed`. O pet
 * escuta e entra no estado "failed" por alguns segundos.
 *
 * Manter a string do evento numa constante evita erro de digitação silencioso:
 * um emissor e um ouvinte com nomes diferentes simplesmente não se encontram —
 * e nenhum teste quebraria por isso.
 */

/** Página não encontrada (404): pede ao pet para "falhar" por um tempo. */
export const EVENTO_COMPANHEIRO_FAILED = "cp:companheiro-failed";

/**
 * Quanto tempo o bicho fica no estado "failed" após o sinal, em ms.
 *
 * Seis segundos é tempo suficiente para a pessoa ver o bicho "triste" ao cair
 * numa página que não existe, sem travar o passeio por muito tempo. O atlas já
 * traz a linha própria ("failed", índice 5), então é só duração, não arte nova.
 */
export const DURACAO_FALHA_MS = 6000;

/** Avisa o companheiro de que a página atual não foi encontrada. */
export function sinalizarErroCompanheiro(): void {
  // Guarda de SSR: durante o render no servidor não existe `window`.
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_COMPANHEIRO_FAILED));
}
