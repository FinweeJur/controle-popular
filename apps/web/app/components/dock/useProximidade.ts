"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/** Distância (px) do ponteiro ao dock que revela os itens recolhidos. */
export const RAIO_PROXIMIDADE_PX = 120;

/**
 * "O ponteiro está perto do dock?"
 *
 * Mede a distância até a caixa do elemento em `pointermove` e só troca o
 * estado quando cruza o raio — parado, o handler não re-renderiza nada.
 * Toque é ignorado: no celular os itens ficam sempre abertos.
 */
export function useProximidade(
  alvo: RefObject<HTMLElement | null>,
  raio: number = RAIO_PROXIMIDADE_PX,
): boolean {
  const pertoRef = useRef(false);
  const [perto, setPerto] = useState(false);

  useEffect(() => {
    const aoMover = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const caixa = alvo.current?.getBoundingClientRect();
      if (!caixa) return;
      const dx = Math.max(caixa.left - e.clientX, 0, e.clientX - caixa.right);
      const dy = Math.max(caixa.top - e.clientY, 0, e.clientY - caixa.bottom);
      const valor = Math.hypot(dx, dy) <= raio;
      if (valor === pertoRef.current) return;
      pertoRef.current = valor;
      setPerto(valor);
    };
    window.addEventListener("pointermove", aoMover, { passive: true });
    return () => window.removeEventListener("pointermove", aoMover);
  }, [alvo, raio]);

  return perto;
}

/** Aponte o dedo como "toque"? Mouse não conta. */
export function ehToque(): boolean {
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

/**
 * Em tela sem hover, os itens recolhidos seriam inalcançáveis: revela todos.
 */
export function useSemHover(): boolean {
  const [semHover, setSemHover] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia("(hover: none), (pointer: coarse)");
    const aplicar = () => setSemHover(consulta.matches);
    aplicar();
    consulta.addEventListener("change", aplicar);
    return () => consulta.removeEventListener("change", aplicar);
  }, []);

  return semHover;
}
