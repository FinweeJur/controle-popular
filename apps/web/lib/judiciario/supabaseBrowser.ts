"use client";

import { createClient } from "@supabase/supabase-js";
import { SCHEMA } from "@/lib/judiciario/supabase";

/**
 * Cliente Supabase para uso em CLIENT COMPONENTS que precisam de sessão
 * de usuário (login por magic link, `/painel`, `/monitoramentos`).
 *
 * Por que não reusar `getSupabaseClient()` de `lib/supabase.ts`: aquele
 * cliente é `persistSession: false` de propósito — foi desenhado para
 * leitura pública em server components, onde não há sessão de usuário
 * para persistir e persistir seria desperdício. Auth por magic link
 * PRECISA de `persistSession: true` (grava o token no localStorage) e
 * `detectSessionInUrl: true` (lê o `access_token` que volta no hash da
 * URL depois do clique no link do e-mail) — sem os dois, o usuário
 * clicaria o link e cairia deslogado de novo.
 *
 * Singleton por módulo: criar um cliente novo a cada render duplicaria o
 * listener de `onAuthStateChange` e a leitura do localStorage.
 */
let instancia: ReturnType<typeof criar> | null = null;

function criar() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey, {
    auth: { persistSession: true, detectSessionInUrl: true, autoRefreshToken: true },
    db: { schema: SCHEMA },
  });
}

export function getSupabaseBrowserClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  if (!instancia) instancia = criar();
  return instancia;
}
