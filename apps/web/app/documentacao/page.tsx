import type { Metadata } from "next";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = metadataEditavel("/documentacao", {
  title: "Documentação Técnica — Controle Popular",
  description:
    "Como o portal funciona: arquitetura, fontes, coleta, API pública e princípios editoriais. Documentação aberta para jornalistas, pesquisadores e desenvolvedores.",
});

// Capítulos da documentação — cada item aponta para uma subpágina
const CAPITULOS = [
  {
    numero: "01",
    slug: "arquitetura",
    titulo: "Arquitetura do portal",
    resumo:
      "Next.js 16, duplo deploy (Cloudflare Workers + Guará Cloud), tetos de bundle, banco Neon e D1.",
  },
  {
    numero: "02",
    slug: "fontes-e-coletas",
    titulo: "Fontes e coleta de dados",
    resumo:
      "Quais APIs, portais e diários são raspados; frequência; checkpoints; política de User-Agent honesto.",
  },
  {
    numero: "03",
    slug: "api-publica",
    titulo: "API pública",
    resumo:
      "Endpoints JSON sem autenticação: municípios, editais, paraopeba. Formato, limites e exemplos.",
  },
  {
    numero: "04",
    slug: "editorial",
    titulo: "Princípios editoriais",
    resumo:
      "Regras de publicação: dupla verificação metodológica, dado pessoal, lacuna como informação, resumo gerado por IA.",
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
            Início
          </Link>{" "}
          · <span className="text-text">Documentação</span>
        </nav>

        {/* Cabecalho */}
        <header className="space-y-4">
          <p className="font-mono text-xs text-text-soft">
            documentacao / visao geral
          </p>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Documentação Técnica do Controle Popular
          </h1>
          <p className="max-w-2xl text-lg text-text-soft">
            Tudo o que qualquer desenvolvedor, pesquisador ou jornalista precisa
            saber para entender como os dados são coletados, validados e
            publicados no portal.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-surface-2 px-3 py-1 text-text-soft">
              Next.js 16
            </span>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-text-soft">
              Cloudflare Workers + Guará Cloud
            </span>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-text-soft">
              Neon Postgres + D1
            </span>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-text-soft">
              AGPL-3.0 / Aberto
            </span>
          </div>
        </header>

        {/* Indice de capitulos */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Capítulos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {CAPITULOS.map((cap) => (
              <Link
                key={cap.slug}
                href={`/documentacao/${cap.slug}`}
                className="group rounded-xl border border-border bg-surface-2/30 p-5 transition hover:border-primary/50 hover:bg-surface-2/70"
              >
                <div className="flex items-center justify-between text-xs font-mono text-text-soft">
                  <span>Capítulo {cap.numero}</span>
                  <span className="text-primary group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </div>
                <h3 className="mt-2 font-display text-base font-semibold group-hover:text-primary">
                  {cap.titulo}
                </h3>
                <p className="mt-1.5 text-xs text-text-soft leading-relaxed">
                  {cap.resumo}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Como contribuir / reportar */}
        <section className="space-y-3 rounded-xl border border-border bg-surface-2/20 p-6">
          <h2 className="font-display text-lg font-semibold">
            Como reportar erros ou sugerir melhorias
          </h2>
          <p className="text-sm text-text-soft">
            Encontrou um dado incorreto, um cálculo errado ou quer sugerir uma nova
            fonte pública? Abra uma <em>issue</em> no GitHub ou entre em contato pelo
            e-mail de imprensa em{" "}
            <Link href="/imprensa" className="underline hover:text-primary">
              /imprensa
            </Link>
            .
          </p>
          <p className="text-sm text-text-soft">
            Licença do conteúdo: dados são públicos (fontes oficiais). Código:
            MIT. Textos editoriais: CC-BY 4.0 com atribuição ao portal.
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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-12">
        <FooterGlobal />
      </div>
    </>
  );
}
