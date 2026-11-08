import type { Metadata } from "next";
import PaginaEixo from "@/app/components/eixos/PaginaEixo";
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

export default function DireitosPage() {
  return <PaginaEixo slug="direitos" />;
}
