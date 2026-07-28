import { createClient } from "@supabase/supabase-js";

/**
 * Schema Postgres deste app.
 *
 * O projeto Supabase é COMPARTILHADO com o /betim, e os dois schemas
 * colidem em quatro tabelas — `proposicoes`, `cache_ia`, `embeddings` e
 * `fontes_externas`. A de `proposicoes` é a séria: lá é proposição de
 * vereador, aqui é federal. Sem esta opção, toda consulta cairia no
 * schema `public` e leria a tabela do app irmão — sem erro, com dado
 * errado, que é o pior modo de falha possível.
 *
 * Exige `congresso` marcado em Settings → API → Exposed schemas no
 * dashboard do Supabase; sem isso o PostgREST devolve erro de schema
 * desconhecido e o app mostra estado vazio.
 */
export const SCHEMA = "congresso";

function criar(url: string, chave: string) {
  return createClient(url, chave, {
    auth: { persistSession: false },
    db: { schema: SCHEMA },
  });
}

/**
 * Tipo do cliente deste app, DERIVADO da chamada real.
 *
 * Não usar `SupabaseClient` cru aqui: o tipo exportado pela lib fixa
 * `"public"` no parâmetro de schema, e anotar com ele faz o TypeScript
 * recusar o cliente configurado para `congresso`. Inferir do `criar()`
 * mantém o schema no tipo e faz o compilador acompanhar a lib se a
 * assinatura dos genéricos mudar de versão.
 */
export type ClienteCongresso = ReturnType<typeof criar>;

/**
 * Cliente Supabase público, ou `null` quando as env vars não estão
 * configuradas (ex.: projeto ainda não criado).
 *
 * Chamadores (server components, route handlers) DEVEM tratar `null` como
 * "fonte de dados ainda não configurada" e renderizar estado vazio — nunca
 * lançar exceção nem quebrar o build. É o que permite este repo existir e
 * buildar antes do Supabase existir.
 */
export function getSupabaseClient(): ClienteCongresso | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    return criar(url, anonKey);
  } catch {
    return null;
  }
}

/**
 * Cliente `service_role` — ignora RLS. Só de route handlers que já
 * checaram um guard (ADMIN_TOKEN ou sessão). Nunca importar de client
 * component.
 */
export function getSupabaseServiceClient(): ClienteCongresso | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  try {
    return criar(url, serviceKey);
  } catch {
    return null;
  }
}

/**
 * PostgREST devolve no máximo 1000 linhas por requisição, SEM erro — um
 * select sem paginação numa tabela que cresce trunca em silêncio. No app
 * irmão isso inverteu um ranking inteiro em produção e só foi notado por
 * um número repetido na tela.
 *
 * Aqui o volume é ordens de grandeza maior (~4.400 PLs/ano só na Câmara),
 * então esta função é o caminho padrão: qualquer select que possa passar
 * de 1000 linhas usa isto, não `.execute()` direto.
 *
 * `queryFactory` precisa devolver um builder NOVO a cada chamada — não
 * reusar o mesmo entre páginas.
 */
export async function fetchAll<T>(
  queryFactory: () => {
    range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>;
  },
  pageSize = 1000
): Promise<T[]> {
  const rows: T[] = [];
  let page = 0;
  for (;;) {
    const { data, error } = await queryFactory().range(page * pageSize, page * pageSize + pageSize - 1);
    if (error) throw error;
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    page += 1;
  }
  return rows;
}

/**
 * Roda `tentativa()`; se falhar com Postgres 42703 (coluna inexistente),
 * cai para `semColuna()`. Para colunas novas cujo código já foi commitado
 * mas cuja migration ainda não foi aplicada — o DDL aqui é rodado à mão
 * pelo usuário no SQL Editor, então a defasagem entre código e schema é
 * a norma, não a exceção.
 */
export async function comColunaOpcional<T extends { error: { code?: string } | null }>(
  tentativa: () => PromiseLike<T>,
  semColuna: () => PromiseLike<T>
): Promise<T> {
  const primeira = await tentativa();
  if (primeira.error?.code === "42703") return semColuna();
  return primeira;
}
