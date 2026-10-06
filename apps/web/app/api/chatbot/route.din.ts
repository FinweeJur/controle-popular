import { NextResponse } from "next/server";
import { responderComRag, type RespostaRag } from "@/lib/assistente/embeddings/rag";
import { OllamaIndisponivel } from "@/lib/assistente/embeddings/ollama";
import { sanitizarEntradaUsuario } from "@/lib/seguranca/blindagem-prompt";
import { ipDoCliente } from "@/lib/rate-limit-ip";

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
 * Endpoint do chatbot IA do Seu Nonô com RAG.
 *
 * Roda no servidor Node real — no alvo principal (Guara Cloud, standalone),
 * nos servidores de teste (home-pc, `next start`) e no `next dev`. Com
 * `output: export` (GitHub Pages) esta rota nao vira arquivo estatico e a
 * IA nao existe; o widget cai na escada deterministica.
 *
 * O RAG e em memoria (`montarAcervo` + indice vetorial do processo): NAO usa
 * o Postgres nem pgvector — as tabelas `embeddings` do schema estao fora
 * deste caminho. Os embeddings vem do Ollama local ou de API remota
 * (`EMBED_API_KEY`), e a geracao do provedor remoto ativo
 * (`AI_API_KEY_DEEPSEEK`/`MARITACA`/`LING` ou `AI_API_KEY`+`AI_BASE_URL`),
 * caindo para Ollama quando nao ha chave.
 */
export async function POST(req: Request): Promise<Response> {
  // IP do cliente pelo cabeçalho que a Cloudflare seta na borda
  // (`lib/rate-limit-ip.ts`). NÃO ler `x-forwarded-for` cru: o cliente pode
  // mandá-lo e a borda o repassa, então o primeiro valor é falsificável.
  const ip = ipDoCliente(req);

  if (!verificarLimite(ip)) {
    return NextResponse.json(
      { erro: "Muitas perguntas enviadas em sequência. Por favor, aguarde 1 minuto antes de tentar novamente." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let pergunta = "";
  let pathname: string | undefined;
  let titulo: string | undefined;
  try {
    const body = (await req.json()) as {
      pergunta?: string;
      pathname?: string;
      titulo?: string;
    };
    pergunta = (body.pergunta ?? "").trim();
    if (typeof body.pathname === "string" && body.pathname.trim()) {
      pathname = body.pathname.trim().slice(0, 200);
    }
    if (typeof body.titulo === "string" && body.titulo.trim()) {
      titulo = body.titulo.trim().slice(0, 200);
    }
  } catch {
    return NextResponse.json({ erro: "Pergunta invalida." }, { status: 400 });
  }

  if (!pergunta || pergunta.length < 3) {
    return NextResponse.json({ erro: "Escreva uma pergunta." }, { status: 400 });
  }

  // Blindagem contra injeção de prompt e jailbreak
  const diagnostico = sanitizarEntradaUsuario(pergunta);
  if (!diagnostico.seguro) {
    return NextResponse.json(
      { erro: diagnostico.textoSanitizado },
      { status: 400 }
    );
  }
  pergunta = diagnostico.textoSanitizado;

  try {
    const resposta: RespostaRag = await responderComRag(pergunta, { pathname, titulo });
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
