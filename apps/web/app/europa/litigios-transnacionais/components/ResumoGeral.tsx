/**
 * Cartões de topo da subfrente de litígios transnacionais.
 *
 * Os números são contados do próprio acervo (nada digitado à mão): dois
 * litígios confirmados (Mariana/Londres e Brumadinho/Munique) e um pendente
 * de número (Rio Doce Claims, Holanda).
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
    (l) => l.caso === "brumadinho" && !l.pendente,
  ).length;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
          Confirmado em fonte oficial
        </p>
        <p className="mt-1 font-display text-3xl font-bold text-text">{confirmados}</p>
        <p className="mt-1 text-sm text-text-soft">
          Mariana em Londres e Brumadinho em Munique, com número ou decisão
          conferidos.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
          A confirmar
        </p>
        <p className="mt-1 font-display text-3xl font-bold text-text">{pendentes}</p>
        <p className="mt-1 text-sm text-text-soft">
          Rio Doce Claims na Holanda: datas e fase têm fonte, mas o número do
          processo não foi localizado.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
          Brumadinho na Europa
        </p>
        <p className="mt-1 font-display text-3xl font-bold text-text">{brumadinho}</p>
        <p className="mt-1 text-sm text-text-soft">
          Ação contra a TÜV SÜD no Tribunal Regional de Munique, desde 2019.
          Não é na Inglaterra nem na Holanda.
        </p>
      </div>
      <p className="text-sm text-text-soft sm:col-span-3">
        {conexoes.length} conexão holandesa aparece separada: a Braskem/Maceió
        não é Brumadinho e não foi rotulada como tal.
      </p>
    </div>
  );
}
