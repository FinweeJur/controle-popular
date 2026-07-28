import { PROPOSICAO_TIERS } from "@/lib/betim/vereadores";

const COR_POR_SLOT: Record<number, string> = {
  1: "var(--color-ord-1)",
  2: "var(--color-ord-2)",
  3: "var(--color-ord-3)",
  4: "var(--color-ord-4)",
};

const PESO_MAX = Math.max(...PROPOSICAO_TIERS.map((t) => t.peso));

/**
 * Desenha os PESOS na escala real (15 · 6 · 2 · 1). O texto "Projeto de
 * Lei vale 15, Indicação vale 1" é fácil de ler e difícil de sentir —
 * ver a barra do PL quinze vezes maior que a da indicação explica o
 * ranking inteiro antes de olhar qualquer vereador.
 */
export default function ComoFuncionaPontuacao() {
  return (
    <div>
      <ul className="space-y-2.5">
        {PROPOSICAO_TIERS.map((tier) => (
          <li key={tier.slot}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-text">{tier.label}</span>
              <span className="font-tabular shrink-0 text-text-soft">
                {tier.peso} {tier.peso === 1 ? "ponto" : "pontos"} cada
              </span>
            </div>
            <div className="cp-ord-track h-3.5 w-full overflow-hidden">
              <div
                className={`cp-ord-seg cp-ord-seg-${tier.slot} h-full rounded-[4px]`}
                style={{
                  width: `${(tier.peso / PESO_MAX) * 100}%`,
                  background: COR_POR_SLOT[tier.slot],
                }}
                title={`${tier.label}: ${tier.peso} ${tier.peso === 1 ? "ponto" : "pontos"}`}
              />
            </div>
            <p className="mt-1 text-xs text-text-soft">{tier.explicacao}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-border/60 pt-3 text-xs text-text-soft">
        A pontuação de cada vereador é a soma das proposições que ele
        apresentou, multiplicadas por esses pesos. É uma medida de{" "}
        <strong className="font-medium text-text">volume e tipo de atuação</strong>{" "}
        — não de qualidade, acerto ou alinhamento com o interesse público.
      </p>
    </div>
  );
}
