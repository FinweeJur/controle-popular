import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Acesso ao Postgres (Neon), substituindo o `@supabase/supabase-js` dos
 * três repos originais.
 *
 * DRIVER: `@neondatabase/serverless` no modo HTTP. Cada query é um POST
 * HTTPS, sem conexão TCP persistente. Isso é requisito, não preferência:
 *  - o Neon Free suspende o compute depois de ~5 min ocioso, e é esse
 *    autosuspend que faz a franquia de 100 CU-h/mês durar o mês inteiro.
 *    Um pool persistente a manteria acordada 24/7 e queimaria a cota.
 *  - o destino é Cloudflare Workers, onde cada isolate é efêmero e não há
 *    onde um pool viver entre requisições.
 * Para transação multi-statement (escritas do Auth, na Fase 4) usar o modo
 * WebSocket (`drizzle-orm/neon-serverless`), não este.
 *
 * TETO DE SUBREQUESTS: no Workers Free são 50 por invocação, e cada query
 * HTTP conta uma. Página que hoje faz 5-10 selects sequenciais deve virar
 * 1-2 com join/CTE. Nada de N+1.
 *
 * O QUE SUMIU DO SUPABASE, e por que não faz falta:
 *  - `db: { schema }`: os três schemas (`public`, `congresso`,
 *    `judiciario`) agora são `pgSchema` distintos no Drizzle, e as quatro
 *    tabelas homônimas viraram identificadores diferentes
 *    (`proposicoes` vs `proposicoesInCongresso`). Importar a errada passou
 *    a ser erro de compilação, em vez de dado errado silencioso.
 *  - `fetchAll()`: existia só para contornar o teto de 1000 linhas do
 *    PostgREST, que truncava sem erro. SQL direto não trunca.
 *  - `comColunaOpcional()`: existia porque o DDL era aplicado à mão e o
 *    código ia à frente do schema. Com migrations no pipeline, não.
 */

export type DB = ReturnType<typeof criar>;

/**
 * NÃO passe `fetchOptions: { cache: "no-store" }` aqui.
 *
 * É tentador: o driver HTTP faz cada consulta com `fetch`, o Next
 * intercepta esse `fetch` com a Data Cache dele, e essa cache PERSISTE
 * ENTRE BUILDS (ver `npm run prebuild`, que é a correção certa). Mas
 * `no-store` marca a requisição como `revalidate: 0`, e aí o Next se
 * recusa a prerenderizar qualquer página que a use — medido: o build
 * morre em `/[municipio]/meio-ambiente/paraopeba` com
 * `DYNAMIC_SERVER_USAGE`. Isso derrubaria a estaticização, que é a base
 * do plano de ir para o Workers Free (Fase 5).
 *
 * A cache DENTRO de um build é desejável: ela é o que faz `listarCidades()`
 * custar uma consulta em vez de 110. O problema é só a que sobrevive de um
 * build para o outro.
 */
function criar(url: string) {
  return drizzle(neon(url), { schema });
}

let memo: DB | null | undefined;

/**
 * Conexão com o banco, ou `null` quando `DATABASE_URL` não está
 * configurada.
 *
 * O `null` é deliberado e herdado do `getSupabaseClient()` original:
 * chamadores DEVEM tratá-lo como "fonte de dados ainda não configurada" e
 * renderizar estado vazio, nunca lançar. É o que permite `next build`
 * rodar sem banco — sem isso, os ~50 arquivos que tocam dados passariam a
 * quebrar o build em qualquer ambiente sem credencial (CI, clone novo).
 */
export function getDb(): DB | null {
  if (memo !== undefined) return memo;
  const url = process.env.DATABASE_URL;
  if (!url) return (memo = null);
  try {
    return (memo = criar(url));
  } catch {
    return (memo = null);
  }
}
