import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import PainelGestaoClient from "@/app/governo/components/PainelGestaoClient";
import { paramsDasCidades } from "@/lib/betim/staticParams";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { obterMandato } from "@/lib/gestao/dados";

export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Plano de Governo e Promessas de ${c.nome} — Prometeu? Cumpriu? | ${nomePortal(c)}`,
  (c) =>
    `Acompanhamento das propostas de governo registradas na Justiça Eleitoral (TSE) para a Prefeitura de ${c.nome} cruzadas com as secretarias municipais e contratos.`
);

export default async function GestaoMunicipalPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const mandato = obterMandato(cidade.slug, "municipal");

  return (
    <div className="min-h-screen bg-surface-0">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav aria-label="Navegação estrutural" className="mb-4 flex items-center gap-2 text-xs text-text-soft">
          <Link href={`/${cidade.slug}`} className="hover:text-primary">
            {cidade.nome}
          </Link>
          <span>/</span>
          <Link href={`/${cidade.slug}/prefeitura`} className="hover:text-primary">
            Prefeitura
          </Link>
          <span>/</span>
          <span className="font-semibold text-text">Plano de Governo</span>
        </nav>

        {/* Cabeçalho */}
        <header className="mb-8 rounded-2xl border border-border bg-surface-1 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold uppercase text-primary">
              Gestão Municipal de {cidade.nome}
            </span>
            <div className="flex items-center gap-2 text-xs text-text-soft">
              <Link
                href={`/${cidade.slug}/prefeitura/contratos`}
                className="underline hover:text-primary"
              >
                Ver Contratos
              </Link>
              <span>·</span>
              <Link
                href={`/${cidade.slug}/prefeitura/obras`}
                className="underline hover:text-primary"
              >
                Ver Obras
              </Link>
            </div>
          </div>

          <div className="mt-4">
            <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Plano de Governo Registrado: {cidade.nome}
            </h1>
            <p className="mt-1 text-sm text-text-soft">
              O que o prefeito eleito registrou no Tribunal Superior Eleitoral (TSE) cruzado com a
              execução das secretarias municipais.
            </p>
          </div>
        </header>

        {mandato ? (
          <PainelGestaoClient mandato={mandato} />
        ) : (
          /* Estado informativo para municípios onde o PDF do TSE ainda está em catalogação */
          <div className="rounded-2xl border border-dashed border-border bg-surface-1 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
              📋
            </div>
            <h2 className="mt-4 text-base font-bold text-text">
              Plano de Governo de {cidade.nome} em fase de ingestão
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-text-soft">
              O PDF do plano de governo municipal registrado na Justiça Eleitoral está sendo
              processado pelo coletor do TSE. Você já pode consultar as contratações públicas, obras e
              despesas da prefeitura nas páginas dedicadas.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href={`/${cidade.slug}/prefeitura`}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
              >
                Painel da Prefeitura
              </Link>
              <Link
                href={`/${cidade.slug}/prefeitura/contratos`}
                className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-xs font-semibold text-text hover:bg-surface-3"
              >
                Contratos Municipais
              </Link>
            </div>
          </div>
        )}
      </main>

      <FooterGlobal />
    </div>
  );
}
