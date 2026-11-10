"use client";

/**
 * @file useControlePilha.ts
 * @description Quem revela e quem esconde a pilha da esquerda.
 *
 * O ponteiro entra no Seu Nonô (ou em qualquer item marcado com
 * `data-cp-pilha`) e a pilha aparece; sai de todos e ela some. A saída tem
 * 300 ms de carência para o dedo/mouse atravessar o vão entre um botão e
 * outro sem piscar. Teclado usa o mesmo caminho: `focusin` revela e
 * `focusout` agenda o fechamento.
 *
 * Montado UMA vez, no `SeuNono` (que está em toda página). Os outros
 * componentes só leem o estado (`usePilhaRevelada`).
 */

import { useEffect } from "react";
import { ATRIBUTO_PILHA, definirPilhaRevelada } from "@/app/components/pilha/estadoPilha";

/** Carência da saída: cobre o vão entre os botões da pilha. */
export const ESPERA_SAIDA_PILHA_MS = 300;

/**
 * Distância (px) do ponteiro ao FAB do Seu Nonô que já revela a pilha.
 *
 * Pedido do dono (08/11/2026): "pode ser pra já aparecer direto... ou com
 * proximidade de alguns pixels". Sem isto, só o ponteiro EM CIMA do botão
 * abria a pilha, e a chegada parecia lenta.
 */
export const RAIO_PROXIMIDADE_PILHA_PX = 24;

/** Intervalo mínimo entre medições de proximidade (ms): 10 leituras/s. */
const INTERVALO_MEDICAO_MS = 100;

/** O alvo (ou um ancestral) faz parte da pilha? */
function dentroDaPilha(alvo: EventTarget | null): boolean {
  return alvo instanceof Element && Boolean(alvo.closest(`[${ATRIBUTO_PILHA}]`));
}

export default function useControlePilha(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cancelarSaida = () => {
      if (!timer) return;
      clearTimeout(timer);
      timer = null;
    };

    const revelar = () => {
      cancelarSaida();
      definirPilhaRevelada(true);
    };

    const agendarSaida = () => {
      cancelarSaida();
      timer = setTimeout(() => {
        timer = null;
        definirPilhaRevelada(false);
      }, ESPERA_SAIDA_PILHA_MS);
    };

    // Chegada por PROXIMIDADE: não precisa acertar o FAB. Mede a distância
    // até o botão do Seu Nonô 10x/s (suficiente para o olho) e revela dentro
    // de `RAIO_PROXIMIDADE_PILHA_PX`.
    let ultimaMedicao = 0;
    const aoMover = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const agora = performance.now();
      if (agora - ultimaMedicao < INTERVALO_MEDICAO_MS) return;
      ultimaMedicao = agora;
      const caixa = document
        .querySelector('[aria-label="Abrir assistente Seu Nonô"]')
        ?.getBoundingClientRect();
      if (!caixa) return;
      const dx = Math.max(caixa.left - e.clientX, 0, e.clientX - caixa.right);
      const dy = Math.max(caixa.top - e.clientY, 0, e.clientY - caixa.bottom);
      if (Math.hypot(dx, dy) <= RAIO_PROXIMIDADE_PILHA_PX) revelar();
    };

    // `pointerover`/`pointerout` borbulham: dá para ouvir na janela e saber
    // se o alvo está na pilha sem registrar um listener por botão.
    const aoEntrar = (e: PointerEvent) => {
      if (dentroDaPilha(e.target)) revelar();
    };

    const aoSair = (e: PointerEvent) => {
      if (!dentroDaPilha(e.target)) return;
      // Indo de um item para outro da mesma pilha: não fecha.
      if (dentroDaPilha(e.relatedTarget)) return;
      agendarSaida();
    };

    const aoFocar = (e: FocusEvent) => {
      if (dentroDaPilha(e.target)) revelar();
    };

    const aoDesfocar = (e: FocusEvent) => {
      if (!dentroDaPilha(e.target)) return;
      if (dentroDaPilha(e.relatedTarget)) return;
      agendarSaida();
    };

    window.addEventListener("pointerover", aoEntrar);
    window.addEventListener("pointerout", aoSair);
    window.addEventListener("focusin", aoFocar);
    window.addEventListener("focusout", aoDesfocar);
    window.addEventListener("pointermove", aoMover, { passive: true });

    return () => {
      cancelarSaida();
      window.removeEventListener("pointerover", aoEntrar);
      window.removeEventListener("pointerout", aoSair);
      window.removeEventListener("focusin", aoFocar);
      window.removeEventListener("focusout", aoDesfocar);
      window.removeEventListener("pointermove", aoMover);
    };
  }, []);
}
