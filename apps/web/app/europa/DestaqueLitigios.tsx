/**
 * Destaque do hub /europa para a subfrente de litígios transnacionais.
 *
 * Fica em componente próprio para não inflar a função `PaginaHubEuropa`
 * (limite de 120 linhas do CodeScene) e para reaproveitar o mesmo convite
 * em qualquer outro ponto do hub. Link interno via `next/link`.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DestaqueLitigios() {
  return (
    <Link
      href="/europa/litigios-transnacionais"
      className="mb-6 flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:border-primary/60 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Dossiê em destaque
        </p>
        <p className="mt-1 font-display text-lg font-semibold leading-snug text-text">
          Litígios transnacionais de Mariana e Brumadinho na Europa
        </p>
        <p className="mt-1 text-sm text-text-soft">
          Número do processo, fase, linha do tempo, clipping e o que ainda
          está pendente de conferência oficial.
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
        Ver os litígios <ArrowRight size={16} />
      </span>
    </Link>
  );
}
