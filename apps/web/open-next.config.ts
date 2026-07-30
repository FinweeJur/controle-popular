import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import incrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * Config do OpenNext pro Cloudflare Workers (Fase 6 da migração
 * Cloudflare/Neon).
 *
 * `incrementalCache` NÃO é opcional aqui, e o modo de falha ensina por quê:
 * sem ele (o default é nenhum), o Worker tem o `prerender-manifest` mas não
 * tem de onde LER o HTML pré-renderizado. Como `app/[municipio]/layout.tsx`
 * declara `dynamicParams = false` de propósito (slug desconhecido deve dar
 * 404, não renderizar cidade inventada), o Next não pode renderizar sob
 * demanda para compensar — e as 6 rotas SSG do Betim testadas devolveram
 * `NoFallbackError` + página de não-encontrado, com HTTP 404. As rotas
 * DINÂMICAS do mesmo eixo respondiam 200, o que torna o sintoma enganoso:
 * parece problema de banco ou de rota, e é de cache.
 *
 * O adapter de Static Assets é o certo para este projeto: read-only, sem
 * KV/R2/D1 (Workers KV Free dá só 1.000 escritas/dia, o que inviabiliza
 * revalidação real) e a própria doc dele diz servir para apps que "do NOT
 * want revalidation and ONLY want to serve prerendered data" — exatamente a
 * decisão tomada na Fase 5, onde ISR virou SSG e a atualização passa a ser
 * por rebuild agendado.
 */
export default defineCloudflareConfig({
  incrementalCache,
});
