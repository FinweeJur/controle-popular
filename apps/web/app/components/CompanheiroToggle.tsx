"use client";

/**
 * CompanheiroToggle — botão liga/desliga do companheiro (passarinho).
 *
 * Papel no portal: ser o controle VISÍVEL do passarinho dentro do Seu
 * Nonô, no cartão "Acessibilidade" — pedido do dono em 19/10/2026:
 * dois botões distintos (trilha e passarinho) e o chatbot controlando
 * os dois. Reutiliza o contrato do `CompanheiroOpcional.tsx`: chave
 * `cp_companheiro_ativo` (padrão DESLIGADO — só "on" liga), evento
 * `cp:companheiro-ativo` e funções exportadas por ele — nunca
 * reescritos aqui. Assim o estado lido por este botão, pelo botão
 * flutuante do passarinho e pelo `CompanheiroOpcional` é sempre o
 * mesmo: quem muda de um lado, o outro redesenha na hora.
 *
 * Segue o padrão de `RastroCursorToggle.tsx` (reutilizar, não recriar):
 * botão `aria-pressed`, leitura por `useSyncExternalStore`, snapshot do
 * servidor desligado (sem erro de hidratação).
 */

import { useSyncExternalStore } from "react";
import {
  EVENTO_COMPANHEIRO_ATIVO,
  definirCompanheiroAtivo,
  lerCompanheiroAtivo,
} from "@/app/components/CompanheiroOpcional";

function inscrever(cb: () => void) {
  window.addEventListener(EVENTO_COMPANHEIRO_ATIVO, cb);
  return () => window.removeEventListener(EVENTO_COMPANHEIRO_ATIVO, cb);
}

/** Snapshot do servidor: desligado — é o padrão desde 19/10/2026. */
function snapshotServidor(): boolean {
  return false;
}

export default function CompanheiroToggle() {
  const ativo = useSyncExternalStore(inscrever, lerCompanheiroAtivo, snapshotServidor);

  return (
    <button
      type="button"
      onClick={() => definirCompanheiroAtivo(!ativo)}
      aria-pressed={ativo}
      title="Passarinho companheiro — desligue se atrapalhar a leitura"
      className={`cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-medium ${
        ativo
          ? "border-text bg-text text-bg"
          : "border-border bg-transparent text-text-soft hover:bg-surface-2"
      }`}
    >
      Passarinho
    </button>
  );
}
