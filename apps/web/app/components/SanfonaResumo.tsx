"use client";

import { useId, useState } from "react";

/**
 * Sanfona do resumo — REQUISITO DO DONO (14/10/2026): o resumo de cada tese
 * abre na própria página, pelo botão "Ver resumo", sem navegar para outro
 * lugar (estilo sanfona; mesmo vocabulário visual de `SanfonaFrentes.tsx`).
 *
 * Acessibilidade: `aria-expanded` + `aria-controls` no botão de controle do
 * acordeão — quem navega por teclado (AGENTS §1, leitor sob estresse)
 * escuta se o painel está aberto antes de entrar.
 */

export default function SanfonaResumo({ resumo }: { resumo: string }) {
  const [aberto, setAberto] = useState(false);
  const id = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={id}
        onClick={() => setAberto((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-primary transition hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
      >
        {aberto ? "Fechar resumo ▴" : "Ver resumo ▾"}
      </button>
      <div
        id={id}
        hidden={!aberto}
        className="mt-2 rounded-xl border border-border bg-surface-2 p-4 text-sm leading-relaxed text-text"
      >
        <p className="whitespace-pre-line">{resumo}</p>
        <p className="mt-2 border-t border-border pt-2 text-xs text-text-soft">
          Resumo na íntegra do repositório da instituição — o portal não reescreve.
        </p>
      </div>
    </div>
  );
}
