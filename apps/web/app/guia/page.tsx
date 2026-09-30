import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import { obterTodosCanaisInformacao } from "@/lib/direitos/informacao";
import { obterTodasUnidadesJudiciarias } from "@/lib/judiciario/contatos";
import { montarGuia } from "@/lib/guia/contatos";
import TermoGlossario from "@/app/components/TermoGlossario";
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
          (<TermoGlossario id="lai">LAI</TermoGlossario>) e unidade judiciária
          são coisas diferentes.
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

      <section className="mt-10 space-y-3 rounded-2xl border border-border bg-surface-2/40 p-5">
        <h2 className="font-display text-xl font-semibold text-foreground">Fora do Brasil: embaixadas e consulados</h2>
        <p className="text-sm leading-relaxed text-muted">
          O portal ainda não tem base própria de embaixadas e consulados — e
          inventar contato é pior que não ter. Por isso, aqui vai a fonte
          oficial para consultar as representações do Brasil no exterior, e o
          hub internacional do portal para os dados que já são nossos.
        </p>
        <ul className="flex flex-wrap gap-2">
          <li>
            <a
              href="https://www.gov.br/mre/pt-br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
            >
              Itamaraty (MRE) — embaixadas e consulados
            </a>
          </li>
          <li>
            <Link
              href="/internacional"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
            >
              Hub internacional do portal
            </Link>
          </li>
        </ul>
        <p className="text-xs text-muted">
          Lacuna declarada: quando houver coleta com fonte oficial, esta seção
          ganha a lista própria — como as 445 entidades de transparência.
        </p>
      </section>

      <div className="mt-16">
        <FooterGlobal />
      </div>
    </main>
  );
}
