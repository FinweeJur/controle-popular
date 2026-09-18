import { WavePhysicsLoader } from "@/app/components/loaders";

/**
 * Loading state nativo do Next.js App Router (React Suspense).
 *
 * Cobre automaticamente todos os eixos e subfrentes do portal
 * (/cidades, /congresso, /judiciario, /ambiental, /terras, etc.)
 * durante a troca de rotas e carregamento de dados no servidor.
 *
 * Fixo no centro da área visível, com reserva de espaço limpa
 * para evitar layout shift e sem sobrepor o cabeçalho TopNav.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[55vh] w-full flex-col items-center justify-center p-6"
    >
      <div className="flex flex-col items-center justify-center rounded-3xl border border-border/50 bg-surface/50 p-6 backdrop-blur-sm shadow-sm">
        <WavePhysicsLoader legenda="Carregando dados públicos…" />
      </div>
    </div>
  );
}
