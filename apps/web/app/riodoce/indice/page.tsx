import type { Metadata } from "next";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki } from "@/app/components/wiki";

/**
 * @file Índice da Plataforma Rio Doce.
 *
 * O QUE É: reúne num só índice expansível as páginas da zona Rio Doce
 * (rompimento da barragem de Fundão, em Mariana) e a jurisprudência do
 * desastre — antes espalhadas entre o hub, os processos e `/ambiental/mariana`.
 *
 * REGRA DE QUALIDADE: cada cartão aponta para uma rota que existe; a
 * jurisprudência tem página própria (`/jurisprudencia`) com método, N e data.
 */

const topicos: Topico[] = [
  {
    href: "/riodoce",
    titulo: "Visão geral",
    descricao: "O hub da repactuação do Rio Doce e o que já está publicado.",
  },
  {
    href: "/riodoce/processos",
    titulo: "Processos",
    descricao: "Processos-chave do caso, consultados na fonte oficial.",
  },
  {
    href: "/ambiental/mariana",
    titulo: "Acordo de Mariana (R$ 171 bi)",
    descricao: "Execução da repactuação histórica do Rio Doce em Minas.",
  },
  {
    href: "/jurisprudencia",
    titulo: "Jurisprudência",
    descricao:
      "Acórdãos do TJMG sobre Brumadinho e a base do TJES (Fundão): polo, temas, danos PNAB/PEAB e valores.",
  },
];

export const metadata: Metadata = {
  title: "Índice — Plataforma Rio Doce — Controle Popular",
  description:
    "Navegue pela Plataforma Rio Doce: visão geral, processos, Acordo de Mariana e jurisprudência dos desastres.",
};

export default function IndiceRioDoce() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-4 py-8"
    >
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Índice — Plataforma Rio Doce</h1>
        <p className="max-w-2xl text-text-soft">
          As páginas do Rio Doce num só lugar: o hub da repactuação, os processos,
          a execução do Acordo de Mariana e a jurisprudência dos desastres.
        </p>
      </header>

      <IndiceWiki itens={[{ id: "topicos", titulo: "Tópicos" }]} />

      <section className="mt-10" id="topicos">
        <h2 className="font-display text-xl font-semibold">Tópicos</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topicos.map((topico) => (
            <CartaoTopico key={topico.href} topico={topico} />
          ))}
        </div>
      </section>
    </main>
  );
}
