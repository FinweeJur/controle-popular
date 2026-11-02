import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/judiciario/tribunais`.
 *
 * O conteúdo virou a lente padrão do painel `/judiciario/composicao` em
 * 02/11/2026: a mesma consulta que lista os tribunais também alimenta as
 * próximas vagas e as indicações ao Senado. A página de cada tribunal
 * (`/judiciario/tribunais/[sigla]`) continua viva — é composição detalhada,
 * não recorte.
 *
 * Onde há servidor, o `redirects()` do `next.config.ts` responde 301 e esta
 * página nunca renderiza. No alvo estático ela é o único redirecionamento
 * possível — ver `app/components/PaginaPonte.tsx`.
 */
export const metadata: Metadata = {
  title: "Tribunais — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

const ROTA = "/judiciario/tribunais";

export default function PonteTribunais() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();

  return (
    <PaginaPonte
      destino={destino}
      titulo="Tribunais agora abrem o painel de composição"
      descricao="O conteúdo é o mesmo: os tribunais acompanhados, as próximas vagas e as indicações ao Senado. Agora as três lentes dividem uma página só, com o número medido em cada botão."
    />
  );
}
