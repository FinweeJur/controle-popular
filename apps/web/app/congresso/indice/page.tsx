import type { Metadata } from "next";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki } from "@/app/components/wiki";

const tópicos: Topico[] = [
  {
    href: "/congresso",
    titulo: "Visão geral",
    descricao: "Panorama do Congresso Nacional: deputados, senadores e proposições.",
  },
  {
    href: "/congresso/agenda",
    titulo: "Agenda",
    descricao: "Pauta dos próximos dias no Congresso.",
  },
  {
    href: "/congresso/alertas",
    titulo: "Alertas",
    descricao: "Mudanças e movimentações relevantes em proposições e votações.",
  },
  {
    href: "/congresso/bancadas",
    titulo: "Bancadas",
    descricao: "Cada bancada estadual no Congresso.",
  },
  {
    href: "/congresso/bons-exemplos",
    titulo: "Bons exemplos",
    descricao: "Práticas de transparência e boas ações parlamentares.",
  },
  {
    href: "/congresso/comissões",
    titulo: "Comissões",
    descricao: "Comissões permanentes e suas composições.",
  },
  {
    href: "/congresso/metodologia",
    titulo: "Metodologia",
    descricao: "Como os dados do Congresso são coletados e verificados.",
  },
  {
    href: "/congresso/parlamentares",
    titulo: "Parlamentares",
    descricao: "Deputados e senadores com perfil e atividade.",
  },
  {
    href: "/congresso/proposições",
    titulo: "Proposições",
    descricao: "Projetos de lei e outras proposições em tramitação.",
  },
  {
    href: "/congresso/votações",
    titulo: "Votações",
    descricao: "Resultados de votações no plenário e nas comissões.",
  },
];

export const metadata: Metadata = {
  title: "Índice — Congresso Nacional — Controle Popular",
  description:
    "Navegue pelos dados do Congresso Nacional: parlamentares, comissões, proposições, votações e agenda.",
};

export default function ÍndiceCongresso() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-4 py-8"
    >
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Índice — Congresso Nacional</h1>
        <p className="max-w-2xl text-text-soft">
          Dados do Congresso Nacional: parlamentares, bancadas, comissões,
          proposições, votações e agenda.
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
    </main>
  );
}
