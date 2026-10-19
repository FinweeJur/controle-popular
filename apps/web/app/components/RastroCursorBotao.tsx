"use client";

/**
 * RastroCursorBotao — botão mágico flutuante que LIGA a trilha do cursor.
 *
 * Pedido do dono (19/10/2026): a trilha de letras passa a ser opt-in —
 * ninguém ganha a corrente sem pedir. Este botão é o interruptor visível
 * na página inteira: fica discreto no canto inferior direito e, DESLIGADO,
 * pulsa bem devagar com um brilho suave (o tal "meio mágico"). Clicou,
 * liga a trilha na hora (evento `cp:rastro-cursor`, montada pelo
 * `RastroCursor.tsx`); clicou de novo, desliga — e o pulso volta.
 *
 * Preferência compartilhada: `cp_rastro_cursor` (agora padrão DESLIGADO),
 * com as funções exportadas pelo próprio `RastroCursor.tsx` — mesma chave,
 * mesmo evento, nunca reescritos aqui. O botão do cartão Acessibilidade do
 * Seu Nonô (`RastroCursorToggle.tsx`) mostra o mesmo estado: os dois lêm
 * a mesma fonte via `useSyncExternalStore`.
 *
 * O pulso é CSS puro (keyframes ~3,5 s, ease-in-out) e some com
 * `prefers-reduced-motion` — decoração, sem custo de JS por quadro.
 */

import { useSyncExternalStore } from "react";
import {
  EVENTO_RASTRO_CURSOR,
  definirRastroCursor,
  lerRastroCursor,
} from "@/app/components/RastroCursor";

/** Assina a troca da preferência (mesmo barramento do botão do Seu Nonô). */
function inscrever(cb: () => void) {
  window.addEventListener(EVENTO_RASTRO_CURSOR, cb);
  return () => window.removeEventListener(EVENTO_RASTRO_CURSOR, cb);
}

/** Snapshot do servidor: desligada — é o padrão desde 19/10/2026. */
function snapshotServidor(): boolean {
  return false;
}

export default function RastroCursorBotao() {
  const ativo = useSyncExternalStore(inscrever, lerRastroCursor, snapshotServidor);

  return (
    <button
      type="button"
      onClick={() => definirRastroCursor(!ativo)}
      aria-pressed={ativo}
      title="Rastro mágico do mouse — liga e desliga a trilha de letras"
      className={`cp-rastro-botao cursor-pointer select-none rounded-full border px-3 py-2 text-[11px] font-semibold ${
        ativo
          ? "border-text bg-text text-bg"
          : "border-border bg-surface text-text-soft"
      }`}
    >
      <span aria-hidden="true" className="mr-1">✨</span>
      Rastro mágico
      <style>{`
        .cp-rastro-botao {
          position: fixed;
          right: 0.75rem;
          bottom: 0.75rem;
          z-index: 40;
        }
        /* Pulso bem devagar: a sombra cresce 3,5 s e volta. Só no estado
           DESLIGADO (é o convite); ligado, o botão fica quieto. */
        .cp-rastro-botao[aria-pressed="false"] {
          animation: cp-pulso-magico 3.5s ease-in-out infinite;
        }
        @keyframes cp-pulso-magico {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--cp-primary, var(--primary, #f2701d)) 0%, transparent); }
          50% { box-shadow: 0 0 18px 4px color-mix(in srgb, var(--cp-primary, var(--primary, #f2701d)) 55%, transparent); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cp-rastro-botao[aria-pressed="false"] { animation: none; }
        }
      `}</style>
    </button>
  );
}
