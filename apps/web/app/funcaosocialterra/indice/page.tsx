import type { Metadata } from "next";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki } from "@/app/components/wiki";

const topicos: Topico[] = [
  {
    href: "/funcaosocialterra",
    titulo: "Visao geral",
    descricao: "Panorama da funcao social da terra e do territorio.",
  },
  {
    href: "/funcaosocialterra/alertas",
    titulo: "Alertas",
    descricao: "Alertas sobre ocupacao e uso do territorio.",
  },
  {
    href: "/funcaosocialterra/mapa",
    titulo: "Mapa",
    descricao: "Globo 3D com camadas de mineracao, CAR e mais.",
  },
];

export const metadata: Metadata = {
  title: "Indice — Funcao social da terra — Controle Popular",
  description:
    "Navegue pelos dados da funcao social da terra: alertas, mapa de camadas e territorio.",
};

export default function IndiceFuncaoSocialTerra() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-4 py-8"
    >
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Indice — Funcao social da terra</h1>
        <p className="max-w-2xl text-text-soft">
          Dados da funcao social da terra: alertas, mapa de camadas e territorio.
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
