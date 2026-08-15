import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obterCidadePorSlug, nomePortal, type Cidade } from "@/lib/db/queries/municipios";
import { aplicarEdicao } from "@/lib/edicoes";

export type { Cidade };
export { nomePortal };

/**
 * Resolve a cidade a partir do `params` da rota `/[municipio]`.
 *
 * Existe para que cada página faça UMA linha em vez de repetir
 * "await params → busca no banco → notFound se não achar" 45 vezes.
 *
 * A rota carrega o SLUG (`betim`), mas as consultas filtram por
 * `id_municipio` (`3106705`) — são coisas diferentes e é aqui que a
 * tradução acontece, num lugar só.
 *
 * Chamar isto é barato mesmo parecendo uma consulta por página: com SSG
 * roda no build, e `listarCidades()` lê uma tabela de poucas dezenas de
 * linhas.
 */
export async function cidadeDaRota(
  params: Promise<{ municipio: string }>
): Promise<Cidade> {
  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  // O layout já barra slug desconhecido, mas uma página pode ser
  // renderizada sem ele em teste — e um 404 é melhor que um `undefined`
  // vazando para dentro de uma query.
  if (!cidade) notFound();
  return cidade;
}

/**
 * Monta o `generateMetadata` de uma página do eixo Cidades.
 *
 * Existe porque `export const metadata` é um OBJETO ESTÁTICO: ele não
 * enxerga o `params` da rota, então toda página que o usava tinha o nome
 * da cidade escrito à mão — "Assistência Social — Betim em Dados |
 * Controle Popular Betim". Com duas cidades, a página de BH mostrava o
 * título de Betim na aba do navegador, no resultado do Google e no card de
 * compartilhamento. Era invisível para o compilador: o texto não é dado,
 * é literal.
 *
 * O título vem inteiro da página, INCLUSIVE o sufixo do portal. Seria mais
 * curto colar `| ${nomePortal(cidade)}` aqui, mas as páginas não usam um
 * separador só — umas fecham com `| Controle Popular Betim` e outras com
 * `— Controle Popular Betim`. Padronizar mudaria o `<title>` de umas 15
 * páginas já indexadas, o que é preço alto para economizar uma linha por
 * arquivo.
 *
 *   export const generateMetadata = metadataDaCidade(
 *     (c) => `Assistência Social — ${c.nome} em Dados | ${nomePortal(c)}`,
 *     (c) => `Benefícios sociais pagos a moradores de ${c.nome}-${c.uf}.`
 *   );
 *
 * O terceiro argumento — a sub-rota, `"/saude"` — só existe para a
 * sobreposição de `lib/edicoes.ts` saber QUAL página é esta. Sem ele, o
 * arquivo de edições não teria como distinguir `/bh/saude` de `/bh/educacao`:
 * as duas chegam aqui pelo mesmo helper, e o `params` só carrega a cidade.
 * Omiti-lo não quebra nada; apenas deixa a página fora do alcance da edição
 * manual, que é o comportamento certo para quem ainda não precisou dela.
 */
export function metadataDaCidade(
  titulo: (cidade: Cidade) => string,
  descricao: (cidade: Cidade) => string,
  subrota?: string
) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ municipio: string }>;
  }): Promise<Metadata> {
    const { municipio } = await params;
    const cidade = await cidadeDaRota(Promise.resolve({ municipio }));
    const base = { title: titulo(cidade), description: descricao(cidade) };
    if (subrota === undefined) return base;
    return aplicarEdicao(`/${municipio}${subrota}`, base);
  };
}
