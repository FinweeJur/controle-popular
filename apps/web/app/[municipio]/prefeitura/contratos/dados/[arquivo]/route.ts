import { NextResponse } from "next/server";
import { arquivosDoIndice, arquivosDeIndiceVazio, type ArquivoIndice } from "@/lib/estatico/emitir";
import { fetchContratos } from "@/lib/betim/contratos";
import { paramsDasCidades } from "@/lib/betim/staticParams";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

/**
 * Índice estático fatiado de `/[municipio]/prefeitura/contratos` — mesmo
 * mecanismo de `camara/proposicoes/dados/[arquivo]/route.ts`.
 *
 * `fetchContratos({ porPagina: 100_000 })`, sem `alerta`/`motivo`/`tema`/
 * `ano`/`status`/valor: busca a cidade INTEIRA, sem filtro nenhum — inclui
 * `anexarSancoesCeis` normalmente, porque essa função roda sobre `rows`
 * (que aqui é a cidade inteira, não uma página de 25).
 *
 * Volume medido (só Betim tem dado neste banco local, 2026-08-09): 796
 * contratos, 2,18 MiB — 2 fatias no orçamento padrão de 2 MiB.
 */
const cache = new Map<string, Promise<ArquivoIndice[]>>();

async function arquivos(municipioSlug: string): Promise<ArquivoIndice[]> {
  let pendente = cache.get(municipioSlug);
  if (!pendente) {
    pendente = (async () => {
      const cidade = await obterCidadePorSlug(municipioSlug);
      if (!cidade) return arquivosDeIndiceVazio();
      const { rows } = await fetchContratos(cidade.id_municipio, { porPagina: 100_000 });
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
