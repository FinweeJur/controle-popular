"use client";

import { useSyncExternalStore, useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { ChevronDown } from "lucide-react";

export const THEMES = [
  { value: "pequi", label: "Pequi", emoji: "🌰", cor: "#f2701d", desc: "Padrão (Candeia quente)" },
  { value: "cerrado", label: "Cerrado", emoji: "🌾", cor: "#c97b5a", desc: "Terracota & ipê" },
  { value: "mata-atlantica", label: "Mata Atlântica", emoji: "🌿", cor: "#3a6b35", desc: "Verde-serra & dourado" },
  { value: "caatinga", label: "Caatinga", emoji: "🌵", cor: "#d97724", desc: "Âmbar & sol do sertão" },
  { value: "pantanal", label: "Pantanal", emoji: "💧", cor: "#0284c7", desc: "Azul-águas & tuiuiú" },
  { value: "light", label: "Claro", emoji: "☀️", cor: "#ffffff", desc: "Fundo branco clássico" },
  { value: "dark", label: "Escuro", emoji: "🌙", cor: "#0f172a", desc: "Azul-noite profundo" },
  { value: "high-contrast", label: "Alto contraste", emoji: "◐", cor: "#000000", desc: "Preto & branco puro" },
] as const;

const emptySubscribe = () => () => {};

/** True only after the client has hydrated. */
function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * Seletor de Biomas e Temas do Controle Popular.
 * Permite alternar instantaneamente entre Pequi (padrão), Cerrado, Mata Atlântica,
 * Caatinga, Pantanal, Claro, Escuro e Alto contraste.
 * Design compacto que não transborda na TopNav em telas menores.
 */
export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const mounted = useHasMounted();
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAberto(false);
      }
    }
    if (aberto) {
      document.addEventListener("mousedown", handleClickFora);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickFora);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [aberto]);

  if (!mounted) {
    return <span className="inline-block h-7 w-28 rounded-md bg-surface-2 animate-pulse" aria-hidden="true" />;
  }

  const temaAtual = THEMES.find((t) => t.value === theme) || THEMES[0];

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="listbox"
        aria-label={`Tema visual atual: ${temaAtual.label}. Clique para alternar temas e biomas.`}
        className="cp-btn-anim flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-[.8em] font-medium text-text transition-colors duration-150 hover:border-primary hover:text-primary"
      >
        <span
          className="inline-block h-2.5 w-2.5 rounded-full border border-black/20 shrink-0"
          style={{ backgroundColor: temaAtual.cor }}
          aria-hidden="true"
        />
        <span className="hidden sm:inline">{temaAtual.emoji}</span>
        <span className="font-semibold">{temaAtual.label}</span>
        <ChevronDown
          size={12}
          aria-hidden="true"
          className={`transition-transform duration-150 ${aberto ? "rotate-180 text-primary" : "text-text-soft"}`}
        />
      </button>

      {aberto && (
        <div
          role="listbox"
          aria-label="Opções de temas e biomas do portal"
          className="absolute right-0 z-50 mt-1.5 w-60 rounded-xl border border-border bg-surface p-1.5 shadow-xl backdrop-blur-md"
        >
          <div className="px-2 py-1 text-[0.68em] font-bold uppercase tracking-wider text-text-soft border-b border-border/60 mb-1">
            Biomas & Temas Visuais
          </div>
          <div className="max-h-72 space-y-0.5 overflow-y-auto">
            {THEMES.map((t) => {
              const ativo = theme === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="option"
                  aria-selected={ativo}
                  onClick={() => {
                    setTheme(t.value);
                    setAberto(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors duration-100 ${
                    ativo
                      ? "bg-primary/15 font-semibold text-primary"
                      : "text-text hover:bg-surface-2"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: t.cor }}
                      aria-hidden="true"
                    />
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                  </div>
                  <span className="text-[0.68em] text-text-soft truncate max-w-[85px]">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
