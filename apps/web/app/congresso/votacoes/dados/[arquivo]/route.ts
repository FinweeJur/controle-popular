import { NextResponse } from "next/server";
import { arquivosDoIndice, arquivosDeIndiceVazio, type ArquivoIndice } from "@/lib/estatico/emitir";
import { listarVotacoes } from "@/lib/congresso/votacoes";

/**
 * Índice estático fatiado de `/congresso/votacoes` — mesmo mecanismo de
 * `congresso/proposicoes/dados/[arquivo]/route.ts` (ver o porquê lá).
 *
 * `congresso.votacoes` está com **ZERO linhas neste banco local** — não dá
 * para medir o volume real aqui. O comentário de `lib/congresso/votacoes.ts`
 * registra a escala de produção: "2.754 votações, ~513 parlamentares" — cada
 * votação carrega o voto individual de cada parlamentar presente, então o
 * pior caso por linha é maior que o de `proposicoes`. O caminho vazio
 * (`arquivosDeIndiceVazio()`) é o que este build local de fato exercita; o
 * caminho com dado precisa ser reconferido quando houver banco de produção.
 */
let cache: Promise<ArquivoIndice[]> | null = null;

async function arquivos(): Promise<ArquivoIndice[]> {
  if (!cache) {
    cache = (async () => {
      const resultado = await listarVotacoes({ porPagina: 100_000 });
      if (!resultado || resultado.itens.length === 0) return arquivosDeIndiceVazio();
      return arquivosDoIndice(resultado.itens);
    })();
  }
  return cache;
}

export async function generateStaticParams() {
  const lista = await arquivos();
  return lista.map((a) => ({ arquivo: a.nome }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ arquivo: string }> }) {
  const { arquivo } = await params;
  const lista = await arquivos();
  const achado = lista.find((a) => a.nome === arquivo);
  if (!achado) {
    return new NextResponse("não encontrado", { status: 404 });
  }
  return new NextResponse(achado.conteudo, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
