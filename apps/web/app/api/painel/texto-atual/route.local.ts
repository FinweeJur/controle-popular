import { NextResponse } from "next/server";

import { painelAutorizado } from "@/lib/painel/edicoes-io";
import { textoAtualDaRota } from "@/lib/painel/texto-atual";

/**
 * API do painel de edição — `GET ?rota=…` devolve o texto ATUAL da página,
 * lido do código, para quem vai editar saber o que está substituindo.
 *
 * ═══ POR QUE LER O CÓDIGO, E NÃO A PÁGINA RENDERIZADA ═══
 *
 * O texto publicado é o que `next build` imprimiu; renderizar a rota de novo
 * aqui mostraria o texto HOJE, não o texto NO AR. O código é a fonte do texto
 * publicado — e uma edição gravada e ainda não publicada não aparece nele, o
 * que é exatamente o que a tela precisa mostrar: o que está no ar é o código.
 *
 * Os limites da extração (texto calculado com `${…}` não é lido) estão
 * declarados em `lib/painel/texto-atual.ts`.
 */

/** Sem `force-static`: esta rota lê disco a cada chamada, de propósito. */
export const dynamic = "force-dynamic";

function negado() {
  return NextResponse.json(
    { erro: "Não autorizado. Defina PAINEL_TOKEN no .env.local e envie no header Authorization." },
    { status: 401 }
  );
}

export async function GET(request: Request) {
  if (!painelAutorizado(request)) return negado();

  const rota = new URL(request.url).searchParams.get("rota") ?? "";
  if (!rota) return NextResponse.json({ erro: "Rota é obrigatória." }, { status: 400 });

  return NextResponse.json(textoAtualDaRota(rota));
}