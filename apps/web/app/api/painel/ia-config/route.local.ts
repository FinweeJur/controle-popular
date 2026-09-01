import { NextResponse } from "next/server";

import { painelAutorizado } from "@/lib/painel/edicoes-io";
import {
  lerConfigIa,
  salvarConfigIa,
  resumoParaPainel,
  type IdProvedor,
} from "@/lib/assistente/embeddings/provedores";

/**
 * API do painel de edicao — escolha do provedor de IA ativo (degrau 3).
 *
 * O QUE ELA GUARDA
 *
 * `GET` devolve o provedor ativo e, para cada provedor, SE a chave esta
 * configurada em `.env.local` — nunca o valor da chave. `POST` grava a
 * escolha em `data/ia-config.json` (estado de maquina, ignorado pelo git).
 * O outro provedor vira fallback automatico na geracao (ver
 * `lib/assistente/embeddings/geracao.ts`).
 *
 * A extensao `.local.ts` mantem esta rota fora de qualquer build (mesmo
 * padrao das demais rotas do painel — ver `lib/painel/edicoes-io.ts`).
 */

/** Sem `force-static`: esta rota le disco a cada chamada, de proposito. */
export const dynamic = "force-dynamic";

function negado() {
  return NextResponse.json(
    { erro: "Nao autorizado. Defina PAINEL_TOKEN no .env.local e envie no header Authorization." },
    { status: 401 }
  );
}

export async function GET(request: Request) {
  if (!painelAutorizado(request)) return negado();

  return NextResponse.json(resumoParaPainel());
}

export async function POST(request: Request) {
  if (!painelAutorizado(request)) return negado();

  let body: { provedorAtivo?: unknown };
  try {
    body = (await request.json()) as { provedorAtivo?: unknown };
  } catch {
    return NextResponse.json({ erro: "JSON invalido." }, { status: 400 });
  }

  const pedido = body.provedorAtivo;
  if (pedido !== "deepseek" && pedido !== "maritaca" && pedido !== "ling") {
    return NextResponse.json(
      { erro: "provedorAtivo precisa ser 'deepseek', 'maritaca' ou 'ling'." },
      { status: 400 }
    );
  }

  salvarConfigIa({ provedorAtivo: pedido as IdProvedor });
  return NextResponse.json(resumoParaPainel());
}
