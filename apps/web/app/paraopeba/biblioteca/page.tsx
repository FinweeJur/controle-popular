import type { Metadata } from "next";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/paraopeba/biblioteca` — página-PONTE.
 *
 * A biblioteca das assessorias técnicas foi absorvida pela biblioteca
 * unificada dos dois crimes socioambientais
 * (`/ambiental/crimes-socioambientais`) em
 * 01/09/2026 (decisão do dono: "absorver, e por padrão na abertura selecionar
 * os itens do tema"). Esta URL continua existindo — link já compartilhado e
 * indexado — só não serve mais conteúdo próprio: redireciona para a
 * biblioteca unificada já filtrada no caso Brumadinho/Paraopeba.
 *
 * ═══ POR QUE ESTA PÁGINA EXISTE ALÉM DO `redirects()` DE `next.config.ts` ═══
 *
 * `redirects()` cobre o alvo Cloudflare Workers, mas NÃO EXISTE no alvo
 * `output: 'export'` (sem servidor, ninguém aplica o redirect; o modo de
 * falha é silencioso). Esta página é o equivalente estático: `<meta
 * http-equiv="refresh">`, que navegadores tratam como 301 e buscadores
 * consolidam no `canonical`. Mesmo padrão de
 * `app/[municipio]/components/PaginaPonte.tsx` e de
 * `/ambiental/direito-critico`.
 *
 * ═══ NADA AQUI É APAGADO ═══
 *
 * O acervo (`apps/web/public/data/biblioteca-ati.json`) e
 * `lib/paraopeba/biblioteca.ts` continuam como estão — outras telas da frente
 * (home, análise integrada) dependem deles, e o agregador da biblioteca
 * unificada lê o mesmo arquivo. O `BibliotecaClient.tsx` desta rota fica
 * retido como referência de UI, sem rota servindo-o.
 */

const DESTINO = "/ambiental/crimes-socioambientais?desastre=brumadinho";

export const metadata: Metadata = metadataEditavel("/paraopeba/biblioteca", {
  title: "Biblioteca das assessorias — Controle Popular",
  robots: { index: false, follow: true },
  alternates: { canonical: DESTINO },
});

export default function BibliotecaPonte() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${DESTINO}`} />
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-text">
          Biblioteca das assessorias
        </h1>
        <p className="mt-3 text-sm text-text-soft">
          A biblioteca das assessorias técnicas foi incorporada à{" "}
          <a
            href={DESTINO}
            className="font-medium text-primary underline underline-offset-2 hover:text-accent"
          >
            biblioteca dos crimes socioambientais de Mariana e Brumadinho
          </a>
          , já aberta no caso Brumadinho. As publicações continuam todas lá, com busca, filtros e
          ordenação.
        </p>
        <p className="mt-6">
          <a
            href={DESTINO}
            className="cp-btn-anim rounded-full border border-primary bg-primary px-5 py-2.5 text-sm font-medium text-primary-ink"
          >
            Abrir a biblioteca unificada →
          </a>
        </p>
      </div>
    </>
  );
}
