import { NextResponse } from "next/server";
import { montarContexto } from "@/lib/betim/chat";
import { obterCidadePorSlug, nomePortal } from "@/lib/db/queries/municipios";
import { responderAssistente, REGRAS_COMUNS } from "@/lib/chat-comum";

/**
 * "Pergunte ao portal" da zona de cidades.
 *
 * A mecânica (rate limit por IP, chamada ao provedor compatível com a API da
 * OpenAI, degradação honesta sem `AI_API_KEY`) saiu daqui para
 * `lib/chat-comum.ts` quando /congresso e /judiciario ganharam assistente —
 * três cópias do mesmo rate limit divergiriam na primeira correção. O que
 * ficou é o específico da zona: resolver a cidade da URL e montar a persona
 * com o nome dela.
 */
export const runtime = "nodejs";

const systemPrompt = (cidade: { nome: string; uf: string; branding: unknown }) =>
  `Você é o assistente do ${nomePortal(cidade as never)}, um portal independente de transparência sobre a cidade de ${cidade.nome}-${cidade.uf}.

${REGRAS_COMUNS}
- Quando usar um número, diga de onde ele veio (contratos, câmara, IBGE etc.).`;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ municipio: string }> }
) {
  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) {
    return NextResponse.json({ erro: "Cidade não encontrada." }, { status: 404 });
  }

  return responderAssistente(req, {
    systemPrompt: systemPrompt(cidade),
    // O contexto é por cidade: passar o `id_municipio` aqui é o que impede o
    // assistente de uma cidade responder com o dado de outra.
    montarContexto: (pergunta) => montarContexto(cidade.id_municipio, pergunta),
    ondeOlhar: "Tente as páginas de Contratos, Câmara ou Legislação.",
  });
}
