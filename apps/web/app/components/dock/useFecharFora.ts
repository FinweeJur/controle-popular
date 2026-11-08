"use client";

import { useEffect, type RefObject } from "react";

/**
 * Clique fora e Esc fecham a caixa de explicação.
 *
 * Em arquivo próprio porque o módulo do rastro estava no limite de complexidade
 * média do CodeScene; o comportamento é o mesmo.
 */
export default function useFecharFora(
  ativa: boolean,
  dockRef: RefObject<HTMLElement | null>,
  fechar: () => void,
) {
  useEffect(() => {
    if (!ativa) return;
    const aoClicarFora = (e: PointerEvent) => {
      if (e.target instanceof Node && dockRef.current?.contains(e.target)) return;
      fechar();
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("pointerdown", aoClicarFora);
    window.addEventListener("keydown", aoTeclar);
    return () => {
      window.removeEventListener("pointerdown", aoClicarFora);
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [ativa, dockRef, fechar]);
}
