import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/judiciario/vagas`.
 *
 * As datas de aposentadoria viraram a lente `?lente=vagas` do painel
 * `/judiciario/composicao` em 02/11/2026. A fonte e a conta são as mesmas:
 * nascimento + 75 anos (LC 152/2015), sobre a composição publicada por cada
 * tribunal.
 *
 * Onde há servidor, o `redirects()` do `next.config.ts` responde 301 e esta
 * página nunca renderiza. No alvo estático ela é o único redirecionamento
 * possível — ver `app/components/PaginaPonte.tsx`.
 */
export const metadata: Metadata = {
  title: "Próximas vagas — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

const ROTA = "/judiciario/vagas";

export default function PonteVagas() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();

  return (
    <PaginaPonte
      destino={destino}
      titulo="Próximas vagas agora são uma lente do painel de composição"
      descricao="O conteúdo é o mesmo: cada ocupação com data de nascimento conhecida, a vacância projetada aos 75 anos e o tribunal da cadeira."
    />
  );
}
