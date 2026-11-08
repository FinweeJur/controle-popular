import type { Metadata } from "next";
import PaginaEixo from "@/app/components/eixos/PaginaEixo";
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

export default function CasosPage() {
  return <PaginaEixo slug="casos" />;
}
