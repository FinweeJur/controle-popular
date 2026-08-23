import type { Metadata } from "next";
import Link from "next/link";
import { EMPRESAS } from "@/lib/empresas/dados";

export const metadata: Metadata = {
  title: "Observatório de Empresas — Controle Popular",
  description:
    "Acompanhamento de empresas com impacto territorial e social em Minas Gerais: Sigma Lithium, Vale e outras mineradoras sob vigilência pública.",
};

export default function EmpresasIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <nav className="mb-6 text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <span className="text-text">Empresas monitoradas</span>
      </nav>

      <header className="mb-10 space-y-4">
        <h1 className="font-display text-3xl font-bold text-text sm:text-4xl">
          Observatório de Empresas
        </h1>
        <p className="text-text-soft">
          Empresas com impacto territorial, ambiental e social que estão sendo
          acompanhadas pelo Controle Popular. Cada página reúne processos
          minerários, notícias, licenciamentos e contratos públicos quando
          disponíveis.
        </p>
      </header>

      <ul className="space-y-4">
        {EMPRESAS.map((empresa) => (
          <li key={empresa.slug}>
            <Link
              href={`/empresas/${empresa.slug}`}
              className="block rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:border-primary"
            >
              <h2 className="font-display text-xl font-semibold text-text">
                {empresa.nomeCurto}
              </h2>
              <p className="mt-2 text-sm text-text-soft">{empresa.descricao}</p>
              <p className="mt-3 text-xs text-text-soft">
                Municípios de interesse:{" "}
                <span className="text-text">{empresa.municipiosPrioridade.join(", ")}</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <footer className="mt-12 border-t border-border pt-6 text-sm text-text-soft">
        <p>
          Dados de processos minerários extraídos do SIGMINE/ANM. Notícias são
          curadas a partir de fontes públicas. A ausência de informação é
          declarada, nunca escondida.
        </p>
      </footer>
    </div>
  );
}
