import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * Stub dos continentes ainda em coleta.
 *
 * Papel: os cards do hub apontam para seis continentes; só a América Latina
 * tem dado. Esta rota existe para não gerar 404 e para dizer a verdade ao
 * leitor: o levantamento ainda não começou, e eis o que será comparado.
 *
 * Por que página estática por continente em vez de "em breve" no hub:
 * link quebrado é pior que link que explica. O leitor sob estresse não pode
 * clicar e cair em erro.
 */

type ContinenteSlug =
  | "oceania"
  | "europa"
  | "america-do-norte";

const CONTINENTES: Record<
  ContinenteSlug,
  { nome: string; paises: number; nota: string }
> = {
  oceania: {
    nome: "Oceania",
    paises: 14,
    nota: "Foco inicial: direitos dos povos do Pacífico, terras tradicionais e clima.",
  },
  europa: {
    nome: "Europa",
    paises: 44,
    nota: "Foco inicial: contraste norte-sul em direitos sociais e ambientais.",
  },
  "america-do-norte": {
    nome: "América do Norte",
    paises: 3,
    nota: "Foco inicial: contraste com o sul global em direitos indígenas e ambientais.",
  },
};

const DIREITOS_PREVISTOS = [
  "Direitos humanos",
  "Direito ambiental",
  "Direito das mulheres",
  "Direito da natureza",
  "Direitos políticos",
  "Direitos das crianças",
  "Direitos indígenas",
  "Direitos quilombolas e de comunidades tradicionais",
  "Direitos campesinos",
  "Direitos coletivos",
  "Direitos dos atingidos por empreendimentos",
  "Direitos dos atingidos por barragens",
];

export function generateStaticParams() {
  return Object.keys(CONTINENTES).map((continente) => ({ continente }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ continente: string }>;
}): Promise<Metadata> {
  const { continente } = await params;
  const dado = CONTINENTES[continente as ContinenteSlug];
  if (!dado) return { title: "Continente não encontrado | Direitos Globais" };
  return {
    title: `${dado.nome} | Direitos Globais`,
    description: `Comparação de direitos em ${dado.nome}: levantamento em coleta.`,
  };
}

export default async function PaginaContinente({
  params,
}: {
  params: Promise<{ continente: string }>;
}) {
  const { continente } = await params;
  const dado = CONTINENTES[continente as ContinenteSlug];
  if (!dado) notFound();

  return (
    <main
      id="conteudo-principal"
      className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6"
    >
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-text-soft"
      >
        <Link href="/" className="hover:text-primary hover:underline">
          Início
        </Link>
        <span>/</span>
        <Link
          href="/direitos-globais"
          className="hover:text-primary hover:underline"
        >
          Direitos Globais
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">{dado.nome}</span>
      </nav>

      <header className="mb-8">
        <p className="mb-2 inline-block rounded-full border border-border bg-surface-2 px-3 py-0.5 text-xs font-semibold text-text-soft">
          Em coleta
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          {dado.nome}
        </h1>
        <p className="mt-3 text-base text-text-soft">
          {dado.paises} países previstos. {dado.nota}
        </p>
      </header>

      <section className="mb-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-3 text-lg font-semibold text-text">
          O que será comparado
        </h2>
        <p className="mb-4 text-sm text-text-soft">
          Constituição, lei federal, súmula de tribunal superior e tratado
          ratificado de cada país. Sem fonte e sem data, o registro não entra.
        </p>
        <ul className="grid gap-2 text-sm text-text-soft sm:grid-cols-2">
          {DIREITOS_PREVISTOS.map((direito) => (
            <li key={direito} className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary"
              />
              {direito}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-3 text-lg font-semibold text-text">
          Enquanto isso
        </h2>
        <p className="mb-4 text-sm text-text-soft">
          A América Latina já tem o primeiro levantamento publicado.
        </p>
        <Link
          href="/direitos-globais/america-latina"
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          Ver América Latina
        </Link>
      </section>

      <FooterGlobal />
    </main>
  );
}