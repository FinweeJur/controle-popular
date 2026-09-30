/**
 * Pareia o companheiro de desktop a uma sessão existente.
 *
 * PAPEL NO PROJETO
 * ----------------
 * A pessoa lê o código no widget do site e digita no companheiro. O app local
 * chama esta rota com `{ codigo }` e recebe o `id` da sessão — credencial para
 * ouvir os eventos (`/eventos`) e disparar o turno (`/perguntar`).
 *
 * REGRA DE NEGÓCIO
 * ----------------
 * O companheiro entra UMA vez: a segunda tentativa com o mesmo código é
 * recusada (`parearSessao` devolve `null`). Código inválido e sessão expirada
 * também devolvem `null`, para não revelar qual dos dois falhou.
 *
 * SEGURANÇA
 * ---------
 * O código é curto de propósito (leitura humana), então o que barra a força
 * bruta é o teto de tentativas por IP somado ao TTL curto da sessão.
 */

import { NextResponse } from "next/server";
import { parearSessao } from "@/lib/companheiro/sessao";
import { criarLimite } from "@/lib/companheiro/limite";
import { ipDoCliente } from "@/lib/rate-limit-ip";

export const dynamic = "force-dynamic";

/** Teto mais baixo que o das outras rotas: freia a adivinhação do código. */
const verificarLimite = criarLimite({ maxPorMinuto: 12 });

export async function POST(req: Request): Promise<Response> {
  const ip = ipDoCliente(req);
  if (!verificarLimite(ip)) {
    return NextResponse.json(
      { erro: "Muitas tentativas de pareamento. Aguarde um minuto." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let codigo = "";
  try {
    const body = (await req.json()) as { codigo?: string };
    codigo = (body.codigo ?? "").trim();
  } catch {
    return NextResponse.json({ erro: "Pedido invalido." }, { status: 400 });
  }

  if (!codigo) {
    return NextResponse.json({ erro: "Informe o codigo da sessao." }, { status: 400 });
  }

  const sessao = parearSessao(codigo);
  if (!sessao) {
    return NextResponse.json(
      { erro: "Codigo invalido, ja usado ou expirado." },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { id: sessao.id, expiraEm: sessao.expiraEm },
    { headers: { "Cache-Control": "no-store" } }
  );
}
