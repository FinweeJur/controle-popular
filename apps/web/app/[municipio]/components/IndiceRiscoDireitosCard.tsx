"use client";

import type { IndiceRiscoDireitos } from "@/lib/risco-direitos";
import Link from "next/link";

interface Props {
  indice: IndiceRiscoDireitos;
  municipioSlug: string;
  municipioNome: string;
}

export default function IndiceRiscoDireitosCard({
  indice,
  municipioSlug,
  municipioNome,
}: Props) {
  return (
    <section className="rounded-xl border border-border/70 bg-surface p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">
              Indicador Sintético
            </span>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{
                backgroundColor: `${indice.corHex}1a`,
                color: indice.corHex,
                border: `1px solid ${indice.corHex}40`,
              }}
            >
              {indice.rotuloNivel}
            </span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-text">
            Índice de Risco a Direitos — {municipioNome}
          </h2>
          <p className="mt-1 text-sm text-text-soft">
            Medição sintética de violação e ameaça a direitos fundamentais (saúde, meio ambiente, integridade e transparência).
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-lg bg-surface-raised p-4">
          <div className="text-right">
            <span className="text-xs text-text-soft">Score Global</span>
            <div
              className="font-tabular text-3xl font-extrabold"
              style={{ color: indice.corHex }}
            >
              {indice.scoreGeral}
              <span className="text-base font-normal text-text-soft">/100</span>
            </div>
          </div>
          <div className="h-10 w-[2px] bg-border/60" />
          <Link
            href={`/${municipioSlug}/interesses`}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            Ver Teia de Interesses →
          </Link>
        </div>
      </div>

      {/* Grid das 4 Dimensões */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border/50 bg-surface-raised p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-soft">🏥 Saúde & Vida</span>
            <span className="font-tabular text-xs font-bold text-text">
              {indice.dimensoes.saudeVida.score}/100
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/40">
            <div
              className="h-full bg-primary"
              style={{ width: `${indice.dimensoes.saudeVida.score}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-text-soft">
            {indice.dimensoes.saudeVida.fatores.length > 0
              ? `${indice.dimensoes.saudeVida.fatores.length} alerta(s) de internações/óbitos`
              : "Sem anomalias agudas detectadas"}
          </p>
        </div>

        <div className="rounded-lg border border-border/50 bg-surface-raised p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-soft">🌳 Socioambiental</span>
            <span className="font-tabular text-xs font-bold text-text">
              {indice.dimensoes.socioambientalClima.score}/100
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/40">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${indice.dimensoes.socioambientalClima.score}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-text-soft">
            {indice.dimensoes.socioambientalClima.fatores.length > 0
              ? `${indice.dimensoes.socioambientalClima.fatores.length} sobreposição/barragem crítica`
              : "Áreas monitoradas estáveis"}
          </p>
        </div>

        <div className="rounded-lg border border-border/50 bg-surface-raised p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-soft">🏛️ Finanças & Erário</span>
            <span className="font-tabular text-xs font-bold text-text">
              {indice.dimensoes.integridadeErario.score}/100
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/40">
            <div
              className="h-full bg-amber-500"
              style={{ width: `${indice.dimensoes.integridadeErario.score}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-text-soft">
            {indice.dimensoes.integridadeErario.fatores.length > 0
              ? `${indice.dimensoes.integridadeErario.fatores.length} vínculo(s) contratos-doações`
              : "Sem registros no CEIS/CNEP"}
          </p>
        </div>

        <div className="rounded-lg border border-border/50 bg-surface-raised p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-soft">⚖️ Opacidade Política</span>
            <span className="font-tabular text-xs font-bold text-text">
              {indice.dimensoes.opacidadePolitica.score}/100
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/40">
            <div
              className="h-full bg-indigo-500"
              style={{ width: `${indice.dimensoes.opacidadePolitica.score}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-text-soft">
            {indice.dimensoes.opacidadePolitica.fatores.length > 0
              ? "Câmara sem API aberta de votos"
              : "Transparência plena ativa"}
          </p>
        </div>
      </div>
    </section>
  );
}
