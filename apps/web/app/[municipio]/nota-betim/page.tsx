import { paramsDasCidades } from "@/lib/betim/staticParams";
import PaginaPonte from "@/app/[municipio]/components/PaginaPonte";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

/** URL antiga de `/nota-transparencia`, preservada só para Betim. */
export const generateMetadata = metadataDaCidade(
  (c) => `Nota ${c.nome} mudou de endereço | ${nomePortal(c)}`,
  (c) => `A nota de transparência de ${c.nome} agora fica em /nota-transparencia.`
);

export default async function NotaBetimLegado({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  return (
    <PaginaPonte
      cidade={cidade}
      destino="/nota-transparencia"
      titulo={`Nota ${cidade.nome}`}
    />
  );
}
