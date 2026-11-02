import { paramsDasCidades } from "@/lib/betim/staticParams";
import PaginaPonte from "@/app/[municipio]/components/PaginaPonte";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

/**
 * Ponte de `/prefeitura/diarias` para o painel, área de pessoal.
 *
 * A rota deixou de existir em 02/11/2026: era uma tabela servida pelo
 * servidor, sem busca, filtro ou exportação, e virou o bloco "Diárias e
 * viagens oficiais" de `/[municipio]/prefeitura?area=pessoal`
 * (`PainelDiarias.tsx`). O conteúdo é o mesmo, linha por linha.
 *
 * POR QUE PONTE **E** `redirects()`: onde há servidor, o `next.config.ts`
 * responde 301 antes do roteamento; no alvo `output: 'export'` (GitHub
 * Pages) essa função nem é aplicada e esta página é o único redirecionamento
 * possível, via `<meta http-equiv="refresh">`. Ver o topo de `next.config.ts`.
 *
 * `fonte={null}` porque a URL existiu em TODAS as cidades — o gate de
 * `fontes.rotas_legadas` daria 404 justamente onde ela está indexada.
 *
 * O canonical aponta para o painel SEM a query (`/prefeitura`): a área é um
 * recorte de navegação, não uma URL canônica própria. O `destino` mantém o
 * `?area=` e a âncora para o leitor cair no bloco certo.
 */
export const generateMetadata = metadataDaCidade(
  (c) => `Diárias e viagens — ${c.nome} — ${nomePortal(c)}`,
  () => "Esta página mudou de endereço: as diárias agora ficam no painel da Prefeitura.",
  "/prefeitura"
);

export default async function DiariasMudouDeEndereco({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  return (
    <PaginaPonte
      cidade={cidade}
      destino="/prefeitura?area=pessoal#area-pessoal"
      canonico="/prefeitura"
      titulo="As diárias agora ficam no painel da Prefeitura"
      explicacao="A tabela de diárias e viagens virou o bloco de pessoal do painel da Prefeitura. O conteúdo é o mesmo, com as mesmas linhas — diária e passagem aérea continuam separadas."
      fonte={null}
    />
  );
}
