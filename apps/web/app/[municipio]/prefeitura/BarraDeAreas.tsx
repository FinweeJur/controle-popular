"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { PainelFacetas, type Faceta } from "@/app/components/PainelFacetas";
import { hrefDaArea } from "@/lib/prefeitura/areas";

/**
 * @file Faixa de áreas do painel da Prefeitura, com o recorte lido da URL.
 *
 * POR QUE O `?area=` É LIDO AQUI, E NÃO NO SERVIDOR: o portal tem dois alvos.
 * No de servidor (Azure/Cloudflare) `searchParams` funcionaria na página; no
 * estático (GitHub Pages, `output: 'export'`) `searchParams` na página é erro
 * de build, e o padrão da casa para isso é o cliente ler a query (mesma
 * escolha de `prefeitura/despesas/PainelDespesas.tsx`).
 *
 * O RECORTE NÃO ESCONDE ÁREA: o painel é um índice de conteúdo que continua
 * em rota própria. Esconder as outras seções no cliente tiraria do HTML
 * estático justamente o que a regra "nada de informação do usuário pode
 * sumir" protege — e não há ganho, porque as telas já são links. O `?area=`
 * destaca o botão e ancora a seção; o `#area-<slug>` garante o mesmo salto no
 * alvo sem servidor.
 *
 * `hrefDaArea` é relativo à cidade; aqui o prefixo é montado com o primeiro
 * segmento do pathname, o mesmo critério de `lib/betim/link.tsx`. `next/link`
 * usado por `PainelFacetas` recebe então o caminho completo.
 */

interface Props {
  facetas: Faceta[];
  total: number;
  nota: string;
}

function Barra({ facetas, total, nota, atual }: Props & { atual?: string }) {
  const cidade = usePathname()?.split("/")[1] ?? "";
  const base = cidade ? `/${cidade}` : "";

  return (
    <PainelFacetas
      facetas={facetas}
      atual={atual}
      total={total}
      hrefDe={(slug) => (slug ? `${base}${hrefDaArea(slug)}` : `${base}/prefeitura`)}
      titulo="Áreas da Prefeitura"
      ariaLabel="Recorte por área da Prefeitura"
      rotuloTodos="Todas"
      nota={nota}
    />
  );
}

/** Fallback do `<Suspense>`: sem ler a query, nenhum botão ativo. */
export function BarraDeAreasCompleta(props: Props) {
  return <Barra {...props} />;
}

export default function BarraDeAreas(props: Props) {
  const pedida = useSearchParams().get("area") ?? undefined;
  // Área desconhecida na URL não deixa nenhum botão aceso — e não inventa um
  // recorte que a página não tem.
  const atual = props.facetas.some((f) => f.slug === pedida) ? pedida : undefined;
  return <Barra {...props} atual={atual} />;
}
