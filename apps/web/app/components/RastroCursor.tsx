"use client";

/**
 * RastroCursor — trilha de LETRAS que desenha palavras seguindo o mouse.
 *
 * O que é: uma corrente de caracteres atrás do ponteiro. Cada caractere é
 * um elo da corrente: o primeiro persegue o mouse, o segundo persegue o
 * primeiro, e assim por diante — o conjunto forma a curva do movimento. As
 * letras saem de um texto fixo (o vocabulário do portal), lidas em ciclo:
 * conforme a cabeça anda, o texto "rola" pela corrente e as palavras vão se
 * alternando (paz, harmonia, saúde, natureza, ayllu, pachamama, abya yala…).
 * De tempos em tempos entra a saudação pelo relógio de quem lê: bom dia,
 * boa tarde ou boa noite.
 *
 * Pedido do dono (30/09/2026), a partir do vídeo "Vibe Coding a Cursor
 * Trail Text Component in Framer" (efeito "TrailCursor"): a referência
 * mostra uma corrente de letras escrevendo a palavra atrás do cursor. O
 * módulo do Framer é asset pago e vem vazio fora do editor, então o efeito
 * foi RECRIADO (não copiado).
 *
 * Decisões técnicas:
 * - corrente de nós com suavização (lerp) em `requestAnimationFrame`, texto
 *   do DOM direto (sem re-render do React a cada quadro);
 * - a cabeça anda mais rápido (0,15) que a cauda (0,13 de perseguição ao
 *   nó anterior): dá o efeito de chicote/rastro da referência. Valores
 *   baixos de propósito — pedido do dono (03/10/2026): perseguição ainda
 *   mais lenta, atrasada atrás do ponteiro, sem colar nele (era 0,26/0,22
 *   desde 02/10/2026);
 * - o índice do texto avança por DISTÂNCIA percorrida (36 px por letra),
 *   não por tempo: parado, o texto não troca sozinho; andando, rola. São
 *   36 px (era 26) para cada letra durar mais tempo na tela — pedido do
 *   dono (03/10/2026);
 * - a opacidade cai ao longo da corrente (`--i`) e a camada some quando o
 *   mouse para (economiza bateria e evita a "bola" de letras sobrepostas).
 *   O desaparecer é lento de propósito: 1600 ms parado + fade de 1,6 s
 *   mantêm o rastro legível um instante depois que o ponteiro pára
 *   (pedido do dono, 03/10/2026; era 700 ms e 0,7 s);
 * - é decorativo: `aria-hidden`, `pointer-events: none`, sem captura de
 *   clique; respeita `prefers-reduced-motion` e não liga em tela de toque.
 *
 * Cores: usa `--cp-accent` (acompanha o tema) com um brilho suave, no
 * espírito neon da referência.
 */

import { useEffect, useRef } from "react";

/**
 * Vocabulário da trilha, na ordem em que as palavras se alternam. Fica aqui
 * (fora do render) para o componente ser só apresentação; acrescentar
 * palavra é editar esta lista.
 */
const PALAVRAS = [
  "paz",
  "harmonia",
  "saúde",
  "vida",
  "natureza",
  "bem viver",
  "ayllu",
  "pachamama",
  "pindorama",
  "abya yala",
  "cultura",
  "lazer",
  "esporte",
  "orçamento",
  "direitos",
  "revolução",
  "povo",
  "latinoamérica",
  "brasilcoms",
  "étempodeavançar",
  "soberania",
  "mística",
  "umdiadecadavez",
  "respire",
  "obrigado",
  "cooperação",
  "solidariedade",
  "tatarana",
  "urutubranco",
  "diadorim",
  "grandesertão",
  "chapada",
  "riosvivos",
  "florestadepé",
  "mulheresvivaselivres",
  "demarcaçãojá",
  "lutarsempre",
] as const;

/** Saudação pelo relógio local de quem lê. */
function saudacao(agora: Date = new Date()): string {
  const h = agora.getHours();
  if (h >= 5 && h < 12) return "bom dia";
  if (h >= 12 && h < 18) return "boa tarde";
  return "boa noite";
}

/**
 * Texto da corrente: as palavras separadas por espaço, com a saudação do
 * horário entrando a cada 6 palavras. O espaço vira um elo "vazio", que
 * separa visualmente uma palavra da outra.
 */
function montarTexto(): string {
  const partes: string[] = [];
  PALAVRAS.forEach((palavra, i) => {
    partes.push(palavra);
    if ((i + 1) % 6 === 0) partes.push(saudacao());
  });
  return partes.join(" ").toUpperCase();
}

/** Quantos elos (letras) a corrente tem. */
const ELOS = 48;
/**
 * Suavização da cabeça (persegue o mouse). Quanto maior, mais rápido ela
 * acompanha e menos o rastro atrasa. NOVA ORDEM do dono (05/10/2026): o
 * rastro estava lento e atrasado demais a pedido anterior (0,15 em 03/10);
 * subiu para 0,32. Era 0,15 (03/10), 0,26 (02/10) e 0,38 antes disso.
 */
const SUAVE_CABECA = 0.32;
/**
 * Suavização da cauda (cada elo persegue o anterior). Mantém ~85% da cabeça
 * para o chicote não ficar duro nem elástico — 0,27 acompanha o 0,32 (05/10).
 */
const SUAVE_CAUDA = 0.27;
/**
 * Quantos pixels a cabeça anda para a corrente rolar UMA letra. 24 px (era
 * 36 em 03/10) para as letras correrem mais rápido, acompanhando a nova
 * velocidade pedida pelo dono (05/10/2026).
 */
const PX_POR_LETRA = 24;
/**
 * Sem mover por este tempo, a corrente começa a sumir. 1000 ms (era 1600 em
 * 03/10) — o dono achou o rastro longo demais parado (05/10/2026).
 */
const OCIOSO_MS = 1000;

export default function RastroCursor() {
  const camadaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const camada = camadaRef.current;
    if (!camada) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    const texto = montarTexto();
    const elos: { el: HTMLSpanElement; x: number; y: number }[] = [];
    for (let i = 0; i < ELOS; i += 1) {
      const el = document.createElement("span");
      el.className = "cp-rastro-elo";
      el.style.setProperty("--i", String(i));
      el.textContent = texto[i % texto.length];
      camada.appendChild(el);
      elos.push({ el, x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }

    let alvoX = window.innerWidth / 2;
    let alvoY = window.innerHeight / 2;
    let ultimoMovimento = 0;
    let distancia = 0;
    let deslocamento = 0;
    let quadro = 0;
    let visivel = false;

    const acordar = () => {
      if (!visivel) {
        camada.style.opacity = "1";
        visivel = true;
      }
      if (!quadro) quadro = requestAnimationFrame(rodar);
    };

    const aoMover = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      alvoX = e.clientX;
      alvoY = e.clientY;
      ultimoMovimento = performance.now();
      acordar();
    };

    const rodar = () => {
      const cabecaX = elos[0].x;
      const cabecaY = elos[0].y;
      elos[0].x += (alvoX - elos[0].x) * SUAVE_CABECA;
      elos[0].y += (alvoY - elos[0].y) * SUAVE_CABECA;
      for (let i = 1; i < elos.length; i += 1) {
        elos[i].x += (elos[i - 1].x - elos[i].x) * SUAVE_CAUDA;
        elos[i].y += (elos[i - 1].y - elos[i].y) * SUAVE_CAUDA;
      }

      const andou = Math.hypot(elos[0].x - cabecaX, elos[0].y - cabecaY);
      if (andou > 0.01) {
        distancia += andou;
        const novo = Math.floor(distancia / PX_POR_LETRA);
        if (novo !== deslocamento) {
          deslocamento = novo;
          for (let i = 0; i < elos.length; i += 1) {
            elos[i].el.textContent =
              texto[(((deslocamento + i) % texto.length) + texto.length) % texto.length];
          }
        }
      }

      for (const elo of elos) {
        elo.el.style.transform = `translate3d(${elo.x.toFixed(1)}px, ${elo.y.toFixed(
          1,
        )}px, 0) translate(-50%, -50%)`;
      }

      if (performance.now() - ultimoMovimento > OCIOSO_MS && andou < 0.15) {
        camada.style.opacity = "0";
        visivel = false;
        quadro = 0;
        return;
      }
      quadro = requestAnimationFrame(rodar);
    };

    window.addEventListener("pointermove", aoMover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", aoMover);
      if (quadro) cancelAnimationFrame(quadro);
      elos.forEach((elo) => elo.el.remove());
    };
  }, []);

  return (
    <>
      <style>{`
        .cp-rastro-camada {
          position: fixed;
          inset: 0;
          z-index: 30;
          pointer-events: none;
          overflow: hidden;
          opacity: 0;
          /* Desaparecimento lento: 1,6 s (pedido do dono, 03/10/2026);
             era 0,7 s desde 02/10/2026 e 0,25 s antes disso. */
          transition: opacity 1.6s ease;
          contain: strict;
        }
        .cp-rastro-elo {
          position: fixed;
          left: 0;
          top: 0;
          font-family: var(--font-tabular-raw, var(--font-general-sans, monospace));
          font-size: 0.95rem;
          font-weight: 600;
          text-transform: uppercase;
          white-space: pre;
          color: var(--cp-primary, var(--primary, #f2701d));
          opacity: calc(1 - var(--i) * 0.012);
          text-shadow: 0 0 9px color-mix(in srgb, var(--cp-primary, var(--primary, #f2701d)) 60%, transparent);
          will-change: transform;
          user-select: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .cp-rastro-camada { display: none; }
        }
      `}</style>
      <div ref={camadaRef} aria-hidden="true" className="cp-rastro-camada" />
    </>
  );
}
