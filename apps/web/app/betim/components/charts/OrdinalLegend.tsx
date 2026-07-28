import { PROPOSICAO_TIERS } from "@/lib/betim/vereadores";

const COR_POR_SLOT: Record<number, string> = {
  1: "var(--color-ord-1)",
  2: "var(--color-ord-2)",
  3: "var(--color-ord-3)",
  4: "var(--color-ord-4)",
};

export interface OrdinalLegendProps {
  /** Mostra a frase em linguagem simples de cada tier (o "porquê" do peso). */
  detalhado?: boolean;
}

/**
 * Legenda da rampa ordinal de proposições. Presente sempre que um gráfico
 * empilhado aparece — a identidade de cada série nunca fica só na cor.
 * A ordem aqui é a ordem dos degraus da rampa (mais pesado -> mais leve),
 * a mesma da pilha, então a legenda também ensina a ler o gradiente.
 */
export default function OrdinalLegend({ detalhado = false }: OrdinalLegendProps) {
  if (detalhado) {
    return (
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {PROPOSICAO_TIERS.map((tier) => (
          <li key={tier.slot} className="flex gap-2.5">
            <span
              aria-hidden
              className={`cp-ord-seg cp-ord-seg-${tier.slot} mt-1 h-3 w-3 shrink-0 rounded-[3px]`}
              style={{ background: COR_POR_SLOT[tier.slot] }}
            />
            <span className="text-sm">
              <strong className="font-medium text-text">{tier.label}</strong>{" "}
              <span className="font-tabular whitespace-nowrap text-text-soft">
                vale {tier.peso} {tier.peso === 1 ? "ponto" : "pontos"}
              </span>
              <span className="mt-0.5 block text-xs text-text-soft">{tier.explicacao}</span>
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
      {PROPOSICAO_TIERS.map((tier) => (
        <li key={tier.slot} className="flex items-center gap-1.5 text-xs text-text-soft">
          <span
            aria-hidden
            className={`cp-ord-seg cp-ord-seg-${tier.slot} h-2.5 w-2.5 shrink-0 rounded-[3px]`}
            style={{ background: COR_POR_SLOT[tier.slot] }}
          />
          {tier.label}
          <span className="font-tabular text-text-soft/80">×{tier.peso}</span>
        </li>
      ))}
    </ul>
  );
}
