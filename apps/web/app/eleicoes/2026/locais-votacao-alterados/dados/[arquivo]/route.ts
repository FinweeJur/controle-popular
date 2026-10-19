import { NextResponse } from "next/server";
import { arquivosDoIndice } from "@/lib/estatico/emitir";
import { linhasAlteradas } from "@/lib/eleicoes/locais-votacao-2026";

/**
 * Índice estático fatiado de `/eleicoes/2026/locais-votacao-alterados` —
 * mesmo mecanismo de `congresso/votacoes/dados/[arquivo]/route.ts`
 * (ver o porquê lá): o servidor NÃO serializa as 12+ mil linhas no
 * payload da página (AGENTS.md § 5.1); `TabelaEstatica` baixa o
 * `manifesto.json` e as fatias.
 *
 * Fonte: TSE — Dados abertos, coleta de 18/10/2026.
 */
let cache: ReturnType<typeof arquivosDoIndice> | null = null;

function arquivos() {
  if (!cache) cache = arquivosDoIndice(linhasAlteradas);
  return cache;
}

export async function generateStaticParams() {
  return arquivos().map((a) => ({ arquivo: a.nome }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ arquivo: string }> }) {
  const { arquivo } = await params;
  const achado = arquivos().find((a) => a.nome === arquivo);
  if (!achado) {
    return new NextResponse("não encontrado", { status: 404 });
  }
  return new NextResponse(achado.conteudo, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
