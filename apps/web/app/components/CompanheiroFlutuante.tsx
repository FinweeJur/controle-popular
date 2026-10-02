"use client";

/**
 * @file CompanheiroFlutuante.tsx
 * @description O companheiro Seu Nonô no site: uma galinha flutuante e
 * arrastável que abre o assistente cívico. Roda SOZINHA — sem código, sem app
 * e sem pareamento (decisão do dono, 02/10/2026, PLANO-CORRECOES-POS-DEPLOY).
 *
 * PAPEL NO PROJETO
 * ----------------
 * É a cara visível do companheiro no portal. A rádio (`PlayerRadio.tsx`) e o
 * widget do Seu Nonô (`SeuNono.tsx`) vivem no canto inferior esquerdo e são
 * arrastáveis (`usarArrastavel`). Esta galinha nasce na MESMA coluna, logo
 * acima do Seu Nonô (`bottom-20 left-4`), em 48 px, e também é arrastável, com
 * a posição lembrada no `localStorage` (chave `cp_companheiro_pos`).
 *
 * Quem conduz a pessoa até a página é o Seu Nonô: clicar na galinha publica o
 * evento global `abrir-seu-nono`, que o `SeuNono.tsx` ouve para abrir o
 * assistente com a escada determinística e o RAG. A galinha não gera código de
 * sessão: o pareamento com o app de desktop segue OPCIONAL, dentro do próprio
 * widget (`SessaoCompanheiro.tsx`, botão "conectar app"). Sem app, nada quebra.
 *
 * DECISÕES TÉCNICAS
 * -----------------
 * - Reusa `usarArrastavel`: **clique ≠ arrasto** pelo limiar de 5 px, senão
 *   mexer a galinha abriria o assistente sem querer.
 * - **Arte do Petdex** (`dingdong-chicken`, autor hydrogen2o): o atlas público
 *   foi baixado de `petdex.dev` e recortado para a linha `idle`
 *   (`public/companheiro/dingdong-chicken/idle.webp`). Procedência e a
 *   pendência de licença ficam em `PROVENIENCIA.md`, na mesma pasta — o dono
 *   vai contatar o autor (decisão de 02/10/2026).
 * - Anima no CSS e desliga em `prefers-reduced-motion: reduce` (§ acessibilidade).
 * - É um `<button>` de verdade: foco visível, teclado (Enter/Espaço) e
 *   `aria-label` — a galinha é decorativa (`aria-hidden`), o foco é o botão.
 */

import { useCallback } from "react";
import { usarArrastavel } from "@/lib/usarArrastavel";

/**
 * Galinha do companheiro — sprite do Petdex (`dingdong-chicken`).
 *
 * O atlas (8 colunas × 11 linhas de 192×208) foi recortado para a linha
 * `idle` e salvo em `public/companheiro/dingdong-chicken/idle.webp`
 * (procedência e licença em `PROVENIENCIA.md`, mesma pasta). Cada célula tem
 * margem transparente: a galinha ocupa x44–147 / y5–203, então o recorte usa
 * só essa caixa e o fundo avança os quadros por `background-position`.
 *
 * A animação é CSS puro e para em `prefers-reduced-motion: reduce` (aí fica no
 * quadro 0). O tamanho é calculado para caber no botão de 48 px.
 */
function GalinhaCompanheira({ className = "" }: { className?: string }) {
  // Geometria MEDIDA no atlas — não são valores mágicos; ver PROVENIENCIA.md.
  const CAIXA = { x: 44, y: 5, w: 103, h: 198 };
  const QUADROS = 7;
  const CELULA = 192; // largura de uma célula na folha
  const ALTURA = 42; // cabe no botão h-12 (48 px) com folga
  const escala = ALTURA / CAIXA.h;
  const x0 = CAIXA.x * escala;

  return (
    <span
      aria-hidden="true"
      className={`cp-galinha ${className}`}
      style={{
        display: "block",
        width: Math.round(CAIXA.w * escala),
        height: Math.round(CAIXA.h * escala),
        backgroundImage: "url('/companheiro/dingdong-chicken/idle.webp')",
        backgroundRepeat: "no-repeat",
        backgroundSize: `${1536 * escala}px ${208 * escala}px`,
        backgroundPositionX: `${-x0}px`,
        backgroundPositionY: `${-CAIXA.y * escala}px`,
      }}
    >
      <style>{`
        .cp-galinha { animation: cp-galinha-idle 1.1s steps(${QUADROS}) infinite; }
        @keyframes cp-galinha-idle {
          from { background-position-x: ${-x0}px; }
          to   { background-position-x: ${-(x0 + QUADROS * CELULA * escala)}px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cp-galinha { animation: none; }
        }
      `}</style>
    </span>
  );
}

export function CompanheiroFlutuante() {
  const { estilo, arrastando, foiArrasto, handlers } = usarArrastavel("cp_companheiro_pos");

  /** Clicar leva ao assistente; arrastar só move a galinha. */
  const aoClicar = useCallback(() => {
    if (foiArrasto()) return; // o gesto foi arrastar, não clicar
    window.dispatchEvent(new CustomEvent("abrir-seu-nono"));
  }, [foiArrasto]);

  return (
    <div className="fixed bottom-20 left-4 z-40 print:hidden" style={estilo}>
      <div className="group relative flex flex-col items-end">
        <button
          type="button"
          onClick={aoClicar}
          {...handlers}
          aria-label="Abrir o Seu Nonô, o assistente do portal"
          title="Pergunte ao Seu Nonô — arraste para mover"
          className={`flex h-12 w-12 touch-none items-center justify-center rounded-full border border-border bg-surface shadow-lg transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${arrastando ? "cursor-grabbing" : "cursor-pointer"}`}
        >
          <GalinhaCompanheira />
        </button>

        {/* Dica visual: aparece no hover e no foco por teclado. */}
        <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-text opacity-0 shadow transition group-hover:opacity-100 group-focus-within:opacity-100">
          Pergunte ao Seu Non&ocirc;
        </span>
      </div>
    </div>
  );
}
