"use client";

import { useState } from "react";
import { Download, Printer, Copy, CheckCircle2 } from "lucide-react";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";

export interface BotoesExportarProps<T extends Record<string, any>> {
  /** Dados filtrados na tela — array de objetos planos. */
  dados: readonly T[];
  /** Colunas do CSV (reutiliza ColunaCsv do lib/tabela/csv). */
  colunas: readonly ColunaCsv<T>[];
  /** Nome do arquivo CSV (sem extensão; ".csv" é adicionado). */
  nomeArquivo: string;
  /** Texto para copiar ao clipboard (se omitido, gera texto tabulado do dado). */
  textoClipboard?: string;
}

export default function BotoesExportar<T extends Record<string, any>>({
  dados,
  colunas,
  nomeArquivo,
  textoClipboard,
}: BotoesExportarProps<T>) {
  const [copiado, setCopiado] = useState(false);

  const exportarCsv = () => {
    baixarCsv(colunas as ColunaCsv<T>[], dados, nomeArquivo);
  };

  const imprimir = () => {
    window.print();
  };

  const copiarTexto = () => {
    const texto =
      textoClipboard ??
      (() => {
        const cabecalho = colunas.map((c) => c.rotulo).join("\t");
        const linhas = dados.map((linha) =>
          colunas
            .map((col) => {
              const v = linha[col.chave];
              return col.formatar ? String(col.formatar(v, linha) ?? "") : String(v ?? "");
            })
            .join("\t")
        );
        return [cabecalho, ...linhas].join("\n");
      })();

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={exportarCsv}
        disabled={dados.length === 0}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-primary hover:bg-surface disabled:opacity-40"
        aria-label="Baixar planilha CSV"
      >
        <Download className="h-3.5 w-3.5 text-primary" />
        CSV
      </button>

      <button
        type="button"
        onClick={copiarTexto}
        disabled={dados.length === 0}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-primary hover:bg-surface disabled:opacity-40"
        aria-label="Copiar dados para a área de transferência"
      >
        {copiado ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted" />
        )}
        {copiado ? "Copiado!" : "Copiar"}
      </button>

      <button
        type="button"
        onClick={imprimir}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-primary hover:bg-surface"
        aria-label="Imprimir esta página"
      >
        <Printer className="h-3.5 w-3.5 text-muted" />
        Imprimir
      </button>
    </div>
  );
}
