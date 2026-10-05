"use client";

/**
 * RolagemSuave — Lenis (https://lenis.darkroom.engineering) no modo raiz:
 * a roda do mouse e a barra de espaço rolam com interpolação suave em
 * TODA a página, em vez do salto seco do navegador.
 *
 * Por que mora no layout RAIZ (decisão, 05/10/2026): a rolagem é do
 * documento inteiro, não de uma página — e a raiz NÃO desmonta na
 * navegação (regra da casca persistente, AGENTS §5.13), então o Lenis
 * sobe uma vez e não reinicia a cada troca de página.
 *
 * Regras que este componente honra:
 * - `prefers-reduced-motion: reduce` → Lenis NEM monta; scroll nativo;
 * - toggle do rodapé (`BotaoRolagemSuave`) → desliga de verdade, sem
 *   só esconder o efeito: o componente sai da árvore e o navegador
 *   volta ao scroll original;
 * - âncoras (`#conteudo-principal`, `#frentes`...) → opção `anchors`
 *   do Lenis faz o salto suave; sem Lenis, o salto nativo do navegador
 *   continua funcionando.
 *
 * A preferência é um "store externo" (localStorage + media query) e é
 * lida com `useSyncExternalStore` — padrão que o React recomenda para
 * estado que vive FORA do React, e que evita setState dentro de efeito
 * (regra `react-hooks/set-state-in-effect` do ESLint deste repo).
 * O snapshot do SERVIDOR é `false` (children cru, scroll nativo), então
 * o HTML pré-renderizado nunca carrega Lenis — ele entra na hidratação.
 */

import { useSyncExternalStore, type ReactNode } from "react";
import { ReactLenis } from "lenis/react";

/** Chave de localStorage — "off" desliga; ausente/qualquer outro = ligado. */
export const CHAVE_ROLAGEM_SUAVE = "cp_rolagem_suave";

/** Nome do evento que o `BotaoRolagemSuave` dispara ao alternar. */
export const EVENTO_ROLAGEM_SUAVE = "cp-rolagem-suave";

/**
 * Lê a preferência JÁ COMBINADA com reduced-motion: é ESTE o estado que
 * decide se o Lenis existe. Snapshot puro e booleano — o React compara
 * por Object.is entre renders para detectar mudança.
 */
function lerAtivo(): boolean {
  let preferencia = true;
  try {
    preferencia = localStorage.getItem(CHAVE_ROLAGEM_SUAVE) !== "off";
  } catch {
    // localStorage bloqueado: assume ligado (comportamento padrão).
  }
  return preferencia && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Fontes de mudança do store: o toggle do rodapé (evento), mudança em
 * outra aba (`storage`) e o usuário alternando reduced-motion no SO.
 */
function subscrever(notificar: () => void): () => void {
  window.addEventListener(EVENTO_ROLAGEM_SUAVE, notificar);
  window.addEventListener("storage", notificar);
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notificar);
  return () => {
    window.removeEventListener(EVENTO_ROLAGEM_SUAVE, notificar);
    window.removeEventListener("storage", notificar);
    media.removeEventListener("change", notificar);
  };
}

export default function RolagemSuave({ children }: { children: ReactNode }) {
  // No servidor e na pintura inicial da hidratação: `false` (children
  // cru). O React re-renderiza com o snapshot do cliente em seguida —
  // sem divergência de hidratação, sem setState em efeito.
  const ativo = useSyncExternalStore(subscrever, lerAtivo, () => false);

  // Sem Lenis (snapshot do servidor, reduced-motion ou toggle off):
  // devolve o children cru — a página rola como sempre rolou.
  if (!ativo) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root
      options={{
        // Suavização: 1 = sem suavização, 0 = lentíssimo. 0.12 é o
        // padrão do Lenis — perceptível, sem atrapalhar quem tem pressa.
        lerp: 0.12,
        // Saltos de âncora (#...) animados pelo próprio Lenis.
        anchors: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
      }}
    >
      {children}
    </ReactLenis>
  );
}
