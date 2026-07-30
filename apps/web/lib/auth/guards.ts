import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";

/**
 * Sessão do usuário logado, lida no SERVIDOR a partir do cookie — nunca do
 * `user_id` que o client manda (a lição documentada em
 * `lib/db/queries/judiciario.ts`: sem RLS no Neon, o filtro por usuário
 * agora é só o que este código faz).
 *
 * Devolve `null` sem lançar — cada Server Action decide o que fazer (redirecionar
 * para `/judiciario/login`, ou recusar a escrita).
 */
export async function sessaoAtual() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  return sessao;
}

/**
 * Mesmo que `sessaoAtual()`, mas lança se não houver usuário — para Server
 * Actions de escrita (`criarMonitoramento`) onde não faz sentido continuar
 * sem `userId`. NUNCA aceitar um `userId` vindo do body/query em seu lugar.
 */
export async function requireUser() {
  const sessao = await sessaoAtual();
  if (!sessao?.user) {
    throw new Error("Não autenticado.");
  }
  return sessao.user;
}
