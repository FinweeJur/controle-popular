import { type SegmentoPontuacao } from "@/lib/betim/vereadores";
import { formatNumberBR } from "@/lib/betim/format";

export interface StackedPointsBarProps {
  segmentos: SegmentoPontuacao[];
  /** Pontuação total desta barra (= soma dos segmentos). */
  total: number;
  /**
   * Maior pontuação do conjunto. TODAS as barras de um mesmo gráfico
   * precisam receber o mesmo `max`, senão cada barra fica na sua própria
   * escala e os comprimentos deixam de ser comparáveis — que é a única
   * coisa que uma barra existe pra mostrar.
   */
  max: number;
  /** Altura da barra. Barras finas: o dado, não a tinta. */
  altura?: "sm" | "md";
}

const COR_POR_SLOT: Record<number, string> = {
  1: "var(--color-ord-1)",
  2: "var(--color-ord-2)",
  3: "var(--color-ord-3)",
  4: "var(--color-ord-4)",
};

/**
 * Barra empilhada da composição de uma pontuação, segmentada por PONTOS
 * (não por quantidade de proposições) — ver `composicaoPontuacao()`.
 *
 * Cada segmento leva um `title` nativo, então o hover funciona sem uma
 * linha de JS: o gráfico inteiro é server component e não custa bundle.
 */
export default function StackedPointsBar({
  segmentos,
  total,
  max,
  altura = "md",
}: StackedPointsBarProps) {
  const escala = max > 0 ? total / max : 0;
  const h = altura === "sm" ? "h-2.5" : "h-3.5";

  return (
    <div className={`cp-ord-track ${h} w-full overflow-hidden`}>
      <div className="flex h-full" style={{ width: `${escala * 100}%` }}>
        {segmentos.map((s) => (
          <div
            key={s.tier.slot}
            className={`cp-ord-seg cp-ord-seg-${s.tier.slot} h-full first:rounded-l-[4px] last:rounded-r-[4px]`}
            style={{
              // Percentual DENTRO da barra: o container já está escalado
              // contra o `max`, então aqui é só a divisão interna.
              width: total > 0 ? `${(s.pontos / total) * 100}%` : "0%",
              background: COR_POR_SLOT[s.tier.slot],
            }}
            title={`${s.tier.label}: ${formatNumberBR(s.qtd)} × ${s.tier.peso} = ${formatNumberBR(s.pontos)} pontos`}
          />
        ))}
      </div>
    </div>
  );
}
