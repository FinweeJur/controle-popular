import type { Metadata } from "next";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki } from "@/app/components/wiki";

const topicos: Topico[] = [
  {
    href: "/judiciario",
    titulo: "Visao geral",
    descricao: "Panorama do Poder Judiciario e a atuacao de seus orgaos.",
  },
  {
    href: "/judiciario/correicoes-trabalhistas",
    titulo: "Correicoes trabalhistas",
    descricao: "Correicoes na Justica do Trabalho.",
  },
  {
    href: "/judiciario/defensoria",
    titulo: "Defensoria",
    descricao: "Atuacao da Defensoria Publica.",
  },
  {
    href: "/judiciario/indicacoes",
    titulo: "Indicacoes",
    descricao: "Nomeacoes e indicacoes em tribunais.",
  },
  {
    href: "/judiciario/inspecoes",
    titulo: "Inspecoes",
    descricao: "Inspecoes da Corregedoria em orgaos judiciarios.",
  },
  {
    href: "/judiciario/instituicoes",
    titulo: "Instituicoes",
    descricao: "Instituicoes financeiras e orgaos vinculados.",
  },
  {
    href: "/judiciario/metodologia",
    titulo: "Metodologia",
    descricao: "Como os dados do Judiciario sao coletados.",
  },
  {
    href: "/judiciario/numeros",
    titulo: "Numeros",
    descricao: "Justica em Numeros: estatisticas do Judiciario.",
  },
  {
    href: "/judiciario/presidios",
    titulo: "Presidios",
    descricao: "Sistema carcerario e geopresidios.",
  },
  {
    href: "/judiciario/tribunais",
    titulo: "Tribunais",
    descricao: "Tribunais superiores e estaduais.",
  },
  {
    href: "/judiciario/vagas",
    titulo: "Vagas",
    descricao: "Concursos e vagas no Judiciario.",
  },
];

export const metadata: Metadata = {
  title: "Indice — Judiciario — Controle Popular",
  description:
    "Navegue pelos dados do Poder Judiciario: tribunais, numeros, presidios, inspecoes e correicoes.",
};

export default function IndiceJudiciario() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-4 py-8"
    >
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Indice — Judiciario</h1>
        <p className="max-w-2xl text-text-soft">
          Dados do Poder Judiciario: tribunais, numeros, presidios,
          inspecoes e correicoes.
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
