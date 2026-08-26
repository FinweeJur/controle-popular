/**
 * Binding compatível com a SUPERFÍCIE usada pelo drizzle-orm/d1 que fala com
 * a API HTTP do Cloudflare em vez do binding nativo do Worker.
 *
 * ═══ POR QUE ISTO EXISTE ═══
 *
 * Modo "home-pc como origem" (2026-08-26): o site passou a ser servido pelo
 * PC via Cloudflare Tunnel porque o script do Worker estourou o teto de
 * 3 MiB gzip do plano Free (erro 10027). Fora do runtime do Worker não
 * existe `DB_ESCRITAS` — mas o drizzle só precisa de prepare/bind/
 * all/run/raw/values, que esta classe implementa consultando
 * POST /accounts/:id/d1/database/:id/query.
 *
 * ═══ CREDENCIAIS ═══
 *
 * `CLOUDFLARE_D1_API_TOKEN` (custom token com Account › D1 › Edit),
 * `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_D1_ID`. Lidas de process.env
 * (.env.local no home-pc; NUNCA versionadas).
 *
 * Tipagem de propósito solta (duck-typing): implementar a interface oficial
 * D1Database exigiria replicar genéricos/overloads que variam entre versões
 * do @cloudflare/workers-types. O contrato que importa é o que o driver
 * chama em runtime — ver node_modules/drizzle-orm/d1/session.cjs.
 */

interface LinhaD1 {
  [campo: string]: unknown;
}

interface RespostaQuery {
  results?: LinhaD1[];
  meta?: Record<string, unknown>;
}

type ExecFn = (sql: string, params: unknown[]) => Promise<RespostaQuery>;

/* eslint-disable @typescript-eslint/no-explicit-any */
class StatementHttp {
  constructor(
    private execFn: ExecFn,
    private sql: string,
    private params: unknown[] = [],
  ) {}

  bind(...params: unknown[]): this {
    this.params = params;
    return this;
  }

  async all(): Promise<{ results: LinhaD1[]; success: boolean }> {
    const r = await this.execFn(this.sql, this.params);
    return { results: r.results ?? [], success: true };
  }

  async run(): Promise<{ success: boolean }> {
    await this.execFn(this.sql, this.params);
    return { success: true };
  }

  /** Linhas como ARRAYS na ordem das colunas do SELECT. */
  async raw<T = unknown[]>(): Promise<T> {
    const r = await this.execFn(this.sql, this.params);
    const objetos = r.results ?? [];
    if (objetos.length === 0) return [] as T;
    const chaves = Object.keys(objetos[0]);
    return objetos.map((o) => chaves.map((c) => o[c])) as T;
  }

  async values<T = unknown[]>(): Promise<T> {
    return this.raw<T>();
  }

  async first<T = LinhaD1>(coluna?: string): Promise<T | null> {
    const r = await this.execFn(this.sql + " LIMIT 1", this.params);
    const linha = (r.results ?? [])[0];
    if (linha == null) return null;
    return (coluna ? linha[coluna] : linha) as T;
  }

  dispose(): void {}
}

export class D1HttpRest {
  private execFn: ExecFn;

  constructor(accountId: string, databaseId: string, apiToken: string) {
    this.execFn = async (sql, params) => {
      const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql, params }),
        signal: AbortSignal.timeout(20_000),
      });
      const corpo = (await resp.json()) as {
        success?: boolean;
        errors?: { message?: string }[];
        result?: RespostaQuery[];
      };
      if (!resp.ok || !corpo.success) {
        const motivo = corpo.errors?.map((e) => e.message).join("; ") || `HTTP ${resp.status}`;
        throw new Error(`[D1HttpRest] query falhou: ${motivo}`);
      }
      return corpo.result?.[0] ?? {};
    };
  }

  prepare(consulta: string): StatementHttp {
    return new StatementHttp(this.execFn, consulta);
  }

  async batch(declaracoes: StatementHttp[]): Promise<{ success: boolean }[]> {
    const saida: { success: boolean }[] = [];
    for (const d of declaracoes) saida.push(await d.run());
    return saida;
  }
}
