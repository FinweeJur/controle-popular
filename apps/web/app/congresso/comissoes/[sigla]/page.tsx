import type { Metadata } from "next";
import Link from "@/lib/congresso/link";
import { notFound } from "next/navigation";
import PerfilAgregadoView from "@/app/congresso/components/PerfilAgregado";
import RotuloBadge from "@/app/congresso/components/RotuloBadge";
import { obterOrgao } from "@/lib/congresso/orgaos";

type Params = Promise<{ sigla: string }>;

export const revalidate = 900;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sigla } = await params;
  const dados = await obterOrgao(decodeURIComponent(sigla));
  return {
    title: `${dados?.orgao.sigla ?? sigla} — Comissões — Controle Popular · Congresso`,
    description: dados?.orgao.nome ?? undefined,
  };
}

export default async function Comissao({ params }: { params: Params }) {
  const { sigla } = await params;
  const dados = await obterOrgao(decodeURIComponent(sigla));
  if (!dados) notFound();

  const { orgao, perfil, proposicoes } = dados;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <nav className="text-sm">
        <Link href="/comissoes" className="underline">
          ← todas as comissões
        </Link>
      </nav>

      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide opacity-60">{orgao.tipo}</p>
        <h1 className="font-display text-3xl font-bold">{orgao.sigla}</h1>
        <p className="text-lg opacity-85">{orgao.nome}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          {orgao.url_site ? (
            <a href={orgao.url_site} className="underline" target="_blank" rel="noreferrer">
              site oficial
            </a>
          ) : null}
          {orgao.email ? <span className="opacity-75">{orgao.email}</span> : null}
        </div>
      </header>

      <PerfilAgregadoView
        perfil={perfil}
        sujeito={`na ${orgao.sigla}`}
        nota={
          "Este perfil descreve as proposições que estão nesta comissão AGORA — inclusive " +
          "as que ela não pediu e talvez venha a rejeitar. É um retrato da pauta que caiu " +
          "no colo do colegiado, não um julgamento de quem o compõe."
        }
      />

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">
          Em tramitação aqui{" "}
          <span className="font-tabular text-base font-normal opacity-70">
            ({proposicoes.length})
          </span>
        </h2>

        {proposicoes.length === 0 ? (
          <p className="opacity-75">
            Nenhuma proposição registrada nesta comissão no momento.
          </p>
        ) : (
          <ul className="space-y-3">
            {proposicoes.map((p) => (
              <li key={p.id} className="rounded-lg border border-[var(--cp-border)] p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/proposicoes/${p.id}`} className="font-semibold underline">
                    {p.identificacao}
                  </Link>
                  <RotuloBadge rotulo={p.rotulo} score={p.score} tamanho="sm" />
                </div>
                <p className="mt-2 text-sm opacity-85">{p.ementa}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-[var(--cp-border)] p-5 text-sm">
        <h2 className="font-semibold">Quer se manifestar sobre uma destas?</h2>
        <p className="mt-2 opacity-85">
          Abra a proposição e use “Gerar ofício”. O documento é endereçado a quem decide a
          matéria agora — relator, presidência e autoria.{" "}
          {orgao.email ? null : (
            <>
              A API da Câmara não publica o e-mail institucional das comissões, então o
              ofício é endereçado aos parlamentares, cujos e-mails são públicos.
            </>
          )}
        </p>
      </section>
    </div>
  );
}
