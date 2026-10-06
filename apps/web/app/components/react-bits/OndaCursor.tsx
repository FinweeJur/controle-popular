"use client";

/**
 * OndaCursor — grade de formas que responde ao cursor e ao clique.
 *
 * Equivalente próprio, sem licença, do "Cursor Wave" (React Bits Pro). O dono
 * pediu para trocar o fundo de Cubes por ele (06/10/2026). Feito em DOM+CSS,
 * sem WebGL: uma grade de células que ACENDE perto do ponteiro e, no clique,
 * uma ONDA percorre a grade de dentro para fora.
 *
 * Herda do antigo `Cubes` tudo o que foi medido como necessário:
 * - ouve o `document` (a camada é `pointer-events: none`, então não recebe
 *   ponteiro por conta própria) e NUNCA chama `preventDefault` — rolagem e
 *   clique seguem da página;
 * - dorme no repouso (o laço para quando nada muda) e acorda no movimento;
 * - `prefers-reduced-motion` e alto contraste desligam (efeito decorativo
 *   nunca é informação).
 *
 * O que mudou em relação ao Cubes, além do desenho:
 * - 1 `<div>` por célula em vez de 7 (o cubo tinha 6 faces): a grade ficou
 *   ~3× mais leve em DOM sem perder a cara;
 * - sem `gsap`: o valor de cada célula (`--cp-onda`, 0..1) é suavizado por
 *   quadro e lido pelo CSS — cor, opacidade e escala andam juntas.
 */
import { useEffect, useRef, type CSSProperties } from "react";
import { useEfeitoPermitido } from "./useEfeitoPermitido";
import "./OndaCursor.css";

export interface OndaCursorProps {
  /** Células por lado (grade 12 = 144 células). Padrão 12. */
  grade?: number;
  /** Raio do acendimento no ponteiro, em células. Padrão 3,2. */
  raio?: number;
  /** Largura do anel da onda do clique, em células. Padrão 2,2. */
  anel?: number;
  /** Duração da onda do clique, em ms. Padrão 900. */
  duracaoOnda?: number;
  /** Cor de repouso/acesa das células (token do tema). */
  cor?: string;
  /** Largura do bloco (vence o `width: 50%` do CSS). */
  largura?: number | string;
  /** Estreitar as células arredondadas (px). Padrão 4. */
  raioCelula?: number;
  className?: string;
}

/** Suavização do acendimento (constante de tempo em segundos). */
const TAU = 0.09;

const OndaCursor: React.FC<OndaCursorProps> = ({
  grade = 12,
  raio = 3.2,
  anel = 2.2,
  duracaoOnda = 900,
  cor = "var(--cp-primary)",
  largura,
  raioCelula = 4,
  className = "",
}) => {
  const gradeRef = useRef<HTMLDivElement | null>(null);
  const permitido = useEfeitoPermitido();

  useEffect(() => {
    const gradeEl = gradeRef.current;
    if (!gradeEl || !permitido) return;

    const celulas = Array.from(
      gradeEl.querySelectorAll<HTMLElement>(".cp-onda__celula"),
    );
    const n = celulas.length;
    const centros = new Float32Array(n * 2);
    const atuais = new Float32Array(n);
    let passoPx = 1;

    /** Recalcula centros e o tamanho da célula (muda em resize/rolagem). */
    const medir = () => {
      const caixa = gradeEl.getBoundingClientRect();
      passoPx = caixa.width / grade || 1;
      for (let i = 0; i < n; i += 1) {
        const r = celulas[i].getBoundingClientRect();
        centros[i * 2] = r.left + r.width / 2;
        centros[i * 2 + 1] = r.top + r.height / 2;
      }
    };
    medir();

    let ponteiro: { x: number; y: number } | null = null;
    let onda: { x: number; y: number; inicio: number } | null = null;
    let quadro = 0;
    let ultimo = 0;
    let vivo = true;

    const passo = (agora: number) => {
      quadro = 0;
      if (!vivo) return;
      const dt = ultimo ? Math.min((agora - ultimo) / 1000, 0.05) : TAU;
      ultimo = agora;
      const k = 1 - Math.exp(-dt / TAU);

      const ondaAtiva = onda !== null && agora - onda.inicio < duracaoOnda;
      const progresso = onda && ondaAtiva ? (agora - onda.inicio) / duracaoOnda : 1;
      const raioOnda = progresso * grade * 1.3;
      const ox = onda?.x ?? 0;
      const oy = onda?.y ?? 0;

      let mudou = false;
      for (let i = 0; i < n; i += 1) {
        const cx = centros[i * 2];
        const cy = centros[i * 2 + 1];
        let alvo = 0;

        if (ponteiro) {
          const d = Math.hypot((cx - ponteiro.x) / passoPx, (cy - ponteiro.y) / passoPx);
          if (d < raio) {
            const t = 1 - d / raio;
            alvo = t * t * (3 - 2 * t); // suaviza a queda (smoothstep)
          }
        }
        if (ondaAtiva) {
          const d = Math.hypot((cx - ox) / passoPx, (cy - oy) / passoPx);
          const anelVal = Math.max(0, 1 - Math.abs(d - raioOnda) / anel);
          const comFade = anelVal * (1 - progresso);
          if (comFade > alvo) alvo = comFade;
        }

        const atual = atuais[i] + (alvo - atuais[i]) * k;
        if (Math.abs(atual - atuais[i]) > 0.004) {
          atuais[i] = atual;
          celulas[i].style.setProperty("--cp-onda", atual.toFixed(3));
          mudou = true;
        }
      }

      if (onda !== null && !ondaAtiva) onda = null;
      // Dorme quando nada muda e não há onda: zero custo ocioso.
      if (mudou || ondaAtiva) quadro = requestAnimationFrame(passo);
    };

    const acordar = () => {
      if (!quadro) {
        ultimo = 0;
        quadro = requestAnimationFrame(passo);
      }
    };

    const aoMover = (e: PointerEvent) => {
      ponteiro = { x: e.clientX, y: e.clientY };
      acordar();
    };
    const aoSair = () => {
      ponteiro = null;
      acordar();
    };
    const aoClicar = (e: MouseEvent) => {
      onda = { x: e.clientX, y: e.clientY, inicio: performance.now() };
      acordar();
    };
    const aoRedimensionar = () => {
      medir();
      acordar();
    };

    document.addEventListener("pointermove", aoMover, { passive: true });
    document.addEventListener("pointerleave", aoSair);
    document.addEventListener("click", aoClicar);
    window.addEventListener("blur", aoSair);
    window.addEventListener("resize", aoRedimensionar);
    window.addEventListener("scroll", aoRedimensionar, { passive: true });

    return () => {
      vivo = false;
      if (quadro) cancelAnimationFrame(quadro);
      document.removeEventListener("pointermove", aoMover);
      document.removeEventListener("pointerleave", aoSair);
      document.removeEventListener("click", aoClicar);
      window.removeEventListener("blur", aoSair);
      window.removeEventListener("resize", aoRedimensionar);
      window.removeEventListener("scroll", aoRedimensionar);
      for (const c of celulas) c.style.setProperty("--cp-onda", "0");
    };
  }, [permitido, grade, raio, anel, duracaoOnda]);

  const celulasIdx = Array.from({ length: grade * grade });

  return (
    <div
      className={`cp-onda ${className}`}
      style={
        {
          ...(largura !== undefined
            ? { width: typeof largura === "number" ? `${largura}px` : largura }
            : {}),
          "--cp-onda-cor": cor,
          "--cp-onda-raio": `${raioCelula}px`,
        } as CSSProperties
      }
    >
      <div
        ref={gradeRef}
        className="cp-onda__grade"
        style={{ gridTemplateColumns: `repeat(${grade}, 1fr)` }}
        aria-hidden="true"
      >
        {celulasIdx.map((_, i) => (
          <span key={i} className="cp-onda__celula" />
        ))}
      </div>
    </div>
  );
};

export default OndaCursor;
