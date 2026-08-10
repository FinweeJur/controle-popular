import { NextResponse } from "next/server";
import { arquivosDoIndice, arquivosDeIndiceVazio, type ArquivoIndice } from "@/lib/estatico/emitir";
import { listarProposicoes } from "@/lib/congresso/proposicoes";

/**
 * Índice estático fatiado de `/congresso/proposicoes` — `manifesto.json` +
 * `0.json`, `1.json`… consumidos por `TabelaEstatica` (ver `ListaProposicoes.tsx`).
 *
 * ═══ POR QUE UM ROUTE HANDLER, E NÃO A PÁGINA EMBUTIR TUDO NO HTML ═══
 *
 * `congresso.proposicoes` tem 5.562 linhas — 16,16 MiB de JSON (medido em
 * 2026-08-09). Embutir isso no HTML da página estouraria o teto de 25 MiB por
 * arquivo do Cloudflare somado ao resto da página, e a pessoa lendo pagaria
 * o download inteiro antes de ver a primeira linha. Um `GET` sem `Request`
 * É suportado em `output: export` e sai como arquivo (ver
 * `docs/deploy-github-pages.md` §3) — é o mecanismo que faltava, e
 * `lib/estatico/emitir.ts` é a peça que fecha ele.
 *
 * ═══ MEMOIZAÇÃO: A CONSULTA RODA UMA VEZ, NÃO UMA VEZ POR FATIA ═══
 *
 * `generateStaticParams` decide QUANTOS arquivos existem (o que exige rodar
 * `fatiar()`, que exige os dados), e depois o Next chama `GET` uma vez PARA
 * CADA arquivo gerado. Sem cache, a consulta de 5.562 linhas rodaria de novo
 * a cada uma das fatias — 9 vezes para chegar a 16 MiB / 2 MiB por fatia.
 * `cache` garante uma consulta só por build, reaproveitada tanto por
 * `generateStaticParams` quanto por cada chamada de `GET`.
 */
let cache: Promise<ArquivoIndice[]> | null = null;

async function arquivos(): Promise<ArquivoIndice[]> {
  if (!cache) {
    cache = (async () => {
      const resultado = await listarProposicoes({ porPagina: 100_000 });
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
