import Link from "next/link";
import type { Metadata } from "next";
import { LUGARES_CATALOGO } from "@/lib/lugares";

export const metadata: Metadata = {
  title: "Nossas Serras — ONSA · Meio Ambiente & Terras",
  description:
    "Acompanhamento cívico das cordilheiras, unidades de conservação, relevo e conflitos de mineração e preservação em Minas Gerais.",
};

export default function NossasSerrasIndexPage() {
  const serras = LUGARES_CATALOGO.filter((l) => l.tipo === "serra");

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Navegação estrutural" className="text-xs text-text-soft">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:underline">Início</Link>
          </li>
          <li>›</li>
          <li>
            <Link href="/ambiental" className="hover:underline">ONSA</Link>
          </li>
          <li>›</li>
          <li>
            <Link href="/ambiental/nossos" className="hover:underline">Nossos</Link>
          </li>
          <li>›</li>
          <li className="font-semibold text-text">Nossas Serras</li>
        </ol>
      </nav>

      <header className="mt-5 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            #natureza
          </span>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            #ecossistema
          </span>
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-text-soft border border-border">
            Cordilheiras & Relevo
          </span>
        </div>

        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-text">
          Nossas Serras: A Guardiã das Águas e da Paisagem
        </h1>
        <p className="mt-2 text-base text-text-soft max-w-3xl leading-relaxed">
          Cordilheiras, picos e campos rupestres que protegem nascentes vitais, abrigam parques estaduais e enfrentam a pressão de títulos minerários.
        </p>
      </header>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {serras.map((serra) => (
          <article
            key={serra.id}
            className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm hover:border-primary transition-colors"
          >
            <div>
              <span className="text-2xl">⛰️</span>
              <h2 className="mt-2 font-display text-xl font-bold text-text">{serra.nome}</h2>
              <p className="mt-2 text-xs text-text-soft leading-relaxed">{serra.resumoVozCidada}</p>
              <div className="mt-3 text-[0.72rem] text-text-soft">
                Biomas: {serra.biomas.join(" / ")}
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-border">
              <Link
                href={`/ambiental/nossas-serras/${serra.id}`}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Abrir painel da serra e impacto na nossa gente →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
