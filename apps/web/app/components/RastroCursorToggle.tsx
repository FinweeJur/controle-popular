"use client";

/**
 * RastroCursorToggle — botão liga/desliga da trilha do cursor do mouse.
 *
 * Papel no portal: ser o controle VISÍVEL da trilha para quem precisa
 * desligá-la (leitura difícil, enjoo de movimento, PC fraco). Vive no
 * cartão "Acessibilidade" do Seu Nonô — pedido do dono em 10/10/2026:
 * "que o Seu Nonô possa desativar a trilha do cursor se a pessoa pedir,
 * incluir no menu de acessibilidade".
 *
 * Segue o padrão de `CvdToggle.tsx` (reutilizar, não recriar): botão
 * `aria-pressed`, gravação direta em `localStorage` e leitura por
 * `useSyncExternalStore` — aqui a inscrição é o evento
 * `cp:rastro-cursor`, então o botão se redesenha quando a preferência
 * muda pelo TEXTO no chat do Seu Nonô, e o `RastroCursor` (layout raiz)
 * monta ou desmonta a corrente na mesma hora.
 *
 * Preferência compartilhada: `cp_rastro_cursor` (padrão DESLIGADO — opt-in
 * pedido pelo dono em 19/10/2026, com o botão mágico flutuante
 * `RastroCursorBotao.tsx`) com as
 * funções exportadas pelo próprio `RastroCursor.tsx` — mesma chave, mesmo
 * evento, nunca reescritos aqui.
 */

import { useSyncExternalStore } from "react";
import {
  EVENTO_RASTRO_CURSOR,
  definirRastroCursor,
  lerRastroCursor,
} from "@/app/components/RastroCursor";

/**
 * Assina o evento de troca da trilha. Declarado no escopo do módulo de
 * propósito: `useSyncExternalStore` re-inscreve quando a função muda de
 * identidade, e uma função nova a cada render causaria re-inscrição em
 * todo render.
 */
function inscrever(cb: () => void) {
  window.addEventListener(EVENTO_RASTRO_CURSOR, cb);
  return () => window.removeEventListener(EVENTO_RASTRO_CURSOR, cb);
}

/** Snapshot do servidor: trilha desligada (é o padrão desde 19/10/2026,
 *  quando virou opt-in pelo botão mágico) — o cliente corrige depois da
 *  hidratação se a pessoa tiver ligado, sem erro de hidratação. */
function snapshotServidor(): boolean {
  return false;
}

export default function RastroCursorToggle() {
  const ativo = useSyncExternalStore(inscrever, lerRastroCursor, snapshotServidor);

  return (
    <button
      type="button"
      onClick={() => definirRastroCursor(!ativo)}
      aria-pressed={ativo}
      title="Trilha de letras que segue o mouse — desligue se atraplar a leitura"
      className={`cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-medium ${
        ativo
          ? "border-text bg-text text-bg"
          : "border-border bg-transparent text-text-soft hover:bg-surface-2"
      }`}
    >
      Trilha do cursor
    </button>
  );
}
