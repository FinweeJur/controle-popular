import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/lib/ambiental/link";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import {
  listarItensCopamPorMunicipio,
  listarMunicipiosComItensCopam,
} from "@/lib/db/queries/copam";

type Params = Promise<{ idIbge: string }>;

/**
 * Uma página por município com item de pauta do COPAM — algumas centenas,
 * mesma escala das outras rotas com `generateStaticParams` deste app (ver
 * `parlamentares/[id]`). Nome do município sai do PRIMEIRO item (todos os
 * itens do mesmo `idIbge` carregam o mesmo nome, resolvido contra
 * `ref_municipios_mg` — ver `etl.apis.copam_reunioes._municipio_estruturado`
 * e `_municipios_do_texto`).
 */
export async function generateStaticParams() {
  return (await listarMunicipiosComItensCopam()).map((m) => ({ idIbge: m.idIbge }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { idIbge } = await params;
  const itens = await listarItensCopamPorMunicipio(idIbge);
  const nome = itens[0]?.municipiosNomes[itens[0].municipiosIds.indexOf(idIbge)] ?? idIbge;
  return {
    title: `COPAM em ${nome} — Controle Popular · Ambiental`,
    description: `Itens de pauta do Conselho Estadual de Política Ambiental que tratam de ${nome}/MG, com processo, empreendimento e decisão quando já houver.`,
  };
}

export default async function MunicipioCopamPage({ params }: { params: Params }) {
  const { idIbge } = await params;
  const itens = await listarItensCopamPorMunicipio(idIbge);
  if (itens.length === 0) notFound();
  const nome = itens[0].municipiosNomes[itens[0].municipiosIds.indexOf(idIbge)] ?? idIbge;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <nav className="text-sm">
        <Link href="/copam" className="underline opacity-80 hover:opacity-100">
          ← reuniões do COPAM
        </Link>
      </nav>

      <header className="mt-4 space-y-2">
        <p className="text-[.82em] font-semibold uppercase tracking-wide" style={{ color: "var(--cp-tertiary)" }}>
          COPAM em Minas Gerais
        </p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{nome}/MG</h1>
        <p className="max-w-xl text-sm opacity-75">
          {formatNumberBR(itens.length)} {itens.length === 1 ? "item de pauta" : "itens de pauta"}{" "}
          que citam {nome}, das reuniões coletadas — mais recente primeiro.
        </p>
      </header>

      <ul className="mt-8 space-y-4">
        {itens.map((item) => (
          <li
            key={`${item.reuniao.idFonte}-${item.numeroItem}`}
            className="rounded-lg border border-[var(--cp-border)] p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link
                href={`/copam/reuniao/${item.reuniao.idFonte}`}
                className="text-xs font-semibold uppercase tracking-wide opacity-70 underline"
              >
                {formatDateBR(item.reuniao.data)} · {item.reuniao.camaraTecnica ?? item.reuniao.titulo}
              </Link>
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

            {item.municipiosNomes.length > 1 ? (
              <p className="mt-1 text-xs opacity-60">
                Item também trata de: {item.municipiosNomes.filter((n) => n !== nome).join(", ")}
              </p>
            ) : null}

            {item.processo ? (
              <p className="mt-2 font-mono text-xs opacity-70">{item.processo}</p>
            ) : null}

            <details className="mt-2">
              <summary className="cursor-pointer text-xs underline opacity-70">
                Ver texto da pauta
              </summary>
              <p className="mt-2 text-sm opacity-85">{item.textoPauta}</p>
            </details>
          </li>
        ))}
      </ul>

      <p className="mt-10 max-w-xl text-xs opacity-60">
        O município de cada item vem de um campo estruturado da própria fonte ou, quando ele
        vem vazio, do PDF da pauta — sempre casado contra os 853 nomes oficiais de município de
        Minas Gerais. Este portal não afirma irregularidade: é a reprodução da pauta como o
        Copam publica.
      </p>
    </div>
  );
}
