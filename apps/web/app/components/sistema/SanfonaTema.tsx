/**
 * @file SanfonaTema.tsx
 * @description Sanfona fechada que se anuncia como sanfona: seta, hover e pulso.
 *
 * POR QUE EXISTE (dono, 18/11/2026): na `/paraopeba/auditoria` os blocos de
 * tema eram `<summary>` só com texto. Nada dizia que ali dentro havia mais
 * conteúdo — sem seta, sem hover, sem cara de botão, o leitor passava reto.
 *
 * O QUE ENTREGA, sem JavaScript (segue funcionando sem hidratação):
 * - linha inteira clicável, com hover de fundo/borda e `cursor-pointer`;
 * - seta para baixo num selo redondo, que gira 180° quando o bloco abre
 *   (`.cp-sanfona-seta` + `group-open`, em `globals.css`);
 * - pulso suave no selo enquanto fechado — o "aperte aqui" que faltava;
 *   respeita `prefers-reduced-motion`;
 * - microtexto "Abrir/Fechar" no desktop, para quem não lê o ícone;
 * - foco visível por teclado no `summary` (é o alvo real do `<details>`).
 *
 * VARIANTE `linha`: o mesmo comportamento em disclosures pequenos dentro de
 * fichas (ex.: "Ler a descrição original"), sem caixa nem sombra.
 */

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface SanfonaTemaProps {
  /** Título sempre visível (o alvo do clique). */
  titulo: ReactNode;
  /** Conteúdo revelado ao abrir. */
  children: ReactNode;
  /** `card` = bloco da página; `linha` = disclosure dentro de ficha. */
  variante?: "card" | "linha";
  /** Classe extra para o contêiner (ex.: espaçamento entre blocos). */
  className?: string;
}

export default function SanfonaTema({
  titulo,
  children,
  variante = "card",
  className = "",
}: SanfonaTemaProps) {
  const card = variante === "card";
  return (
    <details
      className={
        card
          ? `group rounded-xl border border-border bg-surface transition-colors hover:border-primary/60 open:border-primary/40 ${className}`
          : `group ${className}`
      }
    >
      <summary
        className={
          card
            ? "flex list-none cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-surface-2/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface [&::-webkit-details-marker]:hidden"
            : "flex list-none cursor-pointer items-center gap-2 text-xs font-medium text-text-soft transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden"
        }
      >
        <span
          className={
            card
              ? "min-w-0 flex-1 font-semibold text-text"
              : "min-w-0 flex-1"
          }
        >
          {titulo}
        </span>
        {card && (
          <span
            aria-hidden="true"
            className="hidden text-xs font-medium uppercase tracking-wide text-text-soft group-open:hidden sm:inline"
          >
            Abrir
          </span>
        )}
        {card && (
          <span
            aria-hidden="true"
            className="hidden text-xs font-medium uppercase tracking-wide text-text-soft group-open:inline"
          >
            Fechar
          </span>
        )}
        <span
          aria-hidden="true"
          className={`cp-sanfona-seta ${card ? "h-7 w-7" : "h-5 w-5"}`}
        >
          <ChevronDown size={card ? 16 : 13} strokeWidth={2.2} />
        </span>
      </summary>
      <div
        className={
          card
            ? "border-t border-border/60 px-4 pb-4 pt-3"
            : "mt-2 pl-7"
        }
      >
        {children}
      </div>
    </details>
  );
}
