import Link from "next/link";
import type { Metadata } from "next";
import { LUGARES_CATALOGO } from "@/lib/lugares";

export const metadata: Metadata = {
  title: "Nossos Territórios — ONSA · Meio Ambiente & Terras",
  description:
    "Territórios tradicionais, vales, cerrados, quilombos e a função social da terra integrados à fiscalização ambiental do Controle Popular.",
};

export default function NossosTerritoriosIndexPage() {
  const territorios = LUGARES_CATALOGO.filter((l) => l.tipo === "vale" || l.tipo === "cerrado");

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
          <li className="font-semibold text-text">Nossos Territórios</li>
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
            Territórios & Função Social da Terra
          </span>
        </div>

        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-text">
          Nossos Territórios: A Terra e a Posse Coletiva
        </h1>
        <p className="mt-2 text-base text-text-soft max-w-3xl leading-relaxed">
          O Observatório Nacional Socioambiental reúne a malha fundiária, o Cadastro Ambiental Rural (CAR), os quilombos e a integridade ecológica do solo.
        </p>
      </header>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {territorios.map((ter) => (
          <article
            key={ter.id}
            className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm hover:border-primary transition-colors"
          >
            <div>
              <span className="text-2xl">🌱</span>
              <h2 className="mt-2 font-display text-xl font-bold text-text">{ter.nome}</h2>
              <p className="mt-2 text-xs text-text-soft leading-relaxed">{ter.resumoVozCidada}</p>
              <div className="mt-3 text-[0.72rem] text-text-soft">
                Biomas: {ter.biomas.join(" / ")}
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-border">
              <Link
                href={`/ambiental/nossos-territorios/${ter.id}`}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Abrir território e situação do nosso povo →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
