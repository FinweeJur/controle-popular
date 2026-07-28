"use client";

import { useEffect, useState } from "react";
import Link from "@/lib/judiciario/link";
import { getSupabaseBrowserClient } from "@/lib/judiciario/supabaseBrowser";

/**
 * "Entrar" ou "Painel" no header, dependendo da sessão. Client component
 * isolado (não o layout inteiro) para o resto do header continuar sendo
 * renderizado no servidor — só este pedaço precisa saber de Auth.
 */
export default function AuthNav() {
  const [logado, setLogado] = useState<boolean | null>(null);

  useEffect(() => {
    const sb = getSupabaseBrowserClient();
    if (!sb) {
      setLogado(false);
      return;
    }
    sb.auth.getSession().then(({ data }) => setLogado(!!data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setLogado(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (logado === null) return null; // evita flash "Entrar" -> "Painel" na primeira pintura

  return (
    <Link
      href={logado ? "/painel" : "/login"}
      className="rounded-md border border-[var(--cp-border)] px-2.5 py-1 text-xs font-medium hover:border-[var(--cp-primary)]"
    >
      {logado ? "Painel" : "Entrar"}
    </Link>
  );
}
