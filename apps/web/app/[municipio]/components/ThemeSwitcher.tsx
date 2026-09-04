"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const THEMES = [
  { value: "pequi", label: "Pequi" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "high-contrast", label: "Alto contraste" },
] as const;

const emptySubscribe = () => () => {};

/** True only after the client has hydrated. Implemented with
 * useSyncExternalStore (server snapshot = false, client snapshot = true)
 * instead of a `useEffect(() => setState(true), [])` guard, since that
 * pattern trips the react-hooks/set-state-in-effect lint rule. */
function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/** Claro / Escuro / Alto contraste — replaces the old two-way ThemeToggle.
 * Renders a neutral placeholder until mounted to avoid a hydration
 * mismatch (theme is only known client-side). */
export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const mounted = useHasMounted();

  if (!mounted) {
    return <span className="inline-block h-8 w-[220px]" aria-hidden="true" />;
  }

  return (
    <div role="group" aria-label="Tema" className="flex gap-1.5">
      {THEMES.map((t) => {
        const active = theme === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => setTheme(t.value)}
            aria-pressed={active}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-[.88em] font-medium ${
              active
                ? "border-text bg-text text-bg"
                : "border-border bg-transparent text-text-soft hover:bg-surface-2"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
