import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Freio das quatro escritas públicas sem autenticação: `pageview`, `zap`,
 * `classificados` e `clique` (clique do zap). Nenhuma das quatro exige
 * login — a única barreira que existia era o honeypot (`body.site`), que
 * para robô burro e não para script.
 *
 * O RISCO NÃO É INVASÃO: o desenho já está certo (o que entra nasce
 * `aprovado: false`, toda leitura filtra `aprovado = true`). O risco é
 * custo e ruído — `page_views` crescendo sem teto, fila de moderação
 * entupindo, contador de clique manipulável, franquia de banco queimada.
 * Por isso esta barreira pode ser best-effort, não precisa ser exata.
 *
 * FERRAMENTA ESCOLHIDA: binding `ratelimit` do Workers (GA desde
 * set/2026), configurado em `wrangler.jsonc` → `ratelimits`. Comparado
 * com as outras opções que cabem no plano Free:
 *   - Rate Limiting Rules (produto de borda, fora do Worker): Free dá
 *     1 regra só, com janela FIXA de 10s — não dá pra ter um limite
 *     folgado pra `pageview`/`clique` (alta frequência) e outro apertado
 *     pra `zap`/`classificados` (rara) com uma regra só.
 *   - KV: Free dá 1.000 escritas/dia. Só `pageview` — uma escrita por
 *     navegação — estoura isso em minutos com tráfego normal.
 *   - Durable Objects: cabem no Free (SQLite-backed), mas exigiriam
 *     escrever e manter uma classe nova só pra contar requisição, sem
 *     ganho sobre o binding pronto.
 * O binding é grátis no Free (é runtime do próprio Worker, não produto de
 * borda com tier) — não é um binding de armazenamento, então não conflita
 * com a decisão registrada em `wrangler.jsonc` de não ter KV/R2/D1/DO no
 * caminho crítico.
 *
 * FAIL-OPEN deliberado quando o binding não existe (ex.: `next dev` direto,
 * sem `wrangler`/OpenNext por baixo) ou lança erro em runtime: a escrita
 * segue liberada. Esta é uma barreira de custo/ruído, não de segurança —
 * mesma filosofia de `getDb()` devolvendo `null`: degrada, não quebra.
 *
 * EVENTUALMENTE CONSISTENTE por design da própria Cloudflare — a contagem
 * é por colo/localização de borda, não global na conta. Não é teto exato,
 * é barreira contra abuso grosseiro (script/bot batendo sem parar).
 */

interface RateLimiterBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface EnvComLimitadores {
  RL_ALTA_FREQUENCIA?: RateLimiterBinding;
  RL_BAIXA_FREQUENCIA?: RateLimiterBinding;
}

export interface ResultadoLimite {
  permitido: boolean;
  /** Segundos sugeridos para o cabeçalho `Retry-After` quando negado. */
  retryAfter: number;
}

// Limitador em memória para runtime Node.js (Guara Cloud / Docker / dev local)
// Usado como fallback quando o binding Cloudflare não existe ou falha.
interface EntradaMemoria {
  timestamps: number[];
}
const memoriaLimites = new Map<string, EntradaMemoria>();

function checarMemoria(
  chave: string,
  maxReq: number,
  janelaMs: number,
  retryAfter: number
): ResultadoLimite {
  const agora = Date.now();
  const limitePassado = agora - janelaMs;
  let entrada = memoriaLimites.get(chave);
  if (!entrada) {
    entrada = { timestamps: [] };
    memoriaLimites.set(chave, entrada);
  }
  entrada.timestamps = entrada.timestamps.filter((ts) => ts > limitePassado);
  if (entrada.timestamps.length >= maxReq) {
    return { permitido: false, retryAfter };
  }
  entrada.timestamps.push(agora);
  if (memoriaLimites.size > 5000) {
    for (const [k, v] of memoriaLimites.entries()) {
      v.timestamps = v.timestamps.filter((ts) => ts > limitePassado);
      if (v.timestamps.length === 0) memoriaLimites.delete(k);
    }
  }
  return { permitido: true, retryAfter };
}

async function checarUpstash(
  chave: string,
  maxReq: number,
  janelaSegundos: number,
  retryAfter: number
): Promise<ResultadoLimite> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return checarMemoria(chave, maxReq, janelaSegundos * 1000, retryAfter);
  }
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", chave],
        ["EXPIRE", chave, janelaSegundos],
      ]),
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) {
      return checarMemoria(chave, maxReq, janelaSegundos * 1000, retryAfter);
    }
    const dados = (await res.json()) as Array<{ result?: number }>;
    const contagem = dados[0]?.result ?? 1;
    if (contagem > maxReq) {
      return { permitido: false, retryAfter };
    }
    return { permitido: true, retryAfter };
  } catch {
    return checarMemoria(chave, maxReq, janelaSegundos * 1000, retryAfter);
  }
}

async function checar(
  bindingName: keyof EnvComLimitadores,
  chave: string,
  maxReq: number,
  janelaSegundos: number,
  retryAfter: number
): Promise<ResultadoLimite> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const limitador = (env as EnvComLimitadores)[bindingName];
    if (limitador) {
      const { success } = await limitador.limit({ key: chave });
      return { permitido: success, retryAfter };
    }
  } catch {
    // Fora do runtime Cloudflare (Node.js/Guara Cloud/Docker/dev)
  }
  return checarUpstash(`${bindingName}:${chave}`, maxReq, janelaSegundos, retryAfter);
}

/**
 * `pageview` e `clique`: ~1 escrita por navegação/clique real. Janela de
 * 60s é o teto do binding (só aceita 10 ou 60); 300 por janela = 5/s
 * sustentado, folgado pro caso de escola/telecentro/operadora móvel atrás
 * do mesmo IP (dezenas de pessoas navegando ao mesmo tempo), apertado o
 * bastante pra travar um script em loop.
 */
export function limitarAltaFrequencia(ip: string): Promise<ResultadoLimite> {
  return checar("RL_ALTA_FREQUENCIA", ip, 300, 60, 15);
}

/**
 * `zap` e `classificados`: cadastro que uma pessoa faz raras vezes. 5 por
 * janela de 60s cobre alguém errando o formulário e tentando de novo, ou
 * duas pessoas cadastrando do mesmo IP compartilhado quase ao mesmo
 * tempo — sem abrir espaço pra um bot inundando a fila de moderação.
 */
export function limitarBaixaFrequencia(ip: string): Promise<ResultadoLimite> {
  return checar("RL_BAIXA_FREQUENCIA", ip, 5, 60, 60);
}

/**
 * 429 com corpo que explica e `Retry-After` — este projeto trata silêncio
 * como defeito, um 429 mudo teria o mesmo problema que motivou a barreira.
 */
export function respostaLimiteExcedido(retryAfter: number): Response {
  return Response.json(
    {
      ok: false,
      error: "Muitas requisições em pouco tempo. Espere um pouco e tente de novo.",
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  );
}
