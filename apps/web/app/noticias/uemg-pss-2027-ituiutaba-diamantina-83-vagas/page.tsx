import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte do slug técnico do post da UEMG.
 *
 * O post nasceu como `/noticias/uemg-pss-2027-ituiutaba-diamantina-83-vagas`
 * e foi renomeado no mesmo dia para um endereço legível. A URL antiga chegou
 * a ficar no ar por poucas horas, mas link compartilhado não se apaga: o
 * registro em `rotas-antigas.ts` responde 301 onde há servidor e esta ponte
 * cobre o alvo estático, onde `redirects()` não roda.
 */
const ROTA = "/noticias/uemg-pss-2027-ituiutaba-diamantina-83-vagas";

export const metadata: Metadata = {
  title: "UEMG: endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

export default function PonteUemg() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();
  return (
    <PaginaPonte
      destino={destino}
      titulo="O post da UEMG mudou de endereço"
      descricao="O conteúdo é o mesmo: 83 vagas de professor temporário em Ituiutaba e Diamantina, com tabela filtrável de vagas por área."
    />
  );
}
