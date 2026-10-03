"use client";

/**
 * WavePhysicsLoader — o loader GRANDE do portal: a bolinha quicando sobre as
 * barras de navegação (transição de página, tabelas e gráficos).
 *
 * O QUE É: um modelo de física de onda — 15 barras cuja altura acompanha a
 * passagem de uma bola que quica (parábola) — desenhado por keyframes do
 * framer-motion, sem biblioteca nova (regra do dono, 19/09/2026).
 *
 * COR E CONTRASTE (correção do dono, 03/10/2026): no tema escuro, parte da
 * animação "sumia" — a base das barras era `rgb(39,39,42)` sobre o cartão
 * `bg-surface`, quase o mesmo tom, e a bolinha escura desaparecia. A correção
 * NÃO escreve branco fixo: usa a cor de TEXTO do tema (`currentColor`, pela
 * classe `text-text`) e joga a onda na OPACIDADE. Assim fica branco sobre
 * fundo escuro e escuro sobre fundo claro — contraste garantido em TODOS os
 * temas. Branco fixo resolveria só o tema escuro e desapareceria no claro;
 * por isso a cor acompanha o tema em vez de ser constante.
 *
 * NÃO trocar por outro loader nem usar biblioteca nova (dono, 19/09/2026).
 */
import { motion } from "framer-motion";
import { useMemo } from "react";

export interface WavePhysicsLoaderProps {
  /**
   * Mantido por compatibilidade de API. A cor agora segue o tema do portal
   * via `currentColor` (ver comentário do topo), então este campo não é mais
   * lido — nenhum chamador o usa hoje.
   */
  theme?: "light" | "dark";
  className?: string;
  legenda?: string;
}

export function WavePhysicsLoader({ className = "", legenda }: WavePhysicsLoaderProps) {
  const numBars = 15;
  const barWidth = 12;
  const barGap = 8;
  const barTotalWidth = barWidth + barGap;

  const numFrames = 201;
  const B = 4;
  const maxBounce = 60;
  const baseBarH = 16;
  const wavePeakH = 48;

  const { bars, ballX, ballY, ballScaleX, ballScaleY, times } = useMemo(() => {
    const barsData = Array.from({ length: numBars }).map(() => ({
      heights: [] as string[],
      opacities: [] as number[],
    }));
    const bX: string[] = [];
    const bY: string[] = [];
    const bScaleX: number[] = [];
    const bScaleY: number[] = [];
    const tArr: number[] = [];

    for (let k = 0; k < numFrames; k++) {
      const t = k / (numFrames - 1);
      tArr.push(t);

      const x_frac = t < 0.5 ? t / 0.5 : (1 - t) / 0.5;
      const ball_idx = x_frac * (numBars - 1);

      bX.push(`${ball_idx * barTotalWidth}px`);

      let bounce_f = (x_frac * B) % 1.0;
      if (x_frac === 1 || x_frac === 0) bounce_f = 0;

      const bounce_h = 4 * bounce_f * (1 - bounce_f);
      const height_factor = Math.max(0, 1 - bounce_h * 2);

      const ball_indent = height_factor * 20;
      const ball_y = baseBarH + wavePeakH - ball_indent + bounce_h * maxBounce;
      bY.push(`-${ball_y}px`);

      const squish = height_factor;
      bScaleY.push(1 - squish * 0.3);
      bScaleX.push(1 + squish * 0.25);

      for (let i = 0; i < numBars; i++) {
        const dist = Math.abs(i - ball_idx);

        let wave_val = 0;
        if (dist < 3) {
          wave_val = Math.cos((dist / 3) * (Math.PI / 2));
        }

        let indent = 0;
        if (dist < 1.5) {
          const indent_dist = Math.cos((dist / 1.5) * (Math.PI / 2));
          indent = indent_dist * height_factor * 20;
        }

        const bar_h = baseBarH + wave_val * wavePeakH - indent;
        barsData[i].heights.push(`${Math.max(4, bar_h)}px`);

        // A onda vira OPACIDADE, não cor: base apagada (0,28) e crista cheia
        // (1,0). É o "acender" da barra quando a bola passa — e, por usar a
        // cor de texto do tema, funciona no claro e no escuro sem código de
        // tema aqui. (Antes eram cores fixas por tema: davam quase-preto sobre
        // o cartão escuro e sumiam.)
        const opacity = 0.28 + wave_val * 0.72;
        barsData[i].opacities.push(opacity);
      }
    }

    return { bars: barsData, ballX: bX, ballY: bY, ballScaleX: bScaleX, ballScaleY: bScaleY, times: tArr };
  }, [barTotalWidth]);

  return (
    <div
      role="status"
      aria-label={legenda || "Carregando dados..."}
      className={`relative flex flex-col items-center justify-center w-full py-4 text-text ${className}`}
    >
      <div className="relative flex flex-col items-center justify-center scale-[0.6] sm:scale-75 md:scale-100">
        <div className="relative flex items-end justify-start h-48 space-x-2 w-[292px]">
          {bars.map((bar, i) => (
            <motion.div
              key={i}
              className="w-3 rounded-full origin-bottom bg-current"
              style={{ height: "16px" }}
              animate={{
                height: bar.heights,
                opacity: bar.opacities,
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                times: times,
                ease: "linear",
              }}
            />
          ))}

          <motion.div
            className="absolute w-3 h-3 bg-current rounded-full z-10 shadow-sm"
            style={{ bottom: 0, left: 0, transformOrigin: "bottom center" }}
            animate={{
              x: ballX,
              y: ballY,
              scaleX: ballScaleX,
              scaleY: ballScaleY,
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              times: times,
              ease: "linear",
            }}
          />
        </div>
      </div>
      {legenda && (
        <p className="mt-2 text-xs font-medium text-text-soft animate-pulse tracking-wide">
          {legenda}
        </p>
      )}
    </div>
  );
}
