"use client";

/**
 * CompanheiroOpcional — portão do companheiro (passarinho).
 *
 * Pedido do dono (19/10/2026): o bichinho flutuante NÃO nasce mais sozinho.
 * Só existe se a pessoa quiser, clicando no botão. Este wrapper guarda a
 * escolha no `localStorage` (`cp_companheiro_ativo`, padrão OFF — só `on`
 * liga) e monta o `CompanheiroFlutuante.tsx` só quando está ligado:
 * desligado, nem o script do bicho nem o rastro dele rodam.
 *
 * Desligado, o próprio botão fica no lugar do bicho: mesmo canto inferior
 * esquerdo, mesmo estilo do botão mágico do rastro, para quem quiser
 * religar depois. A troca viaja pelo evento `cp:companheiro-ativo` (mesmo
 * barramento do `cp:rastro-cursor`), sem recarregar a página.
 */

import { useSyncExternalStore } from "react";
import { CompanheiroFlutuante } from "@/app/components/CompanheiroFlutuante";

export const CHAVE_COMPANHEIRO_ATIVO = "cp_companheiro_ativo";
export const EVENTO_COMPANHEIRO_ATIVO = "cp:companheiro-ativo";

export function lerCompanheiroAtivo(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CHAVE_COMPANHEIRO_ATIVO) === "on";
  } catch {
    // localStorage indisponível: padrão desligado — nada nasce sem pedido.
    return false;
  }
}

export function definirCompanheiroAtivo(ativo: boolean): void {
  try {
    localStorage.setItem(CHAVE_COMPANHEIRO_ATIVO, ativo ? "on" : "off");
  } catch {
    // Sem localStorage a escolha só não sobrevive à recarga.
  }
  window.dispatchEvent(new Event(EVENTO_COMPANHEIRO_ATIVO));
}

function inscrever(cb: () => void) {
  window.addEventListener(EVENTO_COMPANHEIRO_ATIVO, cb);
  return () => window.removeEventListener(EVENTO_COMPANHEIRO_ATIVO, cb);
}

function snapshotServidor(): boolean {
  return false;
}

export default function CompanheiroOpcional() {
  const ativo = useSyncExternalStore(inscrever, lerCompanheiroAtivo, snapshotServidor);

  // O `useSyncExternalStore` já resolve a hidratação: durante a hidratação
  // usa o snapshot do servidor (desligado) e, logo depois, re-renderiza
  // lendo o localStorage — sem flash de bicho e sem erro de hidratação.

  if (ativo) {
    return <CompanheiroFlutuante />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => definirCompanheiroAtivo(true)}
        title="Passarinho companheiro — clicar para aparecer o bichinho"
        className="cp-companheiro-botao cursor-pointer select-none rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-soft"
      >
        <span aria-hidden="true" className="mr-1">🐦</span>
        Passarinho
      </button>
      <style>{`
        .cp-companheiro-botao {
          position: fixed;
          left: 0.75rem;
          bottom: 0.75rem;
          z-index: 40;
        }
      `}</style>
    </>
  );
}
