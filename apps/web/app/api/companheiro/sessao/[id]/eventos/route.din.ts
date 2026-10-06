/**
 * Stream de eventos da sessão pareada (SSE) — o canal onde os dois lados
 * ouvem o mesmo turno.
 *
 * PAPEL NO PROJETO
 * ----------------
 * O widget do site e o companheiro de desktop abrem cada um o seu
 * `EventSource` aqui. Quando `/perguntar` publica um `turno`, os dois recebem
 * a mesma `RespostaCompanheiro`: o chat abre o link e o bichinho segue os
 * galhos. Eventos: `aberta` (conexão), `pareada`, `turno`, `fechada`.
 *
 * DECISÃO TÉCNICA
 * ---------------
 * `ReadableStream` cru com `text/event-stream` (sem biblioteca): o navegador já
 * entende SSE e reconecta sozinho. Um comentário `: ping` a cada 15 s mantém
 * proxies e a conexão vivos. `X-Accel-Buffering: no` evita que um proxy
 * intermediário segure os pedaços.
 *
 * O `id` da sessão é tipado explicitamente (`params` é uma Promise no Next 16),
 * sem depender do tipo global `RouteContext` gerado no build.
 */

import { obterSessao, inscreverSessao, type EventoSessao } from "@/lib/companheiro/sessao";

export const dynamic = "force-dynamic";

const INTERVALO_BATIMENTO_MS = 15_000;

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await ctx.params;
  const sessao = obterSessao(id);
  if (!sessao) {
    return new Response(JSON.stringify({ erro: "Sessao nao encontrada ou expirada." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  let encerrado = false;
  let cancelar = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const escrever = (texto: string) => {
        if (encerrado) return;
        try {
          controller.enqueue(encoder.encode(texto));
        } catch {
          // Stream já fechado pelo cliente: o cancel abaixo limpa o resto.
        }
      };
      const enviar = (evento: EventoSessao) => {
        escrever(`event: ${evento.tipo}\ndata: ${JSON.stringify(evento)}\n\n`);
      };

      // Primeiro quadro: prova que a conexão abriu e entrega o estado inicial.
      enviar({
        tipo: "aberta",
        em: Date.now(),
        dados: { id: sessao.id, expiraEm: sessao.expiraEm, pareada: sessao.pareada },
      });

      const desinscrever = inscreverSessao(id, enviar);
      const batimento = setInterval(() => escrever(": ping\n\n"), INTERVALO_BATIMENTO_MS);

      cancelar = () => {
        if (encerrado) return;
        encerrado = true;
        clearInterval(batimento);
        desinscrever?.();
        try {
          controller.close();
        } catch {
          // Já fechado.
        }
      };

      // Desconexão do cliente (aba fechada, navegação) libera o ouvinte.
      req.signal.addEventListener("abort", cancelar);
    },
    cancel() {
      cancelar();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
