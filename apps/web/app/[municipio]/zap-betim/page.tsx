import PaginaPonte from "@/app/[municipio]/components/PaginaPonte";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

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
