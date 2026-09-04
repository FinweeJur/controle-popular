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
 * mismatch (theme is only known client-side).
 *
 * QUARTA cópia byte-idêntica deste arquivo (congresso, judiciario,
 * [municipio], ambiental). É a convenção vigente do repo, não uma escolha
 * desta zona — e é candidata a consolidação em `app/components/`, que já é
 * onde moram os compartilhados de verdade (BuscaUniversal, OutrasFrentes).
 * Consolidar junto com o scaffold seria mexer em três zonas no ar de uma
 * vez, e essa mudança merece commit próprio. */
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
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-[.78em] font-medium ${
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
