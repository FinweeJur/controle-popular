import { NextResponse } from "next/server";
import { arquivosDoIndice, arquivosDeIndiceVazio, type ArquivoIndice } from "@/lib/estatico/emitir";
import { bonsExemplos } from "@/lib/congresso/destaques";

/**
 * Índice estático fatiado de `/congresso/bons-exemplos` — mesmo mecanismo
 * de `congresso/proposicoes/dados/[arquivo]/route.ts`.
 *
 * ═══ POR QUE ESTA É PESADA E `congresso/alertas` NÃO ═══
 *
 * As duas tinham exatamente a mesma armadilha (`bonsExemplos(limite, tema)`
 * filtra por tema no conjunto INTEIRO e só depois corta em 60 — nessa
 * ordem). A diferença é volume: medido em 2026-08-09, `alertas` tem 18
 * análises reducionistas (embutir tudo no HTML, como `AlertasLista.tsx`
 * faz, é barato) — `bons-exemplos` tem **360** garantistas, grande o
 * bastante para valer o índice fatiado em vez de embutir no HTML.
 *
 * `bonsExemplos()` SEM limite nem tema: o conjunto inteiro, já ordenado por
 * score (mais expressivo primeiro) — `ListaBonsExemplos.tsx` filtra por tema
 * e corta em 60 no cliente, mesma ordem de operações do SQL original.
 */
let cache: Promise<ArquivoIndice[]> | null = null;

async function arquivos(): Promise<ArquivoIndice[]> {
  if (!cache) {
    cache = (async () => {
      const todos = await bonsExemplos();
      if (todos.length === 0) return arquivosDeIndiceVazio();
      return arquivosDoIndice(todos);
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
