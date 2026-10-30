/**
 * Cartões de topo da subfrente de litígios transnacionais.
 *
 * Os números são contados do próprio acervo (nada digitado à mão): um
 * litígio confirmado, um pendente e nenhum caso europeu confirmado de
 * Brumadinho. O cartão de Brumadinho é uma lacuna declarada, não um zero
 * decorativo.
 */
import type { ConexaoTransnacional, Litigio } from "@/lib/europa-litigios";

export default function ResumoGeral({
  litigios,
  conexoes,
}: {
  litigios: readonly Litigio[];
  conexoes: readonly ConexaoTransnacional[];
}) {
  const confirmados = litigios.filter((l) => !l.pendente).length;
  const pendentes = litigios.filter((l) => l.pendente).length;
  const brumadinho = litigios.filter(
    (l) => l.caso === "brumadinho" && !l.pendente
  ).length;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
          Confirmado em fonte oficial
        </p>
        <p className="mt-1 font-display text-3xl font-bold text-text">{confirmados}</p>
        <p className="mt-1 text-sm text-text-soft">
          Litígio de Mariana com número e sentença conferidos.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
          A confirmar
        </p>
        <p className="mt-1 font-display text-3xl font-bold text-text">{pendentes}</p>
        <p className="mt-1 text-sm text-text-soft">
          Conexão holandesa citada no acervo, com portal oficial inacessível.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-surface/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
          Brumadinho na Europa
        </p>
        <p className="mt-1 font-display text-3xl font-bold text-text">{brumadinho}</p>
        <p className="mt-1 text-sm text-text-soft">
          Nenhum litígio europeu confirmado nesta coleta. Veja a frente do
          Paraopeba para o caso no Brasil.
        </p>
      </div>
      <p className="text-sm text-text-soft sm:col-span-3">
        {conexoes.length} conexão holandesa aparece separada: a Braskem/Maceió
        não é Brumadinho e não foi rotulada como tal.
      </p>
    </div>
  );
}
