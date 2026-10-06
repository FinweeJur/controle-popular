/**
 * Um turno da sessão pareada: responde UMA pergunta e transmite aos dois lados.
 *
 * PAPEL NO PROJETO
 * ----------------
 * É o único ponto que responde no fluxo pareado. Reusa
 * `responderComoCompanheiro` (escada determinista + RAG do Seu Nonô), publica o
 * evento `turno` no SSE da sessão e devolve a `RespostaCompanheiro` também na
 * resposta HTTP. Assim o chat do site e o companheiro recebem exatamente o
 * mesmo dado — sem duplicar regra nem acervo.
 *
 * SEGURANÇA (mesmo padrão de `/api/companheiro`)
 * ----------------------------------------------
 * - `COMPANHEIRO_TOKEN` opcional: quando definido, exige `Authorization: Bearer`.
 * - Limite de taxa por IP lido de `CF-Connecting-IP` (`ipDoCliente`).
 * - Entrada passa por `sanitizarEntradaUsuario` (blindagem de prompt).
 * - Sem imagem: só texto entra aqui.
 */

import { NextResponse } from "next/server";
import { responderComoCompanheiro } from "@/lib/companheiro/responder";
import type { PedidoCompanheiro } from "@/lib/companheiro/contrato";
import { obterSessao, publicarEvento } from "@/lib/companheiro/sessao";
import { criarLimite } from "@/lib/companheiro/limite";
import { OllamaIndisponivel } from "@/lib/assistente/embeddings/ollama";
import { sanitizarEntradaUsuario } from "@/lib/seguranca/blindagem-prompt";
import { ipDoCliente } from "@/lib/rate-limit-ip";

export const dynamic = "force-dynamic";

const verificarLimite = criarLimite({ maxPorMinuto: 30 });

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await ctx.params;
  if (!obterSessao(id)) {
    return NextResponse.json({ erro: "Sessao nao encontrada ou expirada." }, { status: 404 });
  }

  // Token opcional: só exige quando o operador definiu a variável.
  const tokenEsperado = process.env.COMPANHEIRO_TOKEN;
  if (tokenEsperado) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${tokenEsperado}`) {
      return NextResponse.json({ erro: "Nao autorizado." }, { status: 401 });
    }
  }

  const ip = ipDoCliente(req);
  if (!verificarLimite(ip)) {
    return NextResponse.json(
      { erro: "Muitas perguntas em sequencia. Aguarde um minuto e tente de novo." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let pedido: PedidoCompanheiro;
  try {
    const body = (await req.json()) as Partial<PedidoCompanheiro>;
    pedido = {
      pergunta: (body.pergunta ?? "").trim(),
      pathname: typeof body.pathname === "string" ? body.pathname.trim().slice(0, 200) : undefined,
      titulo: typeof body.titulo === "string" ? body.titulo.trim().slice(0, 200) : undefined,
      municipio: typeof body.municipio === "string" ? body.municipio.trim().slice(0, 80) : undefined,
    };
  } catch {
    return NextResponse.json({ erro: "Pedido invalido." }, { status: 400 });
  }

  if (!pedido.pergunta || pedido.pergunta.length < 3) {
    return NextResponse.json({ erro: "Escreva uma pergunta." }, { status: 400 });
  }

  const diagnostico = sanitizarEntradaUsuario(pedido.pergunta);
  if (!diagnostico.seguro) {
    return NextResponse.json({ erro: diagnostico.textoSanitizado }, { status: 400 });
  }
  pedido.pergunta = diagnostico.textoSanitizado;

  try {
    const resposta = await responderComoCompanheiro(pedido);
    // Transmite aos dois: o chat do site abre o link, o bichinho segue os galhos.
    publicarEvento(id, {
      tipo: "turno",
      em: Date.now(),
      dados: { pergunta: pedido.pergunta, resposta },
    });
    return NextResponse.json(resposta);
  } catch (e) {
    if (e instanceof OllamaIndisponivel) {
      return NextResponse.json(
        {
          erro: "A IA do assistente nao esta disponivel agora. Use os menus de respostas prontas ou tente em instantes.",
        },
        { status: 503 }
      );
    }
    const mensagem = e instanceof Error ? e.message : "Erro ao responder";
    return NextResponse.json({ erro: mensagem }, { status: 500 });
  }
}
