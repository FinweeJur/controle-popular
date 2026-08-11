"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "cp_cvd";

const emptySubscribe = () => () => {};

/** Mesmo padrão de hidratação de ThemeSwitcher/FontSizeControl -- data-cvd
 *  só é conhecido no cliente (lido do localStorage pelo script inline em
 *  layout.tsx). */
function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function getCurrent(): boolean {
  return document.documentElement.getAttribute("data-cvd") === "on";
}

function setCvd(on: boolean) {
  document.documentElement.setAttribute("data-cvd", on ? "on" : "off");
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // localStorage indisponível (modo privado, desabilitado) -- a escolha
    // só não persiste entre recargas, degradação inofensiva.
  }
}

/**
 * Paleta segura para daltonismo: troca --cp-accent/--cp-alert (o par
 * verde/vermelho de alerta de contrato, selo garantista/reducionista e voto
 * sim/não -- ver `app/globals.css`, bloco `[data-cvd="on"]`) por
 * azul/laranja, a combinação que a literatura de acessibilidade recomenda
 * para quem tem dificuldade nesse eixo (deuteranopia/protanopia -- a mais
 * comum é já coberta pela mesma troca; tritanopia mede bem no par também).
 *
 * Atributo PRÓPRIO (`data-cvd`), não uma quarta opção do ThemeSwitcher: a
 * necessidade de paleta segura é independente de preferir Claro ou Escuro
 * -- travar as duas juntas obrigaria a pessoa a abrir mão de uma para ter a
 * outra. Mesmo raciocínio que já vale para `data-fs` (A-/A/A+) neste
 * arquivo-irmão.
 */
export default function CvdToggle() {
  const mounted = useHasMounted();

  if (!mounted) {
    return <span className="inline-block h-8 w-[190px]" aria-hidden="true" />;
  }

  const on = getCurrent();

  return (
    <button
      type="button"
      onClick={() => setCvd(!on)}
      aria-pressed={on}
      title="Troca o vermelho/verde de alerta por azul/laranja"
      className={`cursor-pointer rounded-full border px-3 py-1.5 text-[.8em] font-medium ${
        on
          ? "border-text bg-text text-bg"
          : "border-border bg-transparent text-text-soft hover:bg-surface-2"
      }`}
    >
      Cores para daltônicos
    </button>
  );
}
