import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/judiciario/indicacoes`.
 *
 * As indicações ao Senado viraram a lente `?lente=indicacoes` do painel
 * `/judiciario/composicao` em 02/11/2026. A lista, o resultado da sabatina e
 * o link do documento no Senado são os mesmos — o que mudou é que agora
 * dividem a página com a composição e as próximas vagas.
 *
 * Onde há servidor, o `redirects()` do `next.config.ts` responde 301 e esta
 * página nunca renderiza. No alvo estático ela é o único redirecionamento
 * possível — ver `app/components/PaginaPonte.tsx`.
 */
export const metadata: Metadata = {
  title: "Indicações — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

const ROTA = "/judiciario/indicacoes";

export default function PonteIndicacoes() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();

  return (
    <PaginaPonte
      destino={destino}
      titulo="Indicações agora são uma lente do painel de composição"
      descricao="O conteúdo é o mesmo: cada nome enviado pelo Presidente ao Senado, com data, resultado e o link do documento quando o Senado publica."
    />
  );
}
