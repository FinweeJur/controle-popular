import Link from "next/link";

/**
 * @file "Outros relatórios" do rodapé do post.
 *
 * Saiu de `page.tsx` em 17/11/2026: a página já tinha 351 linhas e qualquer
 * acréscimo derrubava a nota de saúde de código. Extrair este bloco abriu
 * espaço para a sanfona da transcrição sem aumentar o método.
 */

export interface OutraNoticia {
  slug: string;
  categoria: string;
  titulo: string;
  resumo: string;
}

export default function OutrosRelatorios({ noticias }: { noticias: readonly OutraNoticia[] }) {
  return (
    <section aria-label="Outros relatórios do observatório" className="my-12 pt-8 border-t border-border">
      <h3 className="font-display text-lg font-bold text-foreground mb-4">
        Outros Relatórios &amp; Publicações do Observatório
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {noticias.map((outra) => (
          <Link
            key={outra.slug}
            href={`/noticias/${outra.slug}`}
            className="group rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/50"
          >
            <span className="text-xs font-semibold text-primary block mb-1">
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
  );
}
