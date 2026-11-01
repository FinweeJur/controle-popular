"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, X } from "lucide-react";

/**
 * Leitor de ementa/resumo da jurisprudência.
 *
 * O painel antigo era `absolute` dentro da célula: cortava no rodapé e no
 * canto da tela. Aqui vira diálogo fixo, com rolagem, botão de copiar e
 * fechamento por Esc/backdrop.
 */

function semPrefixo(texto: string, prefixo: string): string {
  return texto.replace(new RegExp(`^${prefixo}:\\s*`, "i"), "");
}

function PainelEmenta({
  resumo,
  ementa,
  copiado,
  onCopiar,
  onFechar,
}: {
  resumo?: string;
  ementa?: string;
  copiado: boolean;
  onCopiar: () => void;
  onFechar: () => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-3 sm:p-6"
      onClick={onFechar}
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ementa-titulo"
        style={{ maxHeight: "85vh" }}
        className="flex w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 id="ementa-titulo" className="text-sm font-semibold text-text">
            {resumo ? "Resumo do caso" : "Ementa do acórdão"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCopiar}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-text hover:bg-surface-2"
            >
              {copiado ? <Check size={14} /> : <Copy size={14} />}
              {copiado ? "copiado" : "copiar"}
            </button>
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar"
              className="rounded-md border border-border p-1 text-text hover:bg-surface-2"
            >
              <X size={16} />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 py-4 text-sm leading-relaxed text-text-soft">
          {resumo ? (
            <p className="mb-4">
              <span className="font-semibold text-text">Resumo: </span>
              {semPrefixo(resumo, "resumo")}
            </p>
          ) : null}
          {ementa ? (
            <p>
              <span className="font-semibold text-text">Ementa: </span>
              {semPrefixo(ementa, "ementa")}
            </p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function EmentaDialog({
  resumo,
  ementa,
}: {
  resumo?: string;
  ementa?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const rotulo = resumo ? "ver resumo" : "ver ementa";

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("keydown", aoTeclar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflow;
    };
  }, [aberto]);

  async function copiar() {
    const partes = [
      resumo ? `Resumo: ${semPrefixo(resumo, "resumo")}` : "",
      ementa ? `Ementa: ${semPrefixo(ementa, "ementa")}` : "",
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(partes.join("\n\n"));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-1 block text-xs font-semibold text-primary underline"
      >
        {rotulo}
      </button>
      {aberto ? (
        <PainelEmenta
          resumo={resumo}
          ementa={ementa}
          copiado={copiado}
          onCopiar={copiar}
          onFechar={() => setAberto(false)}
        />
      ) : null}
    </>
  );
}
