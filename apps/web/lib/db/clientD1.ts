import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import * as schemaD1 from "./schema.d1";

/**
 * Acesso ao D1 — o banco das ESCRITAS AO VIVO (pageview, zap, clique,
 * classificados, moderação admin). Ver o cabeçalho de `schema.d1.ts` para
 * por que este banco existe separado do Postgres de `client.ts`.
 *
 * MESMO PADRÃO de `lib/rate-limit.ts`: o binding vem de
 * `getCloudflareContext({ async: true }).env`, não de `process.env` — D1 é
 * um binding do runtime do Worker, não uma URL de conexão. Fora do Worker
 * (`next dev` puro, sem `wrangler`/OpenNext por baixo) o binding não existe
 * e esta função devolve `null` — mesma filosofia de `getDb()` no Postgres:
 * degrada, não quebra o build nem a rota.
 *
 * Para testar de verdade contra D1 (não só compilar), rodar com
 * `wrangler dev --local`, que sobe um D1 local com o binding presente —
 * `next dev` sozinho não tem.
 */

// `D1Database` vem de `@cloudflare/workers-types` por IMPORT explícito, não
// pelo pacote inteiro `types` do tsconfig nem por `worker-configuration.d.ts`
// (gerado por `npx wrangler types`, tentado e revertido: aquele arquivo
// redeclara `Response`/`Body` GLOBALMENTE com `json<T>(): Promise<T>`, o que
// faz TODO `fetch(...).json()` do FRONTEND (PainelAdmin, ZapForm,
// ClassificadoForm, PopularesClient — nenhum deles toca D1) virar
// `Promise<unknown>` em vez de `Promise<any>`, quebrando `tsc --noEmit` em
// quatro arquivos sem relação com esta migration. Medido em 2026-08-13. O
// import nomeado abaixo traz só o tipo do binding, sem ambient global.
interface EnvComD1 {
  DB_ESCRITAS?: D1Database;
}

export type DBEscritas = ReturnType<typeof drizzle<typeof schemaD1>>;

/**
 * Conexão com o D1, ou `null` quando o binding `DB_ESCRITAS` não está
 * presente (dev local sem wrangler, ou downgrade de config).
 *
 * Sem memoização por módulo: diferente do Postgres HTTP (`getDb()`, que
 * memoiza uma URL fixa), o binding vem do contexto da REQUISIÇÃO atual
 * (`getCloudflareContext`), e cachear a primeira leitura prenderia todo
 * request seguinte ao binding resolvido no cold start do isolate.
 */
export async function getD1(): Promise<DBEscritas | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const binding = (env as EnvComD1).DB_ESCRITAS;
    if (!binding) return null;
    return drizzle(binding, { schema: schemaD1 });
  } catch (e) {
    console.error("[getD1] falhou ao obter o binding DB_ESCRITAS; seguindo sem D1:", e);
    return null;
  }
}
