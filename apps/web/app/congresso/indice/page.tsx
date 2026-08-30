import type { Metadata } from "next";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki } from "@/app/components/wiki";

const topicos: Topico[] = [
  {
    href: "/congresso",
    titulo: "Visao geral",
    descricao: "Panorama do Congresso Nacional: deputados, senadores e proposicoes.",
  },
  {
    href: "/congresso/agenda",
    titulo: "Agenda",
    descricao: "Pauta dos proximos dias no Congresso.",
  },
  {
    href: "/congresso/alertas",
    titulo: "Alertas",
    descricao: "Mudancas e movimentacoes relevantes em proposicoes e votacoes.",
  },
  {
    href: "/congresso/bancadas",
    titulo: "Bancadas",
    descricao: "Cada bancada estadual no Congresso.",
  },
  {
    href: "/congresso/bons-exemplos",
    titulo: "Bons exemplos",
    descricao: "Praticas de transparencia e boas acoes parlamentares.",
  },
  {
    href: "/congresso/comissoes",
    titulo: "Comissoes",
    descricao: "Comissoes permanentes e suas composicoes.",
  },
  {
    href: "/congresso/metodologia",
    titulo: "Metodologia",
    descricao: "Como os dados do Congresso sao coletados e verificados.",
  },
  {
    href: "/congresso/parlamentares",
    titulo: "Parlamentares",
    descricao: "Deputados e senadores com perfil e atividade.",
  },
  {
    href: "/congresso/proposicoes",
    titulo: "Proposicoes",
    descricao: "Projetos de lei e outras proposicoes em tramitacao.",
  },
  {
    href: "/congresso/votacoes",
    titulo: "Votacoes",
    descricao: "Resultados de votacoes no plenario e nas comissoes.",
  },
];

export const metadata: Metadata = {
  title: "Indice — Congresso Nacional — Controle Popular",
  description:
    "Navegue pelos dados do Congresso Nacional: parlamentares, comissoes, proposicoes, votacoes e agenda.",
};

export default function IndiceCongresso() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-4 py-8"
    >
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Indice — Congresso Nacional</h1>
        <p className="max-w-2xl text-text-soft">
          Dados do Congresso Nacional: parlamentares, bancadas, comissoes,
          proposicoes, votacoes e agenda.
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
