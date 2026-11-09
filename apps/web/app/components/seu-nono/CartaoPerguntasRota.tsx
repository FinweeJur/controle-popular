"use client";

/**
 * @file CartaoPerguntasRota.tsx
 * @description Cartão de perguntas sugeridas do Seu Nonô, por página/eixo.
 *
 * Pedido do dono (08/11/2026): uma cópia do cartão da home, com perguntas
 * diferentes segundo o tema da rota. O clique abre o Seu Nonô e envia a
 * pergunta para a IA (RAG), que responde de forma didática, com fonte e
 * ressalva — o mesmo caminho do cartão da home (`abrir-seu-nono`).
 *
 * As perguntas vêm de `lib/seu-nono/perguntas-ia.ts` (fonte única). Rota sem
 * entrada não renderiza nada. O efeito magnet é leve e desliga sozinho em
 * toque e em `prefers-reduced-motion` (porteiro dos react-bits).
 */

import { usePathname } from "next/navigation";
import { MessageSquare, Sparkles } from "lucide-react";
import Magnet from "@/app/components/react-bits/Magnet";
import { perguntasDaRota } from "@/lib/seu-nono/perguntas-ia";

export default function CartaoPerguntasRota() {
  const pathname = usePathname();
  const perguntas = perguntasDaRota(pathname);
  if (perguntas.length === 0) return null;

  function perguntar(texto: string) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("abrir-seu-nono", { detail: { pergunta: texto } }),
    );
  }

  return (
    <section
      aria-labelledby="perguntas-seu-nono"
      className="mt-8 rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="perguntas-seu-nono"
          className="flex items-center gap-1.5 font-display text-base font-bold text-text sm:text-lg"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          Pergunte ao Seu Nonô
        </h2>
        <span className="text-xs text-text-soft">resposta com fonte e ressalva</span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-text-soft">
        Perguntas deste tema. O clique abre o assistente e manda a pergunta
        para a IA, que responde em linguagem simples e cita a fonte.
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {perguntas.map((item) => (
          <li key={item.pergunta}>
            <Magnet forca={0.08}>
              <button
                type="button"
                onClick={() => perguntar(item.pergunta)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {item.rotulo}
              </button>
            </Magnet>
          </li>
        ))}
      </ul>
    </section>
  );
}
