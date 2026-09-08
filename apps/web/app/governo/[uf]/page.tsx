import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import PainelGestaoClient from "../components/PainelGestaoClient";
import { obterMandato } from "@/lib/gestao/dados";

export async function generateStaticParams() {
  const ufs = [
    "ac", "al", "ap", "am", "ba", "ce", "df", "es", "go", "ma",
    "mt", "ms", "mg", "pa", "pb", "pr", "pe", "pi", "rj", "rn",
    "rs", "ro", "rr", "sc", "sp", "se", "to", "uniao", "federal",
  ];
  return ufs.map((uf) => ({ uf }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uf: string }>;
}): Promise<Metadata> {
  const { uf } = await params;
  const mandato = obterMandato(uf, "estadual");
  if (!mandato) {
    return {
      title: "Governo não localizado | Controle Popular",
    };
  }
  return {
    title: `Plano de Governo de ${mandato.nome_ente} (${mandato.gestor}): Prometeu? Cumpriu? | Controle Popular`,
    description: `Acompanhamento das propostas de governo do candidato eleito ${mandato.gestor} no TSE cruzadas com os gastos e obras das Secretarias e Ministérios.`,
  };
}

export default async function DetalheGovernoPage({
  params,
}: {
  params: Promise<{ uf: string }>;
}) {
  const { uf } = await params;
  const mandato = obterMandato(uf, "estadual");

  if (!mandato) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Navegação breadcrumb */}
        <nav aria-label="Navegação estrutural" className="mb-4 flex items-center gap-2 text-xs text-text-soft">
          <Link href="/" className="hover:text-primary">
            Início
          </Link>
          <span>/</span>
          <Link href="/governo" className="hover:text-primary">
            Governos
          </Link>
          <span>/</span>
          <span className="font-semibold text-text">{mandato.nome_ente}</span>
        </nav>

        {/* ═══ CABEÇALHO DO MANDATO ═══ */}
        <header className="mb-8 rounded-2xl border border-border bg-surface-1 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold uppercase text-primary">
                {mandato.esfera}
              </span>
              <span className="text-xs text-text-soft">
                Mandato {mandato.periodo.inicio}–{mandato.periodo.fim}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-text-soft">
              <span>Registro TSE:</span>
              <a
                href={mandato.plano_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline hover:text-primary/80"
              >
                PDF Original ↗
              </a>
              {mandato.plano_pdf_hash_sha256 && (
                <span
                  className="font-mono text-[10px] text-text-soft"
                  title={`Hash SHA-256: ${mandato.plano_pdf_hash_sha256}`}
                >
                  (SHA-256: {mandato.plano_pdf_hash_sha256.slice(0, 8)}...)
                </span>
              )}
            </div>
          </div>

          <div className="mt-4">
            <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Plano de Governo: {mandato.nome_ente}
            </h1>
            <p className="mt-1 text-sm text-text-soft">
              {mandato.cargo}: <strong className="text-text">{mandato.gestor}</strong>
              {mandato.partido && ` (${mandato.partido})`}
              {mandato.coligacao && ` · Coligação: ${mandato.coligacao}`}
            </p>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-text-soft">
            Cada compromisso registrado na Justiça Eleitoral é cotejado com os empenhos e contratos
            das Secretarias e Ministérios. O status reflete atos e instrumentos executivos documentados,
            nunca juízo de valor opinativo.
          </p>
        </header>

        {/* ═══ PAINEL INTERATIVO (CARDS, GRÁFICO, FILTROS, CSV) ═══ */}
        <PainelGestaoClient mandato={mandato} />
      </main>

      <FooterGlobal />
    </div>
  );
}
