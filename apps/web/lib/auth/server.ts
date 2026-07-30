import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/lib/db/client";
import { account, session, user, verification } from "@/lib/db/auth-schema";

/**
 * Instância única do Better Auth (Fase 4 da migração Cloudflare/Neon),
 * substituindo o Supabase Auth do Judiciário. Login por magic link, sem
 * senha — mesmo fluxo que `signInWithOtp` já oferecia.
 *
 * `advanced.database.generateId: "uuid"` é OBRIGATÓRIO aqui, não estético:
 * `judiciario.monitoramentos.user_id`/`alertas.user_id` são colunas `uuid`
 * herdadas do antigo `auth.users` do Supabase — sem isto o Better Auth
 * geraria um id curto (nanoid) incompatível com essas colunas e com o
 * usuário migrado (ver `scripts/migrar-usuarios-auth.mts`).
 *
 * `getDb()` devolve `null` sem `DATABASE_URL` — mesmo padrão de todo o
 * resto do app (ver `lib/db/client.ts`). Sem banco, `auth` ainda pode ser
 * construído (a lib não falha no import), mas toda operação real falhará
 * ao tentar consultar um adapter sobre um client `null`; isso só acontece
 * em ambiente mal configurado, o mesmo estado em que o resto do app já
 * mostra vazio.
 */
const db = getDb();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db ?? ({} as never), {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  advanced: {
    database: { generateId: "uuid" },
  },
  session: {
    // Mesma decisão de produto do login antigo: sessão de longa duração
    // (magic link não tem "lembrar de mim", é a única forma de entrar).
    expiresIn: 60 * 60 * 24 * 30, // 30 dias
  },
  plugins: [
    magicLink({
      // Ninguém pode criar monitoramento sem existir — mas cadastro
      // acontece implicitamente no primeiro login (mesmo comportamento do
      // `signInWithOtp` antigo, que também criava o usuário na hora).
      disableSignUp: false,
      async sendMagicLink({ email, url }) {
        const apiKey = process.env.RESEND_API_KEY;
        const from = process.env.RESEND_FROM_EMAIL ?? "Controle Popular <onboarding@resend.dev>";
        if (!apiKey) {
          // Mesmo padrão de degradação do resto do repo (getSupabaseClient
          // etc.): sem a chave, não trava o app — só não envia de verdade.
          // Sem isto, testar o login localmente exigiria a chave do Resend
          // resolvida antes de qualquer verificação de ponta a ponta.
          console.warn(
            `[auth] RESEND_API_KEY não configurada — link de login para ${email}: ${url}`
          );
          return;
        }
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: email,
            subject: "Seu link de acesso — Controle Popular",
            html: `<p>Clique para entrar: <a href="${url}">${url}</a></p><p>Se você não pediu este link, ignore este e-mail.</p>`,
          }),
        });
        if (!resp.ok) {
          throw new Error(`Resend respondeu ${resp.status}: ${await resp.text()}`);
        }
      },
    }),
    // Escreve/apaga o cookie de sessão em Route Handlers e Server Actions
    // automaticamente — precisa vir por ÚLTIMO na lista de plugins
    // (exigência documentada do Better Auth).
    nextCookies(),
  ],
});

export type Auth = typeof auth;
