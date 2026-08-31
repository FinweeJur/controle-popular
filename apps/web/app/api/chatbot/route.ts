import { NextResponse } from "next/server";
import { responderComRag, type RespostaRag } from "@/lib/assistente/embeddings/rag";
import { OllamaIndisponivel } from "@/lib/assistente/embeddings/ollama";

/**
 * Endpoint de laboratorio do chatbot IA com RAG local.
 *
 * Esta rota so funciona em `next dev` ou em um servidor Node real — com
 * `output: export` ela nao vira arquivo estatico. O proposito e permitir
 * testar o pipeline fim-a-fim no home-pc antes de decidir como expor em
 * producao (Cloudflare Worker, serverless com Neon pgvector, etc.).
 */
export async function POST(req: Request): Promise<Response> {
  let pergunta = "";
  try {
    const body = (await req.json()) as { pergunta?: string };
    pergunta = (body.pergunta ?? "").trim();
  } catch {
    return NextResponse.json({ erro: "Pergunta invalida." }, { status: 400 });
  }

  if (!pergunta || pergunta.length < 3) {
    return NextResponse.json({ erro: "Escreva uma pergunta." }, { status: 400 });
  }
  if (pergunta.length > 500) pergunta = pergunta.slice(0, 500);

  try {
    const resposta: RespostaRag = await responderComRag(pergunta);
    return NextResponse.json(resposta);
  } catch (e) {
    if (e instanceof OllamaIndisponivel) {
      // Mensagem pública não expõe o endereço interno do servidor local:
      // quem mantém o portal vê o detalhe no log; quem pergunta vê o
      // caminho honesto (usar os menus de respostas prontas).
      return NextResponse.json(
        { erro: "A IA do assistente não está disponível agora. Use os menus de respostas prontas ou tente de novo em instantes." },
        { status: 503 }
      );
    }
    const mensagem = e instanceof Error ? e.message : "Erro ao gerar resposta";
    return NextResponse.json({ erro: mensagem }, { status: 500 });
  }
}
