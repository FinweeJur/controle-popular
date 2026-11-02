import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/paraopeba/indice`.
 *
 * O índice era uma lista de 12 links para as telas da frente, sem dado
 * próprio. Em 02/11/2026 a lista foi absorvida pelo hub `/paraopeba`, na seção
 * `#indice` — mesmos títulos e mesmas descrições, agora ao lado do dado que
 * cada porta abre.
 *
 * O destino vem de `lib/redirects/rotas-antigas.ts`, a mesma lista que monta o
 * `redirects()` do `next.config.ts`: uma lista só evita o 301 e a ponte
 * divergirem no primeiro dia em que alguém edita uma e esquece a outra.
 */
const ROTA = "/paraopeba/indice";

export const metadata: Metadata = {
  title: "Índice da frente Paraopeba — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

export default function PonteIndiceParaopeba() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();
  return (
    <PaginaPonte
      destino={destino}
      titulo="O índice da frente Paraopeba agora mora no hub"
      descricao="A lista de telas é a mesma — análise, auditoria, auxílio, biblioteca, clipping, documentos, entenda, execução, linha do tempo, perícia e quem atua — agora na seção “Índice da frente”, dentro de /paraopeba."
    />
  );
}
