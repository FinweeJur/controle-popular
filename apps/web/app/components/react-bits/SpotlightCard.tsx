"use client";

/**
 * SpotlightCard — cartão com "luz" radial que segue o cursor.
 *
 * VENDORIADO de React Bits (https://reactbits.dev/components/
 * spotlight-card), biblioteca copy-paste, licença MIT. Copiado em
 * 05/10/2026 e adaptado ao portal.
 *
 * Adaptações ao portal:
 * 1. O brilho referencia o token `--cp-glow` do tema ativo (rgba fraca
 *    da cor primária) — trocou o tema, trocou a luz, sem código por tema;
 * 2. Só reage a `pointerType === "mouse"`: celular/tablet não tem o
 *    custo do handler nem o efeito sem cursor;
 * 3. `prefers-reduced-motion` e tema alto contraste desligam o efeito
 *    (regra do CSS em `react-bits.css`) — o cartão fica normal;
 * 4. É um <div> drop-in: recebe as MESMAS classes do cartão que substitui
 *    (borda, fundo, raio), então os cartões de indicadores dos eixos
 *    trocam sem mudar layout.
 * 5. Magnet leve (dono, 06/10/2026): o cartão desliza poucos pixels na
 *    direção do cursor e volta suave ao sair. A força é pequena de propósito
 *    ("magnet cards de leve") — decoração não pode empurrar leitura nem
 *    layout (o `transform` não afeta o fluxo).
 *
 * Por que existe: luz de foco nos cartões de indicadores dos 4 eixos
 * (dono, 05/10/2026 — "gostei do spotlight card"). O magnet entrou na rodada
 * de 06/10/2026, junto com o fundo de Cubes.
 */

import { useCallback, useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
// O próprio CSS do spotlight (`.cp-spotlight`) mora em `react-bits.css`;
// importar aqui deixa o componente autossuficiente (o arquivo já era trazido
// pelo `ShinyText`, mas depender disso quebrava quem usasse só o cartão).
import "./react-bits.css";

/**
 * Força do magnet do cartão. Pequena porque é ornamento: 0,06 já é
 * perceptível no hover e não desloca o suficiente para atrapalhar o clique.
 */
const FORCA_MAGNET = 0.06;

export interface SpotlightCardProps {
  children: ReactNode;
  /** Classes do cartão original (borda, fundo, raio, padding...). */
  className?: string;
  /** Cor do brilho em CSS. Padrão: token `--cp-glow` do tema. */
  corBrilho?: string;
  ariaLabel?: string;
}

export default function SpotlightCard({
  children,
  className = "",
  corBrilho,
  ariaLabel,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  /**
   * Escreve a posição do cursor em variáveis CSS lidas pelo gradiente
   * radial do ::after (ver `react-bits.css`) e aplica o magnet leve. Sem
   * estado React: escrever direto no estilo evita re-render a cada pixel —
   * o movimento fica a 60fps sem custar hidratação.
   */
  const aoMover = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.documentElement.dataset.theme === "high-contrast") return;
    const caixa = el.getBoundingClientRect();
    const px = e.clientX - caixa.left;
    const py = e.clientY - caixa.top;
    el.style.setProperty("--spot-x", `${px}px`);
    el.style.setProperty("--spot-y", `${py}px`);
    // Magnet: deslocamento proporcional à distância do cursor ao centro.
    // `transition: none` durante o movimento — com transição, o rastro
    // ficaria atrasado em relação ao ponteiro.
    el.style.transition = "none";
    el.style.transform = `translate(${(px - caixa.width / 2) * FORCA_MAGNET}px, ${
      (py - caixa.height / 2) * FORCA_MAGNET
    }px)`;
  }, []);

  /** Volta ao lugar com transição curta (o magnet não "salta" ao sair). */
  const aoSair = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.25s ease-out";
    el.style.transform = "";
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={aoMover}
      onPointerLeave={aoSair}
      className={`cp-spotlight ${className}`}
      style={corBrilho ? ({ "--cp-spot-cor": corBrilho } as CSSProperties) : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
