/**
 * Cria a sessão pareada do companheiro de desktop (bichinho-preguiça).
 *
 * PAPEL NO PROJETO
 * ----------------
 * Primeiro passo do fluxo pareado: o widget do Seu Nonô chama esta rota,
 * recebe `{ id, codigo, expiraEm }` e mostra o código à pessoa. O companheiro
 * entra depois com esse código em `/api/companheiro/sessao/parear`.
 *
 * COMO RODA
 * ---------
 * Rota Node (App Router). Como as demais do companheiro, existe no Guara, no
 * home-pc (`next start`) e no `next dev`; não existe no alvo estático
 * (`output: export`).
 *
 * SEGURANÇA
 * ---------
 * - Sem token: criar sessão é barato e não gera IA — só limite de taxa por IP.
 * - Sem dado pessoal: a sessão guarda id, código e horários.
 * - `Cache-Control: no-store`: o id é credencial, não pode ser cacheado.
 */

import { NextResponse } from "next/server";
import { criarSessao } from "@/lib/companheiro/sessao";
import { criarLimite } from "@/lib/companheiro/limite";
import { ipDoCliente } from "@/lib/rate-limit-ip";

/** Impede o Next de tentar pré-renderizar: a rota depende do relógio. */
export const dynamic = "force-dynamic";

const verificarLimite = criarLimite({ maxPorMinuto: 20 });

export async function POST(req: Request): Promise<Response> {
  const ip = ipDoCliente(req);
  if (!verificarLimite(ip)) {
    return NextResponse.json(
      { erro: "Muitas sessoes em sequencia. Aguarde um minuto e tente de novo." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const sessao = criarSessao();
  return NextResponse.json(sessao, { headers: { "Cache-Control": "no-store" } });
}
