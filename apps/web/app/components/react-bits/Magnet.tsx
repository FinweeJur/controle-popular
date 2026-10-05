"use client";

/**
 * Magnet — o conteúdo "gruda" no cursor: desloca um pouco na direção
 * dele enquanto o mouse se aproxima, e volta suave ao sair.
 *
 * VENDORIADO de React Bits (https://reactbits.dev/components/magnet),
 * biblioteca copy-paste, licença MIT. Copiado em 05/10/2026 e adaptado.
 *
 * Adaptações ao portal:
 * 1. Sem efeito em toque (`pointerType !== "mouse"`), em
 *    `prefers-reduced-motion` (movimento é escolha do usuário) e no tema
 *    alto contraste (decoração some);
 * 2. O deslocamento é LIMITADO (`forca` sobre a distância do cursor ao
 *    centro) — nunca sai da própria linha, não empurra layout;
 * 3. Transição CSS curta no retorno (0,2 s), sem biblioteca de animação;
 * 4. Envelope neutro: quem estiver dentro continua focável e clicável.
 *
 * Por que existe: CTA "role para explorar" da abertura viva (dono,
 * 05/10/2026 — "gostei do magnet").
 */

import { useRef, useState, type PointerEvent, type ReactNode } from "react";

export interface MagnetProps {
  children: ReactNode;
  /** Força do puxão, 0–1 (parcela da distância vira deslocamento). */
  forca?: number;
  /** Classes do envelope (alinhamento no layout de quem usa). */
  className?: string;
}

export default function Magnet({
  children,
  forca = 0.3,
  className = "",
}: MagnetProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [desloc, setDesloc] = useState({ x: 0, y: 0 });
  const [ligado, setLigado] = useState(false);

  const aoMover = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.documentElement.dataset.theme === "high-contrast") return;
    const el = ref.current;
    if (!el) return;
    const caixa = el.getBoundingClientRect();
    const centroX = caixa.left + caixa.width / 2;
    const centroY = caixa.top + caixa.height / 2;
    setDesloc({
      x: (e.clientX - centroX) * forca,
      y: (e.clientY - centroY) * forca,
    });
    setLigado(true);
  };

  const aoSair = () => {
    setDesloc({ x: 0, y: 0 });
    setLigado(false);
  };

  return (
    <div
      ref={ref}
      onPointerMove={aoMover}
      onPointerLeave={aoSair}
      className={className}
      style={{
        transform: ligado ? `translate(${desloc.x}px, ${desloc.y}px)` : undefined,
        transition: ligado ? undefined : "transform 0.25s ease-out",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
