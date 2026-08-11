import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/lib/ambiental/link";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { idsFonteReunioesCopam, obterReuniaoCopamPorIdFonte } from "@/lib/db/queries/copam";

type Params = Promise<{ idFonte: string }>;

/**
 * 454 reuniões coletadas — mesma ordem de grandeza de bancadas/parlamentares
 * do Congresso, que já pré-renderam por inteiro (ver `parlamentares/[id]`).
 * Pré-render total, sem `dynamicParams`.
 */
export async function generateStaticParams() {
  return (await idsFonteReunioesCopam()).map((idFonte) => ({ idFonte: String(idFonte) }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { idFonte } = await params;
  const dados = await obterReuniaoCopamPorIdFonte(Number(idFonte));
  if (!dados) return { title: "Reunião do COPAM — Controle Popular · Ambiental" };
  return {
    title: `${dados.reuniao.titulo} — COPAM · Controle Popular`,
    description: `Pauta da reunião de ${formatDateBR(dados.reuniao.data)} do Copam, item a item, com o município de cada processo.`,
  };
}

const SITUACAO_ROTULO: Record<string, string> = {
  concluida: "Decisão publicada",
  aguardando_decisao: "Aguardando decisão",
  agendada: "Agendada",
};

export default async function ReuniaoCopamPage({ params }: { params: Params }) {
  const { idFonte } = await params;
  const dados = await obterReuniaoCopamPorIdFonte(Number(idFonte));
  if (!dados) notFound();
  const { reuniao, itens } = dados;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <nav className="text-sm">
        <Link href="/copam" className="underline opacity-80 hover:opacity-100">
          ← reuniões do COPAM
        </Link>
      </nav>

      <header className="mt-4 space-y-2">
        <p className="text-[.82em] font-semibold uppercase tracking-wide" style={{ color: "var(--cp-tertiary)" }}>
          {formatDateBR(reuniao.data)}
          {reuniao.camaraTecnica ? ` · ${reuniao.camaraTecnica}` : ""}
        </p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{reuniao.titulo}</h1>
        {reuniao.regional ? <p className="text-sm opacity-70">{reuniao.regional}</p> : null}

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span
            className="rounded-full border px-2.5 py-1 text-xs font-medium"
            style={{ borderColor: "var(--cp-tertiary)" }}
          >
            {SITUACAO_ROTULO[reuniao.situacao] ?? reuniao.situacao}
          </span>
          {reuniao.linkPautaPdf ? (
            <a
              href={reuniao.linkPautaPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium underline underline-offset-2"
            >
              Pauta em PDF ↗
            </a>
          ) : null}
          {reuniao.linkDecisaoPdf ? (
            <a
              href={reuniao.linkDecisaoPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium underline underline-offset-2"
            >
              Decisão em PDF ↗
            </a>
          ) : null}
          {reuniao.linkAtaPdf ? (
            <a
              href={reuniao.linkAtaPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium underline underline-offset-2"
            >
              Ata em PDF ↗
            </a>
          ) : null}
          <a
            href={reuniao.linkDetalhe}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium underline underline-offset-2 opacity-70"
          >
            Página oficial da reunião ↗
          </a>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">
          {itens.length === 0
            ? "Sem itens de pauta substantivos coletados"
            : `${formatNumberBR(itens.length)} ${itens.length === 1 ? "item de pauta" : "itens de pauta"}`}
        </h2>

        {itens.length === 0 ? (
          <p className="mt-2 max-w-xl text-sm opacity-75">
            Ou a reunião não publicou PDF de pauta com camada de texto, ou todos os itens são
            procedimento de reunião (abertura, comunicados, exame de ata) — confira a{" "}
            <a href={reuniao.linkDetalhe} target="_blank" rel="noopener noreferrer" className="underline">
              página oficial
            </a>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {itens.map((item) => (
              <li
                key={item.numeroItem}
                className="rounded-lg border border-[var(--cp-border)] p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-tabular text-xs font-semibold opacity-60">
                    Item {item.numeroItem}
                  </p>
                  {item.decisao ? (
                    <span
                      className="rounded-full border px-2 py-0.5 text-xs font-medium"
                      style={{ borderColor: "var(--cp-accent)" }}
                    >
                      {item.decisao}
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 font-semibold">
                  {item.empreendimento ?? "(empreendimento não identificado)"}
                </p>

                {item.municipiosNomes.length > 0 ? (
                  <p className="mt-1 flex flex-wrap gap-1.5 text-sm">
                    {item.municipiosNomes.map((nome, i) => (
                      <Link
                        key={item.municipiosIds[i]}
                        href={`/copam/municipio/${item.municipiosIds[i]}`}
                        className="rounded-full bg-[var(--cp-surface-2)] px-2 py-0.5 underline decoration-dotted underline-offset-2"
                      >
                        {nome}
                      </Link>
                    ))}
                  </p>
                ) : (
                  <p className="mt-1 text-sm opacity-60">Sem município identificado.</p>
                )}

                {item.processo ? (
                  <p className="mt-2 font-mono text-xs opacity-70">{item.processo}</p>
                ) : null}

                <details className="mt-2">
                  <summary className="cursor-pointer text-xs underline opacity-70">
                    Ver texto da pauta
                  </summary>
                  <p className="mt-2 text-sm opacity-85">{item.textoPauta}</p>
                </details>

                {item.linkDocumento ? (
                  <a
                    href={item.linkDocumento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-medium underline underline-offset-2"
                  >
                    Baixar anexo ↗
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
