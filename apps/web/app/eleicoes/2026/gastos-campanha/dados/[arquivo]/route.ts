import { NextResponse } from "next/server";
import { arquivosDoIndice, type ArquivoIndice } from "@/lib/estatico/emitir";
import linhasJson from "@/data/eleicoes/gastos-2026/linhas.json";
import type { LinhaGasto } from "@/lib/eleicoes/gastos-2026";

/**
 * Índice estático fatiado de `/eleicoes/2026/gastos-campanha` — o mesmo
 * mecanismo de `congresso/votacoes/dados/[arquivo]/route.ts` (ver o porquê
 * lá), mas sem banco: as 1.823 linhas da tabela pública já vêm prontas do
 * ETL em `data/eleicoes/gastos-2026/linhas.json`, então aqui só fatiar.
 *
 * Por que import e não `fs.readFileSync`: o import é resolvido no bundle do
 * Next — funciona igual no build, no standalone do Guara e no dev, sem
 * depender de `process.cwd()` (armadilha `DIR_CAMADAS` do AGENTS.md). O
 * `as unknown as` existe porque o TypeScript infere os 1.823 elementos do
 * JSON como união literal gigante; converter na fronteira evita o erro
 * `TS2590: union type too complex` que já derrubou um `.ts` de dados no
 * passado (AGENTS.md § 8).
 */
const linhas = linhasJson as unknown as LinhaGasto[];

let cache: ArquivoIndice[] | null = null;

function arquivos(): ArquivoIndice[] {
  if (!cache) cache = arquivosDoIndice(linhas);
  return cache;
}

export function generateStaticParams() {
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
