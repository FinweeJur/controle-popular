"use client";

import { Play } from "lucide-react";

/**
 * Botão de rádio do rodapé — liga/desliga o player persistente.
 *
 * O player real vive em `PlayerRadio.tsx`, montado no layout raiz e que não
 * desmonta ao navegar. Este botão, que é renderizado por PÁGINA dentro do
 * rodapé, não pode controlar o estado daquele componente diretamente (são
 * árvores diferentes). Por isso ele só dispara o evento global
 * `cp:radio-toggle`, que o `PlayerRadio` escuta. Se nada estiver carregado, o
 * player abre na Rádio Brasil de Fato (a estação padrão); o diretório inteiro
 * fica em `/radio`. Um controle, um estado.
 */

export default function BotaoRadio() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("cp:radio-toggle"))}
      className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-accent"
    >
      <Play size={14} aria-hidden="true" /> Ouvir a rádio
    </button>
  );
}
