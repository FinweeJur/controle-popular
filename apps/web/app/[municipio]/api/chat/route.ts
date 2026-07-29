import { NextResponse } from "next/server";
import { montarContexto } from "@/lib/betim/chat";
import { obterCidadePorSlug, nomePortal } from "@/lib/db/queries/municipios";

/**
 * "Pergunte ao portal" (F8). RAG simples: recupera contexto do dado real
 * (`lib/chat.ts`) e pede pro LLM responder SÓ com base nele. Provider-
 * agnóstico (API compatível com OpenAI: DeepSeek, OpenRouter, OpenAI, um
 * modelo local…), configurado por env:
 *   AI_API_KEY   — a chave (sem ela, o chat responde um aviso, não quebra)
 *   AI_BASE_URL  — base da API (padrão: DeepSeek)
 *   AI_MODEL     — modelo (padrão: deepseek-chat)
 */
export const runtime = "nodejs";

const AI_BASE_URL = process.env.AI_BASE_URL || "https://api.deepseek.com";
const AI_MODEL = process.env.AI_MODEL || "deepseek-chat";
const AI_API_KEY = process.env.AI_API_KEY || "";

const systemPrompt = (cidade: { nome: string; uf: string; branding: unknown }) =>
  `Você é o assistente do ${nomePortal(cidade as never)}, um portal independente de transparência sobre a cidade de ${cidade.nome}-${cidade.uf}.

Regras:
- Responda em português do Brasil, claro e curto. Frases diretas.
- Use SOMENTE os dados do CONTEXTO abaixo. Nunca invente números, nomes, valores ou fatos.
- Se o contexto não tiver a resposta, diga que não encontrou esse dado no portal e sugira onde a pessoa pode olhar (ex.: página de Contratos, Câmara, Legislação).
- Não dê opinião política nem aconselhamento jurídico. Não acuse ninguém.
- Quando usar um número, diga de onde ele veio (contratos, câmara, IBGE etc.).`;

// Rate limit simples por IP (janela de 1 min). Em serverless o estado é
// por-instância, não global — é uma barreira leve, não uma garantia forte.
const JANELA_MS = 60_000;
const LIMITE_POR_JANELA = 20;
const acessos = new Map<string, number[]>();

function permitido(ip: string): boolean {
  const agora = Date.now();
  const recentes = (acessos.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  if (recentes.length >= LIMITE_POR_JANELA) return false;
  recentes.push(agora);
  acessos.set(ip, recentes);
  return true;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ municipio: string }> }
) {
  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) {
    return NextResponse.json({ erro: "Cidade não encontrada." }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (!permitido(ip)) {
    return NextResponse.json(
      { erro: "Muitas perguntas em pouco tempo. Espere um minuto e tente de novo." },
      { status: 429 }
    );
  }

  let pergunta = "";
  try {
    const body = (await req.json()) as { pergunta?: string };
    pergunta = (body.pergunta ?? "").trim();
  } catch {
    return NextResponse.json({ erro: "Pergunta inválida." }, { status: 400 });
  }
  if (!pergunta || pergunta.length < 3) {
    return NextResponse.json({ erro: "Escreva uma pergunta." }, { status: 400 });
  }
  if (pergunta.length > 500) pergunta = pergunta.slice(0, 500);

  const contexto = await montarContexto(cidade.id_municipio, pergunta);

  if (!AI_API_KEY) {
    // Sem chave de LLM: não inventa resposta. Mostra o contexto encontrado
    // (dado real) e avisa que o assistente por IA ainda não está ligado.
    return NextResponse.json({
      resposta:
        "O assistente por IA ainda não está ativo neste portal. " +
        (contexto
          ? "Enquanto isso, aqui está o que encontrei nos dados sobre sua pergunta:\n\n" + contexto
          : "Não encontrei dados diretamente ligados à sua pergunta. Tente as páginas de Contratos, Câmara ou Legislação."),
      semIa: true,
    });
  }

  try {
    const resp = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt(cidade) },
          {
            role: "user",
            content: `CONTEXTO (dados do portal):\n${contexto || "(nenhum dado específico encontrado)"}\n\nPERGUNTA: ${pergunta}`,
          },
        ],
      }),
    });

    if (!resp.ok) {
      return NextResponse.json(
        { erro: "O assistente está indisponível no momento. Tente de novo em instantes." },
        { status: 502 }
      );
    }
    const data = (await resp.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const resposta = data.choices?.[0]?.message?.content?.trim();
    if (!resposta) {
      return NextResponse.json(
        { erro: "Não consegui gerar uma resposta agora. Tente reformular a pergunta." },
        { status: 502 }
      );
    }
    return NextResponse.json({ resposta });
  } catch {
    return NextResponse.json(
      { erro: "O assistente está indisponível no momento. Tente de novo em instantes." },
      { status: 502 }
    );
  }
}
