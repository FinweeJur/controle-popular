"use client";

import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";

interface ExportarCsvDireitosProps<T extends object> {
  dados: readonly T[];
  colunas: readonly ColunaCsv<T>[];
  nomeArquivoBase: string;
  rotuloBotao?: string;
}

export default function ExportarCsvDireitos<T extends object>({
  dados,
  colunas,
  nomeArquivoBase,
  rotuloBotao,
}: ExportarCsvDireitosProps<T>) {
  function exportar() {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarCsv(colunas, dados, `${nomeArquivoBase}-${hoje}.csv`);
  }

  return (
    <button
      type="button"
      onClick={exportar}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-sm transition-colors hover:border-primary hover:text-primary print:hidden"
      title="Baixar planilha CSV com delimitador ';' e BOM UTF-8 (compatível com Excel brasileiro)"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      {rotuloBotao ?? `Baixar CSV (${dados.length})`}
    </button>
  );
}
