import { NextResponse } from "next/server";
import { arquivosDoIndice, arquivosDeIndiceVazio, type ArquivoIndice } from "@/lib/estatico/emitir";
import { listarEscolasDoMunicipio } from "@/lib/betim/educacao";
import { paramsDasCidades } from "@/lib/betim/staticParams";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

/**
 * Índice estático fatiado de `/[municipio]/educacao` — mesmo mecanismo de
 * `emendas/dados/[arquivo]/route.ts` e `prefeitura/servidores/dados/[arquivo]/route.ts`.
 *
 * ═══ POR QUE ESTA PÁGINA ENTROU NA FILA, ANTES DE QUEBRAR ═══
 *
 * `emendas` só ganhou fatiamento DEPOIS de o deploy falhar (24,11 MB contra
 * teto de 25 MiB, quando os 3.000 convênios de BH entraram). Aqui é o caso
 * inverso, e de propósito: `sp/educacao.cache` publicava **21 MiB** no build de
 * 15/08/2026 — abaixo do teto, no ar, e sem ninguém ter mexido nele.
 *
 * Medido nesta árvore com build real (6 cidades, 0 a 16.000 escolas sintéticas
 * de 45 caracteres; `.cache` remontado como `@opennextjs/aws/dist/build/createAssets.js`
 * o monta, e regressão linear sobre os seis pontos):
 *
 *     custo fixo da rota ......... 190,3 KiB
 *     custo por escola ........... 2.200,6 bytes
 *     teto de 25 MiB atingido em . 11.824 escolas
 *
 * Os 21 MiB de São Paulo correspondem a ~9.900 escolas nessa régua. Faltam
 * ~1.900 — **19% de crescimento do acervo** — para o deploy morrer sozinho na
 * ingestão seguinte. É a lição do §19 aplicada antes do susto, não depois.
 *
 * ═══ POR QUE FATIAR, E NÃO PAGINAR NO SERVIDOR ═══
 *
 * Paginar no servidor era a outra saída, e ela não sobrevive ao alvo: não há
 * servidor no runtime: as rotas de cidade são pré-renderizadas e servidas como
 * asset estático. "Paginar" aqui significaria gerar uma rota por página (~200
 * páginas só para São Paulo, ×6 cidades) e, pior, **matar a busca** — filtrar
 * exige o conjunto inteiro, e uma busca que só enxerga a página atual responde
 * "nenhuma escola" para uma escola que existe. Trocar a lista completa por
 * paginação de servidor seria perder função para ganhar bytes.
 *
 * O índice fatiado dá as duas coisas: o `.cache` da página deixa de crescer com
 * o acervo (as escolas saem dele por completo) e o navegador baixa fatias de no
 * máximo 2 MiB sob demanda, com a busca cobrindo tudo assim que a última chega
 * — o contrato que `TabelaEstatica` já cumpre em nove outras tabelas deste
 * repositório.
 */
const cache = new Map<string, Promise<ArquivoIndice[]>>();

async function arquivos(municipioSlug: string): Promise<ArquivoIndice[]> {
  let pendente = cache.get(municipioSlug);
  if (!pendente) {
    pendente = (async () => {
      const cidade = await obterCidadePorSlug(municipioSlug);
      if (!cidade) return arquivosDeIndiceVazio();
      const escolas = await listarEscolasDoMunicipio(cidade.id_municipio);
      if (escolas.length === 0) return arquivosDeIndiceVazio();
      return arquivosDoIndice(escolas);
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
