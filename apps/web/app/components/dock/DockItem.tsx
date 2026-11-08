"use client";

import { type ReactNode } from "react";
import { Check } from "lucide-react";

export interface ItemDockProps {
  nome: string;
  icone: ReactNode;
  onClick: () => void;
  /** Presente = item de alternância; vira `aria-pressed`. */
  ativo?: boolean;
  /** Falso = item recolhido (bicho/rastro longe do ponteiro). */
  disponivel?: boolean;
  descritoPor?: string;
  aoEntrarPonteiro?: (tipo: string) => void;
  aoSairPonteiro?: () => void;
}

/**
 * Um item do dock: alvo de 44 px, rótulo que cresce à esquerda no hover/foco
 * e ✓ quando está ligado (cor nunca é o único sinal).
 *
 * Extraído de `DockFlutuante.tsx` em 08/11/2026 porque o arquivo passou do
 * limite do CodeScene; o comportamento é o mesmo.
 */
export default function DockItem({
  nome,
  icone,
  onClick,
  ativo,
  disponivel = true,
  descritoPor,
  aoEntrarPonteiro,
  aoSairPonteiro,
}: ItemDockProps) {
  return (
    <div
      inert={!disponivel}
      aria-hidden={disponivel ? undefined : true}
      className={`flex justify-end transition-[max-height,opacity,transform] duration-200 motion-reduce:transition-none ${
        disponivel
          ? "max-h-16 pb-2 opacity-100"
          : "max-h-0 overflow-hidden pb-0 opacity-0"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        onPointerEnter={(e) => aoEntrarPonteiro?.(e.pointerType)}
        onPointerLeave={aoSairPonteiro}
        aria-pressed={ativo}
        aria-describedby={descritoPor}
        // Nome acessível por texto, não por aria-label: o DicaHover global usa
        // aria-label como fonte e abriria uma segunda caixa sobre o dock, que já
        // mostra o nome no hover.
        
        className="group/item flex min-h-11 items-center justify-end rounded-full border border-border bg-surface text-text-soft shadow-lg transition-colors hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <span className="sr-only">{nome}</span>
        <span
          aria-hidden="true"
          className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold opacity-0 transition-all duration-200 group-hover/item:max-w-[9rem] group-hover/item:pl-3 group-hover/item:opacity-100 group-focus-visible/item:max-w-[9rem] group-focus-visible/item:pl-3 group-focus-visible/item:opacity-100 motion-reduce:transition-none"
        >
          {nome}
        </span>
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
          {icone}
          {ativo && (
            <span
              aria-hidden="true"
              className="absolute right-0.5 top-0.5 rounded-full bg-primary p-0.5 text-primary-ink"
            >
              <Check size={9} strokeWidth={3} />
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
