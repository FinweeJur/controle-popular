"use client";

/**
 * @file PilhaBotao.tsx
 * @description Botão redondo da pilha da esquerda, com o nome abrindo ao lado.
 *
 * REGRA DO DONO (08/11/2026): o item só aparece quando o ponteiro está no
 * Seu Nonô; passando o mouse no item, o nome abre À DIREITA (nunca por cima,
 * que cobria os outros botões). Alvo de 44 px, anel de foco visível e
 * `prefers-reduced-motion` sem transição.
 *
 * ESTADO VISÍVEL (dono, 10/11/2026): interruptor ligado ganha ✓ no canto e o
 * nome diz o estado ("Rastro mágico · ligado", "Rádio · tocando"). Cor nunca
 * é o único sinal. O `title` nativo saiu: o balão do navegador cobria os
 * botões vizinhos; quem explica é o rótulo ao lado e o `aria-label`.
 */

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Check } from "lucide-react";

export interface PilhaBotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Nome que abre ao lado do ícone e vira `aria-label` padrão. */
  rotulo: string;
  icone: ReactNode;
  /** Interruptor ligado? Mostra o ✓ e mantém o estado no rótulo. */
  ativo?: boolean;
  /** Palavra de estado ao lado do nome (ex.: "ligado", "tocando"). */
  estado?: string;
}

export default function PilhaBotao({
  rotulo,
  icone,
  ativo = false,
  estado,
  className = "",
  ...props
}: PilhaBotaoProps) {
  const textoRotulo = estado ? `${rotulo} · ${estado}` : rotulo;

  return (
    <button
      type="button"
      data-cp-pilha
      data-cp-sem-dica
      aria-label={textoRotulo}
      aria-pressed={ativo || undefined}
      {...props}
      className={`group/item relative flex h-11 w-11 touch-none items-center justify-center rounded-full border bg-surface/95 text-primary shadow-lg backdrop-blur transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 motion-reduce:transition-none ${
        ativo ? "border-primary" : "border-border hover:border-primary"
      } ${className}`}
    >
      {icone}
      {ativo && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-ink shadow"
        >
          <Check size={10} strokeWidth={3} />
        </span>
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-x-1 -translate-y-1/2 whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-text opacity-0 shadow-lg transition-all duration-200 group-hover/item:translate-x-0 group-hover/item:opacity-100 group-focus-visible/item:translate-x-0 group-focus-visible/item:opacity-100 motion-reduce:transition-none"
      >
        {textoRotulo}
      </span>
    </button>
  );
}
