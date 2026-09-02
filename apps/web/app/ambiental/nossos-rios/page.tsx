import Link from "next/link";
import type { Metadata } from "next";
import { LUGARES_CATALOGO } from "@/lib/lugares";

export const metadata: Metadata = {
  title: "Nossos Rios — ONSA · Meio Ambiente & Terras",
  description:
    "Acompanhamento cívico das bacias hidrográficas, monitoramento de qualidade da água, barragens e pescadores de Minas Gerais e do Brasil.",
};

export default function NossosRiosIndexPage() {
  const rios = LUGARES_CATALOGO.filter((l) => l.tipo === "rio");

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
          <li className="font-semibold text-text">Nossos Rios</li>
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
            Bacias Hidrográficas
          </span>
        </div>

        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-text">
          Nossos Rios: As Águas e a Vida Ribanceira
        </h1>
        <p className="mt-2 text-base text-text-soft max-w-3xl leading-relaxed">
          Os rios que desenham o território, alimentam as cidades e sustentam a pesca e a agricultura de vazante.
        </p>
      </header>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {rios.map((rio) => (
          <article
            key={rio.id}
            className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm hover:border-primary transition-colors"
          >
            <div>
              <span className="text-2xl">🌊</span>
              <h2 className="mt-2 font-display text-xl font-bold text-text">{rio.nome}</h2>
              <p className="mt-2 text-xs text-text-soft leading-relaxed">{rio.resumoVozCidada}</p>
              <div className="mt-3 text-[0.72rem] text-text-soft">
                Biomas: {rio.biomas.join(" / ")}
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-border">
              <Link
                href={`/ambiental/nossos-rios/${rio.id}`}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Abrir painel do rio e impactos humanos →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
