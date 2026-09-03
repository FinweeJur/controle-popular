import { NextResponse } from "next/server";
import { responderComRag, type RespostaRag } from "@/lib/assistente/embeddings/rag";
import { OllamaIndisponivel } from "@/lib/assistente/embeddings/ollama";

/**
 * Limitador de taxa em memória por IP (Token Bucket) para proteção anti-DoS.
 * Permite até 15 perguntas por janela de 1 minuto por IP.
 */
interface RegistroLimite {
  contagem: number;
  resetEm: number;
}
const LIMITES_IP = new Map<string, RegistroLimite>();
const LIMITE_MAX_POR_MINUTO = 15;
const JANELA_MS = 60 * 1000;

function verificarLimite(ip: string): boolean {
  const agora = Date.now();
  const registro = LIMITES_IP.get(ip);

  // Limpeza de entradas expiradas para evitar vazamento de memória
  if (LIMITES_IP.size > 1000) {
    for (const [chave, val] of LIMITES_IP.entries()) {
      if (agora > val.resetEm) LIMITES_IP.delete(chave);
    }
  }

  if (!registro || agora > registro.resetEm) {
    LIMITES_IP.set(ip, { contagem: 1, resetEm: agora + JANELA_MS });
    return true;
  }

  if (registro.contagem >= LIMITE_MAX_POR_MINUTO) {
    return false;
  }

  registro.contagem += 1;
  return true;
}

/**
 * Endpoint de laboratorio do chatbot IA com RAG local.
 *
 * Esta rota so funciona em `next dev` ou em um servidor Node real — com
 * `output: export` ela nao vira arquivo estatico. O proposito e permitir
 * testar o pipeline fim-a-fim no home-pc antes de decidir como expor em
 * producao (Cloudflare Worker, serverless com Neon pgvector, etc.).
 */
export async function POST(req: Request): Promise<Response> {
  // Extrai IP cliente (via Cloudflare CF-Connecting-IP, X-Forwarded-For ou fallback)
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1";

  if (!verificarLimite(ip)) {
    return NextResponse.json(
      { erro: "Muitas perguntas enviadas em sequência. Por favor, aguarde 1 minuto antes de tentar novamente." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

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
