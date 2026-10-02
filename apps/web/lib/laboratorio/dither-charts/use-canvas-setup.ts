import {
  useEffect,
  useRef,
  useCallback,
  type DependencyList,
  type RefObject,
} from 'react';

interface CanvasRect {
  width: number;
  height: number;
}

/**
 * Preparo do `<canvas>` dos gráficos dither: tamanho pelo devicePixelRatio,
 * observação de resize e leitura de `prefers-reduced-motion`. Compartilhado
 * por `lib/laboratorio/dither-charts/`. A visibilidade e a cadência do
 * desenho ficam em `useDitherLoop`.
 */
export function useCanvasSetup() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rect = useRef<CanvasRect>({ width: 0, height: 0 });
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

    updateRect();

    return () => {
      observer.disconnect();
    };
  }, [updateRect]);

  return { canvasRef, rect, reducedMotion };
}

/**
 * Laço único de animação dos gráficos dither. O código anterior criava um
 * `requestAnimationFrame` perpétuo por gráfico, redesenhando a grade de pontos
 * a 60 fps mesmo com o gráfico fora da tela, e recriava o laço a cada
 * `onPointerMove` (porque o hover estava nas dependências do efeito). Este
 * laço:
 *   1. desenha ~`fps` vezes por segundo (acumula tempo e ignora quadros);
 *   2. para de verdade quando o canvas sai da tela (`IntersectionObserver`) ou
 *      a aba fica oculta, e retoma ao voltar;
 *   3. lê `draw` de um ref, então hover/estado de ponteiro não recria o laço,
 *      e lê `frameScale` para manter a velocidade da onda original.
 *
 * Custo residual documentado (não escondido): mesmo com o gate e a cadência,
 * cada quadro ainda varre a grade com trigonometria. Fora da tela o custo é
 * zero; visível, cai para ~1/4 do original. Trocar o canvas por SVG está fora
 * de cogitação por decisão do dono.
 */
export function useDitherLoop(
  draw: (frameScale: number) => void,
  deps: DependencyList,
  options: { canvasRef: RefObject<HTMLCanvasElement | null>; fps?: number },
) {
  const drawRef = useRef(draw);
  // Mantém o desenho mais recente sem recriar o laço; a atribuição vai num
  // efeito porque a regra react-hooks/refs proíbe mexer em ref durante o render.
  useEffect(() => {
    drawRef.current = draw;
  });
  const { canvasRef, fps = 14 } = options;

  useEffect(() => {
    let raf = 0;
    let running = false;
    let onScreen = true;
    let last = 0;
    const interval = 1000 / fps;
    const canvas = canvasRef.current;

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (last === 0) {
        last = now;
        return;
      }
      const delta = now - last;
      if (delta < interval) return;
      last = now;
      // Quantos quadros de 60 fps passaram; limitado para não dar salto na
      // onda quando a aba volta do segundo plano.
      const frameScale = Math.min(delta / (1000 / 60), 5);
      drawRef.current(frameScale);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const sync = () => {
      // `requestAnimationFrame` já pausa com a aba oculta; aqui pausamos
      // explicitamente para nem registrar o callback, e para cobrir o caso
      // mais comum do portal: o gráfico rolado para fora da tela.
      if (onScreen && !document.hidden) start();
      else stop();
    };

    let io: IntersectionObserver | undefined;
    if (canvas && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      });
      io.observe(canvas);
    }
    document.addEventListener('visibilitychange', sync);
    sync();

    return () => {
      stop();
      io?.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
    // deps é dinâmico: quem chama decide quando o laço precisa ser refeito
    // (mudança de dados), não a cada movimento do ponteiro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
