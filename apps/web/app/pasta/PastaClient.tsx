"use client";

import Link from "next/link";
import { Download, Printer, Trash2, X, FolderOpen, Command } from "lucide-react";
import { LIMITE_ITENS } from "@/lib/pasta/itens";
import { limparPasta, removerDaPasta, useItensPasta } from "./pastaStore";

/**
 * Página `/pasta` — o dossiê em construção.
 *
 * ═══ O QUE É ═══
 *
 * Mostra os itens que o leitor juntou ao navegar (páginas, tabelas, leis) e
 * permite exportar tudo de uma vez em planilha (CSV) ou imprimir. É a outra
 * ponta do gesto "adicionar à pasta" (na paleta de comandos, Ctrl+K).
 *
 * ═══ POR QUE CSV COM BOM E PONTO E VÍRGULA ═══
 *
 * É a mesma régua das tabelas do portal (AGENTS § 8): `;` como separador e
 * BOM UTF-8 (`\uFEFF`) para o Excel brasileiro abrir acentuado e em colunas
 * certas. O arquivo sai com a fonte (o endereço) de cada linha.
 */

export default function PastaClient() {
  const itens = useItensPasta();

  function baixarCsv() {
    const origem = typeof window === "undefined" ? "" : window.location.origin;
    const cabecalho = "Titulo;Endereco;Tipo;Adicionado em\n";
    const linhas = itens
      .map(
        (i) =>
          `"${i.titulo}";"${origem}${i.href}";"${i.tipo}";"${i.adicionadoEm.slice(0, 10)}"`,
      )
      .join("\n");
    const conteudo = "\uFEFF" + cabecalho + linhas;
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "controle-popular-dossie.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (itens.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface-2/50 p-6">
        <div className="flex items-start gap-3">
          <FolderOpen size={20} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-foreground">Sua pasta está vazia.</p>
            <p className="mt-1 text-sm text-muted leading-relaxed">
              Ao navegar, abra a busca rápida com{" "}
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs">
                Ctrl K
              </kbd>{" "}
              e escolha <strong className="text-foreground">Adicionar esta página à pasta</strong>.
              Junte quantas quiser e exporte tudo junto no final.
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
              <Command size={12} aria-hidden="true" /> A lista fica no seu aparelho, sem cadastro.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <strong className="text-foreground">{itens.length}</strong> de {LIMITE_ITENS} itens na pasta.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={baixarCsv}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Download size={14} aria-hidden="true" /> Baixar planilha (CSV)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
          >
            <Printer size={14} aria-hidden="true" /> Imprimir
          </button>
          <button
            type="button"
            onClick={limparPasta}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            <Trash2 size={14} aria-hidden="true" /> Limpar
          </button>
        </div>
      </div>

      <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
        {itens.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <Link
                href={item.href}
                className="block truncate text-sm font-medium text-foreground hover:text-primary"
              >
                {item.titulo}
              </Link>
              <span className="mt-0.5 block truncate font-mono text-xs text-muted">
                {item.href}
              </span>
            </div>
            <button
              type="button"
              onClick={() => removerDaPasta(item.id)}
              aria-label={`Remover ${item.titulo} da pasta`}
              className="shrink-0 rounded-lg p-1 text-muted transition-colors hover:text-foreground"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
