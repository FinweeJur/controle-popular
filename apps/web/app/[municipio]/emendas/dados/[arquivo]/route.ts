import { NextResponse } from "next/server";
import { arquivosDoIndice, arquivosDeIndiceVazio, type ArquivoIndice } from "@/lib/estatico/emitir";
import { getConveniosFederais } from "@/lib/betim/convenios";
import { paramsDasCidades } from "@/lib/betim/staticParams";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

/**
 * Índice estático fatiado de `/[municipio]/emendas` — mesmo mecanismo de
 * `prefeitura/licitacoes/dados/[arquivo]/route.ts`.
 *
 * ═══ POR QUE ESTA PÁGINA PRECISOU DISSO, E O QUE ELA QUEBROU ANTES ═══
 *
 * Emendas era a ÚLTIMA das páginas pesadas sem fatiamento — proposições,
 * votações, contratos, licitações e servidores já tinham. Ela renderizava
 * todos os convênios inline, e enquanto só Betim tinha dado (334 convênios,
 * 2,88 MB de cache) isso passava despercebido.
 *
 * Em 2026-08-10 o ETL de Belo Horizonte entrou e trouxe **3.000 convênios
 * federais**. A entrada de cache da página foi para **24,11 MB** — contra o
 * teto de **25 MiB por arquivo** do Workers Static Assets. O deploy passou a
 * falhar com `write ECONNRESET` no POST de upload do asset, duas vezes
 * seguidas, e a mensagem do wrangler ("A fetch request failed, likely due to
 * a connectivity issue") mandava procurar rede — não o tamanho.
 *
 * Medido: ~8,6 KB de cache por convênio renderizado. 3.000 × 8,6 KB ≈ 25 MB.
 * O limite não foi estourado por pouco; foi raspado.
 *
 * A lição que fica é a do §19: página que cresce com o acervo precisa de
 * índice fatiado ANTES de a cidade grande entrar, não depois.
 */
const cache = new Map<string, Promise<ArquivoIndice[]>>();

async function arquivos(municipioSlug: string): Promise<ArquivoIndice[]> {
  let pendente = cache.get(municipioSlug);
  if (!pendente) {
    pendente = (async () => {
      const cidade = await obterCidadePorSlug(municipioSlug);
      if (!cidade) return arquivosDeIndiceVazio();
      const { convenios } = await getConveniosFederais(cidade.id_municipio);
      if (convenios.length === 0) return arquivosDeIndiceVazio();
      return arquivosDoIndice(convenios);
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
