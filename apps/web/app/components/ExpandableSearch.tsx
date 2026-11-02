"use client";

/**
 * ExpandableSearch — Barra de busca expansível animada.
 * Padrão Lightswind UI (React + Tailwind CSS + Framer Motion).
 *
 * Em repouso, ocupa espaço mínimo na navbar (ícone de 36px em mobile, pílula compacta em desktop).
 * Ao interagir (clique, foco ou atalho Ctrl+K), expande suavemente com mola física
 * (Framer Motion) e foca o campo de digitação automaticamente.
 * Fecha com Escape ou ao clicar fora da caixa.
 */

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";

export interface ExpandableSearchProps {
  /** Placeholder exibido no input */
  placeholder?: string;
  /** Valor do texto de busca */
  value?: string;
  /** Callback ao alterar o texto */
  onChange?: (val: string) => void;
  /** Callback ao submeter via tecla Enter */
  onSearch?: (query: string) => void;
  /** Callback ao expandir */
  onExpand?: () => void;
  /** Callback ao recolher */
  onCollapse?: () => void;
  /** Largura expandida em desktop (padrão: "22rem") */
  expandedWidth?: string;
  /** Largura compacta em desktop (padrão: "9.5rem") */
  collapsedWidth?: string;
  /** Indicador de carregamento */
  isLoading?: boolean;
  /** Desabilitado */
  disabled?: boolean;
  /** Slot à direita do input (ex: spinner de carregamento ou atalho) */
  rightSlot?: React.ReactNode;
  /** Dropdown suspenso de resultados/sugestões */
  children?: React.ReactNode;
  /** Se o dropdown deve ser exibido */
  showDropdown?: boolean;
  /** Classes CSS adicionais para o contêiner */
  className?: string;
  /** Rótulo acessível (aria-label) */
  ariaLabel?: string;
}

export interface ExpandableSearchRef {
  expand: () => void;
  collapse: () => void;
  focus: () => void;
}

export const ExpandableSearch = forwardRef<ExpandableSearchRef, ExpandableSearchProps>(
  function ExpandableSearch(
    {
      placeholder = "Buscar no portal…",
      value = "",
      onChange,
      onSearch,
      onExpand,
      onCollapse,
      expandedWidth = "22rem",
      collapsedWidth = "9.5rem",
      isLoading = false,
      disabled = false,
      rightSlot,
      children,
      showDropdown = false,
      className = "",
      ariaLabel = "Buscar no portal",
    },
    ref
  ) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Detecta tamanho da tela para ajustar largura mínima e máxima
    useEffect(() => {
      const updateMobile = () => {
        setIsMobile(window.innerWidth < 640);
      };
      updateMobile();
      window.addEventListener("resize", updateMobile);
      return () => window.removeEventListener("resize", updateMobile);
    }, []);

    const expand = () => {
      setIsExpanded(true);
      onExpand?.();
      setTimeout(() => inputRef.current?.focus(), 50);
    };

    const collapse = () => {
      setIsExpanded(false);
      onCollapse?.();
      inputRef.current?.blur();
    };

    useImperativeHandle(ref, () => ({
      expand,
      collapse,
      focus: () => inputRef.current?.focus(),
    }));

    // Fecha ao clicar fora ou pressionar Escape
    useEffect(() => {
      function handleClickOutside(ev: PointerEvent) {
        if (!containerRef.current?.contains(ev.target as Node)) {
          if (value.trim().length === 0) {
            collapse();
          }
        }
      }

      function handleKeyDown(ev: KeyboardEvent) {
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "k") {
          ev.preventDefault();
          expand();
        }
        if (ev.key === "Escape") {
          if (value.trim().length === 0) {
            collapse();
          }
        }
      }

      document.addEventListener("pointerdown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("pointerdown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSearch?.(value);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (value.trim().length === 0) {
          collapse();
        }
      }
    };

    // Em celular: recolhido = botão compacto de 36px; expandido = largura total fluida
    // Em desktop: recolhido = 9.5rem; expandido = 22rem
    const targetWidth = isExpanded
      ? isMobile
        ? "min(20rem, calc(100vw - 4.5rem))"
        : expandedWidth
      : isMobile
        ? "2.25rem"
        : collapsedWidth;

    return (
      <motion.div
        ref={containerRef}
        role="search"
        initial={false}
        animate={{ width: targetWidth }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className={`relative flex items-center ${className}`}
      >
        {/* Estado compacto em mobile: botão redondo com ícone de lupa */}
        {!isExpanded && isMobile ? (
          <button
            type="button"
            onClick={expand}
            disabled={disabled}
            aria-label={ariaLabel}
            title={placeholder}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-surface-2 text-text-soft transition-colors hover:border-primary hover:text-primary"
          >
            <Search size={15} aria-hidden="true" />
          </button>
        ) : (
          <div className="relative flex w-full items-center">
            {/* Ícone fixo de busca */}
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 shrink-0 text-text-soft"
              aria-hidden="true"
            />

            <input
              ref={inputRef}
              type="search"
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              onFocus={() => {
                if (!isExpanded) setIsExpanded(true);
              }}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              aria-label={ariaLabel}
              className="w-full rounded-lg border border-border bg-surface-2 py-1.5 pr-8 pl-8.5 text-sm text-text outline-none transition-colors placeholder:text-text-soft focus:border-primary"
            />

            {/* Ações à direita */}
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center gap-1">
              {rightSlot}

              {value.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange?.("");
                    inputRef.current?.focus();
                  }}
                  className="rounded-full p-0.5 text-text-soft hover:bg-surface hover:text-foreground"
                  aria-label="Limpar busca"
                  title="Limpar"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              ) : isExpanded ? (
                <button
                  type="button"
                  onClick={collapse}
                  className="rounded-full p-0.5 text-text-soft hover:bg-surface hover:text-foreground"
                  aria-label="Recolher busca"
                  title="Fechar (Esc)"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* Dropdown de resultados anexo */}
        {showDropdown && children}
      </motion.div>
    );
  }
);

export default ExpandableSearch;
