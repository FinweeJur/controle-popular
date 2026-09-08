import type { Metadata } from "next";
import { metadataEditavel } from "@/lib/edicoes";
import PaginaContatosJudiciario from "../contatos/page";

export const metadata: Metadata = metadataEditavel("/judiciario/varas", {
  title: "Varas e Juizados — Guia Nacional · Judiciário",
  description:
    "Catálogo e contatos das Varas Cíveis, Criminais, de Família, Juizados Especiais e Varas do Trabalho em Minas Gerais e no Brasil.",
  alternates: {
    canonical: "/judiciario/contatos",
  },
});

export default PaginaContatosJudiciario;
