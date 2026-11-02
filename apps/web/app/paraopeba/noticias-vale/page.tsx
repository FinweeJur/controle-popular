import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/paraopeba/noticias-vale`.
 *
 * O conteúdo virou o recorte `?fonte=vale` do painel `/paraopeba/noticias` em
 * 02/11/2026: as duas telas eram a mesma pergunta ("o que saiu na imprensa?")
 * com coletores e fontes diferentes. Nada foi apagado — a lista, o filtro por
 * veículo, a ordenação, o gráfico por mês e o CSV continuam no painel.
 *
 * O destino NÃO é escrito aqui: vem de `lib/redirects/rotas-antigas.ts`, a
 * mesma lista que monta o `redirects()` do `next.config.ts`. Onde há servidor,
 * o 301 responde e esta página nunca renderiza; no alvo estático ela é o único
 * redirecionamento possível.
 *
 * `ListaNoticiasVale.tsx` permanece nesta pasta porque é importado pelo
 * painel. O que saiu foi a rota, não o componente.
 */
const ROTA = "/paraopeba/noticias-vale";

export const metadata: Metadata = {
  title: "Notícias da Vale — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

export default function PonteNoticiasVale() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();
  return (
    <PaginaPonte
      destino={destino}
      titulo="As notícias da Vale agora são um recorte do painel de notícias"
      descricao="O conteúdo é o mesmo: a lista filtrável e ordenável, o gráfico por mês e o CSV da varredura de quatro feeds públicos. Agora ele divide a página com o radar da bacia do Paraopeba."
    />
  );
}
