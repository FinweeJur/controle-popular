import { Database } from "lucide-react";
import MetricaValor from "./MetricaValor";
import type { MetricaNoticia } from "@/lib/noticias/portal";

/**
 * @file Cartões de indicadores do post.
 *
 * Extraído do corpo da página para o componente principal não crescer a cada
 * seção nova (CodeScene barra função acima de 120 linhas). Cada valor passa
 * por `MetricaValor`, que anima número simples e mantém texto composto como
 * está.
 */
export default function SecaoMetricas({ metricas }: { metricas: MetricaNoticia[] }) {
  if (!metricas?.length) return null;

  return (
    <section
      aria-label="Indicadores principais"
      className="mb-8 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs"
    >
      <h2 className="text-xs font-bold uppercase tracking-[.18em] text-primary mb-3 flex items-center gap-1.5">
        <Database size={14} />
        <span>Indicadores &amp; Dados Chave</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metricas.map((m) => (
          <div key={m.rotulo} className="rounded-xl bg-primary/5 p-3.5 border border-primary/20">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">{m.rotulo}</p>
            <p className="mt-1 font-display text-3xl sm:text-4xl font-bold text-primary">
              <MetricaValor valor={m.valor} />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
