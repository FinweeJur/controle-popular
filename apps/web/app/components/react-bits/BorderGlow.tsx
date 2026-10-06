"use client";

/**
 * BorderGlow — brilho de borda que segue o cursor nas quinas do elemento.
 *
 * Origem: React Bits "BorderGlow" (licença MIT), fonte recebida pelo dono em
 * 06/10/2026. Papel no portal: dar "hover glow" aos cartões e aos botões
 * pequenos dentro deles, nos 4 eixos (pedido do dono na mesma data).
 *
 * Adaptações ao portal (por quê entre parênteses):
 * 1. props em português e classes `cp-borda-glow*` — nada no portal carrega
 *    nome genérico de biblioteca;
 * 2. CORES SAEM DOS TOKENS DO TEMA. O original pedia 3 hex fixos (roxo/rosa/
 *    azul) e um par "H S L" numérico para o brilho; aqui o brilho é `color-mix`
 *    sobre `--cp-primary` (aceita qualquer cor CSS, inclusive `var()`), e o
 *    mesh da borda usa primária/acento/secundária — trocar de tema repinta o
 *    efeito sem código por tema;
 * 3. NÃO FORÇA borda, fundo nem sombra: no portal o cartão já traz as classes
 *    (`border-border`, `bg-surface`, `shadow-xs`) e CSS sem camada venceria o
 *    Tailwind — o efeito só acrescenta as camadas de brilho;
 * 4. guardas: só ponteiro de mouse; desligado em `prefers-reduced-motion` e no
 *    tema de alto contraste (`useEfeitoPermitido`) — efeito decorativo nunca é
 *    informação;
 * 5. `claro` é prop explícita em vez de adivinhar pelo fundo: token é `var()`,
 *    não há hex para medir (o original tentava `isLightColor`).
 */
import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useEfeitoPermitido } from "./useEfeitoPermitido";
import "./BorderGlow.css";

export interface BorderGlowProps {
  children: ReactNode;
  /** Classes extras do elemento externo (no portal: as classes do cartão). */
  className?: string;
  /** Quão perto da borda o brilho aparece, 0–100. Padrão 30. */
  sensibilidade?: number;
  /** Cor do brilho (aceita token do tema). Padrão `var(--cp-primary)`. */
  corBrilho?: string;
  /** Fundo do miolo da camada de borda. Padrão `var(--cp-surface)`. */
  corFundo?: string;
  /** Raio do elemento em px. Padrão 24. */
  raio?: number;
  /** Quanto o brilho avança além do elemento, em px. Padrão 32. */
  raioBrilho?: number;
  /** Multiplicador de opacidade do brilho (0,1–3). Padrão 1. */
  intensidade?: number;
  /** Abertura do cone direcional, em % (5–45). Padrão 25. */
  aberturaCone?: number;
  /** Varredura de entrada ao montar. Padrão `false`. */
  animarEntrada?: boolean;
  /** As 3 cores do mesh de borda. Padrão primária/acento/secundária do tema. */
  cores?: [string, string, string];
  /** Opacidade do preenchimento de borda (0–1). Padrão 0,45. */
  opacidadePreenchimento?: number;
  /** Superfície clara (troca os blend modes). Padrão `false`. */
  claro?: boolean;
}

/** Posições e chaves do mesh de borda (as mesmas 7 do original). */
const POSICOES_GRAD = ["80% 55%", "69% 34%", "8% 6%", "41% 38%", "86% 85%", "82% 18%", "51% 4%"];
const CHAVES_GRAD = [
  "--cp-grad-1",
  "--cp-grad-2",
  "--cp-grad-3",
  "--cp-grad-4",
  "--cp-grad-5",
  "--cp-grad-6",
  "--cp-grad-7",
];
const MAPA_COR = [0, 1, 2, 0, 1, 2, 1];
/** Opacidades (em %) e sufixos de cada camada do brilho, do original. */
const CAMADAS_BRILHO: Array<[string, number]> = [
  ["", 100],
  ["-60", 60],
  ["-50", 50],
  ["-40", 40],
  ["-30", 30],
  ["-20", 20],
  ["-10", 10],
];

/** Monta as variáveis de cor do brilho como `color-mix` sobre a cor dada. */
function varsBrilho(cor: string, intensidade: number): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [sufixo, opacidade] of CAMADAS_BRILHO) {
    const pct = Math.min(opacidade * intensidade, 100);
    vars[`--cp-borda-cor${sufixo}`] = `color-mix(in srgb, ${cor} ${pct}%, transparent)`;
  }
  return vars;
}

/** Monta as 7 camadas do mesh de borda a partir das 3 cores. */
function varsGradiente(cores: [string, string, string]): Record<string, string> {
  const vars: Record<string, string> = {};
  for (let i = 0; i < 7; i += 1) {
    const cor = cores[Math.min(MAPA_COR[i], cores.length - 1)];
    vars[CHAVES_GRAD[i]] = `radial-gradient(at ${POSICOES_GRAD[i]}, ${cor} 0px, transparent 50%)`;
  }
  vars["--cp-grad-base"] = `linear-gradient(${cores[0]} 0 100%)`;
  return vars;
}

const BorderGlow: React.FC<BorderGlowProps> = ({
  children,
  className = "",
  sensibilidade = 30,
  corBrilho = "var(--cp-primary)",
  corFundo = "var(--cp-surface)",
  raio = 24,
  raioBrilho = 32,
  intensidade = 1,
  aberturaCone = 25,
  animarEntrada = false,
  cores = ["var(--cp-primary)", "var(--cp-accent)", "var(--cp-secondary)"],
  opacidadePreenchimento = 0.45,
  claro = false,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const permitido = useEfeitoPermitido();

  /**
   * Escreve proximidade e ângulo direto no estilo — sem estado React, o que
   * evita re-render a cada pixel de movimento.
   */
  const aoMover = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      if (e.pointerType !== "mouse") return;
      if (!permitido) return;
      const caixa = el.getBoundingClientRect();
      const width = caixa.width;
      const height = caixa.height;
      const x = e.clientX - caixa.left;
      const y = e.clientY - caixa.top;
      const cx = width / 2;
      const cy = height / 2;
      const dx = x - cx;
      const dy = y - cy;
      // Proximidade da borda: 1 no centro, 0 exatamente na borda (0..1).
      let kx = Infinity;
      let ky = Infinity;
      if (dx !== 0) kx = cx / Math.abs(dx);
      if (dy !== 0) ky = cy / Math.abs(dy);
      const borda = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
      const angulo = (Math.atan2(dy, dx) * (180 / Math.PI) + 90 + 360) % 360;
      el.style.setProperty("--cp-borda-prox", (borda * 100).toFixed(3));
      el.style.setProperty("--cp-borda-angulo", `${angulo.toFixed(3)}deg`);
    },
    [permitido],
  );

  // Varredura de entrada (opcional): roda uma vez, respeitando as guardas.
  useEffect(() => {
    const el = ref.current;
    if (!el || !animarEntrada || !permitido) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let quadro = 0;
    let vivo = true;
    const inicio = performance.now();
    const DURACAO = 900;
    const passo = () => {
      if (!vivo) return;
      const t = Math.min((performance.now() - inicio) / DURACAO, 1);
      // Sobe até ~35 e volta: um "acender e apagar" da borda inteira.
      const prox = Math.sin(t * Math.PI) * 35;
      el.style.setProperty("--cp-borda-prox", prox.toFixed(3));
      el.style.setProperty("--cp-borda-angulo", `${(110 + 355 * t).toFixed(3)}deg`);
      if (t < 1) quadro = requestAnimationFrame(passo);
      else el.style.setProperty("--cp-borda-prox", "0");
    };
    quadro = requestAnimationFrame(passo);
    return () => {
      vivo = false;
      cancelAnimationFrame(quadro);
    };
  }, [animarEntrada, permitido]);

  return (
    <div
      ref={ref}
      onPointerMove={aoMover}
      className={`cp-borda-glow${claro ? " cp-borda-glow--claro" : ""} ${className}`}
      style={
        {
          "--cp-borda-sens": sensibilidade,
          "--cp-borda-sens-cor": sensibilidade + 20,
          "--cp-borda-raio": `${raio}px`,
          "--cp-borda-luz-pad": `${raioBrilho}px`,
          "--cp-borda-cone": aberturaCone,
          "--cp-borda-fundo": corFundo,
          "--cp-borda-preench": opacidadePreenchimento,
          ...varsBrilho(corBrilho, intensidade),
          ...varsGradiente(cores),
        } as CSSProperties
      }
    >
      <span className="cp-borda-glow__luz" aria-hidden="true" />
      <div className="cp-borda-glow__interno">{children}</div>
    </div>
  );
};

export default BorderGlow;
