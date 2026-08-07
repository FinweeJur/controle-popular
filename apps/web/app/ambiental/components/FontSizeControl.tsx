"use client";

import { useSyncExternalStore } from "react";

const STEPS = ["sm", "md", "lg", "xl"] as const;
type FontSize = (typeof STEPS)[number];
const STORAGE_KEY = "cp_fs";

const emptySubscribe = () => () => {};

/** Same hydration-guard pattern as ThemeSwitcher -- data-fs is only known
 * client-side (read from localStorage by the inline script in layout.tsx). */
function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function getCurrent(): FontSize {
  const fs = document.documentElement.getAttribute("data-fs");
  return (STEPS as readonly string[]).includes(fs ?? "") ? (fs as FontSize) : "md";
}

function setFontSize(fs: FontSize) {
  document.documentElement.setAttribute("data-fs", fs);
  try {
    localStorage.setItem(STORAGE_KEY, fs);
  } catch {
    // localStorage unavailable (private mode, disabled) -- the choice just
    // won't persist across reloads, which is a harmless degradation.
  }
}

/** A-/A/A+ text-scaling control (eMAG convention). Persists via
 * data-fs on <html> + localStorage, read by the --cp-tscale CSS variable
 * in globals.css.
 *
 * Quarta cópia byte-idêntica — ver a nota em `ThemeSwitcher.tsx`. */
export default function FontSizeControl() {
  const mounted = useHasMounted();

  if (!mounted) {
    return <span className="inline-block h-8 w-[104px]" aria-hidden="true" />;
  }

  const current = getCurrent();
  const index = STEPS.indexOf(current);

  return (
    <div
      role="group"
      aria-label="Tamanho do texto"
      className="ml-1 flex items-center gap-1 border-l border-border pl-2"
    >
      <button
        type="button"
        onClick={() => setFontSize(STEPS[Math.max(0, index - 1)])}
        aria-label="Diminuir texto"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border font-display text-[.85em] font-semibold text-text hover:bg-surface-2"
      >
        A−
      </button>
      <button
        type="button"
        onClick={() => setFontSize("md")}
        aria-label="Texto padrão"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border font-display text-base font-semibold text-text hover:bg-surface-2"
      >
        A
      </button>
      <button
        type="button"
        onClick={() => setFontSize(STEPS[Math.min(STEPS.length - 1, index + 1)])}
        aria-label="Aumentar texto"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border font-display text-[1.15em] font-semibold text-text hover:bg-surface-2"
      >
        A+
      </button>
    </div>
  );
}
