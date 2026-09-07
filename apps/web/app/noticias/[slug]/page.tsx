import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ExternalLink,
  ArrowLeft,
  Database,
  Building,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import {
  listarNoticiasPortal,
  obterNoticiaPorSlug,
  metadadosAcademicosNoticia,
  gerarJsonLdNoticia,
} from "@/lib/noticias/portal";
import CitarArtigoClient from "./CitarArtigoClient";
import FooterGlobal from "@/app/components/FooterGlobal";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const noticias = listarNoticiasPortal();
  return noticias.map((n) => ({
    slug: n.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const noticia = obterNoticiaPorSlug(slug);

  if (!noticia) {
    return {
      title: "Publicação não encontrada | Controle Popular",
    };
  }

  const urlArtigo = `https://controlepopular.com.br/noticias/${noticia.slug}`;

  return {
    title: `${noticia.titulo} | Controle Popular`,
    description: noticia.resumo,
    keywords: noticia.palavrasChave,
    alternates: {
      canonical: urlArtigo,
    },
    openGraph: {
      title: noticia.titulo,
      description: noticia.resumo,
      url: urlArtigo,
      siteName: "Controle Popular — Observatório Nacional Socioambiental",
      type: "article",
      publishedTime: noticia.publicadoEm,
      modifiedTime: noticia.atualizadoEm,
      authors: [noticia.autor],
      section: noticia.subfrente,
      tags: noticia.palavrasChave,
    },
    twitter: {
      card: "summary_large_image",
      title: noticia.titulo,
      description: noticia.resumo,
    },
    other: metadadosAcademicosNoticia(noticia),
  };
}

/**
 * Renderiza texto com hiperlinks em sintaxe markdown `[rotulo](url)`.
 * Garante que links internos naveguem pelo Next.js e links externos abram em nova aba com rel de segurança.
 */
function renderTextoComLinks(texto: string) {
  const partes = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(texto)) !== null) {
    if (match.index > lastIndex) {
      partes.push(texto.substring(lastIndex, match.index));
    }
    const rotulo = match[1];
    const url = match[2];
    const isExterno = url.startsWith("http");

    partes.push(
      <a
        key={`${match.index}-${url}`}
        href={url}
        target={isExterno ? "_blank" : undefined}
        rel={isExterno ? "noopener noreferrer" : undefined}
        className="font-medium text-primary hover:underline underline-offset-2"
      >
        {rotulo}
        {isExterno && <span className="text-[10px] ml-0.5">↗</span>}
      </a>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < texto.length) {
    partes.push(texto.substring(lastIndex));
  }

  return partes.length > 0 ? partes : texto;
}

export default async function PaginaNoticiaIndividual({ params }: Props) {
  const { slug } = await params;
  const noticia = obterNoticiaPorSlug(slug);

  if (!noticia) {
    notFound();
  }

  const jsonLd = gerarJsonLdNoticia(noticia);
  const outrasNoticias = listarNoticiasPortal()
    .filter((n) => n.slug !== noticia.slug)
    .slice(0, 3);

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14"
    >
      {/* SCHEMA.ORG JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* BREADCRUMB */}
      <nav aria-label="Caminho de navegação" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-foreground transition-colors">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/noticias" className="hover:text-foreground transition-colors">
          Notícias
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-foreground truncate max-w-xs sm:max-w-sm">
          {noticia.titulo}
        </span>
      </nav>

      {/* CABEÇALHO EDITORIAL */}
      <header className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-primary/10 px-3 py-0.5 font-bold text-primary">
            {noticia.categoria}
          </span>
          <span className="rounded-full bg-surface-2 px-3 py-0.5 text-muted border border-border">
            {noticia.subfrente}
          </span>
          <span className="ml-auto flex items-center gap-1 text-muted">
            <Clock size={12} />
            <span>{noticia.tempoLeituraMin} min de leitura</span>
          </span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
          {noticia.titulo}
        </h1>

        <p className="text-base sm:text-lg text-muted leading-relaxed font-serif">
          {noticia.subtitulo}
        </p>

        {/* METADADOS DE AUTORIA E DATA */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border/60 py-3 text-xs text-muted">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-foreground">{noticia.autor}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              <span>
                {new Date(noticia.publicadoEm).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/noticias"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft size={12} />
              <span>Voltar ao índice</span>
            </Link>
          </div>
        </div>

        {/* DECLARAÇÃO DE TRANSPARÊNCIA DE IA */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted leading-relaxed flex items-start gap-2.5">
          <Sparkles size={16} className="text-primary mt-0.5 shrink-0" />
          <div>
            <strong className="font-semibold text-foreground">Metodologia e Transparência de IA: </strong>
            <span>{noticia.declaracaoIa}</span>
          </div>
        </div>
      </header>

      {/* PAINEL DE DADOS E MÉTRICAS CHAVE */}
      <section aria-label="Indicadores principais" className="mb-8 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
          <Database size={13} className="text-primary" />
          <span>Indicadores & Dados Chave Documentados</span>
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {noticia.metricas.map((m) => (
            <div key={m.rotulo} className="rounded-xl bg-surface-2 p-3.5 border border-border/50">
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{m.rotulo}</p>
              <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-foreground">{m.valor}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CORPO DO ARTIGO COM HIPERLINKS */}
      <article className="prose prose-neutral dark:prose-invert max-w-none space-y-5 text-base sm:text-lg text-foreground/90 leading-relaxed font-serif">
        {noticia.paragrafos.map((p, idx) => (
          <p key={idx}>{renderTextoComLinks(p)}</p>
        ))}
      </article>

      {/* RECOMENDAÇÃO PARA VERIFICAR ESTE DADO */}
      {noticia.recomendacaoVerificar && (
        <section aria-label="Como verificar este dado" className="my-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-display text-sm font-bold text-foreground">
              Recomendação para Verificar este Dado de Forma Independente
            </h3>
          </div>
          <div className="text-xs sm:text-sm text-muted leading-relaxed">
            {renderTextoComLinks(noticia.recomendacaoVerificar)}
          </div>
        </section>
      )}

      {/* PALAVRAS-CHAVE / TAGS */}
      <div className="my-8 flex flex-wrap gap-1.5 pt-4 border-t border-border/60">
        <span className="text-xs font-semibold text-muted mr-1 self-center">Palavras-chave:</span>
        {noticia.palavrasChave.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-border/60 bg-surface-2 px-2.5 py-0.5 text-xs text-muted"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* FONTES OFICIAIS */}
      <section aria-label="Fontes de dados oficiais" className="my-8 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <h3 className="font-display text-base font-bold text-foreground mb-2 flex items-center gap-2">
          <Building size={16} className="text-primary" />
          <span>Bases de Dados Governamentais Consultadas</span>
        </h3>
        <p className="text-xs text-muted mb-4">
          O Controle Popular preza pela transparência e auditabilidade. Você pode auditar os dados brutos nos sistemas oficiais:
        </p>
        <ul className="space-y-2">
          {noticia.fontesOficiais.map((f) => (
            <li key={f.nome}>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary hover:underline"
              >
                <span>{f.nome}</span>
                <ExternalLink size={13} />
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* BLOCO DE CITAÇÃO ACADÊMICA (ABNT & BIBTEX) */}
      <div className="my-8">
        <CitarArtigoClient
          citacaoAbnt={noticia.citacaoAbnt}
          citacaoBibtex={noticia.citacaoBibtex}
        />
      </div>

      {/* OUTRAS REPORTAGENS RELACIONADAS */}
      <section aria-label="Outros relatórios do observatório" className="my-12 pt-8 border-t border-border">
        <h3 className="font-display text-lg font-bold text-foreground mb-4">
          Outros Relatórios & Publicações do Observatório
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {outrasNoticias.map((outra) => (
            <Link
              key={outra.slug}
              href={`/noticias/${outra.slug}`}
              className="group rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/50"
            >
              <span className="text-[10px] font-semibold text-primary block mb-1">
                {outra.categoria}
              </span>
              <h4 className="font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {outra.titulo}
              </h4>
              <p className="mt-1 text-xs text-muted line-clamp-2">
                {outra.resumo}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* RODAPÉ GLOBAL */}
      <div className="mt-14">
        <FooterGlobal />
      </div>
    </main>
  );
}
