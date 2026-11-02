"use client";

/**
 * AnimatedCopyButton — Botão animado de cópia para a área de transferência.
 * Padrão Lightswind UI (React + Tailwind + Framer Motion).
 *
 * Suporta modo com rótulo ou só ícone, respeita acessibilidade (aria-label),
 * tem affordance tátil e transição por mola suave de Copy -> Check.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";

export interface AnimatedCopyButtonProps {
  /** Texto a ser copiado para a área de transferência */
  textToCopy?: string;
  /** Função opcional caso a geração do texto seja sob demanda */
  getText?: () => string | Promise<string>;
  /** Callback opcional chamado após cópia bem sucedida */
  onCopied?: () => void;
  /** Rótulo exibido no botão (padrão: "Copiar") */
  label?: string;
  /** Rótulo exibido após a cópia (padrão: "Copiado!") */
  copiedLabel?: string;
  /** Se deve mostrar o texto além do ícone */
  showLabel?: boolean;
  /** Tamanho do ícone em pixels (padrão: 13) */
  iconSize?: number;
  /** Classes CSS adicionais */
  className?: string;
  /** Rótulo de acessibilidade (aria-label) */
  ariaLabel?: string;
}

export function AnimatedCopyButton({
  textToCopy,
  getText,
  onCopied,
  label = "Copiar",
  copiedLabel = "Copiado!",
  showLabel = true,
  iconSize = 13,
  className = "",
  ariaLabel = "Copiar para a área de transferência",
}: AnimatedCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const text = getText ? await getText() : textToCopy ?? "";
      if (text) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      onCopied?.();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copiado para a área de transferência" : ariaLabel}
      title={copied ? "Copiado!" : label}
      className={`relative inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:text-primary ${className}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className="inline-flex items-center text-green-600 dark:text-green-400"
          >
            <Check size={iconSize} aria-hidden="true" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className="inline-flex items-center text-muted"
          >
            <Copy size={iconSize} aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>

      {showLabel && (
        <span className="select-none">
          {copied ? copiedLabel : label}
        </span>
      )}
    </button>
  );
}

export default AnimatedCopyButton;
