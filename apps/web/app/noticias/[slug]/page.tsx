import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ExternalLink,
  ArrowLeft,
  Building,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  listarNoticiasPortal,
  obterNoticiaPorSlug,
  metadadosAcademicosNoticia,
  gerarJsonLdNoticia,
} from "@/lib/noticias/portal";
import CitarArtigoClient from "./CitarArtigoClient";
import LeitorAudioArtigoClient from "./LeitorAudioArtigoClient";
import OutrosRelatorios from "./OutrosRelatorios";
import TranscricaoAcordeao from "./TranscricaoAcordeao";
import SecaoMetricas from "./SecaoMetricas";
import GraficoBarrasArtigo from "./GraficoBarrasArtigo";
import SecaoTabelas from "./SecaoTabelas";
import TextoComLinks from "./TextoComLinks";
import ResumoEssencial from "./ResumoEssencial";
import OlhoArtigo from "./OlhoArtigo";
import FooterGlobal from "@/app/components/FooterGlobal";

interface Props {
  params: Promise<{ slug: string }>;
}

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function editadaDepois(n: { publicadoEm: string; atualizadoEm: string }): boolean {
  return new Date(n.atualizadoEm).getTime() > new Date(n.publicadoEm).getTime();
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

export default async function PaginaNoticiaIndividual({ params }: Props) {
  const { slug } = await params;
  const noticia = obterNoticiaPorSlug(slug);

  if (!noticia) {
    notFound();
  }

  const jsonLd = gerarJsonLdNoticia(noticia);
  const [lead = "", ...corpo] = noticia.paragrafos;
  const outrasNoticias = listarNoticiasPortal()
    .filter((n) => n.slug !== noticia.slug)
    .slice(0, 3);

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14"
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
          Blog
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

        <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.9rem] font-extrabold tracking-tight text-foreground leading-[1.08]">
          {noticia.titulo}
        </h1>

        <p className="text-lg sm:text-xl text-muted leading-relaxed font-serif">
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
                Publicado em {dataCurta(noticia.publicadoEm)}
                {editadaDepois(noticia) && (
                  <span> · editado em {dataCurta(noticia.atualizadoEm)}</span>
                )}
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

      {/* LEITOR DE ÁUDIO ACESSÍVEL */}
      <LeitorAudioArtigoClient
        titulo={noticia.titulo}
        resumo={noticia.resumo}
        paragrafos={noticia.paragrafos}
      />

      {/* ÁUDIO ORIGINAL ANEXADO (documento bruto, não a leitura TTS) */}
      {noticia.audio ? (
        <figure className="mb-8 rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <figcaption className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
            {noticia.audio.descricao ?? "Áudio original"}
            {noticia.audio.duracao ? ` · ${noticia.audio.duracao}` : ""}
          </figcaption>
          <audio
            controls
            preload="metadata"
            src={noticia.audio.arquivo}
            className="w-full"
          >
            Seu navegador não reproduz áudio. Baixe o arquivo em{" "}
            <a href={noticia.audio.arquivo}>{noticia.audio.arquivo}</a>.
          </audio>
          {noticia.audio.transcricao ? (
            <p className="mt-2 text-xs text-muted">
              <a
                href={noticia.audio.transcricao}
                className="font-medium text-primary underline underline-offset-2"
              >
                Transcrição integral
              </a>{" "}
              — feita por modelo local (faster-whisper), revisada antes de publicar.
            </p>
          ) : null}
        </figure>
      ) : null}

      {/* PAINEL DE DADOS E MÉTRICAS CHAVE */}
      <SecaoMetricas metricas={noticia.metricas} />

      {/* LEAD EM CORPO MAIOR — o primeiro parágrafo carrega a matéria */}
      <p className="font-serif text-xl sm:text-2xl leading-relaxed text-foreground">
        <TextoComLinks texto={lead} />
      </p>

      {/* RESUMO DE SERVIÇO — 15 segundos antes do detalhe */}
      <ResumoEssencial itens={noticia.essencial} />

      {/* CORPO DO ARTIGO COM HIPERLINKS */}
      <article className="prose prose-neutral dark:prose-invert max-w-none space-y-5 text-base sm:text-lg text-foreground/90 leading-relaxed font-serif">
        {corpo.map((p, idx) => (
          <p key={idx}>
            <TextoComLinks texto={p} />
          </p>
        ))}
      </article>

      {/* OLHO DO TEXTO — pull quote com fonte colada */}
      <OlhoArtigo olho={noticia.olho} />

      {/* TABELAS — vagas por área (e a legada, quando existir) */}
      <SecaoTabelas tabelas={noticia.tabelas} />

      {/* GRÁFICO DE BARRAS (opcional) — o componente devolve null sem série */}
      <GraficoBarrasArtigo grafico={noticia.grafico} />

      <SecaoTabelas tabela={noticia.tabela} />

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
            <TextoComLinks texto={noticia.recomendacaoVerificar} />
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
      <OutrosRelatorios noticias={outrasNoticias} />

      {/* TRANSCRIÇÃO REVISADA — sanfona no fim do post */}
      <TranscricaoAcordeao slug={noticia.slug} />

      {/* RODAPÉ GLOBAL */}
      <div className="mt-14">
        <FooterGlobal />
      </div>
    </main>
  );
}
