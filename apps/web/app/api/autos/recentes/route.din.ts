import { NextResponse } from "next/server";
import { buscar, carregarArquivoRecentes } from "@/lib/ambiental/autos-recentes";

/**
 * GET /api/autos/recentes — busca paginada dos autos de infração 2024–2026
 * do Sisema/SEMAD-MG.
 *
 * O filtro roda no servidor porque o arquivo tem 36 mil registros (6,3 MB).
 * Mandar tudo para o navegador estouraria o teto de payload (AGENTS § 5.1).
 *
 * Parâmetros: municipio, ano, situacao, valorMin, valorMax, q, pagina.
 * Resposta: total, valorTotal, porAno (para o gráfico) e a página de itens.
 */
export const dynamic = "force-dynamic";

function numero(param: string | null): number | undefined {
  if (param === null || param.trim() === "") return undefined;
  const valor = Number(param.replace(",", "."));
  return Number.isFinite(valor) ? valor : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const resultado = buscar(carregarArquivoRecentes().autos, {
    municipio: searchParams.get("municipio") ?? undefined,
    ano: searchParams.get("ano") ?? undefined,
    situacao: searchParams.get("situacao") ?? undefined,
    valorMin: numero(searchParams.get("valorMin")),
    valorMax: numero(searchParams.get("valorMax")),
    q: searchParams.get("q") ?? undefined,
    pagina: numero(searchParams.get("pagina")),
    porPagina: 20,
  });

  return NextResponse.json(resultado, {
    headers: { "Cache-Control": "no-store" },
  });
}
