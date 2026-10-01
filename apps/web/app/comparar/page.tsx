import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  listarTodasCidadesCompletas,
  obterMetaCidadesCompletas,
} from "@/lib/cidades/estrategicas";
import type { CidadeComparavel } from "@/lib/comparador/cidades";
import TermoGlossario from "@/app/components/TermoGlossario";
import CompararClient from "./CompararClient";

/**
 * Página `/comparar` — comparador de cidades.
 *
 * Papel: pôr duas cidades do acervo lado a lado, com valor por habitante para
 * normalizar tamanhos diferentes. Projeta só os campos do comparador (sem o
 * histórico de PIB) e passa a lista ao componente de cliente.
 *
 * Fonte: `cidades-dados-completos.json` (IBGE e fontes oficiais), lido no
 * build. A data do acervo viaja colada ao número na tela.
 */

export const metadata: Metadata = {
  title: "Comparar cidades — população, PIB e repasses lado a lado | Controle Popular",
  description:
    "Compare duas cidades do portal: população, PIB, PIB por habitante, repasses federais, saúde e escolas, com o valor por habitante para igualar tamanhos diferentes.",
};

/** Formata AAAA-MM-DD… em dd/mm/aaaa. */
function formatarData(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("pt-BR");
}

export default function CompararPage() {
  const cidades: CidadeComparavel[] = listarTodasCidadesCompletas()
    .map((c) => ({
      id: c.id_municipio,
      nome: c.nome,
      uf: c.uf,
      regiao: c.regiao,
      tipo: c.tipo,
      populacao: c.populacao,
      pibBi: c.pib_mais_recente_bi,
      pibPerCapita: c.pib_per_capita_reais,
      repassesMi: c.repasses_federais_anuais_mi,
      saude: c.saude_estabelecimentos,
      escolas: c.escolas_total,
      slug: c.slug,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const { geradoEm } = obterMetaCidadesCompletas();

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <nav aria-label="Caminho de navegação" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="transition-colors hover:text-foreground">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/cidades" className="transition-colors hover:text-foreground">
          Cidades
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-foreground">Comparar</span>
      </nav>

      <header className="mb-8 max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <span>Duas cidades lado a lado</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Comparar cidades
        </h1>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          Escolha duas cidades e veja os números lado a lado —{" "}
          <TermoGlossario id="pib">PIB</TermoGlossario>, repasses, saúde e
          escolas. O valor{" "}
          <TermoGlossario id="per-capita">por habitante</TermoGlossario> entra
          para igualar cidades de tamanhos diferentes. O realce mostra o maior
          valor — não a melhor cidade.
        </p>
      </header>

      <CompararClient cidades={cidades} dataAcervo={formatarData(geradoEm)} />

      <div className="mt-16">
        <FooterGlobal />
      </div>
    </main>
  );
}
