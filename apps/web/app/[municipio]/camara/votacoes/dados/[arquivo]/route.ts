import { NextResponse } from "next/server";
import { arquivosDoIndice, arquivosDeIndiceVazio, type ArquivoIndice } from "@/lib/estatico/emitir";
import { fetchVotacoes } from "@/lib/betim/votacoesCamara";
import { paramsDasCidades } from "@/lib/betim/staticParams";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

/**
 * Índice estático fatiado de `/[municipio]/camara/votacoes` — mesmo
 * mecanismo de `camara/proposicoes/dados/[arquivo]/route.ts` (ver lá o
 * porquê do `generateStaticParams` devolver `{municipio, arquivo}` já
 * combinados, em vez de confiar em fan-out entre os dois segmentos).
 *
 * `votacoes_camara` está com **ZERO linhas em TODAS as cidades** neste banco
 * local — o mecanismo aqui só é exercitado pelo caminho vazio
 * (`arquivosDeIndiceVazio()`). Câmara que não publica voto individual
 * (Belo Horizonte, ver `lib/betim/votacoesCamara.ts`) tem esse mesmo estado
 * mesmo com produção rodando — "vazio" não é necessariamente ausência de
 * dado.
 */
const cache = new Map<string, Promise<ArquivoIndice[]>>();

async function arquivos(municipioSlug: string): Promise<ArquivoIndice[]> {
  let pendente = cache.get(municipioSlug);
  if (!pendente) {
    pendente = (async () => {
      const cidade = await obterCidadePorSlug(municipioSlug);
      if (!cidade) return arquivosDeIndiceVazio();
      const { rows } = await fetchVotacoes(cidade.id_municipio, { porPagina: 100_000 });
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
