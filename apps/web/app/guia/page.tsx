import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import { obterTodosCanaisInformacao } from "@/lib/direitos/informacao";
import { obterTodasUnidadesJudiciarias } from "@/lib/judiciario/contatos";
import { montarGuia } from "@/lib/guia/contatos";
import GuiaClient from "./GuiaClient";

/**
 * Página `/guia` — guia de contatos públicos.
 *
 * Papel: reunir num só lugar os contatos oficiais que o portal já publica em
 * catálogos separados — canais de acesso à informação (445, em
 * `/direitos-em-movimento/informacao`) e unidades judiciárias (990, em
 * `/judiciario/contatos`), com busca, filtro e CSV.
 *
 * Fonte única: as duas bases já versionadas do portal. Nada de contato novo.
 * Contatos municipais seguem em `/[municipio]/contatos`.
 */

export const metadata: Metadata = {
  title: "Guia de contatos públicos — órgãos, ouvidorias e Justiça | Controle Popular",
  description:
    "Busque telefone, e-mail e canal de ouvidoria de órgãos públicos, prefeituras, câmaras e unidades da Justiça num só lugar, com filtro por origem e UF e exportação em planilha.",
};

export default function GuiaPage() {
  const contatos = montarGuia(
    obterTodosCanaisInformacao(),
    obterTodasUnidadesJudiciarias(),
  );

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <nav aria-label="Caminho de navegação" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="transition-colors hover:text-foreground">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-foreground">Guia de contatos</span>
      </nav>

      <header className="mb-8 max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <span>{contatos.length.toLocaleString("pt-BR")} contatos oficiais</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Guia de contatos públicos
        </h1>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          Telefone, e-mail e canal de ouvidoria de prefeituras, câmaras, órgãos
          federais e unidades da Justiça num só lugar. Busque, filtre e baixe em
          planilha. Cada linha mantém a origem: canal de acesso à informação
          (LAI) e unidade judiciária são coisas diferentes.
        </p>
      </header>

      <GuiaClient contatos={contatos} />

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Fonte: catálogos de canais de informação (LAI) e de unidades judiciárias
        já publicados pelo portal. Os contatos de cada município continuam em{" "}
        <Link href="/direitos-em-movimento/informacao" className="font-medium text-primary hover:underline">
          Central de Canais LAI
        </Link>{" "}
        e{" "}
        <Link href="/judiciario/contatos" className="font-medium text-primary hover:underline">
          Varas e Balcão Virtual
        </Link>
        . Encontrou um contato errado?{" "}
        <Link href="/" className="font-medium text-primary hover:underline">
          Use o “Achou erro?” no rodapé
        </Link>
        .
      </p>

      <div className="mt-16">
        <FooterGlobal />
      </div>
    </main>
  );
}
