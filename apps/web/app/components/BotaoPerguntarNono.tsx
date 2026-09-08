"use client";

import { MessageSquare } from "lucide-react";

interface Props {
  pergunta: string;
  rotulo?: string;
  classeExtra?: string;
}

export default function BotaoPerguntarNono({
  pergunta,
  rotulo = "Perguntar ao Seu Nonô",
  classeExtra = "",
}: Props) {
  function disparar() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("abrir-seu-nono", {
          detail: { pergunta },
        })
      );
    }
  }

  return (
    <button
      type="button"
      onClick={disparar}
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer ${classeExtra}`}
    >
      <span aria-hidden="true">🦜</span>
      <span>{rotulo}</span>
    </button>
  );
}
