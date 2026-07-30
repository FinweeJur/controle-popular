import { responderAssistente } from "@/lib/chat-comum";
import { montarContexto, SYSTEM_PROMPT_JUDICIARIO } from "@/lib/judiciario/chat";

/** Assistente do /judiciario. Ver `congresso/api/chat` e `lib/chat-comum.ts`. */
export const runtime = "nodejs";

export async function POST(req: Request) {
  return responderAssistente(req, {
    systemPrompt: SYSTEM_PROMPT_JUDICIARIO,
    montarContexto,
    ondeOlhar: "Tente as páginas de Tribunais, Vagas ou Indicações.",
  });
}
