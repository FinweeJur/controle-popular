import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { useCanvasSetup } from './use-canvas-setup';
import { smoothstep, hash } from './dither-engine';

export interface GaugeMetric {
  name: string;
  value: number;
  color?: string;
}

export interface ServerGaugeProps {
  metrics: GaugeMetric[];
  title?: string;
  theme?: 'dark' | 'light';
  compact?: boolean;
}

export function ServerGauge({
  metrics,
  title,
  theme = 'dark',
  compact = false,
}: ServerGaugeProps) {
  const [metricIndex, setMetricIndex] = useState(0);
  const { canvasRef, rect, isVisible, reducedMotion } = useCanvasSetup();
  const metric = metrics[metricIndex] || metrics[0];

  const valSpring = useSpring(metric.value, { stiffness: 120, damping: 20 });

  useEffect(() => {
    valSpring.set(metric.value);
  }, [metric.value, valSpring]);

  useEffect(() => {
    let req: number;
    let time = 0;
    const draw = () => {
      if (!isVisible.current) { req = requestAnimationFrame(draw); return; }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width: w, height: h } = rect.current;
      if (w === 0 || h === 0) { req = requestAnimationFrame(draw); return; }

      time += reducedMotion.current ? 0 : 0.05;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h * 0.8;
      const rOut = Math.min(w * 0.4, h * 0.7);
      const rIn = rOut - 10;

      const jitter = reducedMotion.current ? 0 : Math.sin(time) * 2 + Math.cos(time * 2.3) * 1.5;
      const currentVal = valSpring.get() + jitter;

      const startAngle = Math.PI;
      const endAngle = Math.PI * 2;
      const valAngle = startAngle + (currentVal / 100) * Math.PI;

      ctx.beginPath();
      ctx.arc(cx, cy, rOut, startAngle, endAngle);
      ctx.arc(cx, cy, rIn, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fill();

      if (currentVal > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, rOut, startAngle, valAngle);
        ctx.arc(cx, cy, rIn, valAngle, startAngle, true);
        ctx.closePath();
        ctx.clip();

        ctx.globalAlpha = 0.9;
        ctx.fillStyle = metric.color || '#FFFFFF';

        const cell = Math.max(2, Math.round(w / 200));

        for (let x = Math.floor(cx - rOut); x <= Math.ceil(cx + rOut); x += cell) {
          for (let y = Math.floor(cy - rOut); y <= Math.ceil(cy); y += cell) {
            const jx = x + cell / 2;
            const jy = y + cell / 2;
            const jit = hash(jx, jy);

            const dx = jx - cx;
            const dy = jy - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < rIn - cell || dist > rOut + cell) continue;

            const waveRaw = reducedMotion.current
              ? 0
              : Math.sin(jx * 0.05 + time) + Math.sin(jy * 0.05 + time * 0.7);
            const mod = smoothstep(-1.5, 1.5, waveRaw);

            const sz = cell * (0.4 + 0.4 * mod) * (0.8 + 0.4 * jit);
            ctx.fillRect(x + (cell - sz) / 2, y + (cell - sz) / 2, sz, sz);
          }
        }
        ctx.restore();
      }

      ctx.restore();
      req = requestAnimationFrame(draw);
    };
    req = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(req);
  }, [metric, valSpring, reducedMotion]);

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
    <div className={`w-full rounded-3xl p-6 transition-colors border ${
      theme === 'dark'
        ? 'bg-[var(--cp-surface-2,#1b2536)] border-white/5 text-white'
        : 'bg-white border-[var(--cp-border,#e2e8f0)] text-[var(--cp-text,#0e1726)] shadow-lg'
    }`}>
      {title && (
        <div className="mb-4">
          <h4 className="text-sm font-bold">{title}</h4>
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full h-[120px] flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        <div className="text-center">
          <span className="text-2xl font-bold">{Math.round(metric.value)}%</span>
          <span className={`text-xs ml-2 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
            {metric.name}
          </span>
        </div>

        {metrics.length > 1 && (
          <div className="flex gap-2">
            {metrics.map((m, idx) => (
              <button
                key={m.name}
                onClick={() => setMetricIndex(idx)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  metricIndex === idx
                    ? 'bg-white/20 text-white'
                    : (theme === 'dark' ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
