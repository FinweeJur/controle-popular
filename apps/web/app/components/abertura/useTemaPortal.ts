"use client";

/**
 * useTemaPortal — o tema ATUAL do portal, reativo a trocas feitas fora do
 * next-themes.
 *
 * POR QUE NÃO BASTA `useTheme()` (next-themes): o seletor de temas do
 * portal escreve o atributo `data-theme` no <html> (e há script anti-flash
 * que lê localStorage antes da pintura). Componentes que precisam REAGIR à
 * troca de tema no runtime já observam o atributo com MutationObserver —
 * `CursorTema.tsx` é o precedente (attributeFilter: ["data-theme",
 * "data-cvd"]). Este hook segue o mesmo padrão para a abertura viva: o
 * fundo WebGL é pintado com as cores lidas dos tokens, e as cores só
 * ficam certas se a troca de tema for percebida na hora.
 *
 * Retorno:
 * - `tema`: string do atributo (ex.: "pequi", "dark", "high-contrast");
 * - `altoContraste`: true quando o tema ativo é o de alto contraste —
 *   nele NENHUM efeito decorativo existe (regra do AGENTS.md).
 */

import { useEffect, useState } from "react";

export function useTemaPortal() {
  // Primeira leitura síncrona (o script anti-flash já garantiu o atributo
  // antes da hidratação, então o valor inicial já é o certo).
  const [tema, setTema] = useState(() =>
    typeof document === "undefined"
      ? "pequi"
      : document.documentElement.getAttribute("data-theme") ?? "pequi",
  );

  useEffect(() => {
    const ler = () => {
      setTema(
        document.documentElement.getAttribute("data-theme") ?? "pequi",
      );
    };
    ler();
    const observador = new MutationObserver(ler);
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observador.disconnect();
  }, []);

  return { tema, altoContraste: tema === "high-contrast" };
}
