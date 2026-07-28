import { notFound } from "next/navigation";
import { obterCidadePorSlug, type Cidade } from "@/lib/db/queries/municipios";

export type { Cidade };

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
