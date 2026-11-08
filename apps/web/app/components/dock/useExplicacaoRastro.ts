"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import useFecharFora from "@/app/components/dock/useFecharFora";

/** Tempo de ponteiro parado no rastro até abrir a explicação. */
const ESPERA_EXPLICACAO_MS = 800;
/** No toque, a explicação some sozinha depois disto. */
const DURACAO_EXPLICACAO_TOQUE_MS = 6000;

export interface ExplicacaoRastro {
  aberta: boolean;
  /** Entrou no botão do rastro: agenda a explicação (mouse). */
  entrar: (tipo: string) => void;
  /** Saiu do botão antes dos 800 ms: cancela. */
  cancelar: () => void;
  /** Saiu do dock: fecha o que o hover abriu. */
  sair: () => void;
  /** Toque no rastro: abre por alguns segundos. */
  abrirPorToque: () => void;
  fechar: () => void;
}

/** Os dois relógios da explicação, num lugar só. */
function useRelogios() {
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toque = useRef<ReturnType<typeof setTimeout> | null>(null);

  const limpar = useCallback(() => {
    if (espera.current) clearTimeout(espera.current);
    if (toque.current) clearTimeout(toque.current);
    espera.current = null;
    toque.current = null;
  }, []);

  useEffect(() => limpar, [limpar]);

  return { espera, toque, limpar };
}

/**
 * Relógios da explicação do rastro mágico.
 *
 * POR QUE EXISTE: o dock precisa de três temporizadores (espera do hover,
 * fechamento automático no toque, limpeza no unmount) e de saber quem abriu a
 * caixa. Isolado aqui, o componente do dock só desenha.
 */
export function useExplicacaoRastro(
  dockRef: RefObject<HTMLElement | null>,
): ExplicacaoRastro {
  const [aberta, setAberta] = useState(false);
  const origem = useRef<"mouse" | "toque" | null>(null);
  const { espera, toque, limpar } = useRelogios();

  const fechar = useCallback(() => {
    limpar();
    origem.current = null;
    setAberta(false);
  }, [limpar]);

  const abrirPorToque = useCallback(() => {
    limpar();
    origem.current = "toque";
    setAberta(true);
    toque.current = setTimeout(() => setAberta(false), DURACAO_EXPLICACAO_TOQUE_MS);
  }, [limpar, toque]);

  const entrar = useCallback(
    (tipo: string) => {
      // Dedo não tem "ponteiro parado"; no toque, a explicação abre no clique.
      if (tipo === "touch") return;
      limpar();
      espera.current = setTimeout(() => {
        origem.current = "mouse";
        setAberta(true);
      }, ESPERA_EXPLICACAO_MS);
    },
    [limpar, espera],
  );

  const sair = useCallback(() => {
    // Saída do dedo não fecha o que o toque abriu (some sozinho).
    if (origem.current === "toque") return;
    fechar();
  }, [fechar]);

  const cancelar = useCallback(() => {
    if (espera.current) clearTimeout(espera.current);
    espera.current = null;
  }, [espera]);

  useFecharFora(aberta, dockRef, fechar);

  return { aberta, entrar, cancelar, sair, abrirPorToque, fechar };
}
