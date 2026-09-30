"use client";

import { useEffect } from "react";
import { useLoading } from "@/lib/use-loading";
import { WavePhysicsLoader, DotsRing } from "@/app/components/loaders";

/**
 * Indicador fixo e elegante de carregamento entre páginas do portal.
 *
 * Localizado no canto inferior esquerdo (fixed bottom-5 left-5 z-[55]),
 * afastado do FAB do Seu Nonô (que mora na direita).
 * Não sobrepõe texto, não bloqueia navegação e fecha automaticamente
 * assim que a nova página conclui o carregamento.
 *
 * Enquanto estiver aberto, liga `data-carregando` no `<body>`. É esse
 * atributo — e não uma marcação em cada página — que faz o cursor do
 * mouse virar a hora arejada do pacote Korkhon em TODA a tela
 * (`globals.css`). O cursor é propriedade herdada, então um único
 * atributo no corpo cobre as ~100 páginas do portal.
 */
export default function LoadingOverlay() {
  const { carregando, segundos } = useLoading();

  useEffect(() => {
    if (carregando) {
      document.body.setAttribute("data-carregando", "");
    } else {
      document.body.removeAttribute("data-carregando");
    }
    // Se o componente desmontar no meio da navegação, o atributo não
    // pode ficar preso — senão o cursor ficaria preso em "esperando".
    return () => document.body.removeAttribute("data-carregando");
  }, [carregando]);

  if (!carregando) return null;

  return (
    <aside
      aria-label="Status de carregamento da página"
      className="fixed bottom-5 left-5 z-[55] pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="pointer-events-auto flex flex-col items-center rounded-2xl border border-border/80 bg-surface/95 p-3 shadow-2xl backdrop-blur-md max-w-[280px] sm:max-w-[320px]">
        {/* Animação física de onda */}
        <div className="w-full flex justify-center -my-10 overflow-hidden">
          <WavePhysicsLoader className="scale-[0.52] origin-center py-0" />
        </div>

        {/* Rodapé com CircularBars e contador de segundos */}
        <div
          role="status"
          aria-live="polite"
          className="mt-1 flex items-center justify-between w-full gap-2 border-t border-border/40 pt-2 text-[0.75rem]"
        >
          <div className="flex items-center gap-1.5 font-medium text-text">
            <DotsRing size={14} className="text-text" />
            <span>Navegando no portal…</span>
          </div>
          <span className="font-tabular text-text-soft bg-surface-2 px-1.5 py-0.5 rounded text-[11px]">
            {segundos}s
          </span>
        </div>
      </div>
    </aside>
  );
}

