import type { Metadata } from "next";
import Link from "next/link";
import { listerAlmgProposicoes } from "@/lib/congresso/almg-queries";
import type { ProposicaoAlmg } from "@/lib/congresso/almg";

export const metadata: Metadata = {
  title: "Proposições Estaduais ALMG — Assembleia de MG | Controle Popular",
  description:
    "Todas as proposições legislativas de MG com análise garantista de direitos. Projetos de lei, PECs e complementares da ALMG.",
};

function TabelaAlmg({ dados }: { dados: ProposicaoAlmg[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/60 text-left text-xs font-semibold uppercase tracking-wider text-muted">
            <th className="px-3 py-2">Código</th>
            <th className="px-3 py-2">Ementa</th>
            <th className="px-3 py-2">Situação</th>
            <th className="px-3 py-2">Última Ação</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((p) => (
            <tr key={p.codigo} className="border-b border-border/50 hover:bg-surface-2/40">
              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-semibold text-primary">
                <Link href={`/congresso/almg/proposicoes/${encodeURIComponent(p.codigo)}`} className="hover:underline">
                  {p.codigo}
                </Link>
              </td>
              <td className="px-3 py-2 text-xs text-muted line-clamp-2">{p.ementa}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-muted">{p.situacao}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-muted">{p.data_ultima_acao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AlmgProposicoesPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | undefined }>;
}) {
  const sp = await searchParams;
  const proposicoes = await listerAlmgProposicoes({
    q: sp.q,
    tipo: sp.tipo,
    ano: sp.ano ? Number(sp.ano) : undefined,
    tramitando: sp.tramitando === "1",
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:underline">Início</Link>
        <span>/</span>
        <Link href="/congresso" className="hover:underline">Congresso</Link>
        <span>/</span>
        <Link href="/congresso/almg" className="hover:underline">ALMG</Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Proposições</span>
      </nav>

      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Proposições Estaduais de MG
        </h1>
        <p className="mt-2 text-sm text-muted">
          {proposicoes.length} proposições relevantes (PL, PLC, PEC, PLD, PRE, PLE)
          coletadas dos Dados Abertos da ALMG.
        </p>
      </header>

      {proposicoes.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-muted">
            Nenhuma proposição coletada ainda. Execute o coletor:
          </p>
          <code className="mt-2 block rounded-lg bg-surface-2 p-3 text-xs text-foreground">
            python scripts/coletar-almg-proposicoes.py
          </code>
        </div>
      ) : (
        <TabelaAlmg dados={proposicoes} />
      )}
    </main>
  );
}
