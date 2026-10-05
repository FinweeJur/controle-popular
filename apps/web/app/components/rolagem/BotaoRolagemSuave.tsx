"use client";

/**
 * BotaoRolagemSuave — liga/desliga a rolagem suave (Lenis) do portal.
 *
 * Mora na fileira de botões do `FooterGlobal` (decisão do dono em
 * 05/10/2026: o controle da rolagem é do usuário, e o rodapé é onde já
 * vivem os controles globais — rádio, notificações, citar página).
 *
 * Como fala com o `RolagemSuave` (layout raiz): grava em localStorage
 * (`cp_rolagem_suave`) e dispara o evento de janela `cp-rolagem-suave`.
 * O estado lido com `useSyncExternalStore` (mesmo store do provedor:
 * mesmo snapshot, mesmas fontes de mudança) — sem estado React local
 * para sincronizar à mão, sem setState em efeito (regra do ESLint).
 *
 * Acessibilidade: `aria-pressed` comunica o estado; o rótulo diz o que o
 * botão faz em português ("Rolagem suave: ligada/desligada"). O snapshot
 * do SERVIDOR é `true` (padrão do portal: ligada), então o botão renderiza
 * no HTML pré-renderizado com o estado default honesto.
 */

import { useSyncExternalStore } from "react";
import {
  CHAVE_ROLAGEM_SUAVE,
  EVENTO_ROLAGEM_SUAVE,
} from "./RolagemSuave";

/** Mesmo store do provedor: mesma leitura, mesmas fontes de mudança. */
function subscrever(notificar: () => void): () => void {
  window.addEventListener(EVENTO_ROLAGEM_SUAVE, notificar);
  window.addEventListener("storage", notificar);
  return () => {
    window.removeEventListener(EVENTO_ROLAGEM_SUAVE, notificar);
    window.removeEventListener("storage", notificar);
  };
}

function lerAtivo(): boolean {
  try {
    return localStorage.getItem(CHAVE_ROLAGEM_SUAVE) !== "off";
  } catch {
    return true;
  }
}

export default function BotaoRolagemSuave() {
  const ativo = useSyncExternalStore(subscrever, lerAtivo, () => true);

  const alternar = () => {
    const novo = !ativo;
    try {
      localStorage.setItem(CHAVE_ROLAGEM_SUAVE, novo ? "on" : "off");
    } catch {
      // localStorage bloqueado (navegação privada estrita): a escolha
      // vale só para esta visita — mesmo comportamento do tamanho de fonte.
    }
    // O evento avisa o `RolagemSuave` (layout raiz) e re-renderiza este
    // botão: o snapshot é relido, e o React compara e atualiza sozinho.
    window.dispatchEvent(new Event(EVENTO_ROLAGEM_SUAVE));
  };

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={ativo}
      className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-accent"
    >
      {ativo ? "🌀 Rolagem suave: ligada" : "🌀 Rolagem suave: desligada"}
    </button>
  );
}
