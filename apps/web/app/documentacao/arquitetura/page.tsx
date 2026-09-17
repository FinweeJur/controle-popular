import type { Metadata } from "next";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = metadataEditavel("/documentacao/arquitetura", {
  title: "Arquitetura — Documentacao Controle Popular",
  description:
    "Next.js 16, duplo deploy Cloudflare Workers + Guara Cloud, banco Neon, tetos de bundle e regras de payload.",
});

export default function ArquiteturaPage() {
  return (
    <>
      <main
        id="conteudo-principal"
        tabIndex={-1}
        className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      >
        <nav className="text-sm text-text-soft">
          <Link href="/" className="hover:text-primary">Inicio</Link>{" "}·{" "}
          <Link href="/documentacao" className="hover:text-primary">Documentacao</Link>{" "}·{" "}
          <span className="text-text">Arquitetura</span>
        </nav>

        <header className="space-y-3">
          <p className="font-mono text-xs text-text-soft">01 / arquitetura</p>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Arquitetura do portal
          </h1>
          <p className="text-text-soft">
            Monorepo Next.js 16 com duplo deploy: Cloudflare Workers para
            conteudo estatico e Guara Cloud (Docker standalone) para rotas
            dinamicas. Teto de 25 MiB por asset no Workers e 3 MiB gzip de
            bundle ditam todas as decisoes de payload.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Stack</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-text-soft">
            <li><strong>Next.js 16</strong> (App Router, TypeScript, Tailwind CSS)</li>
            <li><strong>Monorepo:</strong> <code className="text-xs">apps/web/</code> — rotas, componentes, lib, dados</li>
            <li><strong>Banco (leitura/escrita):</strong> Neon Postgres via Drizzle ORM</li>
            <li><strong>Banco (escrita ao vivo em Workers):</strong> Cloudflare D1</li>
            <li><strong>Deploy A:</strong> Cloudflare Workers via OpenNext — estatico + ISR</li>
            <li><strong>Deploy B:</strong> Guara Cloud (Docker, regiao br-gru) via <code className="text-xs">output: standalone</code></li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Tetos que mandam na arquitetura</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2/60 text-xs font-semibold uppercase text-text-soft">
                <tr>
                  <th className="px-4 py-3">Teto</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Consequencia pratica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Asset por rota (Workers)", "25 MiB", "Colecao grande usa indice fatiado, nao props"],
                  ["Bundle gzip por rota", "3 MiB", "Sem bibliotecas de grafico — SVG inline ou CSS"],
                  ["Arquivos no Workers", "20.000", "Dado versionado em data/, compactado antes de commitar"],
                  ["Neon storage (Free)", "0,5 GB", "Novas coletas vao para D1 ate renovacao"],
                ].map(([t, v, c]) => (
                  <tr key={t} className="odd:bg-surface-2/20">
                    <td className="px-4 py-3 font-medium">{t}</td>
                    <td className="px-4 py-3 font-mono text-xs">{v}</td>
                    <td className="px-4 py-3 text-text-soft">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Duplo deploy</h2>
          <p className="text-sm text-text-soft">
            O mesmo codigo gera dois artefatos independentes: o Workers (OpenNext, <code className="text-xs">output: export</code>) e o container Docker (Guara Cloud, <code className="text-xs">output: standalone</code>). O DNS aponta para o Workers por padrao. O container e a saida de contingencia e o ambiente de homologacao de rotas dinamicas.
          </p>
          <p className="text-sm text-text-soft">
            Detalhes operacionais: <Link href="/documentacao/arquitetura" className="underline hover:text-primary">esta pagina</Link>. Deploy passo a passo: <Link href="/documentacao/fontes-e-coletas" className="underline hover:text-primary">Fontes e coleta</Link>.
          </p>
        </section>

        <nav className="flex justify-between text-sm">
          <Link href="/documentacao" className="text-text-soft hover:text-primary">
            ← Documentacao
          </Link>
          <Link href="/documentacao/fontes-e-coletas" className="text-text-soft hover:text-primary">
            Fontes e coletas →
          </Link>
        </nav>
      </main>
      <FooterGlobal />
    </>
  );
}
