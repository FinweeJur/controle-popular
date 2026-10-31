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

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import type Lenis from "lenis";

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

function vigiarRolagem(obter: () => Lenis | null): () => void {
  let observador: ResizeObserver | null = null;

  const conferir = () => {
    if (document.hidden) return;
    const lenis = obter();
    if (!lenis) return;

    if (!observador) {
      observador = new ResizeObserver(() => lenis.resize());
      observador.observe(document.documentElement);
      observador.observe(document.body);
      lenis.resize();
    }

    const limite = document.documentElement.scrollHeight - window.innerHeight;
    if (Math.abs(limite - lenis.limit) > 4) lenis.resize();
    if (lenis.isScrolling) return;

    const real = window.scrollY;
    if (Math.abs(real - lenis.targetScroll) > 2) {
      lenis.scrollTo(real, { immediate: true, force: true });
    }
  };

  const vigia = window.setInterval(conferir, 250);
  const aoVoltar = () => {
    if (!document.hidden) conferir();
  };
  window.addEventListener("focus", aoVoltar);
  document.addEventListener("visibilitychange", aoVoltar);
  window.addEventListener("scroll", conferir, { passive: true });

  return () => {
    window.clearInterval(vigia);
    observador?.disconnect();
    window.removeEventListener("focus", aoVoltar);
    document.removeEventListener("visibilitychange", aoVoltar);
    window.removeEventListener("scroll", conferir);
  };
}

export default function RolagemSuave({ children }: { children: ReactNode }) {
  // No servidor e na pintura inicial da hidratação: `false` (children
  // cru). O React re-renderiza com o snapshot do cliente em seguida —
  // sem divergência de hidratação, sem setState em efeito.
  const ativo = useSyncExternalStore(subscrever, lerAtivo, () => false);
  const lenisRef = useRef<LenisRef | null>(null);

  /**
   * ═══ POR QUE ESTE EFEITO EXISTE: A RODA QUE "NÃO DESCE MAIS" ═══
   *
   * O Lenis mantém um alvo INTERNO (`targetScroll`) e anima a página até ele.
   * Quando a posição real foge desse alvo — clique na barra do navegador,
   * `scrollIntoView`, ou ALTURA da página que mudou — o alvo fica velho e a
   * roda seguinte "não desce": ela mira num ponto que a página já passou.
   *
   * A versão anterior (06/10/2026) só conferia dentro do evento `scroll`.
   * Isso não cobre o caso em que a página TRAVA: sem rolagem, não há evento
   * `scroll`, e o conserto nunca roda (medido 01/11/2026 em
   * /direitos-globais/america-latina: parava no quarto scroll).
   *
   * Agora há um vigia de 250 ms que não depende de evento nenhum:
   * 1. se a altura mudou, `resize()` recalcula o limite;
   * 2. se o alvo divergiu do real com o Lenis parado, realinha na hora.
   * O custo é uma leitura de `scrollY` a cada 250 ms — barato e invisível.
   */
  useEffect(() => {
    if (!ativo) return;
    return vigiarRolagem(() => lenisRef.current?.lenis ?? null);
  }, [ativo]);

  // Sem Lenis (snapshot do servidor, reduced-motion ou toggle off):
  // devolve o children cru — a página rola como sempre rolou.
  if (!ativo) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        // Suavização: 1 = sem suavização, 0 = lentíssimo. 0.12 é o padrão.
        lerp: 0.12,
        // Saltos de âncora (#...) animados pelo próprio Lenis.
        anchors: true,
        // Rolagem da roda do mouse 100% nativa do navegador (smoothWheel: false):
        // impede que o Lenis intercepte wheel com event.preventDefault(), eliminando
        // de vez o congelamento de scroll relatado pelo usuário em todas as páginas.
        smoothWheel: false,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
      }}
    >
      {children}
    </ReactLenis>
  );
}
