"use client";

import { useLoading } from "@/lib/use-loading";

/**
 * Indicador sutil de carregamento. Bolinha + contador aparecem no canto
 * inferior direito (acima do FAB do Seu Nonô) quando o usuário navega
 * entre páginas. Não bloqueia visualização nem navegação — é pequeno,
 * discreto e some automaticamente ao carregar.
 */
export default function LoadingOverlay() {
  const { carregando, segundos } = useLoading();

  if (!carregando) return null;

  return (
    <div
      className="cp-painel-entra fixed bottom-20 right-4 z-[55] flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/80 px-2.5 py-1 text-[.75rem] shadow-sm backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={`Carregando ha ${segundos} segundos`}
    >
      <span className="cp-icon-spin inline-block h-3 w-3 rounded-full border-[1.5px] border-primary border-t-transparent" />
      <span className="font-tabular text-text-soft">{segundos}s</span>
    </div>
  );
}
