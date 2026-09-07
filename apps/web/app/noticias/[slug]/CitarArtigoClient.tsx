"use client";

import { useState } from "react";
import { Copy, Check, BookMarked } from "lucide-react";

interface Props {
  citacaoAbnt: string;
  citacaoBibtex: string;
}

export default function CitarArtigoClient({ citacaoAbnt, citacaoBibtex }: Props) {
  const [formato, setFormato] = useState<"abnt" | "bibtex">("abnt");
  const [copiado, setCopiado] = useState(false);

  const textoAtual = formato === "abnt" ? citacaoAbnt : citacaoBibtex;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoAtual);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <BookMarked size={16} className="text-primary" />
          <h3 className="font-display text-sm font-bold text-foreground">
            Como citar este relatório / divulgação científica
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="inline-flex rounded-lg bg-surface-2 p-0.5 border border-border">
            <button
              type="button"
              onClick={() => setFormato("abnt")}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                formato === "abnt"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              ABNT
            </button>
            <button
              type="button"
              onClick={() => setFormato("bibtex")}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                formato === "bibtex"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              BibTeX
            </button>
          </div>

          <button
            type="button"
            onClick={copiar}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
            title="Copiar citação formatada"
          >
            {copiado ? (
              <>
                <Check size={12} className="text-emerald-600" />
                <span className="text-emerald-600">Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-3">
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs text-muted leading-relaxed rounded-xl bg-surface-2 p-3.5 border border-border/50">
          {textoAtual}
        </pre>
      </div>
    </div>
  );
}
