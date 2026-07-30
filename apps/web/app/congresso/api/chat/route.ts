import { responderAssistente } from "@/lib/chat-comum";
import { montarContexto, SYSTEM_PROMPT_CONGRESSO } from "@/lib/congresso/chat";

/**
 * Assistente do /congresso. Toda a mecânica (rate limit, provedor, degradação
 * sem chave) vive em `lib/chat-comum.ts`; aqui só a persona e o contexto.
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  return responderAssistente(req, {
    systemPrompt: SYSTEM_PROMPT_CONGRESSO,
    montarContexto,
    ondeOlhar:
      "Tente as páginas de Proposições, Alertas, Agenda ou Comissões.",
  });
}
