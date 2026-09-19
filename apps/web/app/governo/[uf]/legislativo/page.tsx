import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import TabelaDeputadosClient from "./TabelaDeputadosClient";
import {
  obterAssembleiaEstadual,
  listarUfsAssembleias,
} from "@/lib/legislativo/ranking-estadual";

export async function generateStaticParams() {
  const ufs = listarUfsAssembleias();
  return ufs.map((uf) => ({ uf }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uf: string }>;
}): Promise<Metadata> {
  const { uf } = await params;
  const assembleia = obterAssembleiaEstadual(uf);
  if (!assembleia) {
    return {
      title: "Assembleia Legislativa não localizada | Controle Popular",
    };
  }
  return {
    title: `${assembleia.sigla}: Ranking de Deputados Estaduais, Salários e Gastos (${assembleia.nome_uf}) | Controle Popular`,
    description: `Fiscalização dos deputados da ${assembleia.nome_assembleia}: ranking de atuação garantista, presença em plenário, salários de R$ ${assembleia.subsidio_mensal_bruto.toLocaleString("pt-BR")}, assessores de gabinete e cota parlamentar.`,
  };
}

export default async function DetalheLegislativoEstadualPage({
  params,
}: {
  params: Promise<{ uf: string }>;
}) {
  const { uf } = await params;
  const assembleia = obterAssembleiaEstadual(uf);

  if (!assembleia) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Navegação Estrutural (Breadcrumb) */}
        <nav
          aria-label="Navegação estrutural"
          className="mb-4 flex items-center gap-2 text-xs text-text-soft"
        >
          <Link href="/" className="hover:text-primary">
            Início
          </Link>
          <span>/</span>
          <Link href="/governo" className="hover:text-primary">
            Governos
          </Link>
          <span>/</span>
          <Link href={`/governo/${assembleia.uf}`} className="hover:text-primary">
            {assembleia.nome_uf}
          </Link>
          <span>/</span>
          <span className="font-semibold text-text">
            {assembleia.sigla} (Legislativo)
          </span>
        </nav>

        {/* ═══ CABEÇALHO DO PODER LEGISLATIVO ESTADUAL ═══ */}
        <header className="mb-8 rounded-2xl border border-border bg-surface-1 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold uppercase text-primary">
                Poder Legislativo Estadual
              </span>
              <span className="text-xs text-text-soft">
                {assembleia.total_cadeiras} Cadeiras · 20ª Legislatura
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-text-soft">
              <Link
                href={`/governo/${assembleia.uf}`}
                className="inline-flex items-center gap-1 rounded bg-surface-2 px-2.5 py-1 font-medium text-text hover:bg-surface-3 transition-colors"
              >
                ← Ver Plano do Executivo (Governador)
              </Link>
            </div>
          </div>

          <div className="mt-4">
            <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
              {assembleia.nome_assembleia} ({assembleia.sigla})
            </h1>
            <p className="mt-2 text-sm text-text-soft leading-relaxed max-w-4xl">
              Painel de transparência ativa do parlamento mineiro e estaduais:
              ranking de atividade com a régua garantista de direitos, frequência
              em votações nominais, subsídio constitucional bruto de{" "}
              <strong className="text-text">
                R$ {assembleia.subsidio_mensal_bruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </strong>
              , quadro de servidores comissionados por gabinete e gastos da cota
              para o exercício da atividade parlamentar.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-border pt-4 text-xs text-text-soft">
            <div>
              <strong className="text-text">Régua Cívica:</strong> Mede projetos
              que ampliam direitos fundamentais e desconta faltas em plenário.
            </div>
            <div>
              <strong className="text-text">Custo do Gabinete:</strong> Salários,
              equipe de apoio comissionada e reembolsos de combustível/divulgação.
            </div>
            <div>
              <strong className="text-text">Dados Abertos:</strong> Extração direta
              dos diários e APIs de dados abertos da própria assembleia.
            </div>
          </div>
        </header>

        {/* ═══ PAINEL INTERATIVO DE DEPUTADOS (CARDS, GRÁFICO, FILTROS, CSV) ═══ */}
        <TabelaDeputadosClient assembleia={assembleia} />
      </main>

      <FooterGlobal />
    </div>
  );
}
