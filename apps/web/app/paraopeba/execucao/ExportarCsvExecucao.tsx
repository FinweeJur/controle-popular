"use client";

import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import type { ProjetoExecucaoFgv } from "@/lib/paraopeba/execucao-fgv";

const COLUNAS_CSV_EXECUCAO: ColunaCsv<ProjetoExecucaoFgv>[] = [
  { chave: "municipio", rotulo: "Municipio" },
  { chave: "projeto", rotulo: "Projeto" },
  { chave: "empenhoNominal", rotulo: "Empenho Nominal (R$)" },
  { chave: "empenhoAtualizado", rotulo: "Empenho Atualizado (R$)" },
  { chave: "executado", rotulo: "Valor Pago / Executado (R$)" },
  { chave: "saldo", rotulo: "Saldo (R$)" },
  { chave: "nivelExecucao", rotulo: "Nivel de Execucao (%)" },
];

export default function ExportarCsvExecucao({
  projetos,
}: {
  projetos: readonly ProjetoExecucaoFgv[];
}) {
  function exportar() {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarCsv(COLUNAS_CSV_EXECUCAO, projetos, `execucao-acordo-paraopeba-${hoje}.csv`);
  }

  return (
    <button
      type="button"
      onClick={exportar}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text shadow-sm transition-colors hover:border-primary hover:text-primary"
      title="Baixar planilha CSV compativel com Excel brasileiro"
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
      Baixar CSV (Planilha)
    </button>
  );
}
