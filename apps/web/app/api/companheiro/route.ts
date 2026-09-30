/**
 * Endpoint do companheiro de desktop (bichinho-preguica) do Seu Nono.
 *
 * PAPEL NO PROJETO
 * ----------------
 * O companheiro roda fora do navegador (app Windows em Python). Ele manda a
 * pergunta por voz e recebe de volta a resposta, a fala curta e os "galhos"
 * — os pedacos reais do portal por onde o bichinho se apoia para levar o
 * leitor ate a informacao. O caminho de resposta e o mesmo do widget: escada
 * determinista e, se preciso, o RAG do Seu Nono (`lib/companheiro/responder`).
 *
 * COMO RODA
 * ---------
 * Como `/api/chatbot`, e rota Node: existe no Guara Cloud, no home-pc
 * (`next start`) e no `next dev`. Com `output: export` (GitHub Pages) ela nao
 * vira arquivo estatico e nao existe.
 *
 * SEGURANCA
 * ---------
 * - Limite de taxa por IP, lendo o IP de `CF-Connecting-IP` (`ipDoCliente`),
 *   nunca de `x-forwarded-for` cru, que o cliente pode falsificar.
 * - `COMPANHEIRO_TOKEN` opcional: quando definido no ambiente, o app precisa
 *   mandar `Authorization: Bearer <token>`. Sem a variavel, a rota e publica
 *   como o `/api/chatbot`, so com limite de taxa.
 * - Nao aceita imagem: a foto da tela NUNCA sai da maquina do usuario. So
 *   texto entra aqui.
 * - A entrada passa por `sanitizarEntradaUsuario` (blindagem de prompt).
 */

import { NextResponse } from "next/server";
import { responderComoCompanheiro } from "@/lib/companheiro/responder";
import type { PedidoCompanheiro } from "@/lib/companheiro/contrato";
import { OllamaIndisponivel } from "@/lib/assistente/embeddings/ollama";
import { sanitizarEntradaUsuario } from "@/lib/seguranca/blindagem-prompt";
import { ipDoCliente } from "@/lib/rate-limit-ip";

/** Limite por IP: o companheiro pergunta em rajada, entao o teto e maior que
 *  o do widget (15/min), mas ainda baixo o bastante para conter abuso. */
const LIMITE_MAX_POR_MINUTO = 30;
const JANELA_MS = 60 * 1000;
const LIMITES_IP = new Map<string, { contagem: number; resetEm: number }>();

function verificarLimite(ip: string): boolean {
  const agora = Date.now();
  const registro = LIMITES_IP.get(ip);

  if (LIMITES_IP.size > 1000) {
    for (const [chave, val] of LIMITES_IP.entries()) {
      if (agora > val.resetEm) LIMITES_IP.delete(chave);
    }
  }

  if (!registro || agora > registro.resetEm) {
    LIMITES_IP.set(ip, { contagem: 1, resetEm: agora + JANELA_MS });
    return true;
  }
  if (registro.contagem >= LIMITE_MAX_POR_MINUTO) return false;
  registro.contagem += 1;
  return true;
}

export async function POST(req: Request): Promise<Response> {
  // Token opcional: so exige quando o operador definiu a variavel.
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
    const pergunta = (body.pergunta ?? "").trim();
    pedido = {
      pergunta,
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
