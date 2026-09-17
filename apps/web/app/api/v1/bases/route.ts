import { NextResponse } from "next/server";
import catalogo from "@/data/catalogo-bases-dados.json";

export const runtime = "edge";

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
