import Link from "@/lib/betim/link";
import { notFound } from "next/navigation";
import { getNoticiaBySlug, CATEGORIA_LABELS } from "@/lib/betim/noticias";
import { TEMA_LABELS } from "@/lib/betim/temas";
import { formatDateBR } from "@/lib/betim/format";

interface NoticiaPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: NoticiaPageProps) {
  const { slug } = await params;
  const noticia = await getNoticiaBySlug(slug);
  if (!noticia) return { title: "Notícia não encontrada — Controle Popular Betim" };
  return {
    title: `${noticia.titulo} — Controle Popular Betim`,
    description: noticia.resumo,
  };
}

export default async function NoticiaPage({ params }: NoticiaPageProps) {
  const { slug } = await params;
  const noticia = await getNoticiaBySlug(slug);
  if (!noticia) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/noticias" className="hover:text-primary">
          Notícias
        </Link>{" "}
        · <span className="text-text">{noticia.titulo}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-2 text-[.85em] font-semibold tracking-wide uppercase">
        <span
          className={`rounded-full px-2.5 py-1 ${
            noticia.categoria === "curadoria" ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"
          }`}
        >
          {CATEGORIA_LABELS[noticia.categoria] ?? noticia.categoria}
        </span>
        {(noticia.temas ?? []).map((t) => (
          <span key={t} className="rounded-full bg-surface-2 px-2.5 py-1 text-text-soft">
            {TEMA_LABELS[t] ?? t}
          </span>
        ))}
      </div>

      <h1 className="mt-3 font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        {noticia.titulo}
      </h1>
      <p className="mt-2 text-sm text-text-soft">
        {noticia.autor} · {formatDateBR(noticia.publicadoEm)}
      </p>

      {noticia.fonteExternaNome && (
        <div className="mt-4 rounded-2xl border border-accent bg-accent/10 px-5 py-4">
          <p className="text-sm text-text">
            <strong className="font-semibold">Resumo nosso, não republicação.</strong> Baseado
            em reportagem de{" "}
            <strong className="font-semibold">{noticia.fonteExternaNome}</strong>
            {noticia.fonteExternaUrl && (
              <>
                {" — "}
                <a
                  href={noticia.fonteExternaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:underline"
                >
                  leia a matéria completa na fonte original ↗
                </a>
              </>
            )}
            .
          </p>
        </div>
      )}

      <div
        className="mt-8 flex flex-col gap-4 text-[1.02em] leading-relaxed text-text-soft [&_a]:font-medium [&_a]:text-accent [&_a]:hover:underline [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-text [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-text [&_li]:ml-5 [&_ol]:list-decimal [&_strong]:font-semibold [&_strong]:text-text [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: noticia.conteudoHtml }}
      />

      <div className="mt-10 rounded-2xl border border-accent bg-accent/10 px-6 py-5">
        <p className="text-sm text-text-soft">
          {noticia.fonteExternaNome ? (
            <>
              Este post é um resumo com comentário próprio, não uma cópia da
              matéria original — o texto completo, com todas as informações,
              está no link acima.
            </>
          ) : (
            <>
              Achou um erro ou quer conferir a fonte? Todo dado citado aqui
              vem de uma tabela pública já sincronizada neste portal —{" "}
              <Link href="/sobre" className="font-medium text-accent hover:underline">
                veja como verificamos cada número
              </Link>
              .
            </>
          )}
        </p>
      </div>
    </main>
  );
}
