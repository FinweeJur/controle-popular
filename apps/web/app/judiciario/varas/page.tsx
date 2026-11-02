import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/judiciario/varas`.
 *
 * Esta rota já renderizava o mesmo componente de `/judiciario/contatos`, com
 * `canonical` apontando para lá — duas URLs com o mesmo conteúdo indexável.
 * Em 02/11/2026 ela virou ponte de verdade: o catálogo de 990 unidades mora
 * só em `/judiciario/contatos`.
 *
 * Onde há servidor, o `redirects()` do `next.config.ts` responde 301 e esta
 * página nunca renderiza. No alvo estático ela é o único redirecionamento
 * possível — ver `app/components/PaginaPonte.tsx`.
 */
export const metadata: Metadata = {
  title: "Varas e Juizados — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

const ROTA = "/judiciario/varas";

export default function PonteVaras() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();

  return (
    <PaginaPonte
      destino={destino}
      titulo="Varas e Juizados agora ficam no catálogo de contatos"
      descricao="O conteúdo é o mesmo: telefone com DDD, e-mail, endereço com CEP, juiz titular e balcão virtual das 990 unidades judiciárias."
    />
  );
}
