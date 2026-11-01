import { formatNumberBR } from "@/lib/betim/format";
import type { ContagemFonte } from "./CabecalhoLegislacao";

/**
 * Cartões de topo do painel de legislação.
 * Extraído para reduzir `LegislacaoAmbientalIndex` (CodeScene).
 */
export default function CartoesLegislacao({
  totalGeral,
  contagem,
  criticas,
  precedentes,
  cobertura,
}: {
  totalGeral: number;
  contagem: ContagemFonte;
  criticas: number;
  precedentes: number;
  cobertura: { total: number; comTema: number };
}) {
  return (
    <section aria-labelledby="numeros-legislacao" className="mt-10">
      <h2 id="numeros-legislacao" className="font-display text-xl font-semibold">
        O acervo em números
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
            Itens ao todo
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-text">
            {formatNumberBR(totalGeral)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
            Normas estaduais de Minas
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-text">
            {formatNumberBR(contagem.porFonte.almg + contagem.porFonte.semad + contagem.porFonte.siam)}
          </p>
          <p className="mt-1 text-[.86em] text-text-soft">ALMG, Semad e Siam</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
            Normas federais
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-text">
            {formatNumberBR(contagem.porFonte.mma + contagem.porFonte.cndh)}
          </p>
          <p className="mt-1 text-[.86em] text-text-soft">MMA/Conama e CNDH</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
            Nacional/internacional curados
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-text">
            {formatNumberBR(criticas)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
            Precedentes judiciais
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-text">
            {formatNumberBR(precedentes)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
            Com tema atribuído
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-text">
            {cobertura.total > 0
              ? `${((100 * cobertura.comTema) / cobertura.total).toFixed(1).replace(".", ",")}%`
              : "—"}
          </p>
          <p className="mt-1 text-[.86em] text-text-soft">
            {formatNumberBR(cobertura.comTema)} de {formatNumberBR(cobertura.total)} normas
            coletadas em massa
          </p>
        </div>
      </div>
    </section>
  );
}
