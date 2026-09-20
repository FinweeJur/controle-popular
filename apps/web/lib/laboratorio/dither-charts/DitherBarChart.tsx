import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform, useReducedMotion } from 'framer-motion';

export interface DitherBarChartProps {
  labels: string[];
  values: number[];
  title?: string;
  subtitle?: string;
  trend?: string;
  theme?: 'dark' | 'light';
  compact?: boolean;
}

function AnimatedValue({ value }: { value: number }) {
  const prefersReducedMotion = useReducedMotion();
  const spring = useSpring(value, { stiffness: 190, damping: 27, mass: 0.7 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString('pt-BR'));

  useEffect(() => {
    if (prefersReducedMotion) spring.jump(value);
    else spring.set(value);
  }, [value, spring, prefersReducedMotion]);

  return <motion.span className="tabular-nums">{display}</motion.span>;
}

export function DitherBarChart({
  labels,
  values,
  title = 'Barras verticais',
  subtitle,
  trend,
  theme = 'dark',
  compact = false,
}: DitherBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const requestRef = useRef<number>(0);

  const { total, maxVal } = useMemo(() => {
    const tot = values.reduce((a, b) => a + b, 0);
    const mx = Math.max(...values);
    return { total: tot, maxVal: mx };
  }, [values]);

  useEffect(() => {
    const draw = () => {
      timeRef.current += 0.03;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      const colW = w / values.length;
      const barW = Math.min(colW * 0.55, 36);
      const cell = Math.max(3, Math.round(w / 160));

      values.forEach((val, i) => {
        const cx = i * colW + colW / 2;
        const x0 = cx - barW / 2;
        const barH = maxVal > 0 ? (val / maxVal) * (h * 0.82) : 0;
        const yTop = h - barH;
        const isHovered = hoveredIdx === i;

        for (let bx = Math.floor(x0); bx < Math.ceil(x0 + barW); bx += cell) {
          for (let by = Math.floor(yTop); by < h; by += cell) {
            const distToTop = barH > 0 ? (by - yTop) / barH : 0;
            const wave = Math.sin(bx * 0.08 + timeRef.current * 2) * 0.1;
            const density = 0.4 + 0.6 * (1 - distToTop) + wave;

            if (Math.random() < density || isHovered) {
              ctx.fillStyle = isHovered ? 'var(--cp-accent, #0e8f6e)' : 'rgba(255, 255, 255, 0.75)';
              const sz = cell * (isHovered ? 0.95 : 0.75);
              const offset = (cell - sz) / 2;
              ctx.fillRect(bx + offset, by + offset, sz, sz);
            }
          }
        }
      });

      ctx.restore();
      requestRef.current = requestAnimationFrame(draw);
    };

    requestRef.current = requestAnimationFrame(draw);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [values, maxVal, hoveredIdx]);

  if (compact) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-2">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-3 font-sans">
      <div className={`w-full rounded-2xl p-4 flex flex-col gap-3 shadow-lg border transition-colors ${
        theme === 'dark'
          ? 'bg-[var(--cp-surface-2,#1b2536)] border-white/10 text-white'
          : 'bg-white border-[var(--cp-border,#e2e8f0)] text-[var(--cp-text,#0e1726)]'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{title}</span>
            {subtitle && <span className="text-xs text-neutral-500 ml-2">{subtitle}</span>}
          </div>
          {trend && <span className="text-xs font-semibold text-emerald-400">{trend}</span>}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight">
            <AnimatedValue value={total} />
          </span>
          <span className="text-xs text-neutral-400">total</span>
        </div>

        <div
          className="relative h-[160px] w-full touch-none cursor-pointer"
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const colW = rect.width / values.length;
            const idx = Math.min(Math.max(0, Math.floor(x / colW)), values.length - 1);
            setHoveredIdx(idx);
          }}
          onPointerLeave={() => setHoveredIdx(null)}
        >
          <canvas ref={canvasRef} className="w-full h-full pointer-events-none" />

          <AnimatePresence>
            {hoveredIdx !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bg-neutral-900 border border-neutral-700 text-white rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full top-2"
                style={{ left: `${((hoveredIdx + 0.5) / values.length) * 100}%` }}
              >
                {labels[hoveredIdx]}: {values[hoveredIdx].toLocaleString('pt-BR')}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between text-[11px] text-neutral-400 px-1 pt-1">
          {labels.map((lbl, idx) => (
            <span key={lbl} className={hoveredIdx === idx ? 'text-white font-bold' : ''}>{lbl}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
