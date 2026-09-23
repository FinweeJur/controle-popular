import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { useCanvasSetup } from './use-canvas-setup';
import { smoothstep, hash, drawRoundedRect, getAxisMax, formatCurrency } from './dither-engine';

export interface StackedBand {
  name: string;
  color: string;
  share: number;
}

export interface StackedBranch {
  name: string;
  weights?: number;
}

export interface DitherStackedChartProps {
  branches: StackedBranch[];
  bands: StackedBand[];
  baseTotal: number;
  multiplier?: number;
  title?: string;
  subtitle?: string;
  formatValue?: (v: number) => string;
  theme?: 'dark' | 'light';
  compact?: boolean;
}

function AnimatedValue({
  value,
  formatValue,
}: {
  value: number;
  formatValue?: (v: number) => string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const spring = useSpring(value, { stiffness: 190, damping: 27, mass: 0.7 });
  const display = useTransform(spring, (current) =>
    (formatValue || formatCurrency)(Math.round(current))
  );

  useEffect(() => {
    if (prefersReducedMotion) spring.jump(value);
    else spring.set(value);
  }, [value, spring, prefersReducedMotion]);

  return <motion.span className="tabular-nums">{display}</motion.span>;
}

export function DitherStackedChart({
  branches,
  bands,
  baseTotal,
  multiplier = 1,
  title = 'Empilhado',
  subtitle,
  formatValue,
  theme = 'dark',
  compact = false,
}: DitherStackedChartProps) {
  const [hoverBranch, setHoverBranch] = useState<number | null>(null);
  const [hoverBand, setHoverBand] = useState<number | null>(null);
  const { canvasRef, rect, isVisible, reducedMotion } = useCanvasSetup();

  const branchWeights = useMemo(() => {
    const w = branches.map((b) => b.weights ?? 1 / branches.length);
    const sum = w.reduce((a, b) => a + b, 0);
    return w.map((v) => v / sum);
  }, [branches]);

  const { data, totalValue, axisMax } = useMemo(() => {
    let tot = 0;
    const branchData = branches.map((b, bIdx) => {
      const branchBase = baseTotal * branchWeights[bIdx];
      let branchTotal = 0;
      const bandData = bands.map((band) => {
        const wobble = 0.9 + 0.14 * Math.sin(bIdx * 3.1 + bands.indexOf(band) * 1.7);
        const val = Math.round(branchBase * multiplier * band.share * wobble);
        branchTotal += Math.max(6, val);
        return { value: Math.max(6, val) };
      });
      tot += branchTotal;
      return { total: branchTotal, bands: bandData };
    });

    const maxBranchTotal = Math.max(...branchData.map((b) => b.total));
    const axMax = getAxisMax(maxBranchTotal);

    return { data: branchData, totalValue: tot, axisMax: axMax };
  }, [branches, bands, baseTotal, multiplier, branchWeights]);

  const timeRef = useRef(0);
  const requestRef = useRef<number>(0);
  const drawnRef = useRef<Map<string, number>>(new Map());
  const morphStartTimeRef = useRef(0);
  const fromStateRef = useRef<Map<string, number>>(new Map());

  const hoverRef = useRef({ b: hoverBranch, band: hoverBand });
  useEffect(() => { hoverRef.current = { b: hoverBranch, band: hoverBand }; }, [hoverBranch, hoverBand]);

  useEffect(() => {
    fromStateRef.current = new Map(drawnRef.current);
    morphStartTimeRef.current = performance.now();
  }, [data]);

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

      timeRef.current += reducedMotion.current ? 0 : 0.004;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      const colW = w / branches.length;
      const barW = Math.min(colW * 0.62, 54);
      const cell = Math.max(3, Math.round(w / 200));
      const HIGHLIGHT = '#FFFFFF';
      const t2 = timeRef.current;

      let prog = 0;
      if (reducedMotion.current) {
        prog = 1;
      } else if (morphStartTimeRef.current > 0) {
        prog = (performance.now() - morphStartTimeRef.current) / 3100;
        if (prog > 1) prog = 1;
      } else {
        prog = 1;
      }

      const n = branches.length;

      for (let i = 0; i < n; i++) {
        const bp = 1 - Math.pow(1 - Math.max(0, Math.min(1, (prog - i * 0.05) / (1 - (n - 1) * 0.05))), 3);
        const colX = i * colW;
        const cx = colX + colW / 2;
        const x0 = cx - barW / 2;

        let currentY = h;

        for (let j = 0; j < bands.length; j++) {
          const key = `${i}-${j}`;
          const targetH = axisMax > 0 ? (data[i].bands[j].value / axisMax) * h : 0;
          const fromH = fromStateRef.current.get(key) || 0;
          const segH = Math.max(0.1, fromH + (targetH - fromH) * bp);

          drawnRef.current.set(key, segH);

          const yBottom = currentY;
          const yTop = currentY - segH;
          const rTop = j === bands.length - 1 ? 8 : 5;
          const rBottom = j === 0 ? 7 : 5;

          const hb = hoverRef.current.b;
          const hband = hoverRef.current.band;

          const isHot = hb === i && hband === j;
          const isOtherBranch = hb !== null && hb !== i;
          const isOtherBandInBranch = hb === i && hband !== null && hband !== j;

          let alpha = 1.0;
          if (isOtherBranch) alpha = 0.3;
          else if (isOtherBandInBranch) alpha = 0.48;

          const color = isHot ? HIGHLIGHT : bands[j].color;

          ctx.save();
          drawRoundedRect(ctx, x0, yTop, barW, segH, rTop, rBottom);
          ctx.clip();

          ctx.globalAlpha = alpha * 0.85;
          ctx.fillStyle = color;

          for (let bx = x0; bx < x0 + barW; bx += cell) {
            for (let by = yTop; by < yBottom; by += cell) {
              const dx = bx - (x0 + barW / 2);
              const dy = by - (yTop + segH / 2);
              const dist = Math.sqrt(dx * dx + dy * dy);

              const jitter = hash(bx, by);
              const wave = reducedMotion.current ? 0 : Math.sin(dist * 0.1 - t2 * 2) * 0.15;
              const sz = cell * (0.68 + wave + jitter * 0.2);

              ctx.fillRect(bx + (cell - sz) / 2, by + (cell - sz) / 2, sz, sz);
            }
          }

          ctx.restore();
          currentY = yTop;
        }
      }

      ctx.restore();
      requestRef.current = requestAnimationFrame(draw);
    };

    requestRef.current = requestAnimationFrame(draw);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [data, axisMax, branches, bands]);

  if (compact) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-2">
        <div className="relative w-full h-[120px]">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">
              <AnimatedValue value={totalValue} formatValue={formatValue} />
            </span>
            <span className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>total</span>
          </div>
          {subtitle && (
            <p className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs font-medium">
        {bands.map((band, idx) => (
          <div
            key={band.name}
            onMouseEnter={() => setHoverBand(idx)}
            onMouseLeave={() => setHoverBand(null)}
            className="flex items-center gap-1.5 cursor-pointer opacity-80 hover:opacity-100"
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: band.color }} />
            <span>{band.name}</span>
          </div>
        ))}
      </div>

      <div className="relative h-[200px] w-full rounded-xl overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <div className={`grid gap-2 mt-3 text-center text-xs font-semibold`}
        style={{ gridTemplateColumns: `repeat(${branches.length}, 1fr)` }}
      >
        {branches.map((branch, idx) => (
          <div
            key={branch.name}
            onMouseEnter={() => setHoverBranch(idx)}
            onMouseLeave={() => setHoverBranch(null)}
            className={`py-1.5 rounded-lg cursor-pointer transition-all ${
              hoverBranch === idx
                ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-neutral-200 text-black')
                : (theme === 'dark' ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
            }`}
          >
            {branch.name}
          </div>
        ))}
      </div>
    </div>
  );
}
