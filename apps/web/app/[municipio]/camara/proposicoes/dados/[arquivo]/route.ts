import { NextResponse } from "next/server";
import { arquivosDoIndice, arquivosDeIndiceVazio, type ArquivoIndice } from "@/lib/estatico/emitir";
import { fetchProposicoes } from "@/lib/betim/proposicoes";
import { paramsDasCidades } from "@/lib/betim/staticParams";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

/**
 * Índice estático fatiado de `/[municipio]/camara/proposicoes` — mesmo
 * mecanismo do eixo Congresso (`congresso/proposicoes/dados/[arquivo]/route.ts`),
 * agora por CIDADE.
 *
 * ═══ POR QUE `generateStaticParams` DEVOLVE `{municipio, arquivo}` JUNTOS ═══
 *
 * `[municipio]` já tem `generateStaticParams` no layout, e cada `page.tsx` da
 * zona precisa DECLARAR a própria (não herdar por re-export — ver
 * `lib/betim/staticParams.ts` e `docs/deploy-github-pages.md` §8.1, o mesmo
 * bloqueio de `output: export`). Não há prova de que um `route.ts` aninhado
 * sob `[municipio]` herde de forma diferente, e testar isso por tentativa
 * custaria um build inteiro por hipótese. Em vez de confiar num fan-out
 * implícito entre os dois segmentos dinâmicos, este `generateStaticParams`
 * devolve a lista completa de combinações `{municipio, arquivo}` ele mesmo —
 * elimina a dúvida.
 *
 * ═══ MEMOIZAÇÃO POR CIDADE ═══
 *
 * Mesmo motivo do eixo Congresso, mas agora uma consulta por cidade: sem
 * cache, `betim` sozinha rodaria a consulta de novo a cada fatia gerada.
 *
 * ═══ VOLUME MEDIDO (só Betim tem dado neste banco local, 2026-08-09) ═══
 *
 *     2.733 proposições · 1,67 MiB
 *
 * Cabe numa fatia só (orçamento padrão de 2 MiB). Belo Horizonte, São Paulo,
 * Araçuaí e Diamantina estão zeradas nesta tabela neste banco — o mecanismo
 * segue correto pra elas via `arquivosDeIndiceVazio()`.
 */
const cache = new Map<string, Promise<ArquivoIndice[]>>();

async function arquivos(municipioSlug: string): Promise<ArquivoIndice[]> {
  let pendente = cache.get(municipioSlug);
  if (!pendente) {
    pendente = (async () => {
      const cidade = await obterCidadePorSlug(municipioSlug);
      if (!cidade) return arquivosDeIndiceVazio();
      const { rows } = await fetchProposicoes(cidade.id_municipio, { porPagina: 100_000 });
      if (rows.length === 0) return arquivosDeIndiceVazio();
      return arquivosDoIndice(rows);
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
