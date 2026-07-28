import { type ReactNode } from "react";

/**
 * Gráfico de barras horizontais pra valores grandes (pedido do usuário
 * 2026-07-24: "quando envolver valores grandes, usar também gráficos de
 * barra"). CSS/HTML server-rendered, proporcional ao maior valor da
 * lista — mesma técnica dos gráficos do ranking de vereadores, sem lib.
 *
 * Cada barra carrega um `titulo` (hover nativo) dizendo O QUE ela é e
 * quanto vale (pedido #10: "ao passar pelos gráficos, cada barra deve
 * sinalizar o que estou visualizando"). Server Component — o `title`
 * nativo dá o tooltip sem JS de cliente.
 */
export interface BarraItem {
  /** Rótulo principal (nome da função, fornecedor, órgão…). */
  label: string;
  valor: number;
  /** Texto secundário ao lado do rótulo (ex. contagem, %). */
  sublabel?: string;
  /** Tooltip no hover — descreve o que a barra representa + o valor. */
  titulo?: string;
  /** Se presente, o rótulo vira link. */
  href?: string;
  /** Link externo (abre em nova aba). */
  externo?: boolean;
}

export default function BarrasValor({
  itens,
  formatValor,
  max,
}: {
  itens: BarraItem[];
  /** Formata o valor exibido (ex. `formatCurrencyBRL`). */
  formatValor: (v: number) => string;
  /** Base pro 100% da barra; padrão = maior valor da lista. */
  max?: number;
}) {
  const maxVal = max ?? Math.max(...itens.map((i) => i.valor), 1);

  return (
    <ul className="flex flex-col gap-2.5">
      {itens.map((it, i) => {
        const pct = Math.max((it.valor / maxVal) * 100, 1.5);
        const rotulo: ReactNode = it.href ? (
          <a
            href={it.href}
            target={it.externo ? "_blank" : undefined}
            rel={it.externo ? "noopener noreferrer" : undefined}
            className="text-accent hover:underline"
          >
            {it.label}
            {it.externo ? " ↗" : ""}
          </a>
        ) : (
          it.label
        );
        return (
          <li key={i} title={it.titulo ?? `${it.label}: ${formatValor(it.valor)}`}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-sm text-text">
                {rotulo}
                {it.sublabel ? (
                  <span className="ml-1 text-text-soft">{it.sublabel}</span>
                ) : null}
              </span>
              <strong className="font-tabular shrink-0 text-sm text-text">
                {formatValor(it.valor)}
              </strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
