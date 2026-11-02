import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/ambiental/nossos-rios`.
 *
 * O conteúdo virou recorte do painel `/ambiental/nossos` (`?colecao=rios`) em
 * 02/11/2026: as três listas da Coleção Nossos tinham o mesmo esqueleto e
 * liam o mesmo catálogo (`lib/lugares.ts`), mudando só o `tipo`. O detalhe de
 * cada rio continua em `/ambiental/nossos-rios/<id>` — só o índice migrou.
 *
 * O destino NÃO é escrito aqui: vem de `lib/redirects/rotas-antigas.ts`, a
 * mesma lista que monta o `redirects()` do `next.config.ts`. Onde há servidor,
 * o 301 responde e esta página nunca renderiza; no alvo estático ela é o único
 * redirecionamento possível.
 */
const ROTA = "/ambiental/nossos-rios";

export const metadata: Metadata = {
  title: "Nossos Rios — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

export default function PonteNossosRios() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();
  return (
    <PaginaPonte
      destino={destino}
      titulo="Nossos Rios agora é um recorte da Coleção Nossos"
      descricao="O conteúdo é o mesmo: as fichas das bacias, com biomas e o resumo de cada rio. Agora elas dividem a página com serras e territórios, e o painel de cada rio continua em endereço próprio."
    />
  );
}
