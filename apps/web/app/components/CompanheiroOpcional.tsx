"use client";

/**
 * CompanheiroOpcional — portão do companheiro (passarinho).
 *
 * Pedido do dono (19/10/2026): o bichinho flutuante NÃO nasce mais sozinho.
 * Só existe se a pessoa quiser, ligando pelo item do dock. Este wrapper
 * guarda a escolha no `localStorage` (`cp_companheiro_ativo`, padrão OFF —
 * só `on` liga) e monta o `CompanheiroFlutuante.tsx` só quando está ligado:
 * desligado, nem o script do bicho nem o rastro dele rodam.
 *
 * Desligado, o componente não desenha mais botão próprio: quem liga e
 * desliga o bicho agora é o `DockFlutuante.tsx` (pedido do dono,
 * 08/11/2026 — um único lugar para as ações rápidas). Aqui fica só o
 * PORTÃO: com o bicho ligado monta o flutuante; desligado, monta o menu de
 * bichinhos offline (para a pata do Seu Nonô continuar abrindo o menu sem
 * ligar nada sozinho). A troca viaja pelo evento `cp:companheiro-ativo`
 * (mesmo barramento do `cp:rastro-cursor`), sem recarregar a página.
 */

import { useSyncExternalStore } from "react";
import { CompanheiroFlutuante } from "@/app/components/CompanheiroFlutuante";
import CompanheiroMenuOffline from "@/app/components/CompanheiroMenuOffline";

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

  // Bicho desligado: só o menu de bichinhos, que a pata do Seu Nonô pede.
  // Nenhum botão flutuante aqui — o gatilho é o `DockFlutuante`.
  return <CompanheiroMenuOffline />;
}
