import type { Metadata } from "next";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = metadataEditavel("/documentacao", {
  title: "Documentacao Tecnica — Controle Popular",
  description:
    "Como o portal funciona: arquitetura, fontes, coleta, API publica e principios editoriais. Documentacao aberta para jornalistas, pesquisadores e desenvolvedores.",
});

// Capitulos da documentacao — cada item aponta para uma subpagina
const CAPITULOS = [
  {
    numero: "01",
    slug: "arquitetura",
    titulo: "Arquitetura do portal",
    resumo:
      "Next.js 16, duplo deploy (Cloudflare Workers + Guara Cloud), tetos de bundle, banco Neon e D1.",
  },
  {
    numero: "02",
    slug: "fontes-e-coletas",
    titulo: "Fontes e coleta de dados",
    resumo:
      "Quais APIs, portais e diarios sao raspados; frequencia; checkpoints; politica de User-Agent honesto.",
  },
  {
    numero: "03",
    slug: "api-publica",
    titulo: "API publica",
    resumo:
      "Endpoints JSON sem autenticacao: municipios, editais, paraopeba. Formato, limites e exemplos.",
  },
  {
    numero: "04",
    slug: "editorial",
    titulo: "Principios editoriais",
    resumo:
      "Regras de publicacao: dupla verificacao metodologica, dado pessoal, lacuna como informacao, resumo gerado por IA.",
  },
] as const;

export default function DocumentacaoPage() {
  return (
    <>
      <main
        id="conteudo-principal"
        tabIndex={-1}
        className="mx-auto max-w-4xl space-y-14 px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      >
        {/* Breadcrumb */}
        <nav className="text-sm text-text-soft">
          <Link href="/" className="hover:text-primary">
            Inicio
          </Link>{" "}
          · <span className="text-text">Documentacao</span>
        </nav>

        {/* Cabecalho */}
        <header className="space-y-4">
          <p className="font-display text-[1.1em] font-bold text-text">
            controlepopular<span className="text-primary">.br</span> ·
            documentacao
          </p>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Documentacao Tecnica
          </h1>
          <p className="max-w-2xl text-[1.05em] text-text-soft">
            Como o portal foi construido, como os dados sao coletados, quais
            APIs estao disponiveis e quais regras editoriais guiam o que
            publicamos. Tudo aberto — para jornalistas, pesquisadores e
            desenvolvedores.
          </p>
        </header>

        {/* Grade de capitulos */}
        <section aria-labelledby="capitulos-titulo" className="space-y-4">
          <h2
            id="capitulos-titulo"
            className="font-display text-xl font-semibold"
          >
            Capitulos
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {CAPITULOS.map((cap) => (
              <Link
                key={cap.slug}
                href={`/documentacao/${cap.slug}`}
                className="group rounded-xl border border-border bg-surface-2/60 p-5 transition hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <p className="mb-1 font-mono text-xs text-text-soft">
                  {cap.numero}
                </p>
                <h3 className="mb-2 font-display text-base font-semibold text-text group-hover:text-primary">
                  {cap.titulo}
                </h3>
                <p className="text-sm text-text-soft">{cap.resumo}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Contribuicao e fontes */}
        <section className="space-y-3 rounded-xl border border-border bg-surface-2/40 p-5">
          <h2 className="font-display text-base font-semibold">
            Repositorio e contribuicao
          </h2>
          <p className="text-sm text-text-soft">
            O codigo-fonte do portal e aberto.{" "}
            <a
              href="https://github.com/FinweeJur/controle-popular"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              github.com/FinweeJur/controle-popular
            </a>
            . Erros de dado ou de metodo podem ser reportados como{" "}
            <em>issues</em> no GitHub ou pelo e-mail de imprensa em{" "}
            <Link href="/imprensa" className="underline hover:text-primary">
              /imprensa
            </Link>
            .
          </p>
          <p className="text-sm text-text-soft">
            Licenca do conteudo: dados sao publicos (fontes oficiais). Codigo:
            MIT. Textos editoriais: CC-BY 4.0 com atribuicao ao portal.
          </p>
        </section>
        {/* Paginas relacionadas */}
        <nav aria-label="Páginas relacionadas" className="border-t border-border pt-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-soft">
            Páginas relacionadas
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { href: "/editais", titulo: "Radar de Editais", desc: "Painel de editais e chamamentos do Diário Oficial de MG." },
              { href: "/estudos-rurais", titulo: "Estudos Rurais", desc: "Hub de pesquisas socioambientais e territoriais." },
              { href: "/termos", titulo: "Termos & LGPD", desc: "Transparência passiva, direitos e proteção de dados." },
            ].map((p) => (
              <a
                key={p.href}
                href={p.href}
                className="group rounded-lg border border-border bg-surface-2/50 p-3 text-sm transition hover:border-primary hover:bg-surface-2"
              >
                <p className="font-medium text-text group-hover:text-primary">{p.titulo}</p>
                <p className="mt-0.5 text-xs text-text-soft">{p.desc}</p>
              </a>
            ))}
          </div>
        </nav>
      </main>
      <FooterGlobal />
    </>
  );
}
