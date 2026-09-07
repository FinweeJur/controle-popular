import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import PainelRecomendacoesClient from "./PainelRecomendacoesClient";
import { obterRecomendacoes } from "@/lib/judiciario/recomendacoes";

export const metadata: Metadata = {
  title: "Recomendações e Cobranças do CNJ e CNMP | Controle Popular",
  description:
    "Catálogo transparente e em linguagem simples das determinações e recomendações emitidas pelo CNJ e CNMP em inspeções sobre tribunais e promotorias.",
};

export default function PaginaRecomendacoesJudiciario() {
  const itens = obterRecomendacoes();

  return (
    <div className="min-h-screen bg-surface-0">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav aria-label="Navegação estrutural" className="mb-4 flex items-center gap-2 text-xs text-text-soft">
          <Link href="/" className="hover:text-primary">
            Início
          </Link>
          <span>/</span>
          <Link href="/judiciario" className="hover:text-primary">
            Judiciário
          </Link>
          <span>/</span>
          <span className="font-semibold text-text">Recomendações do CNJ e CNMP</span>
        </nav>

        {/* Cabeçalho */}
        <header className="mb-8 rounded-2xl border border-border bg-surface-1 p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold uppercase text-primary">
              Controle dos Tribunais e MPs
            </span>
            <span className="rounded-full bg-surface-2 px-3 py-0.5 text-xs text-text-soft">
              Conselho Nacional de Justiça & Conselho Nacional do Ministério Público
            </span>
          </div>

          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
            O que o CNJ e o CNMP Mandaram Corrigir
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-soft">
            Quando os corregedores nacionais inspecionam um tribunal ou Ministério Público, eles
            identificam gavetas cheias de processos parados, falta de defensores, dinheiro de idosos
            retido em precatórios e ausência de audiências de custódia. Nós traduzimos os despachos
            técnicos para microresumos que qualquer cidadão entende.
          </p>
        </header>

        {/* Painel Interativo com Gráfico, Top Cards, Filtros, Microresumo e CSV */}
        <PainelRecomendacoesClient itens={itens} />
      </main>

      <FooterGlobal />
    </div>
  );
}
