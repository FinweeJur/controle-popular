import type { Metadata } from "next";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki } from "@/app/components/wiki";

const topicos: Topico[] = [
  {
    href: "/paraopeba",
    titulo: "Visao geral",
    descricao: "Panorama da reparacao de Brumadinho.",
  },
  {
    href: "/paraopeba/analise",
    titulo: "Analise",
    descricao: "Analises sobre a reparacao e o acordo.",
  },
  {
    href: "/paraopeba/auditoria",
    titulo: "Auditoria",
    descricao: "Auditorias e fiscalizacao da reparacao.",
  },
  {
    href: "/paraopeba/auxilio",
    titulo: "Auxilio",
    descricao: "Auxilio emergencial e pagamentos as familias atingidas.",
  },
  {
    href: "/paraopeba/biblioteca",
    titulo: "Biblioteca",
    descricao: "Documentos e publicacoes sobre a reparacao.",
  },
  {
    href: "/paraopeba/clipping",
    titulo: "Clipping",
    descricao: "Noticias e cobertura de imprensa sobre Brumadinho.",
  },
  {
    href: "/paraopeba/documentos",
    titulo: "Documentos",
    descricao: "Documentos oficiais da reparacao e do acordo.",
  },
  {
    href: "/paraopeba/entenda",
    titulo: "Entenda",
    descricao: "Como funciona a reparacao e o Acordo de Brumadinho.",
  },
  {
    href: "/paraopeba/execucao",
    titulo: "Execucao",
    descricao: "Execucao do acordo e andamento das obrigacoes.",
  },
  {
    href: "/paraopeba/linha-do-tempo",
    titulo: "Linha do tempo",
    descricao: "Cronologia dos principais marcos desde 2019.",
  },
  {
    href: "/paraopeba/pericia",
    titulo: "Pericia",
    descricao: "Pareceres e pericias tecnicas.",
  },
  {
    href: "/paraopeba/quem-atua",
    titulo: "Quem atua",
    descricao: "Entidades envolvidas na reparacao.",
  },
];

export const metadata: Metadata = {
  title: "Indice — Reparacao de Brumadinho — Controle Popular",
  description:
    "Navegue pelos dados da reparacao de Brumadinho: auxilio, execucao do acordo, documentos, pericias e linha do tempo.",
};

export default function IndiceParaopeba() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-4 py-8"
    >
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Indice — Reparacao de Brumadinho</h1>
        <p className="max-w-2xl text-text-soft">
          Dados da reparacao de Brumadinho: auxilio, execucao do acordo,
          documentos, pericias e linha do tempo.
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
