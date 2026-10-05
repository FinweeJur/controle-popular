"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Square, Loader2 } from "lucide-react";
import { useLeitor, pausar, retomar, parar } from "@/lib/ouvir/leitor";
const emptySubscribe = () => () => {};

function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * Controles flutuantes de leitura — so aparecem DURANTE leitura ativa.
 * O botao de INICIAR fica na TopNav (`OuvirNavbar`); aqui ficam Pausar/Parar
 * para nao perder o controle depois de rolar a pagina. O estado e o audio
 * vem de `lib/ouvir/leitor` (mesmo audio dos dois controles).
 */
export default function OuvirPagina() {
  const mounted = useHasMounted();
  const pathname = usePathname();
  const leitor = useLeitor();

  // Ao trocar de rota, para a leitura (o conteudo mudou).
  useEffect(() => {
    if (mounted) parar();
  }, [mounted, pathname]);

  if (!mounted || leitor.estado === "idle") return null;

  const carregando = leitor.estado === "carregando";

  return (
    <div className="fixed right-5 bottom-5 z-40 flex items-center gap-2">
      <button
        type="button"
        onClick={carregando ? parar : leitor.estado === "falando" ? pausar : retomar}
        aria-pressed={leitor.estado === "falando"}
        aria-label={
          carregando ? "Cancelar leitura" : leitor.estado === "falando" ? "Pausar leitura" : "Retomar leitura"
        }
        className="cp-btn-anim flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink shadow-lg"
      >
        <span aria-hidden="true">
          {carregando ? (
            <Loader2 size={16} className="animate-spin" />
          ) : leitor.estado === "falando" ? (
            "⏸"
          ) : (
            "▶"
          )}
        </span>
        {carregando ? "Preparando" : leitor.estado === "falando" ? "Pausar" : "Retomar"}
      </button>
      <button
        type="button"
        onClick={parar}
        aria-label="Parar leitura"
        className="cp-btn-anim flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text shadow-lg"
      >
        <Square size={16} aria-hidden="true" />
      </button>
      <span role="status" className="sr-only">
        {leitor.estado === "falando" && "Lendo a pagina em voz alta."}
        {leitor.estado === "pausado" && "Leitura pausada."}
        {carregando && "Preparando a leitura."}
        {leitor.aviso}
      </span>
    </div>
  );
}
