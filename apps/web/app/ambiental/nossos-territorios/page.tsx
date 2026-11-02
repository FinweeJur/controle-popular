import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/ambiental/nossos-territorios`.
 *
 * O conteúdo virou recorte do painel `/ambiental/nossos`
 * (`?colecao=territorios`) em 02/11/2026: a lista era `lib/lugares.ts`
 * filtrado por `tipo` vale ou cerrado. O detalhe de cada território continua
 * em `/ambiental/nossos-territorios/<id>`.
 *
 * O destino vem de `lib/redirects/rotas-antigas.ts` — a mesma lista que monta
 * o `redirects()` do `next.config.ts` e que a ponte usa no alvo estático.
 */
const ROTA = "/ambiental/nossos-territorios";

export const metadata: Metadata = {
  title: "Nossos Territórios — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

export default function PonteNossosTerritorios() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();
  return (
    <PaginaPonte
      destino={destino}
      titulo="Nossos Territórios agora é um recorte da Coleção Nossos"
      descricao="O conteúdo é o mesmo: vales, cerrados, função social da terra e o cruzamento com o CAR. Agora eles dividem a página com rios e serras."
    />
  );
}
