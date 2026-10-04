import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obterCidadePorSlug, nomePortal, type Cidade } from "@/lib/db/queries/municipios";
import { aplicarEdicao } from "@/lib/edicoes";
import { CAPA_PADRAO, comImagemOg } from "@/lib/seo/og";

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
 * O terceiro argumento — a sub-rota, `"/saude"` — é o CAMINHO REAL da
 * página dentro da cidade, e serve para DUAS coisas:
 *
 *  1. o canonical (`/bh/saude`, nunca só `/bh`) — sem ele o Google era
 *     informado de que `/bh/saude` era uma duplicata da home da cidade e
 *     tirava a página do índice (medido no ar em 04/10/2026, em
 *     `/betim/emendas`, cujo canonical apontava para `/betim`);
 *  2. a sobreposição de `lib/edicoes.ts` saber QUAL página é esta — as duas
 *     chegam aqui pelo mesmo helper e o `params` só carrega a cidade.
 *
 * Omiti-lo não quebra o build; apenas deixa a página com canonical errado e
 * fora do alcance da edição manual. `cidade.test.ts` é a régua: falha quando
 * algum `page.tsx` chama o helper sem o terceiro argumento.
 */
const BASE_URL = "https://www.controlepopular.com.br";

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
    const title = titulo(cidade);
    const description = descricao(cidade);
    const canonical = subrota === undefined ? `/${municipio}` : `/${municipio}${subrota}`;
    const base: Metadata = {
      title,
      description,
      metadataBase: new URL(BASE_URL),
      // `images` explícito: o merge de metadata do Next é raso, e um
      // `openGraph` declarado sem `images` apaga o que a raiz trouxesse —
      // o cartão saía sem foto (medido em /betim/emendas, 04/10/2026).
      openGraph: comImagemOg(
        {
          type: "website",
          locale: "pt_BR",
          url: canonical,
          siteName: "Controle Popular",
          title,
          description,
        },
        title
      ),
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [CAPA_PADRAO],
      },
      alternates: {
        canonical,
      },
    };
    if (subrota === undefined) return base;
    // `Metadata.title` é tipado como string | TemplateString | null | undefined,
    // mas aqui sempre vem de uma função que retorna string. O cast preserva
    // o contrato exigido por `aplicarEdicao` sem alterar o valor em runtime.
    return aplicarEdicao(canonical, base as Metadata & { title: string });
  };
}
