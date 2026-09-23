import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { useCanvasSetup } from './use-canvas-setup';
import { smoothstep, hash, hexToRgba, drawRoundedWedge } from './dither-engine';

export interface DonutSlice {
  name: string;
  color: string;
  value: number;
}

export interface DitherDonutChartProps {
  slices: DonutSlice[];
  title?: string;
  subtitle?: string;
  theme?: 'dark' | 'light';
  compact?: boolean;
}

function AnimatedNumber({ value }: { value: number }) {
  const prefersReducedMotion = useReducedMotion();
  const spring = useSpring(value, { stiffness: 190, damping: 27, mass: 0.7 });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString('pt-BR')
  );

  useEffect(() => {
    if (prefersReducedMotion) spring.jump(value);
    else spring.set(value);
  }, [value, spring, prefersReducedMotion]);

  return <motion.span className="tabular-nums">{display}</motion.span>;
}

export function DitherDonutChart({
  slices,
  title = 'Distribuicao',
  subtitle,
  theme = 'dark',
  compact = false,
}: DitherDonutChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { canvasRef, rect, isVisible, reducedMotion } = useCanvasSetup();

  const total = useMemo(() => slices.reduce((a, s) => a + s.value, 0), [slices]);
  const shares = useMemo(() => slices.map(s => s.value / (total || 1)), [slices, total]);

  const timeRef = useRef(0);
  const requestRef = useRef<number>(0);
  const morphStartTimeRef = useRef(0);
  const fromSharesRef = useRef<number[]>([]);
  const targetSharesRef = useRef<number[]>([]);
  const dispSharesRef = useRef<number[]>([]);

  const hoverRef = useRef(hoverIndex);
  useEffect(() => { hoverRef.current = hoverIndex; }, [hoverIndex]);

  useEffect(() => {
    if (dispSharesRef.current.length === 0) {
      dispSharesRef.current = [...shares];
      fromSharesRef.current = [...shares];
      targetSharesRef.current = [...shares];
    } else {
      fromSharesRef.current = [...dispSharesRef.current];
      targetSharesRef.current = [...shares];
      morphStartTimeRef.current = performance.now();
    }
  }, [shares]);

  useEffect(() => {
    const draw = () => {
      if (!isVisible.current) {
        requestRef.current = requestAnimationFrame(draw);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width: logW, height: logH } = rect.current;
      if (logW === 0 || logH === 0) {
        requestRef.current = requestAnimationFrame(draw);
        return;
      }

      timeRef.current += reducedMotion.current ? 0 : 0.004;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const logicalSize = 200;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale((logW * dpr) / logicalSize, (logH * dpr) / logicalSize);

      let t = 0;
      if (reducedMotion.current) {
        t = 1;
      } else if (morphStartTimeRef.current > 0) {
        t = (performance.now() - morphStartTimeRef.current) / 2500;
        if (t > 1) t = 1;
      } else {
        t = 1;
      }

      const e = 1 - Math.pow(2, -10 * t);
      for (let i = 0; i < targetSharesRef.current.length; i++) {
        dispSharesRef.current[i] =
          fromSharesRef.current[i] +
          (targetSharesRef.current[i] - fromSharesRef.current[i]) * e;
      }

      let startAngle = -Math.PI / 2;
      const gap = 0.07;
      const currentHover = hoverRef.current;

      for (let i = 0; i < dispSharesRef.current.length; i++) {
        const share = dispSharesRef.current[i];
        if (share === 0) continue;

        const sweep = share * Math.PI * 2;
        let aStart = startAngle + gap / 2;
        let aEnd = startAngle + sweep - gap / 2;
        if (aEnd < aStart) aEnd = aStart;

        ctx.save();
        const isHovered = currentHover === i;
        const isAnyHovered = currentHover !== null;

        if (isHovered) {
          const mid = (aStart + aEnd) / 2;
          ctx.translate(Math.cos(mid) * 6, Math.sin(mid) * 6);
        }

        ctx.beginPath();
        drawRoundedWedge(ctx, 100, 100, 55, 86, aStart, aEnd, 6);
        ctx.clip();

        ctx.globalAlpha = isHovered ? 1.0 : (isAnyHovered ? 0.3 * 0.72 : 0.72);
        ctx.fillStyle = slices[i].color;

        if (isHovered) {
          ctx.shadowColor = hexToRgba(slices[i].color, 0.55);
          ctx.shadowBlur = 5;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

        const cell = 4.6;
        const t2 = timeRef.current;
        for (let x = 14; x <= 186; x += cell) {
          for (let y = 14; y <= 186; y += cell) {
            const dx = x - 100;
            const dy = y - 100;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 55 - cell || dist > 86 + cell) continue;

            let a = Math.atan2(dy, dx);
            let normalizedA = a - aStart;
            while (normalizedA < 0) normalizedA += Math.PI * 2;
            while (normalizedA >= Math.PI * 2) normalizedA -= Math.PI * 2;
            if (normalizedA > aEnd - aStart) continue;

            const fullness = smoothstep(0.62, 1.0, (dist - 55) / (86 - 55));
            const waveRaw = reducedMotion.current
              ? 0
              : Math.sin(dist * 0.1 - t2) +
                Math.sin(a * 3 + t2 * 1.5) +
                Math.sin(dx * 0.05 + dy * 0.05 + t2 * 2);
            const wave = smoothstep(-1.5, 1.5, waveRaw);
            const jitter = hash(x, y);

            const size =
              cell *
              ((isHovered ? 0.46 : 0.34) + 0.36 * fullness + 0.26 * wave) *
              (0.78 + 0.42 * jitter);

            ctx.fillRect(x - size / 2, y - size / 2, size, size);
          }
        }

        ctx.restore();
        startAngle += sweep;
      }

      ctx.restore();
      requestRef.current = requestAnimationFrame(draw);
    };

    requestRef.current = requestAnimationFrame(draw);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [reducedMotion, slices]);

  if (compact) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-2">
        <div className="relative w-[130px] h-[130px]">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-3xl p-6 transition-colors border ${
      theme === 'dark'
        ? 'bg-[var(--cp-surface-2,#1b2536)] border-white/5 text-white'
        : 'bg-white border-[var(--cp-border,#e2e8f0)] text-[var(--cp-text,#0e1726)] shadow-lg'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold">{title}</h4>
          {subtitle && (
            <p className={`text-[11px] ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-[180px] h-[180px] shrink-0">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        <div className="flex-1 w-full space-y-2">
          {slices.map((slice, idx) => {
            const pct = Math.round(shares[idx] * 100);
            const isHovered = hoverIndex === idx;

            return (
              <div
                key={slice.name}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                  isHovered
                    ? (theme === 'dark' ? 'bg-white/10 border-white/20' : 'bg-neutral-100 border-neutral-300')
                    : 'border-transparent hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                  <span className="text-xs font-medium">{slice.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-semibold ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>
                    {slice.value.toLocaleString('pt-BR')}
                  </span>
                  <span className={`text-[10px] w-8 text-right font-mono ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
