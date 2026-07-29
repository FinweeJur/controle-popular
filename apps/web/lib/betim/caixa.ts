import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export interface CaixaDisponivel {
  ano: number;
  valor: number;
  anoAnterior: number | null;
  valorAnterior: number | null;
}

/**
 * "Quanto a Prefeitura tem em caixa" (pedido do usuário 2026-07-21) —
 * lê `caixa_disponivel` (migration 0011). Retorna `null` tanto se
 * Supabase não estiver configurado quanto se a tabela ainda não existir
 * (migration não aplicada) ou não tiver dado — mesmo padrão degradado das
 * outras funções de lib/, nunca lança.
 */
export async function getCaixaDisponivel(
  idMunicipio: IdMunicipio
): Promise<CaixaDisponivel | null> {
  try {
    const data = await q.caixaDisponivel(idMunicipio);
    if (!data || data.length === 0) return null;

    const [atual, anterior] = data as { ano: number; valor: number }[];
    return {
      ano: atual.ano,
      valor: atual.valor,
      anoAnterior: anterior?.ano ?? null,
      valorAnterior: anterior?.valor ?? null,
    };
  } catch {
    return null;
  }
}
