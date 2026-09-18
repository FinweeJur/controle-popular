import type { Metadata } from "next";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki } from "@/app/components/wiki";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";

/**
 * Índice da frente /ambiental.
 *
 * Padrao wiki: aponta para os tópicos ja publicados da frente. Cada card
 * descreve o destino e leva a pagina de conteudo real.
 */

const tópicos: Topico[] = [
  {
    href: "/ambiental",
    titulo: "Visão geral",
    descricao: "Panorama do Observatório Nacional Socioambiental: COPAM, licenciamento, barragens, Justiça, Mariana e a Vale.",
  },
  {
    href: "/ambiental/barragens",
    titulo: "Barragens",
    descricao: "Situação e risco de barragens em Minas Gerais.",
  },
  {
    href: "/ambiental/convenios",
    titulo: "Convênios ambientais",
    descricao: "Repasses e convênios relacionados ao meio ambiente.",
  },
  {
    href: "/ambiental/copam",
    titulo: "COPAM",
    descricao: "Reuniões e decisões do Conselho Estadual de Política Ambiental.",
  },
  {
    href: "/ambiental/decisoes",
    titulo: "Decisões de licenciamento",
    descricao: "Decisões com cobertura declarada do licenciamento.",
  },
  {
    href: "/ambiental/direito-critico",
    titulo: "Direito crítico",
    descricao: "Análises e estudos jurídicos sobre a agenda ambiental.",
  },
  {
    href: "/ambiental/estudos",
    titulo: "Estudos",
    descricao: "Estudos de impacto ambiental e relatórios.",
  },
  {
    href: "/ambiental/legislação",
    titulo: "Legislação",
    descricao: "Normas ambientais municipais, estaduais e federais.",
  },
  {
    href: "/ambiental/licenciamento",
    titulo: "Licenciamento",
    descricao: "Processos de licenciamento ambiental por município.",
  },
  {
    href: "/ambiental/patrimonio-cultural",
    titulo: "Patrimônio cultural",
    descricao: "Bens tombados e patrimônio cultural de Minas Gerais.",
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
  title: "Índice — Meio Ambiente (ONSA) · Observatório Nacional Socioambiental — Controle Popular",
  description:
    "Navegue pelo Observatório Nacional Socioambiental: COPAM, licenciamento, barragens, legislação, patrimônio cultural, estudos, Mariana e a Vale.",
};

export default function ÍndiceAmbiental() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-4 py-8"
    >
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Índice — ONSA</h1>
        <p className="max-w-2xl text-text-soft">
          Observatório Nacional Socioambiental: licenciamento, barragens, COPAM,
          legislação, patrimônio cultural, estudos, Mariana e a Vale.
        </p>
      </header>

      <IndiceWiki itens={[{ id: "tópicos", titulo: "Tópicos" }]} />

      <section className="mt-10" id="tópicos">
        <h2 className="font-display text-xl font-semibold">Tópicos</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tópicos.map((topico) => (
            <CartaoTopico key={topico.href} topico={topico} />
          ))}
        </div>
      </section>
      <MeioAmbienteRelacionado />
    </main>
  );
}
