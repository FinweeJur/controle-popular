import { useEffect, useRef, useCallback } from 'react';

interface CanvasRect {
  width: number;
  height: number;
}

export function useCanvasSetup() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rect = useRef<CanvasRect>({ width: 0, height: 0 });
  const isVisible = useRef(true);
  const reducedMotion = useRef(false);

  const updateRect = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    rect.current = { width: r.width, height: r.height };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== r.width * dpr || canvas.height !== r.height * dpr) {
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
    }
  }, []);

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new ResizeObserver(updateRect);
    if (canvasRef.current) observer.observe(canvasRef.current);

    const visObserver = new IntersectionObserver(
      ([entry]) => { isVisible.current = entry.isIntersecting; },
      { threshold: 0 }
    );
    if (canvasRef.current) visObserver.observe(canvasRef.current);

    updateRect();

    return () => {
      observer.disconnect();
      visObserver.disconnect();
    };
  }, [updateRect]);

  return { canvasRef, rect, isVisible, reducedMotion };
}
