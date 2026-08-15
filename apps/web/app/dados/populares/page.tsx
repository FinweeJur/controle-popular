import type { Metadata } from "next";
// `next/link` DIRETO, e não o `<Link>` de zona (`lib/link-zona.tsx`): esta
// página mora na RAIZ do domínio, então todo caminho interno daqui já é
// absoluto — o wrapper de zona geraria `/betim/` a partir de `/`. Mesma
// escolha, pelo mesmo motivo, de `app/termos/page.tsx`. `<a>` cru também não
// serve: o lint do Next (`no-html-link-for-pages`) reprova, e com razão,
// porque perde o pré-carregamento da rota.
import Link from "next/link";
import { listarCidades } from "@/lib/db/queries/municipios";
import PopularesClient from "./PopularesClient";

/**
 * "Páginas mais vistas" do portal inteiro — todas as zonas juntas.
 *
 * FICA NA RAIZ, fora de `[municipio]`/`congresso`/`judiciario` (mesmo
 * motivo de `app/busca/page.tsx`): a contagem de `page_views` cobre o
 * portal inteiro, e uma versão dentro de uma zona mostraria só um recorte
 * do ranking.
 *
 * O NÚMERO NÃO PODE VIR DO BUILD: o HTML desta página é pré-renderizado uma
 * vez e serve estático até o próximo rebuild agendado
 * (`docs/rotina-local.md`) — um contador embutido aqui no servidor ficaria
 * parado até lá. `PopularesClient` busca a contagem atual no navegador,
 * depois de montada (ver `app/api/pageview/route.din.ts`).
 */
export const metadata: Metadata = {
  title: "Páginas mais vistas — Controle Popular",
  description:
    "O que mais se lê no portal: ranking de visualizações das páginas principais de Cidades, Congresso e Judiciário.",
};

export default async function PaginasPopularesPage() {
  const cidades = await listarCidades();

  return (
    // Sem layout.tsx próprio (fora das quatro zonas) — precisa do <main>
    // explícito para o botão global "Ouvir esta página" (`OuvirPagina.tsx`)
    // achar conteúdo, mesma razão documentada em `app/busca/page.tsx`.
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <nav className="mb-4 text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <span className="text-text">Páginas mais vistas</span>
      </nav>

      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Páginas mais vistas</h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Ranking de carregamentos das páginas principais do portal — Cidades, Congresso e
          Judiciário juntos. Contagem aproximada: cada carregamento de página soma 1, sem
          identificar quem visitou.
        </p>
      </header>

      <PopularesClient cidades={cidades.map((c) => ({ slug: c.slug, nome: c.nome }))} />
    </main>
  );
}
