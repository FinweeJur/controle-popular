import type { CoberturaMunicipal } from "@/lib/telefonia/cobertura";
import { Radio, ExternalLink } from "lucide-react";
import Link from "next/link";

interface CardCoberturaCelularProps {
  cobertura: CoberturaMunicipal;
  nomeCidade: string;
  className?: string;
}

export default function CardCoberturaCelular({
  cobertura,
  nomeCidade,
  className = "",
}: CardCoberturaCelularProps) {
  const { lider, ranking, total_torres, tem_5g } = cobertura;
  if (!lider) return null;

  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md ${className}`}
      role="region"
      aria-label={`Cobertura de telefonia celular em ${nomeCidade}`}
    >
      {/* Topo / Selo */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[.82em] font-semibold tracking-wide uppercase text-text-soft">
          <Radio className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>Sinal & Cobertura Celular</span>
        </div>
        {tem_5g ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            5G ativo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            4G disponível
          </span>
        )}
      </div>

      {/* Destaque da líder */}
      <div className="mt-3">
        <div className="text-[.82em] text-text-soft">
          Melhor cobertura em {nomeCidade}:
        </div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="font-display text-[1.65em] font-bold text-text">
            {lider.operadora}
          </span>
          <span className="text-[.92em] font-semibold text-primary font-tabular">
            {lider.pct}% das torres
          </span>
        </div>
        <div className="text-[11px] text-text-soft">
          {lider.torres} de {total_torres} torres instaladas ({lider.geracao_max})
        </div>
      </div>

      {/* Mini ranking de operadoras */}
      <div className="mt-3.5 border-t border-border pt-3">
        <div className="mb-2 text-[11px] font-semibold tracking-wider uppercase text-text-soft">
          Presença por operadora
        </div>
        <div className="space-y-1.5">
          {ranking.slice(0, 4).map((op) => (
            <div key={op.operadora} className="flex items-center justify-between text-[.82em]">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text">{op.operadora}</span>
                <span className="rounded bg-surface-2 px-1.5 py-0.2 text-[11px] text-text-soft font-mono">
                  {op.geracao_max}
                </span>
              </div>
              <div className="flex items-center gap-2 font-tabular">
                <span className="text-text-soft text-[.88em]">{op.torres} torres</span>
                <span className="font-semibold text-text w-9 text-right">{op.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé com links */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px]">
        <Link
          href="/funcaosocialterra/mapa?camada=torres-celular-mg"
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          <span>Ver torres no Globo 3D</span>
          <span aria-hidden="true">→</span>
        </Link>
        <a
          href="https://sistemas.anatel.gov.br/se/public/view/b/licenciamento.php"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-text-soft hover:underline"
        >
          <span>Anatel Mosaico</span>
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
