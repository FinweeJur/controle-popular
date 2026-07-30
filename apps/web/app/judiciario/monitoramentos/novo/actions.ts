"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { criarMonitoramento } from "@/lib/db/queries/judiciario";
import { withBasePath } from "@/lib/judiciario/basePath";

export interface NovoMonitoramentoInput {
  nome: string;
  tribunais: string[];
  cotas: string[];
  horizonteMeses: number;
  frequencia: string;
}

/**
 * Server Action: cria o monitoramento PARA o usuário da sessão do
 * servidor — `requireUser()` lança se não houver cookie válido, então
 * `userId` nunca vem do formulário/client. Substitui o insert direto do
 * client Supabase (Fase 4).
 */
export async function criarMonitoramentoAction(input: NovoMonitoramentoInput) {
  const user = await requireUser();
  await criarMonitoramento(user.id, {
    nome: input.nome || null,
    tribunais: input.tribunais.length ? input.tribunais : null,
    cotas: input.cotas.length ? input.cotas : null,
    horizonteMeses: input.horizonteMeses,
    frequencia: input.frequencia,
  });
  redirect(withBasePath("/painel"));
}
