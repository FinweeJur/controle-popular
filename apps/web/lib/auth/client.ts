"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

/**
 * Cliente Better Auth para CLIENT COMPONENTS (login, painel, novo
 * monitoramento, AuthNav) — substitui `getSupabaseBrowserClient()`.
 *
 * Sem `baseURL` explícito: o SDK usa a origem atual (`window.location`),
 * e a rota `/api/auth/*` já vive no MESMO app (sem zona/basePath própria,
 * diferente do resto de `/judiciario`) — ver `app/api/auth/[...all]/route.ts`.
 */
export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});

export const { useSession, signOut } = authClient;
