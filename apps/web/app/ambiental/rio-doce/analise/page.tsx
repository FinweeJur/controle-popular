import type { Metadata } from "next";
import analise from "@/data/analises/rio-doce.json";
import { MarkdownResumo } from "@/app/components/ResumoRealidade";
import { TrilhaFrentes } from "@/app/components/TrilhaFrentes";

/**
 * `/ambiental/rio-doce/analise` — análise integrada do Rio Doce e do litoral.
 *
 * O QUE É: a síntese do que a literatura documenta sobre a chegada da pluma ao
 * litoral capixaba e a Abrolhos, com a força da evidência de cada afirmação.
 * Não é página de notícia nem de acervo: é leitura do conjunto.
 *
 * POR QUE ASSIM: o texto vem de `data/analises/rio-doce.json`, escrito a partir
 * dos artigos citados — o relatório exportado do Consensus não pode ser
 * republicado. Cada afirmação mantém a citação do trabalho que a sustenta.
 */

export const metadata: Metadata = {
  title: "Análise integrada — Rio Doce e litoral | Controle Popular",
  description:
    "O que a literatura documenta sobre a chegada dos rejeitos de Fundão ao litoral capixaba e a Abrolhos: extensão da pluma, danos ambientais, saúde, pesca e limites da reparação.",
};

export default function AnaliseRioDoce() {
  const corpo = (analise.markdown ?? "").replace(/^#\s+.*\r?\n/, "").trim();
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {analise.titulo}
        </h1>
        <p className="text-sm opacity-70">
          Síntese própria a partir dos artigos citados. Atualizada em{" "}
          {analise.geradoEm}.
        </p>
      </header>

      <article className="rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface-2)] p-5 sm:p-6">
        <MarkdownResumo markdown={corpo} />
      </article>

      <TrilhaFrentes atual="/ambiental/rio-doce/analise" />
    </div>
  );
}
