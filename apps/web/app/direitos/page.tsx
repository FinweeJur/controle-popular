import type { Metadata } from "next";
import PaginaEixo from "@/app/components/eixos/PaginaEixo";
import FrentesDoEixo from "@/app/components/eixos/FrentesDoEixo";
import { IndiceWiki, LinksRelacionados, SecaoWiki } from "@/app/components/wiki";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * @file /direitos — porta do eixo Direitos.
 *
 * O direito violado e o que fazer: saúde, educação, moradia, água, trabalho,
 * segurança e informação. A página é montada do mapa de navegação
 * (`lib/navegacao/mapa.ts`) e não repete lista de frentes.
 */

export const metadata: Metadata = metadataEditavel("/direitos", {
  title: "Direitos — o direito violado e o que fazer",
  description:
    "Saúde, educação, trabalho, moradia, memória das lutas e direitos globais: onde buscar ajuda, como pedir informação e como denunciar, com fonte oficial.",
});

const SECOES = [
  { id: "frentes", titulo: "Frentes do eixo" },
  { id: "como-ler", titulo: "Como ler este eixo" },
];

export default function DireitosPage() {
  return (
    <PaginaEixo slug="direitos">
      <IndiceWiki itens={SECOES} />

      <SecaoWiki id="frentes" titulo="Frentes do eixo" href="/indice">
        <FrentesDoEixo slug="direitos" />
      </SecaoWiki>

      <SecaoWiki id="como-ler" titulo="Como ler este eixo">
        <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
          Escolha pelo problema, não pela sigla: cada frente abre a página que
          responde onde buscar ajuda, como pedir informação e como denunciar,
          com a fonte oficial ao lado de cada afirmação.
        </p>
      </SecaoWiki>

      <LinksRelacionados
        links={[
          {
            href: "/direitos-em-movimento",
            titulo: "Direitos em Movimento",
            descricao: "Ajuda, conselhos, denúncia e informação.",
          },
          {
            href: "/memoria",
            titulo: "Memória das lutas",
            descricao: "A linha do tempo das resistências no Brasil.",
          },
          {
            href: "/ambiental/direitos-humanos",
            titulo: "Direitos humanos e violações",
            descricao: "Relatórios da CIDH, ONU e CNDH cruzados por território.",
          },
        ]}
      />
    </PaginaEixo>
  );
}
