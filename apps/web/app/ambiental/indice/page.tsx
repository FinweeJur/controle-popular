import type { Metadata } from "next";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki } from "@/app/components/wiki";

/**
 * Indice da frente /ambiental.
 *
 * Padrao wiki: aponta para os topicos ja publicados da frente. Cada card
 * descreve o destino e leva a pagina de conteudo real.
 */

const topicos: Topico[] = [
  {
    href: "/ambiental",
    titulo: "Visao geral",
    descricao: "Panorama do Observatório Nacional Socioambiental: COPAM, licenciamento, barragens, Justiça, Mariana e a Vale.",
  },
  {
    href: "/ambiental/barragens",
    titulo: "Barragens",
    descricao: "Situacao e risco de barragens em Minas Gerais.",
  },
  {
    href: "/ambiental/convenios",
    titulo: "Convenios ambientais",
    descricao: "Repasses e convenios relacionados ao meio ambiente.",
  },
  {
    href: "/ambiental/copam",
    titulo: "COPAM",
    descricao: "Reunioes e decisoes do Conselho Estadual de Política Ambiental.",
  },
  {
    href: "/ambiental/decisoes",
    titulo: "Decisoes de licenciamento",
    descricao: "Decisoes com cobertura declarada do licenciamento.",
  },
  {
    href: "/ambiental/direito-critico",
    titulo: "Direito critico",
    descricao: "Analises e estudos juridicos sobre a agenda ambiental.",
  },
  {
    href: "/ambiental/estudos",
    titulo: "Estudos",
    descricao: "Estudos de impacto ambiental e relatorios.",
  },
  {
    href: "/ambiental/legislacao",
    titulo: "Legislacao",
    descricao: "Normas ambientais municipais, estaduais e federais.",
  },
  {
    href: "/ambiental/licenciamento",
    titulo: "Licenciamento",
    descricao: "Processos de licenciamento ambiental por municipio.",
  },
  {
    href: "/ambiental/patrimonio-cultural",
    titulo: "Patrimonio cultural",
    descricao: "Bens tombados e patrimonio cultural de Minas Gerais.",
  },
  {
    href: "/ambiental/tac",
    titulo: "Termos de ajustamento de conduta",
    descricao: "TACs e compromissos ambientais firmados.",
  },
  {
    href: "/ambiental/conselhos",
    titulo: "Conselhos e comitês de bacia",
    descricao: "Comitês de bacias hidrográficas, CODEMAs e conselhos de direitos.",
  },
  {
    href: "/ambiental/direitos-humanos",
    titulo: "Relatórios de direitos humanos",
    descricao: "Compêndio oficial da CIDH, ONU e CNDH cruzados por município.",
  },
  {
    href: "/ambiental/clima-risco",
    titulo: "Bases de clima e risco",
    descricao: "População em áreas de risco (BATER), pluviômetros CEMADEN, INMET e saneamento SNIS.",
  },
];

export const metadata: Metadata = {
  title: "Indice — ONSA · Observatório Nacional Socioambiental — Controle Popular",
  description:
    "Navegue pelo Observatório Nacional Socioambiental: COPAM, licenciamento, barragens, legislacao, patrimonio cultural, estudos, Mariana e a Vale.",
};

export default function IndiceAmbiental() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-4 py-8"
    >
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Indice — ONSA</h1>
        <p className="max-w-2xl text-text-soft">
          Observatório Nacional Socioambiental: licenciamento, barragens, COPAM,
          legislacao, patrimonio cultural, estudos, Mariana e a Vale.
        </p>
      </header>

      <IndiceWiki itens={[{ id: "topicos", titulo: "Topicos" }]} />

      <section className="mt-10" id="topicos">
        <h2 className="font-display text-xl font-semibold">Topicos</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topicos.map((topico) => (
            <CartaoTopico key={topico.href} topico={topico} />
          ))}
        </div>
      </section>
    </main>
  );
}
