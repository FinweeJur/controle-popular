import type { Metadata } from "next";
import PaginaEixo from "@/app/components/eixos/PaginaEixo";
import FrentesDoEixo from "@/app/components/eixos/FrentesDoEixo";
import { IndiceWiki, LinksRelacionados, SecaoWiki } from "@/app/components/wiki";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * @file /casos — porta do eixo Casos.
 *
 * Os desastres que o portal acompanha (Fundão, Córrego do Feijão e Serra
 * Azul). A página é montada do mapa de navegação (`lib/navegacao/mapa.ts`)
 * e não repete lista de frentes: o mapa é a fonte única.
 */

export const metadata: Metadata = metadataEditavel("/casos", {
  title: "Casos — os desastres que o portal acompanha",
  description:
    "Brumadinho, Rio Doce e Itatiaiuçu: o que aconteceu, a reparação, os processos e a fiscalização cidadã de cada rompimento, com fonte oficial.",
});

const SECOES = [
  { id: "frentes", titulo: "Frentes do eixo" },
  { id: "como-ler", titulo: "Como ler este eixo" },
];

export default function CasosPage() {
  return (
    <PaginaEixo slug="casos">
      <IndiceWiki itens={SECOES} />

      <SecaoWiki id="frentes" titulo="Frentes do eixo" href="/indice">
        <FrentesDoEixo slug="casos" />
      </SecaoWiki>

      <SecaoWiki id="como-ler" titulo="Como ler este eixo">
        <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
          As frentes seguem a ordem do mapa: primeiro o caso, depois a
          reparação e os processos. Nenhum número é digitado nesta porta —
          cada página mostra a fonte oficial do que afirma.
        </p>
      </SecaoWiki>

      <LinksRelacionados
        links={[
          {
            href: "/paraopeba",
            titulo: "Brumadinho — Bacia do Paraopeba",
            descricao: "Acordo, auxílio emergencial e execução da reparação.",
          },
          {
            href: "/riodoce",
            titulo: "Rio Doce — Fundão",
            descricao: "Repactuação, processos e o que mudou na bacia.",
          },
          {
            href: "/jurisprudencia",
            titulo: "Jurisprudência dos desastres",
            descricao: "Acórdãos, valores de condenação e súmulas.",
          },
        ]}
      />
    </PaginaEixo>
  );
}
