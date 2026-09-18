import type { Metadata } from "next";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki } from "@/app/components/wiki";

const tópicos: Topico[] = [
  {
    href: "/judiciario",
    titulo: "Visão geral",
    descricao: "Panorama do Poder Judiciario e a atuação de seus órgãos.",
  },
  {
    href: "/judiciario/contatos",
    titulo: "Varas, Gabinetes e Balcão Virtual",
    descricao: "Catálogo nacional de contatos, telefones, e-mails, endereços e juízes titulares de varas e tribunais.",
  },
  {
    href: "/judiciario/correicoes-trabalhistas",
    titulo: "Correições trabalhistas",
    descricao: "Correições na Justiça do Trabalho.",
  },
  {
    href: "/judiciario/defensoria",
    titulo: "Defensoria",
    descricao: "Atuação da Defensoria Pública.",
  },
  {
    href: "/judiciario/indicacoes",
    titulo: "Indicações",
    descricao: "Nomeações e indicacoes em tribunais.",
  },
  {
    href: "/judiciario/inspeções",
    titulo: "Inspeções",
    descricao: "Inspeções da Corregedoria em órgãos judiciarios.",
  },
  {
    href: "/judiciario/instituicoes",
    titulo: "Instituições",
    descricao: "Instituições financeiras e órgãos vinculados.",
  },
  {
    href: "/judiciario/metodologia",
    titulo: "Metodologia",
    descricao: "Como os dados do Judiciario são coletados.",
  },
  {
    href: "/judiciario/números",
    titulo: "Números",
    descricao: "Justiça em Números: estatísticas do Judiciario.",
  },
  {
    href: "/judiciario/presídios",
    titulo: "Presídios",
    descricao: "Sistema carcerário e geopresídios.",
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
  title: "Índice — Judiciario — Controle Popular",
  description:
    "Navegue pelos dados do Poder Judiciário: tribunais, números, presídios, inspeções e correicoes.",
};

export default function ÍndiceJudiciario() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-4 py-8"
    >
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Índice — Judiciario</h1>
        <p className="max-w-2xl text-text-soft">
          Dados do Poder Judiciário: tribunais, números, presídios,
          inspeções e correicoes.
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
