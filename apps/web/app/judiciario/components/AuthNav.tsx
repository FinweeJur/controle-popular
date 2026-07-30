"use client";

import Link from "@/lib/judiciario/link";
import { authClient } from "@/lib/auth/client";

/**
 * "Entrar" ou "Painel" no header, dependendo da sessão. Client component
 * isolado (não o layout inteiro) para o resto do header continuar sendo
 * renderizado no servidor — só este pedaço precisa saber de Auth.
 */
export default function AuthNav() {
  const { data: sessao, isPending } = authClient.useSession();

  if (isPending) return null; // evita flash "Entrar" -> "Painel" na primeira pintura

  return (
    <Link
      href={sessao?.user ? "/painel" : "/login"}
      className="rounded-md border border-[var(--cp-border)] px-2.5 py-1 text-xs font-medium hover:border-[var(--cp-primary)]"
    >
      {sessao?.user ? "Painel" : "Entrar"}
    </Link>
  );
}
