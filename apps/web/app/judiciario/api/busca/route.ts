import { NextResponse } from "next/server";
import { buscaRapidaJudiciario } from "@/lib/db/queries/judiciario";

/** Sugestões da barra de busca do /judiciario. Ver `congresso/api/busca`. */
export const runtime = "nodejs";

const PERGUNTAS_BASE = [
  "Quais vagas abrem no STF até 2030?",
  "Quantos ministros do STJ cada presidente nomeou?",
  "O que é o quinto constitucional?",
];

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ sugestoes: [], perguntas: [] });

  let sugestoes: Awaited<ReturnType<typeof buscaRapidaJudiciario>> = [];
  try {
    sugestoes = await buscaRapidaJudiciario(q, 8);
  } catch (e) {
    if ((e as { code?: string }).code !== "42P01") {
      return NextResponse.json({ erro: "Busca indisponível." }, { status: 500 });
    }
  }

  return NextResponse.json({
    sugestoes: sugestoes.map(({ tipo, titulo, subtitulo, href }) => ({
      tipo,
      titulo,
      subtitulo,
      href,
    })),
    perguntas: [`O que o portal tem sobre ${q}?`, ...PERGUNTAS_BASE].slice(0, 3),
  });
}
