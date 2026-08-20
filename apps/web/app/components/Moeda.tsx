import { formatCurrencyBRL, formatCurrencyCompactaBR } from "@/lib/betim/format";

/**
 * Valor em reais legível de relance: "R$ 12,3 mil" / "R$ 2,4 milhões" / "R$ 37,6
 * bilhões", com o valor cheio no `title` (hover) — o formato curto nunca é a
 * única forma de ver o número. Abaixo de R$ 1 mil renderiza o valor normal sem
 * `title` redundante. Componente de servidor: não tem estado nem evento.
 */
export default function Moeda({ value, className }: { value: number; className?: string }) {
  const curto = formatCurrencyCompactaBR(value);
  const cheio = formatCurrencyBRL(value);
  if (curto === cheio) return <span className={className}>{cheio}</span>;
  return (
    <span className={className} title={cheio}>
      {curto}
    </span>
  );
}