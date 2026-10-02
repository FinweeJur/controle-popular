"use client";

/**
 * @file CompanheiroFlutuante.tsx
 * @description O companheiro Seu Nonô no site: uma galinha flutuante, viva e
 * arrastável, que abre o assistente cívico. Roda SOZINHA — sem código, sem app
 * e sem pareamento (decisão do dono, 02/10/2026).
 *
 * PAPEL NO PROJETO
 * ----------------
 * É a cara visível do companheiro no portal. A rádio (`PlayerRadio.tsx`) e o
 * widget do Seu Nonô (`SeuNono.tsx`) vivem no canto inferior esquerdo e são
 * arrastáveis (`usarArrastavel`). Esta galinha nasce na MESMA coluna, logo
 * acima do Seu Nonô (`bottom-20 left-4`), e também é arrastável, com a posição
 * lembrada no `localStorage` (chave `cp_companheiro_pos`).
 *
 * Montada no layout RAIZ (`app/layout.tsx`), ela NÃO desmonta na navegação
 * entre páginas — então a galinha permanece de uma página para outra, com a
 * posição e o estado de ânimo preservados.
 *
 * ═══ A GALINHA TEM VIDA: 9 ESTADOS DO ATLAS PETDEX ═══
 *
 * A arte é o atlas do Petdex (`dingdong-chicken`, autor hydrogen2o — ver
 * `public/companheiro/dingdong-chicken/PROVENIENCIA.md`). O atlas tem 8
 * colunas × 9 linhas de 192×208, onde cada LINHA é um estado e cada coluna um
 * quadro (alguns estados têm menos quadros). Os estados usados:
 *
 *   idle | running-right | running-left | waving | jumping
 *   failed | waiting | running | review
 *
 * O estado reage ao contexto do portal, "combinando com o estágio" da página:
 *   - trocar de rota  → `jumping` (chegou);
 *   - passar o mouse  → `waving` (acena);
 *   - arrastar        → `running-left`/`running-right` (corre para o lado);
 *   - abrir o Seu Nonô → `waiting` (pensando);
 *   - sem internet    → `failed` (triste, fica até voltar);
 *   - parada há um tempo → `review` (quebra o idle).
 *
 * DECISÕES TÉCNICAS
 * -----------------
 * - O quadro avança por `requestAnimationFrame` escrevendo `background-position`
 *   direto no DOM (via `ref`), SEM re-render do React a cada quadro.
 * - Um atlas único (`estados.webp`, 99 KB, linha `idle`..`review`) é carregado
 *   uma vez e cacheado; o peso foi cortado de 1,2 MB para 99 KB recortando as
 *   9 linhas e reduzindo a 0,4 da escala nativa.
 * - Reusa `usarArrastavel`: **clique ≠ arrasto** pelo limiar de 5 px.
 * - `prefers-reduced-motion: reduce` congela no quadro 0 do idle.
 * - É um `<button>` de verdade: foco visível, teclado (Enter/Espaço) e
 *   `aria-label` — a galinha é decorativa (`aria-hidden`), o foco é o botão.
 */

import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { usePathname } from "next/navigation";
import { usarArrastavel } from "@/lib/usarArrastavel";

// ── Geometria do atlas (medida; ver PROVENIENCIA.md) ──────────────────────
const CELL_W = 192;
const CELL_H = 208;
const SHEET_COLS = 8;
const SHEET_ROWS = 9;
/** Caixa que a galinha de fato ocupa dentro da célula (o resto é transparente). */
const BBOX = { x: 44, y: 5, w: 103, h: 198 };
/** Altura que a galinha tem na tela (cabe no botão de 48 px). */
const ALTURA_TELA = 42;
const ESCALA = ALTURA_TELA / BBOX.h;
/** Duração de um quadro, em ms. */
const PERIODO = 130;

/** Estado -> linha no atlas e número de quadros (colunas usadas). */
const ESTADOS = {
  idle: { linha: 0, quadros: 7 },
  "running-right": { linha: 1, quadros: 8 },
  "running-left": { linha: 2, quadros: 8 },
  waving: { linha: 3, quadros: 4 },
  jumping: { linha: 4, quadros: 5 },
  failed: { linha: 5, quadros: 8 },
  waiting: { linha: 6, quadros: 6 },
  running: { linha: 7, quadros: 6 },
  review: { linha: 8, quadros: 6 },
} as const;

type NomeEstado = keyof typeof ESTADOS;

/** `background-position` que mostra o quadro `frame` do estado. */
function posicao(nome: NomeEstado, frame: number): string {
  const x = -(BBOX.x + frame * CELL_W) * ESCALA;
  const y = -(BBOX.y + ESTADOS[nome].linha * CELL_H) * ESCALA;
  return `${x}px ${y}px`;
}

interface EstadoAnim {
  nome: NomeEstado;
  /** Instante (ms) em que o estado começou, para calcular o quadro. */
  inicio: number;
  /** Instante em que um estado efêmero termina; `Infinity` para os fixos. */
  fim: number;
}

const IDLE: EstadoAnim = { nome: "idle", inicio: 0, fim: Number.POSITIVE_INFINITY };

export function CompanheiroFlutuante() {
  const { estilo, arrastando, foiArrasto, handlers } = usarArrastavel("cp_companheiro_pos");
  const pathname = usePathname();

  const spriteRef = useRef<HTMLSpanElement>(null);
  const estadoRef = useRef<EstadoAnim>(IDLE);
  const arrastandoRef = useRef(false);
  const direcaoRef = useRef<"running-right" | "running-left">("running-right");
  const pegaX = useRef(0);
  const pegaY = useRef(0);
  const ultimoX = useRef(0);

  /** Pede um estado por um tempo; estados `Infinity` seguram até outro pedir. */
  const pedir = useCallback((nome: NomeEstado, duracaoMs: number) => {
    const agora = performance.now();
    estadoRef.current = { nome, inicio: agora, fim: agora + duracaoMs };
  }, []);

  // Espelha o estado de arrasto num ref (o laço lê no rAF, fora do render).
  useEffect(() => {
    arrastandoRef.current = arrastando;
  }, [arrastando]);

  // ── O laço de animação: escreve background-position direto no DOM ────────
  useEffect(() => {
    const el = spriteRef.current;
    if (!el) return;
    el.style.backgroundPosition = posicao("idle", 0);

    // Sem movimento: fica no quadro 0 do idle.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const passo = (t: number) => {
      const est = estadoRef.current;
      // Estado efêmero vencido volta a `idle` (o arrasto manda enquanto acontece).
      if (t > est.fim && !arrastandoRef.current) {
        estadoRef.current = { nome: "idle", inicio: t, fim: Number.POSITIVE_INFINITY };
      }
      const atual = estadoRef.current;
      const def = ESTADOS[atual.nome];
      const frame = Math.floor((t - atual.inicio) / PERIODO) % def.quadros;
      el.style.backgroundPosition = posicao(atual.nome, frame);
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Reações ao contexto do portal ────────────────────────────────────────
  // Trocou de página: um pulinho de chegada.
  useEffect(() => {
    pedir("jumping", 800);
  }, [pathname, pedir]);

  // Abriu o Seu Nonô: a galinha fica "pensando" junto.
  useEffect(() => {
    const aoAbrir = () => pedir("waiting", 1500);
    window.addEventListener("abrir-seu-nono", aoAbrir);
    return () => window.removeEventListener("abrir-seu-nono", aoAbrir);
  }, [pedir]);

  // Sem internet: triste. Voltou: comemora.
  useEffect(() => {
    const offline = () => {
      estadoRef.current = { nome: "failed", inicio: performance.now(), fim: Number.POSITIVE_INFINITY };
    };
    const online = () => pedir("jumping", 800);
    if (typeof navigator !== "undefined" && navigator.onLine === false) offline();
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    return () => {
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
    };
  }, [pedir]);

  // Parada há um tempo: uma quebra de idle de vez em quando.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!arrastandoRef.current && estadoRef.current.nome === "idle") {
        pedir("review", 1600);
      }
    }, 22000);
    return () => window.clearInterval(id);
  }, [pedir]);

  /** Clicar leva ao assistente; arrastar só move a galinha. */
  const aoClicar = useCallback(() => {
    if (foiArrasto()) return;
    window.dispatchEvent(new CustomEvent("abrir-seu-nono"));
  }, [foiArrasto]);

  // Handlers do arrasto + a direção do movimento para correr para o lado certo.
  const handlersCompostos = {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      pegaX.current = e.clientX;
      pegaY.current = e.clientY;
      ultimoX.current = e.clientX;
      handlers.onPointerDown(e);
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      handlers.onPointerMove(e);
      if (Math.hypot(e.clientX - pegaX.current, e.clientY - pegaY.current) < 5) return;
      const dx = e.clientX - ultimoX.current;
      if (Math.abs(dx) > 2) direcaoRef.current = dx >= 0 ? "running-right" : "running-left";
      ultimoX.current = e.clientX;
      if (estadoRef.current.nome !== direcaoRef.current) {
        estadoRef.current = { nome: direcaoRef.current, inicio: performance.now(), fim: Number.POSITIVE_INFINITY };
      }
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
      handlers.onPointerUp(e);
      estadoRef.current = IDLE;
    },
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => {
      handlers.onPointerCancel(e);
      estadoRef.current = IDLE;
    },
  };

  return (
    <div className="fixed bottom-20 left-4 z-40 print:hidden" style={estilo}>
      <div className="group relative flex flex-col items-end">
        <button
          type="button"
          onClick={aoClicar}
          onMouseEnter={() => pedir("waving", 900)}
          onFocus={() => pedir("waving", 900)}
          {...handlersCompostos}
          aria-label="Abrir o Seu Nonô, o assistente do portal"
          title="Pergunte ao Seu Nonô — arraste para mover"
          className={`flex h-12 w-12 touch-none items-center justify-center rounded-full border border-border bg-surface shadow-lg transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${arrastando ? "cursor-grabbing" : "cursor-pointer"}`}
        >
          <span
            ref={spriteRef}
            aria-hidden="true"
            style={{
              display: "block",
              width: Math.round(BBOX.w * ESCALA),
              height: Math.round(BBOX.h * ESCALA),
              backgroundImage: "url('/companheiro/dingdong-chicken/estados.webp')",
              backgroundRepeat: "no-repeat",
              backgroundSize: `${SHEET_COLS * CELL_W * ESCALA}px ${SHEET_ROWS * CELL_H * ESCALA}px`,
              backgroundPosition: posicao("idle", 0),
            }}
          />
        </button>

        {/* Dica visual: aparece no hover e no foco por teclado. */}
        <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-text opacity-0 shadow transition group-hover:opacity-100 group-focus-within:opacity-100">
          Pergunte ao Seu Non&ocirc;
        </span>
      </div>
    </div>
  );
}
