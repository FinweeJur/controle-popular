"use client";

/**
 * @file RastroCursorBotao.tsx
 * @description Interruptor do rastro mágico na pilha da esquerda.
 *
 * Pedido do dono (19/10/2026): a trilha de letras é opt-in — ninguém ganha a
 * corrente sem pedir. Desde 08/11/2026 este botão é o quarto item da pilha,
 * acima do rádio: fica escondido até o ponteiro chegar no Seu Nonô, abre o
 * nome "Rastro mágico" no hover e continua visível enquanto a trilha está
 * LIGADA, senão não haveria como desligá-la sem caçar o Seu Nonô.
 *
 * Preferência compartilhada: `cp_rastro_cursor` (padrão DESLIGADO), com as
 * funções exportadas pelo próprio `RastroCursor.tsx` — mesma chave, mesmo
 * evento, nunca reescritos aqui. O cartão "Acessibilidade" do Seu Nonô
 * mostra o mesmo estado.
 *
 * Cor nunca é o único sinal: o botão usa `aria-pressed` e o pulso sai quando
 * ligado.
 */

import { useSyncExternalStore } from "react";
import { Sparkles } from "lucide-react";
import {
  EVENTO_RASTRO_CURSOR,
  definirRastroCursor,
  lerRastroCursor,
} from "@/app/components/RastroCursor";
import PilhaBotao from "@/app/components/pilha/PilhaBotao";
import { useSlotPilha } from "@/app/components/pilha/estadoPilha";

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
  const { visivel, indice } = useSlotPilha("rastro", ativo);

  return (
    <div
      className={`fixed left-[calc(var(--cp-pilha-centro)-1.375rem)] z-[44] transition-[bottom] duration-75 motion-reduce:transition-none print:hidden ${
        visivel ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      data-cp-slot={indice}
      data-cp-pilha
      inert={!visivel}
      aria-hidden={!visivel}
    >
      <PilhaBotao
        rotulo="Rastro mágico"
        aria-pressed={ativo}
        onClick={() => definirRastroCursor(!ativo)}
        title="Rastro mágico do mouse — liga e desliga a trilha de letras"
        icone={<Sparkles size={20} aria-hidden="true" />}
      />
    </div>
  );
}
