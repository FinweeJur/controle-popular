import type { Metadata } from "next";
import Link from "next/link";
import { listarTodasEntidades } from "@/lib/empresas/entidades-dados";
import {
  contarPorSetor,
  filtrarPorSetor,
  hrefSetor,
  ordenarPorNome,
  setorDaUrl,
} from "@/lib/empresas/painel";
import { PainelFacetas } from "@/app/components/PainelFacetas";
import { Barras } from "@/app/components/Barras";
import AvisoContagem from "./AvisoContagem";
import ListaDeEntidades from "./ListaDeEntidades";
import OutrosAcervos from "./OutrosAcervos";
import PaginasRelacionadas from "./PaginasRelacionadas";

/**
 * @file `/empresas` — painel de facetas do Observatório de Grandes Empresas.
 *
 * O QUE MUDOU (02/11/2026): a página era um hub com uma tabela de cliente que
 * segurava as 130 entidades e filtrava por `useState`. O recorte agora é
 * `?setor=`, é LINK e é renderizado no servidor: botão, barra e lista saem da
 * mesma contagem (AGENTS §5.1 e §5.13). No celular a lista vira cartão e não há
 * rolagem lateral (§5.14).
 *
 * O QUE NÃO VIROU FACETA, de propósito: `/empresas/fortunas` (pessoas),
 * `/empresas/executivos` (cargos e porta giratória), `/empresas/documentos`
 * (catálogo de PDFs) e `/empresas/conglomerados` (grafo de controle) são
 * acervos de OUTRO tipo de registro, com tabela e cliente próprios. Juntá-los
 * por prefixo criaria uma página que não é irmã das outras e esconderia dado.
 * A ficha `[slug]` continua rota: é o perfil individual da entidade.
 *
 * NÚMEROS: toda contagem vem do acervo versionado
 * `data/empresas-perfil/entidades-completas.json` e tem denominador explícito.
 * Não é medição de mercado nem ranking por valor — o aviso aparece antes do
 * primeiro N. A fonte oficial de cada entidade está na ficha dela.
 */

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: "Observatório de Grandes Empresas & Fundos — Controle Popular",
  description:
    "Painel cívico das grandes empresas e fundos com atuação no Brasil: recorte por setor, mercado em que são fiscalizados, risco socioambiental declarado e ficha com fontes oficiais.",
};

export default async function EmpresasIndexPage({ searchParams }: Props) {
  const params = await searchParams;
  const setor = setorDaUrl(params.setor);
  const entidades = listarTodasEntidades();
  const recorte = ordenarPorNome(filtrarPorSetor(entidades, setor));
  const facetas = contarPorSetor(entidades);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <link rel="canonical" href={hrefSetor(setor)} />

      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href="/" className="transition hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/estado-e-economia" className="transition hover:text-primary">
          Estado &amp; Economia
        </Link>{" "}
        · <span className="font-semibold text-foreground">Grandes Empresas &amp; Fundos</span>
      </nav>

      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <span>🏛️ Setores estratégicos &amp; mercado de capitais</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Observatório de Grandes Empresas &amp; Fundos
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
          Um painel só para as empresas e fundos que o portal acompanha. Escolha o setor e o
          contador, as barras e a lista abaixo mudam juntos — o número do botão e o da lista saem
          da mesma contagem.
        </p>
      </header>

      <AvisoContagem total={entidades.length} />

      <PainelFacetas
        facetas={facetas}
        atual={setor}
        total={entidades.length}
        hrefDe={(slug) => hrefSetor(slug)}
        titulo="Recorte por setor"
        ariaLabel="Recorte por setor econômico"
        rotuloTodos="Todas"
        nota={`N = entidades do acervo no setor. Denominador: ${entidades.length.toLocaleString(
          "pt-BR"
        )} entidades no total.`}
      />

      <Barras
        titulo="Distribuição do acervo por setor"
        dados={facetas.map((faceta) => [faceta.rotulo, faceta.n])}
        total={entidades.length}
        nota={`Percentual sobre as ${entidades.length.toLocaleString(
          "pt-BR"
        )} entidades do acervo — nunca sobre o maior setor.`}
        limite={10}
      />

      <ListaDeEntidades entidades={recorte} setor={setor} total={entidades.length} />
      <OutrosAcervos />
      <PaginasRelacionadas />

      <footer className="space-y-2 border-t border-border pt-6 text-xs text-muted">
        <p>
          <strong>Fontes oficiais por entidade:</strong> CVM, SEC EDGAR, PNCP, SIGBM/ANM, FEAM-MG,
          IBAMA e ministérios públicos. Cada ficha lista o que aquela entidade declara.
        </p>
        <p>
          O Controle Popular não emite recomendação de investimento. O foco é a fiscalização do
          cumprimento da legislação e da destinação de recursos públicos.
        </p>
      </footer>
    </div>
  );
}
