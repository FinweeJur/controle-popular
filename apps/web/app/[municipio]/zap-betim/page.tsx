import { paramsDasCidades } from "@/lib/betim/staticParams";
import PaginaPonte from "@/app/[municipio]/components/PaginaPonte";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

/** URL antiga de `/zap`, preservada só para Betim. Ver `PaginaPonte`. */
export const generateMetadata = metadataDaCidade(
  (c) => `Zap ${c.nome} mudou de endereço | ${nomePortal(c)}`,
  (c) => `A página de negócios locais de ${c.nome} agora fica em /zap.`
);

export default async function ZapBetimLegado({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  return <PaginaPonte cidade={cidade} destino="/zap" titulo={`Zap ${cidade.nome}`} />;
}
