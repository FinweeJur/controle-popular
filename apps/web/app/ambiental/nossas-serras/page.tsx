import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/ambiental/nossas-serras`.
 *
 * O conteúdo virou recorte do painel `/ambiental/nossos` (`?colecao=serras`) em
 * 02/11/2026: era a mesma lista de `lib/lugares.ts` filtrada por `tipo:
 * "serra"`. O detalhe de cada serra continua em
 * `/ambiental/nossas-serras/<id>`.
 *
 * O destino vem de `lib/redirects/rotas-antigas.ts` — a mesma lista que monta
 * o `redirects()` do `next.config.ts` e que a ponte usa no alvo estático.
 */
const ROTA = "/ambiental/nossas-serras";

export const metadata: Metadata = {
  title: "Nossas Serras — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

export default function PonteNossasSerras() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();
  return (
    <PaginaPonte
      destino={destino}
      titulo="Nossas Serras agora é um recorte da Coleção Nossos"
      descricao="O conteúdo é o mesmo: as fichas das cordilheiras, campos rupestres e a pressão minerária sobre o relevo. Agora elas dividem a página com rios e territórios."
    />
  );
}
