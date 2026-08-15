import { NextResponse } from "next/server";
import { arquivosDoIndice, arquivosDeIndiceVazio, type ArquivoIndice } from "@/lib/estatico/emitir";
import { listarAtosDoMunicipio } from "@/lib/betim/legislacao";
import { paramsDasCidades } from "@/lib/betim/staticParams";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

/**
 * Índice estático fatiado de `/[municipio]/camara/legislacao` — mesmo mecanismo
 * de `educacao/dados/[arquivo]/route.ts` e `camara/proposicoes/dados/[arquivo]/route.ts`.
 *
 * ═══ POR QUE ESTA ROTA ENTROU NA FILA ═══
 *
 * Ela é UMA rota dinâmica servindo todas as cidades, e no build de 15/08/2026
 * duas delas já apareciam na lista dos maiores assets (cabeçalho de
 * `lib/deploy/tamanho-assets.ts`):
 *
 *     11 MiB   bh/camara/legislacao.cache
 *     9,5 MiB  diamantina/camara/legislacao.cache
 *     25 MiB   teto da Cloudflare Workers por asset
 *     20 MiB   onde a trava deste projeto avisa
 *
 * Nenhuma das duas estourou, e é esse o ponto: quando uma estourar, ela derruba
 * o deploy de TODAS — inclusive das cidades que não têm norma nenhuma. O mesmo
 * corpus já mostrou do que é capaz em `/ambiental/legislacao`, que foi de 6.378
 * para 15.318 normas numa ingestão só e levou o `.cache` a 35,5 MiB
 * (`docs/HANDOFF-PAYLOAD-LEGISLACAO.md`).
 *
 * ═══ POR QUE FATIAR, E NÃO PAGINAR NO SERVIDOR ═══
 *
 * Não há servidor no runtime: as rotas de cidade são pré-renderizadas e
 * servidas como asset estático. "Paginar" aqui significaria gerar uma rota por
 * página, e — pior — **matar a busca e os filtros**, que precisam do conjunto
 * inteiro: um filtro por categoria que só enxerga a página atual responde
 * "nenhuma norma" para normas que existem. O índice fatiado dá as duas coisas:
 * o `.cache` da página deixa de crescer com o acervo e o navegador baixa fatias
 * de no máximo 2 MiB sob demanda.
 *
 * ═══ POR QUE `generateStaticParams` DEVOLVE `{municipio, arquivo}` JUNTOS ═══
 *
 * Mesma razão de `camara/proposicoes`: `[municipio]` tem `generateStaticParams`
 * no layout, mas `output: export` exige a função DECLARADA em cada rota, e não
 * há prova de que um `route.ts` sob dois segmentos dinâmicos herde o fan-out.
 * Esta função devolve a lista completa de combinações, o que elimina a dúvida.
 *
 * ═══ SÃO DOIS CACHES, E ELES GUARDAM COISAS DIFERENTES ═══
 *
 * O da CONSULTA mora em `lib/betim/legislacao.ts`, não aqui — ao contrário das
 * rotas irmãs. A página desta rota também precisa da carga (os `<select>` de
 * categoria/ano e o ranking de áreas saem da varredura dos atos), então ele tem
 * de ser comum aos dois; ver o comentário completo lá.
 *
 * O daqui guarda os ARQUIVOS já cortados e serializados. Sem ele, cada uma das
 * ~6 fatias de Belo Horizonte remontaria o índice inteiro para devolver um
 * pedaço: `fatiar()` roda um `JSON.stringify` por linha para medir o corte, e
 * pagar isso sete vezes por cidade é trabalho puro de CPU num build que já
 * leva 6 a 7 minutos.
 */
const cache = new Map<string, Promise<ArquivoIndice[]>>();

async function arquivos(municipioSlug: string): Promise<ArquivoIndice[]> {
  let pendente = cache.get(municipioSlug);
  if (!pendente) {
    pendente = (async () => {
      const cidade = await obterCidadePorSlug(municipioSlug);
      if (!cidade) return arquivosDeIndiceVazio();
      const atos = await listarAtosDoMunicipio(cidade.id_municipio);
      if (atos.length === 0) return arquivosDeIndiceVazio();
      return arquivosDoIndice(atos);
    })();
    cache.set(municipioSlug, pendente);
  }
  return pendente;
}

export async function generateStaticParams(): Promise<{ municipio: string; arquivo: string }[]> {
  const cidades = await paramsDasCidades();
  const resultado: { municipio: string; arquivo: string }[] = [];
  for (const { municipio } of cidades) {
    const lista = await arquivos(municipio);
    for (const a of lista) resultado.push({ municipio, arquivo: a.nome });
  }
  return resultado;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ municipio: string; arquivo: string }> }
) {
  const { municipio, arquivo } = await params;
  const lista = await arquivos(municipio);
  const achado = lista.find((a) => a.nome === arquivo);
  if (!achado) {
    return new NextResponse("não encontrado", { status: 404 });
  }
  return new NextResponse(achado.conteudo, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
