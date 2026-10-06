"use client";

/**
 * BotaoBrilho — invólucro dos botões pequenos dentro dos cartões dos eixos.
 *
 * Junta o que o dono pediu em 06/10/2026: **magnet** (o botão é puxado pelo
 * cursor, de longe) e **hover glow** (anel de luz na cor do tema quando o
 * ponteiro chega).
 *
 * Por que um invólucro em vez de editar cada botão: as páginas dos eixos são
 * componentes de SERVIDOR (exportam `metadata`), então não podem usar hook. O
 * invólucro é cliente, recebe o `<Link>` já pronto como `children` (continua
 * navegando no cliente, AGENTS §5.13) e cuida só do movimento e da luz.
 *
 * O brilho é CSS (`.cp-botao-brilho`): um anel + halo com `color-mix` sobre
 * `--cp-primary` — mais leve e mais previsível que o mesh do `BorderGlow` num
 * alvo pequeno, e o `BorderGlow` fica reservado aos CARTÕES, onde o cone
 * direcional aparece de verdade.
 */
import { useRef, type CSSProperties, type ReactNode } from "react";
import { useMagnet } from "./Magnet";
import "./react-bits.css";

export interface BotaoBrilhoProps {
  children: ReactNode;
  /** Classes de layout do invólucro (largura/raio/margem). */
  className?: string;
  /** Raio do anel de brilho, em px. Padrão 12. */
  raio?: number;
  /** Fração da distância que vira deslocamento. Padrão 0,18. */
  forca?: number;
  /** Distância (px) em que o ímã começa a puxar. Padrão 40. */
  afastamento?: number;
  /** `true` = ocupa a linha inteira (bloco). Padrão `false` (inline-block). */
  bloco?: boolean;
}

export default function BotaoBrilho({
  children,
  className = "",
  raio = 12,
  forca = 0.18,
  afastamento = 40,
  bloco = false,
}: BotaoBrilhoProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useMagnet(ref, { forca, afastamento });

  return (
    <div
      ref={ref}
      className={`cp-botao-brilho ${className}`}
      style={
        {
          display: bloco ? "block" : "inline-block",
          "--cp-brilho-raio": `${raio}px`,
          willChange: "transform",
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
