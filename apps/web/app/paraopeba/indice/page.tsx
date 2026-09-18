import type { Metadata } from "next";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki } from "@/app/components/wiki";

const tópicos: Topico[] = [
  {
    href: "/paraopeba",
    titulo: "Visão geral",
    descricao: "Panorama da reparação de Brumadinho.",
  },
  {
    href: "/paraopeba/analise",
    titulo: "Analise",
    descricao: "Análises sobre a reparação e o acordo.",
  },
  {
    href: "/paraopeba/auditoria",
    titulo: "Auditoria",
    descricao: "Auditorias e fiscalização da reparação.",
  },
  {
    href: "/paraopeba/auxilio",
    titulo: "Auxilio",
    descricao: "Auxílio emergencial e pagamentos às famílias atingidas.",
  },
  {
    href: "/paraopeba/biblioteca",
    titulo: "Biblioteca",
    descricao: "Documentos e publicacoes sobre a reparação.",
  },
  {
    href: "/paraopeba/clipping",
    titulo: "Clipping",
    descricao: "Notícias e cobertura de imprensa sobre Brumadinho.",
  },
  {
    href: "/paraopeba/documentos",
    titulo: "Documentos",
    descricao: "Documentos oficiais da reparação e do acordo.",
  },
  {
    href: "/paraopeba/entenda",
    titulo: "Entenda",
    descricao: "Como funciona a reparação e o Acordo de Brumadinho.",
  },
  {
    href: "/paraopeba/execucao",
    titulo: "Execução",
    descricao: "Execução do acordo e andamento das obrigações.",
  },
  {
    href: "/paraopeba/linha-do-tempo",
    titulo: "Linha do tempo",
    descricao: "Cronologia dos principais marcos desde 2019.",
  },
  {
    href: "/paraopeba/pericia",
    titulo: "Pericia",
    descricao: "Pareceres e perícias técnicas.",
  },
  {
    href: "/paraopeba/quem-atua",
    titulo: "Quem atua",
    descricao: "Entidades envolvidas na reparação.",
  },
];

export const metadata: Metadata = {
  title: "Índice — Reparação de Brumadinho — Controle Popular",
  description:
    "Navegue pelos dados da reparação de Brumadinho: auxilio, execucao do acordo, documentos, perícias e linha do tempo.",
};

export default function ÍndiceParaopeba() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-4 py-8"
    >
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Índice — Reparação de Brumadinho</h1>
        <p className="max-w-2xl text-text-soft">
          Dados da reparação de Brumadinho: auxilio, execucao do acordo,
          documentos, perícias e linha do tempo.
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
