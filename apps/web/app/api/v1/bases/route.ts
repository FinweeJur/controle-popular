import { NextResponse } from "next/server";
import catalogo from "@/data/catalogo-bases-dados.json";

export const runtime = "nodejs";
/**
 * ESTÁTICO DE PROPÓSITO: esta rota devolve um catálogo fixo (um JSON
 * importado), sem banco nem Request. No alvo `output: export` (GitHub Pages)
 * o Next exige `force-static` em route handler; com ele a API pública
 * `/api/v1/bases` também é servida na cópia estática, como um arquivo.
 */
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(
    {
      portal: "Controle Popular",
      versao: "1.0",
      licenca: "Open Data / Dominio Publico Oficial",
      totalBases: catalogo.length,
      bases: catalogo,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
