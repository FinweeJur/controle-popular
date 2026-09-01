import type { NextRequest } from "next/server";
import { ipDoCliente } from "@/lib/rate-limit-ip";
import { limitarAltaFrequencia, respostaLimiteExcedido } from "@/lib/rate-limit";
import { incrementarContador, totaisContadores } from "@/lib/db/queries/betimD1";

/**
 * Contador público de envios/pedidos de dados e inscrições — o "contador de
 * envios / downloads" pedido pelo dono (PLANO-NAVEGACAO-E-NOTIFICACOES.md).
 *
 * Mesmo desenho do `/api/pageview`: POST é beacon de fogo-e-esqueça (o
 * cliente nem lê a resposta), GET alimenta o mostrador público no rodapé.
 *
 * Tipos contados (tabela `contadores` no D1):
 *   - `pedido`      — botão "Pedir dados por e-mail" (pedido iniciado)
 *   - `download`    — exportação CSV / abertura de PDF (futuro)
 *   - `notificacao` — clique em "Receber no Telegram" / "Receber por e-mail"
 *
 * Honestidade sobre a medida: contador é de CLIQUE (pedido iniciado), não de
 * e-mail efetivamente enviado — no Tier 0 o envio acontece no cliente de
 * e-mail do visitante. A contagem de atendimentos reais é manual (ver plano).
 */
export const runtime = "nodejs";

const TIPOS_VALIDOS = new Set(["pedido", "download", "notificacao"]);

export async function POST(request: NextRequest) {
  // Alta frequência (1 clique por visita): mesma régua do pageview.
  const { permitido, retryAfter } = await limitarAltaFrequencia(ipDoCliente(request));
  if (!permitido) return respostaLimiteExcedido(retryAfter);

  const tipo = request.nextUrl.searchParams.get("tipo");
  if (!tipo || !TIPOS_VALIDOS.has(tipo)) {
    return Response.json({ ok: false, error: "tipo inválido" }, { status: 400 });
  }

  try {
    await incrementarContador(tipo);
    // Sem D1 (binding ausente): responde ok mesmo assim — é fogo-e-esqueça.
  } catch {
    // Contador perdido não vale erro de volta.
  }
  return Response.json({ ok: true });
}

export async function GET() {
  try {
    const linhas = await totaisContadores();
    if (linhas === null) return Response.json({ contadores: {} });
    const contadores: Record<string, number> = {};
    for (const l of linhas) contadores[l.tipo] = l.contagem;
    return Response.json({ contadores });
  } catch {
    return Response.json({ error: "Contadores indisponíveis." }, { status: 500 });
  }
}
