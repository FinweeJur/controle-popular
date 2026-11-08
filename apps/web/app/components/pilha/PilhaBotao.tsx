"use client";

/**
 * @file PilhaBotao.tsx
 * @description Botão redondo da pilha da esquerda, com o nome abrindo ao lado.
 *
 * REGRA DO DONO (08/11/2026): o item só aparece quando o ponteiro está no
 * Seu Nonô; passando o mouse no item, o nome abre. Alvo de 44 px, anel de
 * foco visível e `prefers-reduced-motion` sem transição.
 *
 * O rótulo é `aria-hidden` porque o botão já tem `aria-label`: leitor de tela
 * anuncia uma vez, e o texto visível é só o reforço para quem enxerga.
 */

import { type ButtonHTMLAttributes, type ReactNode } from "react";

export interface PilhaBotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Nome que abre ao lado do ícone e vira `aria-label` padrão. */
  rotulo: string;
  icone: ReactNode;
}

export default function PilhaBotao({
  rotulo,
  icone,
  className = "",
  ...props
}: PilhaBotaoProps) {
  return (
    <button
      type="button"
      data-cp-pilha
      data-cp-sem-dica
      aria-label={rotulo}
      title={rotulo}
      {...props}
      className={`group/item relative flex h-11 w-11 touch-none items-center justify-center rounded-full border border-border bg-surface/95 text-primary shadow-lg backdrop-blur transition-transform hover:scale-105 hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 motion-reduce:transition-none ${className}`}
    >
      {icone}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-x-1 -translate-y-1/2 whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-text opacity-0 shadow-lg transition-all duration-200 group-hover/item:translate-x-0 group-hover/item:opacity-100 group-focus-visible/item:translate-x-0 group-focus-visible/item:opacity-100 motion-reduce:transition-none"
      >
        {rotulo}
      </span>
    </button>
  );
}
