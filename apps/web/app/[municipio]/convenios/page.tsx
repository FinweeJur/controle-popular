import { paramsDasCidades } from "@/lib/betim/staticParams";
import PaginaPonte from "@/app/[municipio]/components/PaginaPonte";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

/** URL de convenios municipais aponta para /emendas. */
export const generateMetadata = metadataDaCidade(
  (c) => `Convênios e Repasses de ${c.nome} — ${nomePortal(c)}`,
  (c) => `Convênios, repasses e emendas federais recebidos por ${c.nome}.`,
  "/convenios"
);

export default async function ConveniosPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  return (
    <PaginaPonte
      cidade={cidade}
      destino="/emendas"
      titulo={`Convênios e Repasses de ${cidade.nome}`}
      fonte={null}
    />
  );
}
