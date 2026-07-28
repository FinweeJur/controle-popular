import Link from "@/lib/betim/link";
import { MapPin } from "lucide-react";
import { PAGINAS_DADOS } from "@/lib/betim/dadosNav";

export const metadata = {
  title: "Betim em Dados — Controle Popular Betim",
  description:
    "Saúde, educação, economia, segurança e mais — Betim-MG em números, com fonte oficial em cada dado.",
};

export default function DadosPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Betim em Dados
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        A cidade por tema — cada página traz o dado real, a fonte oficial e
        um &quot;em breve&quot; honesto onde ainda não temos uma fonte conectada.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {PAGINAS_DADOS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="cp-card-hover flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <p.icon size={20} strokeWidth={2} aria-hidden="true" />
            </span>
            <div>
              <p className="font-display font-semibold text-text">{p.nome}</p>
              <p className="mt-1 text-sm text-text-soft">{p.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      <h2 className="mt-12 font-display text-lg font-semibold text-text">
        Regiões da cidade
      </h2>
      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link
          href="/citrolandia"
          className="cp-card-hover flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPin size={20} strokeWidth={2} aria-hidden="true" />
          </span>
          <div>
            <p className="font-display font-semibold text-text">Citrolândia</p>
            <p className="mt-1 text-sm text-text-soft">
              Bairros da regional, negócios locais, farmácias e postos
            </p>
          </div>
        </Link>
      </section>
    </main>
  );
}
