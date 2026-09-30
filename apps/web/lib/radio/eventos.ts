/**
 * Eventos do player de rádio — um canal, um estado.
 *
 * O player vive no layout raiz (`PlayerRadio.tsx`) e não desmonta ao navegar.
 * Qualquer página ou componente (cartão da `/radio`, índice do hover, botão do
 * rodapé) pede a troca de estação disparando `cp:radio-tocar`. O player escuta,
 * troca o stream e devolve o estado em `cp:radio-estado`, para que os cartões
 * marquem qual estação está no ar. É o mesmo padrão de `cp:radio-toggle`, que
 * já existia — só que agora carrega o id da estação.
 */

/** Pedido de troca/acionamento de estação. `detail = { id }`. */
export const EVENTO_TOCAR = "cp:radio-tocar";

/** Estado atual do player. `detail = EstadoRadio`. */
export const EVENTO_ESTADO = "cp:radio-estado";

/** Estado publicado pelo player. */
export interface EstadoRadio {
  /** Id da estação carregada (null quando o player nunca tocou). */
  id: string | null;
  /** `true` enquanto o áudio está tocando. */
  tocando: boolean;
  /** `true` enquanto o stream está sendo sintonizado. */
  carregando: boolean;
}

/** Pede ao player que toque (ou pause) a estação indicada. */
export function pedirTocao(id: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_TOCAR, { detail: { id } }));
}
