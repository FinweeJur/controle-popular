"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { withBasePath } from "@/lib/judiciario/basePath";

/**
 * Login por magic link — sem senha, sem cadastro separado.
 *
 * Substitui o Supabase Auth (Fase 4 da migração Cloudflare/Neon) pelo
 * Better Auth — mesmo fluxo do usuário: digita e-mail, recebe link,
 * clica, entra. `callbackURL` precisa do prefixo `/judiciario` (mesma
 * razão que `withBasePath` já documentava para o `emailRedirectTo`
 * antigo): a zona não tem `basePath` de Next próprio neste monorepo, mas
 * o link do e-mail é absoluto e precisa saber para onde voltar.
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: withBasePath("/painel"),
    });
    if (error) {
      setEstado("erro");
      setErro(error.message ?? "Não foi possível enviar o link.");
      return;
    }
    setEstado("enviado");
  }

  return (
    <div className="mx-auto max-w-md space-y-8 px-4 py-16">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Entrar</h1>
        <p className="opacity-80">
          Sem senha. Digite seu e-mail e mandamos um link de acesso — clique nele para
          entrar. Serve para criar monitoramentos e receber alertas de vagas.
        </p>
      </header>

      {estado === "enviado" ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-5">
          Link enviado para <strong>{email}</strong>. Confira sua caixa de entrada (e o
          spam) e clique no link para entrar.
        </p>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">E-mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-[var(--cp-border)] bg-transparent px-3 py-2"
              placeholder="voce@exemplo.org"
            />
          </label>
          <button
            type="submit"
            disabled={estado === "enviando"}
            className="w-full rounded-md bg-[var(--cp-primary)] px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {estado === "enviando" ? "Enviando..." : "Enviar link de acesso"}
          </button>
          {estado === "erro" && <p className="text-sm text-red-600">{erro}</p>}
        </form>
      )}
    </div>
  );
}
