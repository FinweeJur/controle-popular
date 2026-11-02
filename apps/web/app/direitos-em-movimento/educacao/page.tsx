import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/direitos-em-movimento/educacao`.
 *
 * O conteúdo virou recorte do painel `/direitos-em-movimento/servicos`
 * (`?subfrente=educacao`) em 02/11/2026. O destino vem de
 * `lib/redirects/rotas-antigas.ts`, a mesma lista que alimenta o
 * `redirects()` do `next.config.ts` — uma fonte, dois alvos de publicação.
 */
const ROTA = "/direitos-em-movimento/educacao";

export const metadata: Metadata = {
  title: "Educação — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

export default function PonteEducacao() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();
  return (
    <PaginaPonte
      destino={destino}
      titulo="Educação agora é um recorte do painel de serviços"
      descricao="O conteúdo é o mesmo: cartões de referência do Censo Escolar, a série do IDEB e as fichas de educação. Agora ele divide a página com saúde e trabalho e renda."
    />
  );
}
