/**
 * useArrastavel — hook que move um painel flutuante com o dedo/mouse e
 * grava a posição no `localStorage`.
 *
 * Papel no portal: o player de rádio (`PlayerRadio.tsx`) e o widget do Seu
 * Nonô (`SeuNono.tsx`) ficam fixos no canto inferior da tela. Em telas
 * pequenas — e num portal que a pessoa usa sob estresse — o canto pode
 * tapar justamente o que ela precisa ler. O pedido do dono (30/09/2026) é
 * poder arrastar as duas janelinhas para o lado e ter a posição lembrada no
 * próximo acesso.
 *
 * Decisões técnicas:
 * - o arrasto é por **Pointer Events** (funciona com mouse, toque e caneta
 *   no mesmo código); quem usa precisa marcar o elemento de pega com
 *   `touch-none`, senão o navegador rola a página em vez de arrastar;
 * - a posição é guardada como um DESLOCAMENTO (`translate`) a partir do
 *   canto original, não como `left/top` absoluto: assim o CSS continua
 *   dono do ponto de partida (canto inferior esquerdo, responsivo) e o
 *   `localStorage` guarda só o quanto a pessoa empurrou;
 * - um limiar de 5 px separa CLIQUE de ARRASTO: o botão que abre o chat (ou
 *   toca a rádio) continua funcionando, e `foiArrasto()` avisa o dono do
 *   botão para não disparar a ação quando o gesto foi mover;
 * - a posição é limitada à janela (com 8 px de folga) para o painel nunca
 *   sair da tela por completo.
 *
 * CAIXA DO CONTAINER, NÃO DA PEGA (conserto 03/10/2026) ─────────────────────
 * O clamp precisa da caixa do elemento QUE SE MOVE. Antes ele media
 * `e.currentTarget` (a pega), mas a pega costuma ser um filho bem menor que
 * o painel — no Seu Nonô, o cabeçalho (40 px de altura) media o clamp de um
 * painel de 619 px, e o painel deslizava para fora da tela por baixo. Quem
 * sabe qual é o container é o consumidor: marque o DIV que recebe `estilo`
 * com `data-arrastavel-caixa` e o hook acha a caixa por `closest`.
 *
 * A CAUSA-RAIZ DO "TRAVA APÓS POUCOS PIXELS" (medida com Playwright em
 * 03/10/2026): quando a pega contém uma `<img>` (o avatar do Seu Nonô), o
 * navegador inicia o arrasto NATIVO da imagem no primeiro `pointermove`. O
 * Chrome dispara `pointercancel` no ponteiro, o arrasto morre e a posição
 * trava no primeiro passo (medido: 10 px e nunca mais). `onDragStart` no
 * handler cancela o arrasto nativo da imagem e o gesto segue inteiro.
 *
 * `limitarDeslocamento` é pura e testada (`useArrastavel.test.ts`); o
 * resto do hook toca `window`/`localStorage` e roda só no cliente.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

/** Movimento mínimo (px) para o gesto contar como arrasto, não clique. */
export const LIMITE_ARRASTO = 5;

/** Folga (px) que garante que o painel nunca suma pela borda. */
export const MARGEM_VISAO = 8;

export interface CaixaElemento {
  esq: number;
  topo: number;
  larg: number;
  alt: number;
}

export interface TamanhoVisao {
  larg: number;
  alt: number;
}

/**
 * Limita o deslocamento de arrasto para o painel continuar visível.
 *
 * Recebe o quanto o dedo andou (`dx`, `dy`), a caixa do painel no momento em
 * que o arrasto começou e o tamanho da janela; devolve o deslocamento máximo
 * que mantém o painel dentro da tela (com `margem` de folga em cada borda).
 * Se o painel for maior que a janela, o eixo fica travado no zero — melhor
 * não andar que sumir.
 */
export function limitarDeslocamento(
  dx: number,
  dy: number,
  caixa: CaixaElemento,
  visao: TamanhoVisao,
  margem = MARGEM_VISAO,
): { x: number; y: number } {
  const minX = -caixa.esq + margem;
  const maxX = Math.max(minX, visao.larg - (caixa.esq + caixa.larg) - margem);
  const minY = -caixa.topo + margem;
  const maxY = Math.max(minY, visao.alt - (caixa.topo + caixa.alt) - margem);
  return {
    x: Math.min(Math.max(dx, minX), maxX),
    y: Math.min(Math.max(dy, minY), maxY),
  };
}

/** Cancela o arrasto nativo de `<img>` na pega (ver docstring do arquivo). */
function semArrastoNativo(e: ReactDragEvent<HTMLElement>): void {
  e.preventDefault();
}

export interface UsarArrastavel {
  /** Estilo a espalhar no container flutuante (aplica o `translate`). */
  estilo: CSSProperties;
  /** `true` enquanto o dedo/mouse está arrastando (para o cursor). */
  arrastando: boolean;
  /** O último gesto foi um arrasto? Use no `onClick` para não abrir/fechar. */
  foiArrasto: () => boolean;
  /** Volta o painel ao canto original e limpa a posição salva. */
  resetar: () => void;
  /** Handlers a espalhar na pega do arrasto (o cabeçalho, o botão). */
  handlers: {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void;
    /** Cancela o arrasto nativo de `<img>` dentro da pega: sem isto o
     *  Chrome emite `pointercancel` no primeiro movimento e trava o gesto. */
    onDragStart: (e: ReactDragEvent<HTMLElement>) => void;
  };
}

/**
 * Usa posição arrastável persistida. `chave` é o nome no `localStorage`
 * (ex.: `cp_radio_pos`).
 *
 * O CONTAINER que se move deve carregar o atributo `data-arrastavel-caixa`:
 * o hook acha a caixa por `closest` a partir da pega. Sem ele, mede a própria
 * pega (funciona quando pega e container são o mesmo elemento).
 */
export function useArrastavel(chave: string): UsarArrastavel {
  const [desloc, setDesloc] = useState({ x: 0, y: 0 });
  const [arrastando, setArrastando] = useState(false);
  const atual = useRef({ x: 0, y: 0 });
  const arrastou = useRef(false);
  const gesto = useRef<{
    id: number;
    px: number;
    py: number;
    x0: number;
    y0: number;
    caixa: CaixaElemento;
  } | null>(null);

  // Carrega a posição salva uma vez, já no cliente.
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(chave);
      if (salvo) {
        const p = JSON.parse(salvo) as { x?: unknown; y?: unknown };
        if (typeof p.x === "number" && typeof p.y === "number") {
          atual.current = { x: p.x, y: p.y };
          setDesloc(atual.current);
        }
      }
    } catch {
      // localStorage bloqueado (modo privado): segue no canto padrão.
    }
  }, [chave]);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    // A caixa medida é a do CONTAINER que se move (`data-arrastavel-caixa`),
    // não a da pega: é o container que encosta nas bordas da tela. A pega
    // costuma ser um filho bem menor (cabeçalho de 40 px num painel de 619).
    const alvo =
      e.currentTarget.closest<HTMLElement>("[data-arrastavel-caixa]") ??
      e.currentTarget;
    const r = alvo.getBoundingClientRect();
    gesto.current = {
      id: e.pointerId,
      px: e.clientX,
      py: e.clientY,
      x0: atual.current.x,
      y0: atual.current.y,
      caixa: { esq: r.left, topo: r.top, larg: r.width, alt: r.height },
    };
    arrastou.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const g = gesto.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.px;
    const dy = e.clientY - g.py;
    if (!arrastou.current && Math.hypot(dx, dy) < LIMITE_ARRASTO) return;
    arrastou.current = true;
    setArrastando(true);
    const lim = limitarDeslocamento(dx, dy, g.caixa, {
      larg: window.innerWidth,
      alt: window.innerHeight,
    });
    atual.current = { x: g.x0 + lim.x, y: g.y0 + lim.y };
    setDesloc(atual.current);
  }, []);

  const finalizar = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const g = gesto.current;
      if (!g || g.id !== e.pointerId) return;
      gesto.current = null;
      setArrastando(false);
      if (arrastou.current) {
        try {
          window.localStorage.setItem(chave, JSON.stringify(atual.current));
        } catch {
          // sem persistência: a posição vale só para esta visita.
        }
      }
    },
    [chave],
  );

  const resetar = useCallback(() => {
    atual.current = { x: 0, y: 0 };
    setDesloc({ x: 0, y: 0 });
    try {
      window.localStorage.removeItem(chave);
    } catch {
      // sem persistência: nada a limpar.
    }
  }, [chave]);

  return {
    estilo: { transform: `translate3d(${desloc.x}px, ${desloc.y}px, 0)` },
    arrastando,
    foiArrasto: () => arrastou.current,
    resetar,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finalizar,
      onPointerCancel: finalizar,
      // Cancela o arrasto nativo da imagem (o avatar do Seu Nonô) que, sem
      // isto, emite `pointercancel` e congela o gesto no primeiro pixel.
      onDragStart: semArrastoNativo,
    },
  };
}
