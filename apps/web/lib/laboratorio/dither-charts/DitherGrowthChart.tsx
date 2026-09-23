import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { useCanvasSetup } from './use-canvas-setup';
import { smoothstep, clamp } from './dither-engine';

export interface GrowthPoint {
  date: string;
  value: number;
}

export interface DitherGrowthChartProps {
  data: GrowthPoint[];
  title?: string;
  subtitle?: string;
  trend?: string;
  formatValue?: (v: number) => string;
  theme?: 'dark' | 'light';
  compact?: boolean;
}

function AnimatedNumber({
  value,
  formatValue,
}: {
  value: number;
  formatValue?: (v: number) => string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const spring = useSpring(value, { stiffness: 190, damping: 27, mass: 0.7 });
  const display = useTransform(spring, (current) => {
    const rounded = Math.round(current);
    if (formatValue) return formatValue(rounded);
    return '+' + rounded.toLocaleString('pt-BR');
  });

  useEffect(() => {
    if (prefersReducedMotion) spring.jump(value);
    else spring.set(value);
  }, [value, spring, prefersReducedMotion]);

  return <motion.span className="tabular-nums">{display}</motion.span>;
}

export function DitherGrowthChart({
  data,
  title = 'Crescimento',
  subtitle,
  trend,
  formatValue,
  theme = 'dark',
  compact = false,
}: DitherGrowthChartProps) {
  const { canvasRef, rect, isVisible, reducedMotion } = useCanvasSetup();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const targetX = useSpring(0, { stiffness: 650, damping: 42, mass: 0.5 });
  const targetY = useSpring(0, { stiffness: 650, damping: 42, mass: 0.5 });

  const values = useMemo(() => data.map((d) => d.value), [data]);
  const dates = useMemo(() => data.map((d) => d.date), [data]);
  const total = useMemo(() => values.reduce((a, b) => a + b, 0), [values]);
  const maxVal = useMemo(() => Math.max(...values, 1), [values]);

  const timeRef = useRef(0);
  const requestRef = useRef<number>(0);
  const pointerPosRef = useRef({ x: -100, y: -100 });
  const pointerActiveRef = useRef(false);

  const fromDataRef = useRef([...values]);
  const fromMaxRef = useRef(maxVal);
  const targetDataRef = useRef([...values]);
  const targetMaxRef = useRef(maxVal);
  const morphStartTimeRef = useRef(0);

  useEffect(() => {
    fromDataRef.current = targetDataRef.current.map((_, i) => targetDataRef.current[i]);
    fromMaxRef.current = targetMaxRef.current;

    targetDataRef.current = [...values];
    targetMaxRef.current = maxVal;

    if (fromDataRef.current.length !== targetDataRef.current.length) {
      const len = targetDataRef.current.length;
      const old = fromDataRef.current;
      fromDataRef.current = Array(len)
        .fill(0)
        .map((_, i) => {
          const t = i / (len - 1 || 1);
          const oldIdx = Math.round(t * (old.length - 1));
          return old[oldIdx];
        });
    }

    morphStartTimeRef.current = performance.now();
  }, [values, maxVal]);

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

      const { width: w, height: h } = rect.current;
      if (w === 0 || h === 0) {
        requestRef.current = requestAnimationFrame(draw);
        return;
      }

      timeRef.current += reducedMotion.current ? 0 : 0.006;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cell = Math.max(3, Math.round(w / 180));

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      let prog = 0;
      if (reducedMotion.current) {
        prog = 1;
      } else if (morphStartTimeRef.current > 0) {
        prog = (performance.now() - morphStartTimeRef.current) / 2300;
        if (prog > 1) prog = 1;
      } else {
        prog = 1;
      }

      const curMax =
        fromMaxRef.current +
        (targetMaxRef.current - fromMaxRef.current) * prog;
      const curData = targetDataRef.current.map(
        (v, i) =>
          fromDataRef.current[i] +
          (v - fromDataRef.current[i]) * prog
      );

      const px = pointerPosRef.current.x;
      const py = pointerPosRef.current.y;
      const isActive = pointerActiveRef.current;
      const t2 = timeRef.current;

      for (let x = 0; x < w; x += cell) {
        const t = x / (w || 1);
        const exactIdx = t * (curData.length - 1);
        const i0 = Math.floor(exactIdx);
        const i1 = Math.min(i0 + 1, curData.length - 1);
        const frac = exactIdx - i0;
        const val = curData[i0] + (curData[i1] - curData[i0]) * frac;

        const headroom = 0.16 * h;
        const plotH = h - headroom;
        const curveY = h - plotH * (val / (curMax || 1));

        for (let y = h; y >= 0; y -= cell) {
          ctx.fillStyle =
            theme === 'dark'
              ? 'rgba(255, 255, 255, 0.03)'
              : 'rgba(0, 0, 0, 0.03)';
          ctx.fillRect(x + 1, y + 1, cell - 1, cell - 1);

          if (y < curveY) continue;

          const dx = x - px;
          const dy = y - py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let glow = 0;
          if (isActive && !reducedMotion.current) {
            const rad = h * 0.35;
            glow = 1 - smoothstep(0, rad, dist);
          }

          const shimmer = reducedMotion.current
            ? 0
            : Math.sin(y * 0.1 - t2 * 2) * 0.07;

          ctx.fillStyle = 'var(--cp-accent, #0e8f6e)';
          const sz = cell * (0.7 + shimmer + glow * 0.3);
          const alpha = 0.6 + glow * 0.4;
          ctx.globalAlpha = alpha;

          const offset = (cell - sz) / 2;
          ctx.fillRect(x + offset, y + offset, sz, sz);
          ctx.globalAlpha = 1;
        }
      }

      ctx.restore();
      requestRef.current = requestAnimationFrame(draw);
    };

    requestRef.current = requestAnimationFrame(draw);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [theme, reducedMotion, values, maxVal]);

  const handlePointer = (e: React.PointerEvent) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const r = wrapper.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    pointerPosRef.current = { x, y };
    pointerActiveRef.current = true;

    const { width: w, height: h } = rect.current;

    const t = clamp(x / (w || 1), 0, 1);
    const idx = Math.round(t * (values.length - 1));
    setScrubIndex(idx);

    const actualT = values.length > 1 ? idx / (values.length - 1) : 0.5;
    targetX.set(actualT * w);

    const val = values[idx];
    const headroom = 0.16 * h;
    const plotH = h - headroom;
    const curveY = h - plotH * (val / (maxVal || 1));
    targetY.set(curveY);
  };

  const handlePointerLeave = () => {
    pointerActiveRef.current = false;
    setScrubIndex(null);
  };

  const xPos = useTransform(targetX, (x) => `${x}px`);
  const yPos = useTransform(targetY, (y) => `${y}px`);

  if (compact) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-2">
        <div className="relative w-full h-[120px]">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
      </div>
    );
  }

  const ticks = [
    maxVal,
    Math.round(maxVal * 0.66),
    Math.round(maxVal * 0.33),
    0,
  ];
  const dateLabels = [
    dates[0],
    dates[Math.floor(dates.length * 0.25)],
    dates[Math.floor(dates.length * 0.5)],
    dates[Math.floor(dates.length * 0.75)],
    dates[dates.length - 1],
  ];

  return (
    <div className={`relative w-full rounded-3xl p-6 transition-colors border ${
      theme === 'dark'
        ? 'bg-[var(--cp-surface-2,#1b2536)] border-white/5 text-white'
        : 'bg-white border-[var(--cp-border,#e2e8f0)] text-[var(--cp-text,#0e1726)] shadow-lg'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">
              <AnimatedNumber value={total} formatValue={formatValue} />
            </span>
            {trend && (
              <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 items-start">
        <div className="relative w-7 h-[180px] shrink-0">
          {ticks.map((t, i) => (
            <span
              key={i}
              className={`absolute right-0 text-[10px] font-mono ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'}`}
              style={{
                top: `${(i / 3) * 82 + 8}%`,
                transform: 'translateY(-50%)',
              }}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div
            ref={wrapperRef}
            className="relative h-[180px] touch-none cursor-crosshair overflow-hidden rounded-xl"
            onPointerMove={handlePointer}
            onPointerLeave={handlePointerLeave}
          >
            <div className="absolute inset-0 border-t border-b border-dashed border-white/10 pointer-events-none" />
            <canvas ref={canvasRef} className="w-full h-full block" />

            {scrubIndex !== null && (
              <>
                <motion.div
                  className="absolute top-0 bottom-0 w-px bg-[var(--cp-accent,#0e8f6e)]/80 pointer-events-none z-10"
                  style={{ left: xPos }}
                />
                <motion.div
                  className="absolute w-3 h-3 -ml-[6px] -mt-[6px] rounded-full bg-[var(--cp-accent,#0e8f6e)] border-2 border-white shadow-lg pointer-events-none z-20"
                  style={{ left: xPos, top: yPos }}
                />
                <motion.div
                  className={`absolute -translate-x-1/2 -translate-y-full mb-3 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xl border pointer-events-none z-30 ${
                    theme === 'dark'
                      ? 'bg-[var(--cp-surface-2,#1b2536)] text-white border-white/20'
                      : 'bg-black text-white border-black'
                  }`}
                  style={{ left: xPos, top: yPos }}
                >
                  <div className="text-[10px] text-neutral-400 uppercase">
                    {dates[scrubIndex]}
                  </div>
                  <div>{values[scrubIndex]?.toLocaleString('pt-BR')}</div>
                </motion.div>
              </>
            )}
          </div>

          <div className="flex justify-between items-center mt-2 px-1 text-[10px] font-mono opacity-60">
            {dateLabels.map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
