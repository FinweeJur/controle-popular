"use client";

/**
 * @file CompanheiroFlutuante.tsx
 * @description O companheiro Seu Nonô no site: uma galinha SOLTA que anda pelo
 * chão da tela, sobre o conteúdo, e VOA em arco até o botão que a pessoa
 * precisa clicar quando o Seu Nonô encontra uma página. Roda sozinha — sem
 * código, sem app e sem pareamento (decisão do dono, 02/10/2026).
 *
 * MECÂNICA (adaptada do Clicky original) ────────────────────────────────────
 * O Clicky de desktop (farzaa/clicky, porta Bitshank-2338/clicky-windows,
 * espelhado aqui) tem três peças que reproduzimos:
 *
 *   1. **Bicho solto, ao lado do conteúdo** — não é um botão; é um overlay
 *      `pointer-events: none` (o sprite continua arrastável). Ele não bloqueia
 *      o clique no que está atrás.
 *   2. **Voo em arco bezier** ("teacher pace") até o alvo, em vez de pulo seco.
 *   3. **Anel pulsante** sobre o elemento enquanto ele fica parado ali
 *      ("dwell"), e depois volta a passear.
 *
 * QUEM DIZ ONDE CLICAR: a resposta do Seu Nonô marca o botão "Abrir página"
 * com `data-companheiro-alvo="abrir-pagina"` (o mesmo atributo que a
 * `PonteCompanheiro` manda para o app local). A galinha observa o DOM, acha o
 * primeiro alvo visível e voa até ele. O Seu Nonô responde; a galinha guia.
 *
 * A galinha vive no layout RAIZ (`app/layout.tsx`): permanece de uma página
 * para outra.
 *
 * ARTE: atlas do Petdex (`dingdong-chicken`) — 8 colunas × 9 linhas de 192×208,
 * uma linha por estado. Ver `public/companheiro/dingdong-chicken/PROVENIENCIA.md`.
 *
 * DECISÕES TÉCNICAS
 * -----------------
 * - Um único `requestAnimationFrame` escreve `transform`/`background-position`
 *   direto no DOM, SEM re-render por quadro. Passeio e voo são a mesma
 *   interpolação de posição.
 * - O alvo é relido a cada quadro (`getBoundingClientRect`), então o voo
 *   acompanha rolagem e mudança de layout sozinho.
 * - `prefers-reduced-motion`: fica parado no canto e não voa (acessibilidade).
 * - Clique na galinha abre o Seu Nonô; arrastar a move.
 */

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { usePathname } from "next/navigation";

// ── Geometria do atlas (medida; ver PROVENIENCIA.md) ──────────────────────
const CELL_W = 192;
const CELL_H = 208;
const SHEET_COLS = 8;
const SHEET_ROWS = 9;
const BBOX = { x: 44, y: 5, w: 103, h: 198 };
const ALTURA_TELA = 42;
const ESCALA = ALTURA_TELA / BBOX.h;
const PERIODO = 130; // ms por quadro

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

function posicao(nome: NomeEstado, frame: number): string {
  const x = -(BBOX.x + frame * CELL_W) * ESCALA;
  const y = -(BBOX.y + ESTADOS[nome].linha * CELL_H) * ESCALA;
  return `${x}px ${y}px`;
}

// ── Física do passeio/voo ─────────────────────────────────────────────────
const LARGURA_PET = Math.round(BBOX.w * ESCALA); // ~22
const ALTURA_PET = Math.round(BBOX.h * ESCALA); // 42
const VELOCIDADE = 34; // px por segundo andando
const MARGEM = 12;
const DUR_VOO_MIN = 420; // ms
const DUR_VOO_MAX = 900; // ms
const ESPERA_NO_ALVO_MS = 2800;

interface Ponto {
  x: number;
  y: number;
}

/** Ponto de uma curva de Bézier quadrática (arco do voo, "teacher pace"). */
function bezier(p0: Ponto, c: Ponto, p1: Ponto, t: number): Ponto {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
}

/** Suaviza a velocidade do voo (parte devagar, chega devagar). */
function suavizar(t: number): number {
  return t * t * (3 - 2 * t);
}

interface Voo {
  fase: "ida" | "volta";
  p0: Ponto;
  ctrl: Ponto;
  inicio: number;
  dur: number;
  destino: Ponto;
}

export function CompanheiroFlutuante() {
  const pathname = usePathname();
  const caixaRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<HTMLSpanElement>(null);
  const anelRef = useRef<HTMLSpanElement>(null);

  const posRef = useRef<Ponto>({ x: 24, y: 0 }); // y = o quanto subiu do chão
  const direcaoRef = useRef(1);
  const pausaAteRef = useRef(0);
  const arrastandoRef = useRef(false);
  const alvoElRef = useRef<HTMLElement | null>(null);
  const vooRef = useRef<Voo | null>(null);
  const chegouEmRef = useRef<number | null>(null);
  const estadoRef = useRef<{ nome: NomeEstado; inicio: number }>({ nome: "idle", inicio: 0 });

  // Posição inicial antes da pintura (evita "pulo" no primeiro quadro).
  useLayoutEffect(() => {
    if (caixaRef.current) {
      caixaRef.current.style.transform = `translate3d(${posRef.current.x}px, 0, 0)`;
    }
  }, []);

  /** Escreve posição, quadro e anel direto no DOM. */
  const aplicar = useCallback((agora: number, estado: NomeEstado) => {
    if (caixaRef.current) {
      caixaRef.current.style.transform = `translate3d(${Math.round(posRef.current.x)}px, ${Math.round(-posRef.current.y)}px, 0)`;
    }
    if (spriteRef.current) {
      const def = ESTADOS[estado];
      const frame = Math.floor((agora - estadoRef.current.inicio) / PERIODO) % def.quadros;
      spriteRef.current.style.backgroundPosition = posicao(estado, frame);
    }
    // Anel pulsante sobre o alvo durante o "dwell". `display` (não `opacity`):
    // a animação `animate-ping` mexe na opacidade e venceria o estilo inline.
    const anel = anelRef.current;
    if (anel) {
      if (chegouEmRef.current !== null && alvoElRef.current) {
        const r = alvoElRef.current.getBoundingClientRect();
        anel.style.left = `${r.left - 6}px`;
        anel.style.top = `${r.top - 6}px`;
        anel.style.width = `${r.width + 12}px`;
        anel.style.height = `${r.height + 12}px`;
        anel.style.display = "block";
      } else {
        anel.style.display = "none";
      }
    }
  }, []);

  // ── Centro do alvo onde a galinha para (logo acima dele, sem cobrir) ────
  const pontoDoAlvo = useCallback((): Ponto | null => {
    const el = alvoElRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return null;
    const x = Math.min(
      window.innerWidth - LARGURA_PET - MARGEM,
      Math.max(MARGEM, r.left + r.width / 2 - LARGURA_PET / 2),
    );
    const y = Math.max(0, window.innerHeight - r.top - 2);
    return { x, y };
  }, []);

  // ── O laço: passeio, voo de ida, dwell e voo de volta ───────────────────
  useEffect(() => {
    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let anterior = performance.now();

    const passo = (agora: number) => {
      const dt = Math.min(0.05, (agora - anterior) / 1000);
      anterior = agora;
      let estado: NomeEstado = "idle";
      const voo = vooRef.current;

      if (voo) {
        const t = Math.min(1, (agora - voo.inicio) / voo.dur);
        const destino = voo.fase === "ida" ? pontoDoAlvo() ?? voo.destino : voo.destino;
        posRef.current = bezier(voo.p0, voo.ctrl, destino, suavizar(t));
        estado = voo.fase === "ida" ? "jumping" : "running";
        if (t >= 1) {
          vooRef.current = null;
          if (voo.fase === "ida") chegouEmRef.current = agora; // dwell no alvo
        }
      } else if (chegouEmRef.current !== null) {
        // Parada no alvo: acena e mostra o anel. Depois, voo de volta.
        estado = "waving";
        if (agora - chegouEmRef.current > ESPERA_NO_ALVO_MS) {
          chegouEmRef.current = null;
          const p0 = { ...posRef.current };
          const destino: Ponto = { x: Math.max(MARGEM, Math.min(window.innerWidth - LARGURA_PET - MARGEM, p0.x)), y: 0 };
          vooRef.current = {
            fase: "volta",
            p0,
            ctrl: { x: (p0.x + destino.x) / 2, y: Math.max(p0.y, destino.y) + 80 },
            inicio: agora,
            dur: Math.min(DUR_VOO_MAX, DUR_VOO_MIN + Math.abs(p0.x - destino.x)),
            destino,
          };
        }
      } else if (!arrastandoRef.current && !semMovimento) {
        // Passeio: anda, pausa de vez em quando, vira nas bordas.
        if (agora >= pausaAteRef.current) {
          posRef.current.x += direcaoRef.current * VELOCIDADE * dt;
          const maxX = window.innerWidth - LARGURA_PET - MARGEM;
          if (posRef.current.x <= MARGEM) {
            posRef.current.x = MARGEM;
            direcaoRef.current = 1;
          } else if (posRef.current.x >= maxX) {
            posRef.current.x = maxX;
            direcaoRef.current = -1;
          }
          estado = direcaoRef.current > 0 ? "running-right" : "running-left";
          if (Math.random() < 0.004) pausaAteRef.current = agora + 900 + Math.random() * 1800;
        } else {
          estado = "idle";
        }
      }

      if (estadoRef.current.nome !== estado) estadoRef.current = { nome: estado, inicio: agora };
      aplicar(agora, estado);
      raf = requestAnimationFrame(passo);
    };

    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [aplicar, pontoDoAlvo]);

  // ── Voa em arco até um alvo ─────────────────────────────────────────────
  const voarPara = useCallback(
    (el: HTMLElement) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return; // fora da tela
      alvoElRef.current = el;
      const p0 = { ...posRef.current };
      const destino: Ponto =
        pontoDoAlvo() ?? { x: r.left, y: Math.max(0, window.innerHeight - r.top - 2) };
      vooRef.current = {
        fase: "ida",
        p0,
        ctrl: { x: (p0.x + destino.x) / 2, y: Math.max(p0.y, destino.y) + 90 },
        inicio: performance.now(),
        dur: Math.min(DUR_VOO_MAX, DUR_VOO_MIN + (Math.abs(p0.x - destino.x) + Math.abs(p0.y - destino.y)) * 0.4),
        destino,
      };
      chegouEmRef.current = null;
    },
    [pontoDoAlvo],
  );

  // Nova resposta do Seu Nonô muda o DOM: procura um alvo e voa até ele.
  useEffect(() => {
    const procurar = () => {
      if (vooRef.current || chegouEmRef.current !== null || alvoElRef.current) return;
      const alvo = document.querySelector<HTMLElement>('[data-companheiro-alvo="abrir-pagina"]');
      if (alvo) voarPara(alvo);
    };
    const obs = new MutationObserver(procurar);
    obs.observe(document.body, { childList: true, subtree: true });
    procurar();
    const t = window.setTimeout(procurar, 600);
    return () => {
      obs.disconnect();
      window.clearTimeout(t);
    };
  }, [pathname, voarPara]);

  // Gatilho manual (outro componente pode pedir o voo).
  useEffect(() => {
    const aoPedir = (e: Event) => {
      const sel = (e as CustomEvent<{ seletor?: string }>).detail?.seletor;
      const el = sel
        ? document.querySelector<HTMLElement>(sel)
        : document.querySelector<HTMLElement>('[data-companheiro-alvo="abrir-pagina"]');
      if (el) voarPara(el);
    };
    window.addEventListener("cp:companheiro-voar", aoPedir);
    return () => window.removeEventListener("cp:companheiro-voar", aoPedir);
  }, [voarPara]);

  const aoClicar = useCallback(() => {
    if (arrastandoRef.current) return;
    window.dispatchEvent(new CustomEvent("abrir-seu-nono"));
  }, []);

  // Arrasto: tira do passeio; soltar retoma a partir dali.
  const pega = useRef<{ px: number; py: number; x0: number; y0: number } | null>(null);
  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    pega.current = { px: e.clientX, py: e.clientY, x0: posRef.current.x, y0: posRef.current.y };
    arrastandoRef.current = true;
    alvoElRef.current = null;
    vooRef.current = null;
    chegouEmRef.current = null;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const g = pega.current;
    if (!g) return;
    posRef.current.x = Math.max(MARGEM, Math.min(window.innerWidth - LARGURA_PET - MARGEM, g.x0 + e.clientX - g.px));
    posRef.current.y = Math.max(0, g.y0 - (e.clientY - g.py));
  };
  const onPointerUp = () => {
    pega.current = null;
    arrastandoRef.current = false;
    pausaAteRef.current = performance.now() + 600;
  };

  return (
    <>
      {/* Anel pulsante sobre o alvo (mecânica do Clicky). Click-through. */}
      <span
        ref={anelRef}
        aria-hidden="true"
        className="pointer-events-none fixed z-40 animate-ping rounded-xl border-2 border-primary"
        style={{ display: "none" }}
      />

      {/* A galinha. O container é click-through; só o sprite pega o ponteiro. */}
      <div
        ref={caixaRef}
        className="pointer-events-none fixed bottom-2 left-0 z-40 print:hidden"
        style={{ willChange: "transform" }}
      >
        <button
          type="button"
          onClick={aoClicar}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label="Abrir o Seu Nonô, o assistente do portal"
          title="Pergunte ao Seu Nonô — arraste a galinha para mover"
          className="pointer-events-auto block touch-none rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-grab active:cursor-grabbing"
          style={{ width: LARGURA_PET + 8, height: ALTURA_PET }}
        >
          <span
            ref={spriteRef}
            aria-hidden="true"
            style={{
              display: "block",
              width: LARGURA_PET,
              height: ALTURA_PET,
              margin: "0 auto",
              backgroundImage: "url('/companheiro/dingdong-chicken/estados.webp')",
              backgroundRepeat: "no-repeat",
              backgroundSize: `${SHEET_COLS * CELL_W * ESCALA}px ${SHEET_ROWS * CELL_H * ESCALA}px`,
              backgroundPosition: posicao("idle", 0),
            }}
          />
        </button>
      </div>
    </>
  );
}
