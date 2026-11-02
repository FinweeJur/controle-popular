import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/terra-e-territorios/cidades`.
 *
 * A rota repetia a tabela e os totais de `/cidades` com menos conteúdo: quatro
 * cartões e o mesmo `TabelaCidadesClient`. Em 02/11/2026 o índice da frente
 * virou ponte para a seção `#catalogo-cidades` da página canônica, que tem os
 * mesmos números mais a distribuição por região, a cobertura de memória e as
 * perguntas frequentes. Nada do catálogo foi apagado.
 *
 * O PERFIL DE CADA CIDADE CONTINUA AQUI: `/terra-e-territorios/cidades/<slug>`
 * é outra rota, com PIB, saúde, educação e cruzamentos próprios, e não passa
 * por esta ponte.
 *
 * O destino vem de `lib/redirects/rotas-antigas.ts`, a mesma lista que monta o
 * `redirects()` do `next.config.ts`.
 */
const ROTA = "/terra-e-territorios/cidades";

export const metadata: Metadata = {
  title: "Cidades estratégicas — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

export default function PonteCidadesTerra() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();
  return (
    <PaginaPonte
      destino={destino}
      titulo="O catálogo das 203 cidades agora está em /cidades"
      descricao="O conteúdo é o mesmo: os totais de capitais e polos e a tabela filtrável com exportação. A página canônica traz também a distribuição por região e a cobertura de memória por UF."
    />
  );
}
