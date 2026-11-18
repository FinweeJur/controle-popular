import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, Download, Headphones } from "lucide-react";
import { obterNoticiaPorSlug } from "@/lib/noticias/portal";
import { obterTranscricao, listarTranscricoes } from "@/lib/noticias/transcricoes";

/**
 * @file Transcrição integral de um post com áudio.
 *
 * POR QUE ESTA PÁGINA EXISTE
 *
 * O post anexa o áudio original e precisa do texto para quem não pode ouvir.
 * A primeira versão apontava para um `.txt` cru em `public/`: o leitor saía
 * do padrão visual do portal e caía em texto sem tipografia, sem navegação e
 * sem vínculo com o post. Aqui a transcrição veste a mesma casca do site —
 * cabeçalho, breadcrumb, player e âncoras por minuto.
 *
 * REGRAS
 *
 * - O áudio é a fonte; o texto é apoio e pode conter erro de reconhecimento.
 *   A ressalva fica visível no topo, não em letra miúda.
 * - Cada trecho tem âncora `#t-HH-MM-SS` para citar o minuto exato.
 * - O `.txt` continua disponível como download, não como leitura principal.
 */

interface Props {
  params: Promise<{ slug: string }>;
}

function dataCurta(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR");
}

export function generateStaticParams() {
  return listarTranscricoes()
    .filter(({ slug }) => obterNoticiaPorSlug(slug))
    .map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const noticia = obterNoticiaPorSlug(slug);
  const transcricao = obterTranscricao(slug);
  if (!noticia || !transcricao) {
    return { title: "Transcrição não encontrada | Controle Popular" };
  }
  const url = `https://controlepopular.com.br/noticias/${slug}/transcricao`;
  return {
    title: `Transcrição — ${noticia.titulo} | Controle Popular`,
    description: `Transcrição integral do áudio de ${transcricao.duracao}: ${noticia.titulo}`,
    alternates: { canonical: url },
    openGraph: {
      title: `Transcrição — ${noticia.titulo}`,
      description: noticia.resumo,
      url,
      type: "article",
    },
  };
}

export default async function PaginaTranscricao({ params }: Props) {
  const { slug } = await params;
  const noticia = obterNoticiaPorSlug(slug);
  const transcricao = obterTranscricao(slug);
  if (!noticia || !transcricao) notFound();

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8"
    >
      <nav aria-label="Caminho de navegação" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-foreground">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/noticias" className="hover:text-foreground">
          Blog
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/noticias/${slug}`} className="truncate hover:text-foreground">
          {noticia.titulo}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-foreground">Transcrição</span>
      </nav>

      <header className="border-b border-border pb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          Transcrição integral
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.6em,3.4vw,2.2em)] font-bold leading-tight tracking-tight">
          {noticia.titulo}
        </h1>
        <p className="mt-2 max-w-[72ch] text-[1.02em] leading-relaxed text-text-soft">
          {noticia.subtitulo}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Headphones size={13} /> {transcricao.duracao}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} /> Transcrição automática — {transcricao.modelo}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar size={13} /> {dataCurta(transcricao.geradoEm)}
          </span>
          <Link
            href={`/noticias/${slug}`}
            className="font-semibold text-primary underline underline-offset-2"
          >
            Voltar ao post
          </Link>
        </div>
      </header>

      <figure className="my-6 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <figcaption className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
          Áudio original
        </figcaption>
        <audio
          controls
          preload="metadata"
          src={transcricao.audio}
          className="w-full"
        >
          Seu navegador não reproduz áudio. Baixe em{" "}
          <a href={transcricao.audio}>{transcricao.audio}</a>.
        </audio>
      </figure>

      <p className="mb-6 max-w-[72ch] rounded-lg border border-dashed border-border bg-surface/50 p-3 text-sm leading-relaxed text-text-soft">
        O áudio é a fonte. O texto abaixo foi reconhecido por modelo local e
        pode conter erro de palavra ou de nome. Cada marca de tempo abre o
        trecho correspondente para conferência.
        {transcricao.arquivoTexto ? (
          <>
            {" "}
            <a
              href={transcricao.arquivoTexto}
              download
              className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2"
            >
              <Download size={12} /> Baixar .txt
            </a>
          </>
        ) : null}
      </p>

      <ol className="space-y-3">
        {transcricao.segmentos.map((segmento) => (
          <li
            key={segmento.id}
            id={segmento.id}
            className="grid scroll-mt-24 grid-cols-[5.5rem_1fr] gap-3 text-[1.02em] leading-[1.75]"
          >
            <a
              href={`#${segmento.id}`}
              className="pt-0.5 font-tabular text-xs text-muted hover:text-primary"
              title={`Trecho em ${segmento.t}`}
            >
              {segmento.t}
            </a>
            <p className="max-w-[68ch] text-text">{segmento.texto}</p>
          </li>
        ))}
      </ol>

      <footer className="mt-10 border-t border-border pt-6 text-sm text-text-soft">
        <p>
          Transcrição de áudio público, feita com modelo local. Confira o
          contexto no{" "}
          <Link
            href={`/noticias/${slug}`}
            className="font-semibold text-primary underline underline-offset-2"
          >
            post completo
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}
