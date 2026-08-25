import { NextResponse } from "next/server";
import { arquivosDoIndice, arquivosDeIndiceVazio, type ArquivoIndice } from "@/lib/estatico/emitir";
import { lerEstudos } from "@/lib/ambiental/estudos-dados";

/**
 * Índice estático fatiado de `/ambiental/estudos` — `manifesto.json` +
 * `0.json`, `1.json`… consumidos por `TabelaEstatica` (mesmo padrão de
 * `congresso/proposicoes/dados/[arquivo]/route.ts`, o molde exato deste
 * arquivo).
 *
 * ═══ POR QUE UM ROUTE HANDLER, E NÃO A PÁGINA EMBUTIR TUDO NO HTML ═══
 *
 * `lerEstudos().linhas` tem centenas de linhas (453, medido em 2026-08-20).
 * Embutir isso como props de componente de cliente é a regra que este
 * repositório já pagou caro por violar (ver AGENTS.md, `/ambiental/legislacao`
 * a 35,5 MiB): o mesmo payload sai serializado três vezes. Um `GET` sem
 * `Request` é suportado em `output: export` e sai como arquivo estático —
 * `lib/estatico/emitir.ts` é a peça que fecha o mecanismo.
 *
 * ═══ MEMOIZAÇÃO: A LEITURA RODA UMA VEZ, NÃO UMA VEZ POR FATIA ═══
 *
 * `generateStaticParams` decide QUANTOS arquivos existem (o que exige rodar
 * `fatiar()`, que exige os dados), e depois o Next chama `GET` uma vez PARA
 * CADA arquivo gerado. Sem cache, `lerEstudos()` (e a fatiada) rodaria de
 * novo a cada uma delas. `cache` garante uma leitura só por build,
 * reaproveitada tanto por `generateStaticParams` quanto por cada `GET`.
 */
let cache: Promise<ArquivoIndice[]> | null = null;

async function arquivos(): Promise<ArquivoIndice[]> {
  if (!cache) {
    cache = (async () => {
      const { linhas } = lerEstudos();
      if (!linhas || linhas.length === 0) return arquivosDeIndiceVazio();
      return arquivosDoIndice(linhas);
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
