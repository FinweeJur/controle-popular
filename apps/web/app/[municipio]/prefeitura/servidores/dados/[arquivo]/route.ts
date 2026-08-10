import { NextResponse } from "next/server";
import { arquivosDoIndice, arquivosDeIndiceVazio, type ArquivoIndice } from "@/lib/estatico/emitir";
import { getServidores } from "@/lib/betim/servidores";
import { paramsDasCidades } from "@/lib/betim/staticParams";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

/**
 * Índice estático fatiado de `/[municipio]/prefeitura/servidores` — mesmo
 * mecanismo de `camara/proposicoes/dados/[arquivo]/route.ts`.
 *
 * ═══ VOLUME MEDIDO (só Betim tem dado neste banco local, 2026-08-09) ═══
 *
 *     9.803 servidores · 2,96 MiB → 2 fatias (orçamento padrão de 2 MiB)
 *
 * É a maior das tabelas pesadas por cidade neste banco. O comentário
 * original de `lib/betim/servidores.ts` já registra a razão de existir
 * (~9,8k linhas, teto de 1000 do antigo PostgREST) — e é exatamente a
 * mesma razão pela qual embutir tudo no HTML da página, como as sete
 * páginas do §8.2 fazem, não serviria aqui: o arquivo estouraria o que uma
 * conexão ruim aguenta baixar antes de mostrar a primeira linha. Em São
 * Paulo (fora deste banco local) a doc registra >100 mil linhas — o
 * mecanismo de fatias existe pensando nesse caso, não no de Betim.
 */
const cache = new Map<string, Promise<ArquivoIndice[]>>();

async function arquivos(municipioSlug: string): Promise<ArquivoIndice[]> {
  let pendente = cache.get(municipioSlug);
  if (!pendente) {
    pendente = (async () => {
      const cidade = await obterCidadePorSlug(municipioSlug);
      if (!cidade) return arquivosDeIndiceVazio();
      const { rows } = await getServidores(cidade.id_municipio, { porPagina: 200_000 });
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
