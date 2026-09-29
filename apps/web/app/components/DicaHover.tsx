"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * ═══ Dica no hover — janelinha explicativa depois de 2 segundos ═══
 *
 * Regra do dono, 29/09/2026: ao deixar o mouse PARADO sobre um botão,
 * link ou controle por 2 s, uma janelinha curta explica o que aquele
 * elemento faz. No teclado (Tab) a mesma dica aparece depois de 600 ms,
 * porque quem navega por teclado espera resposta imediata do foco.
 *
 * POR QUE UM COMPONENTE SÓ, MONTADO NO LAYOUT RAIZ (`app/layout.tsx`):
 * o portal tem ~100 páginas e nenhuma delas precisa ser editada. O App
 * Router dá um teto comum — o RootLayout — e aí a dica vale para todo
 * filho, em qualquer rota futura, sem ninguém se lembrar de importá-la.
 *
 * DE ONDE VEM O TEXTO (na ordem):
 *   1. `data-dica`     — texto escrito de propósito, quando o rótulo
 *                        visível é curto demais;
 *   2. `aria-label`    — 397 usos já existem pelo site, de graça;
 *   3. `title`         — 331 usos; enquanto a dica nossa estiver na
 *                        tela, o `title` é guardado em
 *                        `data-cp-titulo-origem` para o tooltip NATIVO
 *                        do navegador não aparecer em cima (ele estoura
 *                        sozinho perto de 1 s e bagunça a leitura).
 *
 * NÃO MOSTRA quando repete o texto visível do elemento — repetir o que
 * já está escrito ali é ruído, não ajuda. A janelinha também é
 * `role="tooltip"` com `aria-describedby` no alvo, escapa com Escape e
 * aceita o ponteiro por cima (WCAG 1.4.13). Sem animação nenhuma, então
 * `prefers-reduced-motion` já está respeitado por omissão.
 */

/** Identidade da caixinha, usada no `aria-describedby` do alvo. */
const ID_CAIXA = "cp-dica-caixa";

/** Quanto tempo o mouse tem de ficar parado antes de aparecer. */
const ATRASO_HOVER_MS = 2000;

/** No teclado a resposta é quase imediata — o foco já é intencional. */
const ATRASO_FOCO_MS = 600;

const SELETOR = "[data-dica],[aria-label],[title]";

interface Dica {
  texto: string;
  x: number;
  y: number;
  acima: boolean;
}

/** Texto da dica de um alvo, ou null se não há nada a explicar. */
function textoDe(alvo: HTMLElement): string | null {
  const explicito =
    alvo.getAttribute("data-dica") ?? alvo.getAttribute("aria-label") ?? alvo.getAttribute("title");
  const texto = (explicito ?? "").trim();
  if (!texto) return null;
  const visivel = (alvo.innerText ?? "").trim();
  if (visivel && visivel === texto) return null; // já está escrito na tela
  return texto;
}

/** Acha o elemento mais próximo que tenha texto de dica. */
function alvoDaDica(e: Event): HTMLElement | null {
  const origem = e.target instanceof Element ? e.target : null;
  return (origem?.closest(SELETOR) ?? null) as HTMLElement | null;
}

export default function DicaHover() {
  const [dica, setDica] = useState<Dica | null>(null);
  const alvoRef = useRef<HTMLElement | null>(null);
  const textoRef = useRef("");
  const tituloRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Cancela o que estiver agendado, esconde a caixa e desfaz o que
   *  mexeu no DOM (title guardado e aria-describedby). */
  const limpar = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const alvo = alvoRef.current;
    if (alvo) {
      alvo.removeAttribute("aria-describedby");
      if (tituloRef.current !== null) {
        alvo.setAttribute("title", tituloRef.current);
        tituloRef.current = null;
      }
    }
    alvoRef.current = null;
    textoRef.current = "";
    setDica(null);
  }, []);

  /** Posiciona a caixinha sob o alvo; se não couber, por cima. */
  const mostrar = useCallback(() => {
    const alvo = alvoRef.current;
    const texto = textoRef.current;
    if (!alvo || !texto) return;

    // Segura o title nativo enquanto a nossa está na tela.
    if (alvo.hasAttribute("title")) {
      tituloRef.current = alvo.getAttribute("title");
      alvo.removeAttribute("title");
    }
    alvo.setAttribute("aria-describedby", ID_CAIXA);

    const r = alvo.getBoundingClientRect();
    const largura = 260;
    const x = Math.max(8, Math.min(r.left, window.innerWidth - largura - 8));
    const acima = r.bottom + 56 > window.innerHeight;
    setDica({ texto, x, y: acima ? r.top - 6 : r.bottom + 6, acima });
  }, []);

  /** Marca o alvo e arma o relógio (2 s com o mouse, 600 ms no foco). */
  const agendar = useCallback(
    (alvo: HTMLElement, atraso: number) => {
      const texto = textoDe(alvo);
      if (!texto) return;
      limpar();
      alvoRef.current = alvo;
      textoRef.current = texto;
      timerRef.current = setTimeout(mostrar, atraso);
    },
    [limpar, mostrar]
  );

  useEffect(() => {
    const emCimaDaCaixa = (n: EventTarget | null) =>
      n instanceof Element && n.closest(`#${ID_CAIXA}`) !== null;

    function aoPassar(e: PointerEvent) {
      const alvo = alvoDaDica(e);
      if (!alvo || alvo === alvoRef.current) return;
      agendar(alvo, ATRASO_HOVER_MS);
    }

    function aoSair(e: PointerEvent) {
      const alvo = alvoDaDica(e);
      if (alvo !== alvoRef.current) return;
      // Dentro do próprio elemento, ou subindo para a caixinha (ela tem
      // de aceitar o ponteiro por cima, senão some ao ser lida).
      if (e.relatedTarget instanceof Node && alvo?.contains(e.relatedTarget)) return;
      if (emCimaDaCaixa(e.relatedTarget)) return;
      limpar();
    }

    function aoFocar(e: FocusEvent) {
      const alvo = alvoDaDica(e);
      if (alvo) agendar(alvo, ATRASO_FOCO_MS);
    }

    function aoPerderFoco(e: FocusEvent) {
      const alvo = e.target instanceof Element ? e.target : null;
      if (alvo && alvoRef.current && alvo.contains(alvoRef.current)) limpar();
    }

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") limpar(); // WCAG 1.4.13: dá para dispensar
    }

    function aoRolar() {
      limpar(); // a posição vira mentira assim que a página mexe
    }

    document.addEventListener("pointerover", aoPassar);
    document.addEventListener("pointerout", aoSair);
    document.addEventListener("focusin", aoFocar);
    document.addEventListener("focusout", aoPerderFoco);
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("scroll", aoRolar, { capture: true, passive: true });
    return () => {
      document.removeEventListener("pointerover", aoPassar);
      document.removeEventListener("pointerout", aoSair);
      document.removeEventListener("focusin", aoFocar);
      document.removeEventListener("focusout", aoPerderFoco);
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("scroll", aoRolar, { capture: true });
      limpar();
    };
  }, [agendar, limpar]);

  if (!dica) return null;

  return (
    <div
      id={ID_CAIXA}
      role="tooltip"
      data-cp-dica-caixa=""
      className="fixed z-[9999] max-w-[260px] rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs leading-snug text-text shadow-xl"
      style={{
        left: dica.x,
        top: dica.y,
        transform: dica.acima ? "translateY(-100%)" : undefined,
      }}
    >
      {dica.texto}
    </div>
  );
}
