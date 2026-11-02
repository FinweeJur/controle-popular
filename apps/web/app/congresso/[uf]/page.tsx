import { redirect } from "next/navigation";

/**
 * @file `/congresso/<uf>` — atalho antigo para a bancada federal do estado.
 *
 * O QUE É: rota de conveniência criada quando cada UF ganharia uma página de
 * bancada. Nunca houve conteúdo próprio: a lista de deputados e senadores do
 * estado vive em `/congresso/parlamentares`, filtrada por `?uf=`.
 *
 * CORREÇÃO DE 02/11/2026: o destino era `/governo/<uf>/legislativo`, que
 * mostra os DEPUTADOS ESTADUAIS (ALMG) — outra casa legislativa. O top-100
 * anunciava `/congresso/mg` como "bancada federal de Minas", e o leitor caía
 * na assembleia estadual. Agora vai para o filtro certo, com a UF em caixa
 * alta porque é assim que o dado guarda a sigla.
 *
 * POR QUE CONTINUA REDIRECIONANDO, E NÃO VIRA FACETA: o painel de análises é
 * de proposições; a bancada é outro acervo (parlamentares), com filtro próprio
 * no cliente. Uma faceta aqui misturaria duas entidades.
 */

const UFS = [
  "ac", "al", "ap", "am", "ba", "ce", "df", "es", "go", "ma", "mt", "ms", "mg",
  "pa", "pb", "pr", "pe", "pi", "rj", "rn", "rs", "ro", "rr", "sc", "sp", "se", "to"
];

export async function generateStaticParams() {
  return UFS.map((uf) => ({ uf }));
}

export default async function CongressoUfPage({
  params,
}: {
  params: Promise<{ uf: string }>;
}) {
  const { uf } = await params;
  redirect(`/congresso/parlamentares?uf=${uf.toUpperCase()}`);
}
