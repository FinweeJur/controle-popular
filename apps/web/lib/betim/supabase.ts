import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Default IBGE municipality code (Betim-MG), used whenever
 * NEXT_PUBLIC_ID_MUNICIPIO is not set in the environment.
 */
export const ID_MUNICIPIO_DEFAULT =
  process.env.NEXT_PUBLIC_ID_MUNICIPIO ?? "3106705";

/**
 * Returns a configured Supabase client, or `null` when the required public
 * env vars are not set (e.g. no Supabase project has been created yet).
 *
 * Callers (server components, route handlers) MUST treat a `null` return as
 * "data source not configured yet" and render an empty/placeholder state —
 * never throw or crash the build/request because Supabase isn't wired up.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  try {
    return createClient(url, anonKey, {
      auth: { persistSession: false },
    });
  } catch {
    // Malformed URL/key etc. — degrade gracefully instead of crashing.
    return null;
  }
}

/**
 * Server-only client authenticated as `service_role` — bypasses RLS.
 * Never import this from a client component; only from route handlers that
 * first check an admin token or similar guard. Returns `null` when
 * `SUPABASE_SERVICE_ROLE_KEY` isn't set.
 */
export function getSupabaseServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  try {
    return createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  } catch {
    return null;
  }
}

/**
 * Roda `tentativa()`; se falhar com o código Postgres 42703
 * (undefined_column — "essa coluna não existe"), roda `semColuna()` no
 * lugar. Pra colunas novas (ex. `temas`, migration 0012) cujo código já
 * foi commitado mas cuja migration ainda não rodou no banco do usuário —
 * sem isso, um `.select()` que inclui a coluna nova quebraria a página
 * inteira (não só o dado novo) até a migration rodar. Mesmo padrão do
 * lado Python (`upsert_com_colunas_opcionais` em `etl/common.py`), aqui
 * pro lado de leitura em vez de escrita.
 */
export async function comColunaOpcional<T extends { error: { code?: string } | null }>(
  tentativa: () => PromiseLike<T>,
  semColuna: () => PromiseLike<T>
): Promise<T> {
  const primeira = await tentativa();
  if (primeira.error?.code === "42703") {
    return semColuna();
  }
  return primeira;
}
