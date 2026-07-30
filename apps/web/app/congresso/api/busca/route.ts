import { NextResponse } from "next/server";
import { buscaRapidaCongresso } from "@/lib/db/queries/congresso";

/**
 * Sugestões da barra de busca do /congresso (autocomplete).
 *
 * Devolve DUAS coisas: entidades para ir direto (proposição, comissão,
 * autor, bancada, evento) e perguntas prontas para o assistente. É a
 * diferença entre uma busca e um chat — a maior parte das intenções é
 * navegacional ("quero a PL 3611"), e forçar todo mundo a conversar com um
 * modelo para chegar numa página que existe é pior e mais caro.
 *
 * Sem cache HTTP de propósito: a resposta depende do prefixo digitado e o
 * volume é baixo (uma consulta ao Postgres por tecla, com debounce de
 * 180 ms no cliente).
 */
export const runtime = "nodejs";

const PERGUNTAS_BASE = [
  "Quais projetos restringem direitos agora?",
  "O que a CCJC tem na pauta?",
  "Quais audiências públicas estão marcadas?",
];

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ sugestoes: [], perguntas: [] });

  let sugestoes: Awaited<ReturnType<typeof buscaRapidaCongresso>> = [];
  try {
    sugestoes = await buscaRapidaCongresso(q, 8);
  } catch (e) {
    // Tabela ausente (migration pendente) não pode derrubar a barra de
    // busca inteira — ela degrada para só as perguntas.
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
    // A pergunta com o termo digitado vem primeiro: é a que o usuário
    // provavelmente quer, e as fixas servem de exemplo do que dá para pedir.
    perguntas: [`O que o portal tem sobre ${q}?`, ...PERGUNTAS_BASE].slice(0, 3),
  });
}
