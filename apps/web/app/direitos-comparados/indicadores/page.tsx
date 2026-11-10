import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/direitos-comparados/indicadores`.
 *
 * O laboratório isolado de indicadores foi unificado ao Painel Nacional de Indicadores
 * em `/indicadores` em 02/11/2026.
 *
 * O destino vem de `lib/redirects/rotas-antigas.ts`, que alimenta o redirects() do
 * `next.config.ts`. No alvo estático, esta página serve de ponte canônica.
 */
const ROTA = "/direitos-comparados/indicadores";

export const metadata: Metadata = {
  title: "Comparador de Indicadores — endereço novo | Controle Popular",
  description: "Os indicadores de direitos, saúde pública, educação básica e desenvolvimento humano foram unificados em /indicadores.",
  robots: { index: false, follow: true },
};

export default function PonteComparadorIndicadores() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();

  return (
    <PaginaPonte
      destino={destino}
      titulo="Indicadores agora estão unificados no Painel Cívico Nacional"
      descricao="O comparador de direitos, os dados de saúde pública do SUS, de educação básica e de desenvolvimento humano foram integrados em um painel interativo completo dos 27 estados e municípios."
    />
  );
}
