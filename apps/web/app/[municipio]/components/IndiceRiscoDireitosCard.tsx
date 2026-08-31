"use client";

import type { IndiceRiscoDireitos } from "@/lib/risco-direitos";
import type { CoberturaIndice } from "@/lib/db/queries/risco-direitos";
import Link from "next/link";

interface Props {
  indice: IndiceRiscoDireitos;
  cobertura: CoberturaIndice;
  municipioSlug: string;
  municipioNome: string;
}

export default function IndiceRiscoDireitosCard({
  indice,
  cobertura,
  municipioSlug,
  municipioNome,
}: Props) {
  const dimensoesComDado = [
    cobertura.saudeVida,
    cobertura.socioambientalClima,
    cobertura.integridadeErario,
    cobertura.opacidadePolitica,
  ].filter(Boolean).length;
  const todasComDado = dimensoesComDado === 4;

  return (
    <section className="rounded-xl border border-border/70 bg-surface p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">
              Indicador Sintético
            </span>
            {todasComDado ? (
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
            ) : (
              <span className="inline-flex items-center rounded-full bg-border/50 px-2.5 py-0.5 text-xs font-bold text-text-soft">
                Índice parcial — {dimensoesComDado} de 4 dimensões com dado
              </span>
            )}
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-text">
            Índice de Risco a Direitos — {municipioNome}
          </h2>
          <p className="mt-1 text-sm text-text-soft">
            Medição sintética de violação e ameaça a direitos fundamentais (saúde, meio ambiente, integridade e transparência).
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-lg bg-surface-raised p-4">
          {todasComDado ? (
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
          ) : (
            <div className="text-right">
              <span className="text-xs text-text-soft">Dado coletado</span>
              <div className="font-tabular text-3xl font-extrabold text-text">
                {dimensoesComDado}
                <span className="text-base font-normal text-text-soft">/4</span>
              </div>
            </div>
          )}
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
        <DimensaoCard
          icone="🏥"
          titulo="Saúde & Vida"
          score={indice.dimensoes.saudeVida.score}
          cor="bg-primary"
          temDado={cobertura.saudeVida}
          qtdFatores={indice.dimensoes.saudeVida.fatores.length}
          textoComDado="alerta(s) de internações/óbitos"
          textoSemDado="Dado de internações por CID ainda não coletado para este município."
        />

        <DimensaoCard
          icone="🌳"
          titulo="Socioambiental"
          score={indice.dimensoes.socioambientalClima.score}
          cor="bg-emerald-500"
          temDado={cobertura.socioambientalClima}
          qtdFatores={indice.dimensoes.socioambientalClima.fatores.length}
          textoComDado="sobreposição/barragem crítica"
          textoSemDado="Dado de barragens e autuações ambientais ainda não coletado para este município."
        />

        <DimensaoCard
          icone="🏛️"
          titulo="Finanças & Erário"
          score={indice.dimensoes.integridadeErario.score}
          cor="bg-amber-500"
          temDado={cobertura.integridadeErario}
          qtdFatores={indice.dimensoes.integridadeErario.fatores.length}
          textoComDado="vínculo(s) contratos-doações"
          textoSemDado="Dado de contratos, CEIS/CNEP e doações ainda não coletado para este município."
        />

        <DimensaoCard
          icone="⚖️"
          titulo="Opacidade Política"
          score={indice.dimensoes.opacidadePolitica.score}
          cor="bg-indigo-500"
          temDado={cobertura.opacidadePolitica}
          qtdFatores={indice.dimensoes.opacidadePolitica.fatores.length}
          textoComDado="Câmara sem API aberta de votos"
          textoSemDado="Dado de transparência e sistema da Câmara ainda não coletado para este município."
        />
      </div>
    </section>
  );
}

function DimensaoCard({
  icone,
  titulo,
  score,
  cor,
  temDado,
  qtdFatores,
  textoComDado,
  textoSemDado,
}: {
  icone: string;
  titulo: string;
  score: number;
  cor: string;
  temDado: boolean;
  qtdFatores: number;
  textoComDado: string;
  textoSemDado: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-surface-raised p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-soft">{icone} {titulo}</span>
        <span className="font-tabular text-xs font-bold text-text">
          {temDado ? `${score}/100` : "—"}
        </span>
      </div>
      {temDado ? (
        <>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/40">
            <div className={`h-full ${cor}`} style={{ width: `${score}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-text-soft">
            {qtdFatores > 0
              ? `${qtdFatores} ${textoComDado}`
              : "Sem alerta disparado com o dado disponível"}
          </p>
        </>
      ) : (
        <p className="mt-2 text-[11px] text-text-soft">{textoSemDado}</p>
      )}
    </div>
  );
}
