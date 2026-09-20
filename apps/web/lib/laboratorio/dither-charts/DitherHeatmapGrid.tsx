import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface HeatmapCell {
  row: string;
  col: string;
  value: number;
}

export interface DitherHeatmapGridProps {
  rows: string[];
  cols: string[];
  data: number[][];
  title?: string;
  subtitle?: string;
  valueLabel?: string;
  theme?: 'dark' | 'light';
  compact?: boolean;
}

export function DitherHeatmapGrid({
  rows,
  cols,
  data,
  title = 'Heatmap',
  subtitle,
  valueLabel = 'ops/s',
  theme = 'dark',
  compact = false,
}: DitherHeatmapGridProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const requestRef = useRef<number>(0);

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
      const numCols = cols.length || 1;
      const numRows = rows.length || 1;
      const cellW = w / numCols;
      const cellH = h / numRows;
      const dotCell = Math.max(3, Math.round(w / 160));

      const maxVal = Math.max(...data.flat(), 1);

      data.forEach((row, d) => {
        row.forEach((val, c) => {
          const x0 = c * cellW;
          const y0 = d * cellH;
          const isHovered = hoveredCell?.row === d && hoveredCell?.col === c;
          const intensity = val / maxVal;

          for (let bx = Math.floor(x0); bx < Math.ceil(x0 + cellW - 2); bx += dotCell) {
            for (let by = Math.floor(y0); by < Math.ceil(y0 + cellH - 2); by += dotCell) {
              const shimmer = Math.sin(bx * 0.1 + timeRef.current * 2) * 0.1;
              if (Math.random() < intensity + shimmer || isHovered) {
                ctx.fillStyle = isHovered
                  ? 'var(--cp-accent, #0e8f6e)'
                  : `rgba(255, 255, 255, ${Math.min(1, Math.max(0.2, intensity))})`;
                const sz = dotCell * (isHovered ? 0.95 : 0.75);
                ctx.fillRect(bx, by, sz, sz);
              }
            }
          }
        });
      });

      ctx.restore();
      requestRef.current = requestAnimationFrame(draw);
    };

    requestRef.current = requestAnimationFrame(draw);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [data, rows, cols, hoveredCell]);

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
        </div>

        <div
          className="relative h-[160px] w-full touch-none cursor-pointer"
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const numCols = cols.length || 1;
            const numRows = rows.length || 1;
            const cIdx = Math.min(Math.max(0, Math.floor((x / rect.width) * numCols)), numCols - 1);
            const rIdx = Math.min(Math.max(0, Math.floor((y / rect.height) * numRows)), numRows - 1);
            setHoveredCell({ row: rIdx, col: cIdx });
          }}
          onPointerLeave={() => setHoveredCell(null)}
        >
          <canvas ref={canvasRef} className="w-full h-full pointer-events-none" />

          <AnimatePresence>
            {hoveredCell !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bg-neutral-900 border border-neutral-700 text-white rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full top-2"
                style={{ left: `${((hoveredCell.col + 0.5) / (cols.length || 1)) * 100}%` }}
              >
                {rows[hoveredCell.row]} / {cols[hoveredCell.col]}: {data[hoveredCell.row]?.[hoveredCell.col]} {valueLabel}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between text-[10px] text-neutral-400 px-1 pt-1">
          {cols.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
