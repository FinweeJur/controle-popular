import { NextResponse } from "next/server";

/**
 * Núcleo compartilhado do assistente das três zonas.
 *
 * O que é comum: ler e validar a pergunta, o rate limit por IP, chamar o
 * provedor compatível com a API da OpenAI, degradar sem chave, e a forma da
 * resposta JSON. O que muda por zona é só o SYSTEM PROMPT e a função que
 * monta o CONTEXTO a partir do dado real — as duas entram por parâmetro.
 *
 * Extraído de `app/[municipio]/api/chat/route.ts`, que era a única
 * implementação. Copiá-lo para /congresso e /judiciario duplicaria o rate
 * limit e a degradação sem chave em três lugares, e o modo de falha dessa
 * duplicação é ruim de notar: uma zona ganharia uma correção de segurança
 * que as outras duas não.
 *
 * A REGRA ANTI-ALUCINAÇÃO É A MESMA DAS TRÊS, e não é negociável: o modelo
 * responde SÓ com o contexto recebido, e o contexto sai de consulta ao banco.
 * Nenhum número deste portal é escrito por LLM — a mesma disciplina do
 * pipeline de análise, onde o modelo extrai e o score é calculado.
 */

const AI_BASE_URL = process.env.AI_BASE_URL || "https://api.deepseek.com";
const AI_MODEL = process.env.AI_MODEL || "deepseek-v4-flash";
const AI_API_KEY = process.env.AI_API_KEY || "";

// Rate limit por IP, janela de 1 min. Em serverless o estado é por-instância,
// não global — é barreira leve, não garantia forte.
const JANELA_MS = 60_000;
const LIMITE_POR_JANELA = 20;
const acessos = new Map<string, number[]>();

/**
 * IP do visitante para o rate limit — não é `X-Forwarded-For`.
 *
 * A Cloudflare ACRESCENTA o IP real ao FINAL do `X-Forwarded-For`, não
 * substitui o cabeçalho recebido do cliente. Então `X-Forwarded-For.split(",")[0]`
 * é o PRIMEIRO valor da lista — e esse primeiro valor é o que o próprio
 * cliente mandou. Quem quiser ganhar um balde novo por requisição só precisa
 * mandar um XFF diferente a cada vez; o limitador de `permitido()` virava
 * decorativo.
 *
 * `CF-Connecting-IP` é a borda quem escreve, sempre — o cliente não consegue
 * forjar porque a Cloudflare reescreve esse cabeçalho específico em toda
 * requisição que passa por ela, descartando o que veio do cliente.
 *
 * Em dev local (`next dev`) não existe borda nenhuma, logo não existe
 * `CF-Connecting-IP` — a requisição nem passou pela Cloudflare. Cair para
 * XFF (ou "anon") AQUI é seguro: é o próprio processo local recebendo a
 * própria requisição, não há atacante entre as duas pontas para forjar nada.
 * Cair para XFF em PRODUÇÃO anularia o conserto — por isso o fallback para
 * XFF é só isso, um fallback de desenvolvimento, nunca o caminho real atrás
 * da Cloudflare.
 */
export function ipDoVisitante(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
}

function permitido(ip: string): boolean {
  const agora = Date.now();
  const recentes = (acessos.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  if (recentes.length >= LIMITE_POR_JANELA) return false;
  recentes.push(agora);
  acessos.set(ip, recentes);
  return true;
}

/** Regras de resposta idênticas nas três zonas, para não derivarem. */
export const REGRAS_COMUNS = `Regras:
- Responda em português do Brasil, claro e curto. Frases diretas.
- Use SOMENTE os dados do CONTEXTO abaixo. Nunca invente números, nomes, datas, valores ou dispositivos legais.
- Se o contexto não tiver a resposta, diga que não encontrou esse dado no portal e sugira em qual página olhar.
- Não dê opinião política nem aconselhamento jurídico. Não acuse ninguém.
- Quando usar um número, diga de onde ele veio.`;

export interface OpcoesAssistente {
  /** Persona e escopo da zona, já com as `REGRAS_COMUNS` embutidas. */
  systemPrompt: string;
  /** Recupera contexto do banco para a pergunta. String vazia = nada achado. */
  montarContexto: (pergunta: string) => Promise<string>;
  /** Páginas a sugerir quando não há chave de LLM nem contexto. */
  ondeOlhar: string;
}

export async function responderAssistente(req: Request, op: OpcoesAssistente) {
  const ip = ipDoVisitante(req);
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

  let contexto = "";
  try {
    contexto = await op.montarContexto(pergunta);
  } catch {
    // Falha na recuperação degrada para "sem contexto", o que faz o modelo
    // dizer que não encontrou — e não inventar.
    contexto = "";
  }

  if (!AI_API_KEY) {
    // Sem chave: NÃO inventa resposta. Mostra o dado real encontrado e avisa
    // que o assistente por IA não está ligado. É a diferença entre um portal
    // honesto e um que simula funcionar.
    return NextResponse.json({
      resposta:
        "O assistente por IA ainda não está ativo neste portal. " +
        (contexto
          ? "Enquanto isso, aqui está o que encontrei nos dados sobre sua pergunta:\n\n" +
            contexto
          : `Não encontrei dados diretamente ligados à sua pergunta. ${op.ondeOlhar}`),
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
          { role: "system", content: op.systemPrompt },
          {
            role: "user",
            content: `CONTEXTO (dados do portal):\n${
              contexto || "(nenhum dado específico encontrado)"
            }\n\nPERGUNTA: ${pergunta}`,
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
