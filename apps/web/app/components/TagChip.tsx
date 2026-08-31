"use client";

import React from "react";

interface TagChipProps {
  label: string;
  ativo?: boolean;
  contador?: number;
  onClick?: () => void;
  className?: string;
  title?: string;
}

/**
 * Chip visual unificado para tags de assunto e filtros rápidos no portal.
 * Suporta estado ativo/inativo, contador numérico opcional e acessibilidade por teclado.
 */
export function TagChip({
  label,
  ativo = false,
  contador,
  onClick,
  className = "",
  title,
}: TagChipProps) {
  const baseClasses =
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1";

  const stateClasses = ativo
    ? "border-primary bg-primary/10 text-primary font-semibold"
    : "border-border bg-surface text-text-soft hover:border-primary/60 hover:text-text";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={ativo}
        title={title ?? `Filtrar por ${label}`}
        className={`${baseClasses} ${stateClasses} cursor-pointer ${className}`}
      >
        <span>{label}</span>
        {contador !== undefined && (
          <span
            className={`rounded-full px-1.5 py-0.2 text-[0.7em] tabular-nums ${
              ativo ? "bg-primary text-primary-ink" : "bg-surface-2 text-text-soft"
            }`}
          >
            {contador}
          </span>
        )}
      </button>
    );
  }

  return (
    <span
      title={title}
      className={`${baseClasses} ${stateClasses} ${className}`}
    >
      <span>{label}</span>
      {contador !== undefined && (
        <span className="rounded-full bg-surface-2 px-1.5 py-0.2 text-[0.7em] text-text-soft tabular-nums">
          {contador}
        </span>
      )}
    </span>
  );
}
