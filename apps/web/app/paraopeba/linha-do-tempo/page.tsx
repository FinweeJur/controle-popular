import type { Metadata } from "next";
import NextLink from "next/link";
import CaminhoSistema from "@/app/components/CaminhoSistema";
import FooterGlobal from "@/app/components/FooterGlobal";
import { MARCOS_PARAOPEBA } from "@/lib/paraopeba";
import { metadataEditavel } from "@/lib/edicoes";
import LinhaDoTempo from "./LinhaDoTempo";

/**
 * A data sai por `formatarDataMarco`, NÃO por `formatDateBR`: desde 15/08/2026
 * três marcos guardam mês sem dia (`2020-01`), porque a fonte não tem o dia e
 * inventar um daria cara de fato a um palpite. `formatDateBR` devolveria "—"
 * para eles. Ver o cabeçalho de `lib/paraopeba/linha-do-tempo.ts`.
 *
 * ⟲ 01/09/2026: a lista virou componente de cliente (`LinhaDoTempo.tsx`) com
 * a régua das 5 coisas (AGENTS.md): cartões de topo, gráfico SVG, filtro por
 * tipo de leitura, ordenação e CSV. A contagem do parágrafo abaixo continua
 * vindo da constante — quem mexer nos marcos tem de mexer aqui e no teste.
 */
export const metadata: Metadata = metadataEditavel("/paraopeba/linha-do-tempo", {
  title: "Linha do tempo — Paraopeba | Controle Popular",
  description:
    "Os marcos do processo de reparação pelo rompimento da barragem da Vale em Brumadinho, do rompimento de 25 de janeiro de 2019 à confirmação do pagamento de agosto de 2026.",
});

export default function LinhaDoTempoPage() {
  // ⟲ 13/08, revisão de onboarding: era `<div>` — mesmo conserto de
  // `clipping/page.tsx` (ver o comentário lá): sem `<main>`,
  // `OuvirPagina.tsx` não achava texto e o botão "Ouvir esta página"
  // sumia nesta tela.
  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <CaminhoSistema rota="/paraopeba/linha-do-tempo" />

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Do rompimento à confirmação de agosto
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        {MARCOS_PARAOPEBA.length} marcos do processo de reparação, em ordem — do rompimento da
        barragem B1, em 25 de janeiro de 2019, a cada decisão judicial, cada resposta da Vale e
        cada passo do caso no STF.
      </p>
      <p className="mt-2 max-w-2xl text-[.9em] text-text-soft">
        Onde a data aparece por extenso (&ldquo;janeiro de 2020&rdquo;), é porque a fonte
        registrou só o mês — o dia não é conhecido, e preencher um daria a um palpite a mesma
        aparência de fato que as datas cheias têm.
      </p>

      <LinhaDoTempo />

      {/* O caso não termina no Brasil: a ação contra a BHP corre na Inglaterra e
          a discussão sobre a certificadora, na Alemanha. Fica aqui, logo depois
          dos marcos nacionais, com a fonte de cada frente na página própria. */}
      <section
        aria-labelledby="fora-do-brasil"
        className="mt-10 rounded-lg border border-border bg-surface p-5"
      >
        <h2 id="fora-do-brasil" className="font-display text-lg font-semibold">
          Os mesmos casos fora do Brasil
        </h2>
        <p className="mt-1 text-sm text-text-soft">
          Mariana e Brumadinho também são discutidos fora do país: a ação contra a BHP na
          Inglaterra (julgamento em Londres), a discussão sobre a certificadora TÜV SÜD na
          Alemanha e os processos na Holanda. Cada frente está na página de litígios
          transnacionais, com número de processo e fonte oficial.
        </p>
        <NextLink
          href="/europa/litigios-transnacionais"
          className="mt-3 inline-block rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-soft transition-colors hover:border-current hover:text-text"
        >
          Ver os litígios transnacionais →
        </NextLink>
      </section>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
