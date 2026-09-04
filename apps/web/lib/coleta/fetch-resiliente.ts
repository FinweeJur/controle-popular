/**
 * apps/web/lib/coleta/fetch-resiliente.ts
 *
 * Cliente HTTP compartilhado dos coletores do Controle Popular.
 *
 * ═══ POR QUE ESTE ARQUIVO EXISTE ═══
 *
 * Cada coletor em `scripts/*.mts` tinha seu fetch com retry ad-hoc: `coletar-
 * comunicabr.mts` fazia 3 tentativas com espera linear; `coletar-execucao-fgv.mts`
 * não tinha retry nenhum (um 502 na FGV derrubava a rodada inteira);
 * `coletar-pncp-mg.mts` reimplementava o backoff do `etl/pncp/client.py` em
 * TypeScript, à mão. Retry é exatamente o tipo de código que cada um escreve
 * um pouco diferente e nenhum testa — o mesmo argumento que fez o `sigpub.py`
 * centralizar a pausa no `_get` (armadilha 7 do cabeçalho dele): espalhado
 * pelos call sites, a versão errada é sempre a mais fácil de repetir.
 *
 * Este módulo centraliza três coisas da regra de coleta do AGENTS.md:
 * 1. **User-Agent honesto** — um só, identificando o projeto, sem acento
 *    (cabeçalho com acento quebra cliente HTTP — lição de
 *    `coletar-noticias-desastres.py`).
 * 2. **Backoff exponencial com jitter** e respeito a `Retry-After` (429/503).
 *    O jitter importa: dois jobs do mesmo cron martelando a mesma fonte pública
 *    no mesmo instante (PNCP devolve 429 quando dois jobs varrem juntos —
 *    registrado em `etl-cidades-novas.yml`) se sincronizam sozinhos sem jitter.
 * 3. **Checkpoint JSON de retomada** em `etl/betim/dados/_checkpoints/` — o
 *    mesmo padrão que `coletar-salic-rouanet.mts` e `coletar-comunicabr.mts`
 *    já usam em pastas próprias, agora com caminho canônico para coletores
 *    novos.
 *
 * ⚠️ O QUE ELA NÃO É: não substitui os coletores com semântica própria de
 * erro (`coletar-pncp-mg.mts` espelha o `client.py` de propósito, inclusive o
 * teto de 60s e o 204 → `{data:[], totalPaginas:0}`; `coletar-decisoes-cge-mg.mts`
 * precisa de cookie jar manual). Migração só onde a mudança é mecânica — ver
 * `docs/planos/COLETA-MELHORIAS-2026-09.md`.
 *
 * Roda fora do Next (coletores via `npx tsx`), então usa só `node:fs`/
 * `node:path`/`node:crypto` + fetch global do Node 22.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { randomInt } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** UA honesto canônico — o mesmo para toda fonte pública. */
export const USER_AGENT_HONESTO =
  "ControlePopular/2.0 (+https://controlepopular.com.br; transparencia dados abertos)";

/** Diretório canônico de checkpoints, relativo à raiz do monorepo. */
export const PASTA_CHECKPOINTS = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../etl/betim/dados/_checkpoints",
);

export interface OpcoesFetchComRetry {
  /** Tentativas totais (1 = sem retry). Padrão: 4. */
  tentativas?: number;
  /** Timeout por tentativa, ms. Padrão: 30 000. */
  timeoutMs?: number;
  /** Base do backoff exponencial, ms. Padrão: 1 000 (1s, 2s, 4s...). */
  backoffBaseMs?: number;
  /** Teto por espera, ms. Padrão: 60 000 — mesmo do client.py do PNCP. */
  backoffTetoMs?: number;
  /** Fração do jitter (0–1) aplicada sobre a espera. Padrão: 0,25. */
  jitterFrac?: number;
  /** Pausa fixa ANTES de cada request (educação com a fonte). Padrão: 0. */
  pausaEntreRequestsMs?: number;
  /** Headers extras; o User-Agent daqui vence o default se fornecido. */
  headers?: Record<string, string>;
  /** Injetável para teste do cálculo de espera. */
  aleatorio?: (maxExclusive: number) => number;
}

export interface ResultFetchComRetry {
  ok: boolean;
  statusHttp?: number;
  texto?: string;
  erro?: string;
  tentativasUsadas: number;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Espera da tentativa N (1-indexada): expoencial `base * 2^(n-1)`, limitada ao
 * teto, mais jitter uniforme em [0, frac * espera]. Pura e exportada para o
 * teste não depender de tempo de relógio.
 */
export function calcularEsperaMs(
  tentativa: number,
  opts: Pick<OpcoesFetchComRetry, "backoffBaseMs" | "backoffTetoMs" | "jitterFrac"> = {},
  aleatorio: (maxExclusive: number) => number = (max) => randomInt(max),
): number {
  const base = opts.backoffBaseMs ?? 1000;
  const teto = opts.backoffTetoMs ?? 60_000;
  const frac = opts.jitterFrac ?? 0.25;
  const exponential = Math.min(base * 2 ** Math.max(0, tentativa - 1), teto);
  const jitter = Math.floor(aleatorio(Math.max(1, Math.floor(exponential * frac))));
  return exponential + jitter;
}

/**
 * GET com retry/backoff/jitter, timeout por tentativa e respeito a Retry-After.
 *
 * Semântica por status (a mesma que os coletores já assumem, escrita uma vez):
 * - 2xx → sucesso (texto cru; quem quiser JSON faz `JSON.parse(res.texto)`);
 * - 204 → sucesso com texto vazio (o PNCP usa isto como "página sem nada");
 * - 429/503 → transitório: espera `Retry-After` (segundos) se vier, senão o
 *   backoff com jitter, e retenta;
 * - 5xx outros → transitório com backoff;
 * - 4xx outros → PERMANENTE: não adianta repetir a mesma chamada ruim — volta
 *   já com `ok: false` e o corpo no `erro` (foi assim que o PNCP ensinou:
 *   parâmetro errado disfarçado de indisponibilidade custa 45 min de retenta).
 */
export async function fetchComRetry(
  url: string,
  opts: OpcoesFetchComRetry = {},
): Promise<ResultFetchComRetry> {
  const tentativasMax = Math.max(1, opts.tentativas ?? 4);
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const aleatorio = opts.aleatorio ?? ((max: number) => randomInt(max));
  let ultimoErro = "";
  let statusHttp: number | undefined;

  for (let tentativa = 1; tentativa <= tentativasMax; tentativa++) {
    if (opts.pausaEntreRequestsMs) await delay(opts.pausaEntreRequestsMs);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT_HONESTO,
          Accept: "application/json, text/plain, */*",
          ...opts.headers,
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      statusHttp = res.status;

      if (res.status === 204) {
        return { ok: true, statusHttp: 204, texto: "", tentativasUsadas: tentativa };
      }
      if (res.ok) {
        return { ok: true, statusHttp: res.status, texto: await res.text(), tentativasUsadas: tentativa };
      }
      if (res.status === 429 || res.status === 503) {
        const retryAfter = Number(res.headers.get("retry-after"));
        ultimoErro = `HTTP ${res.status}`;
        if (tentativa < tentativasMax) {
          await delay(
            Number.isFinite(retryAfter) && retryAfter > 0
              ? Math.min(retryAfter * 1000, opts.backoffTetoMs ?? 60_000)
              : calcularEsperaMs(tentativa, opts, aleatorio),
          );
        }
        continue;
      }
      if (res.status >= 500) {
        ultimoErro = `HTTP ${res.status}`;
        if (tentativa < tentativasMax) await delay(calcularEsperaMs(tentativa, opts, aleatorio));
        continue;
      }
      // 4xx que não é 429: erro permanente — corpo da resposta no erro, para o
      // coletor distinguir "recurso não existe" de "rede caiu".
      const corpo = await res.text().catch(() => "");
      return {
        ok: false,
        statusHttp: res.status,
        erro: `HTTP ${res.status} (permanente): ${url} ${corpo.slice(0, 200)}`.trim(),
        tentativasUsadas: tentativa,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      ultimoErro = /abort/i.test(msg) ? `timeout de ${timeoutMs}ms` : msg;
      if (tentativa < tentativasMax) await delay(calcularEsperaMs(tentativa, opts, aleatorio));
    }
  }
  return { ok: false, statusHttp, erro: ultimoErro, tentativasUsadas: tentativasMax };
}

/** `fetchComRetry` + parse JSON, com abort opcional no falho (o padrão dos coletores). */
export async function fetchJsonComRetry<T = unknown>(
  url: string,
  opts: OpcoesFetchComRetry = {},
): Promise<T> {
  const r = await fetchComRetry(url, opts);
  if (!r.ok || r.texto === undefined) throw new Error(r.erro || `falha em ${url}`);
  // BOM: a FGV publica JSON com EF BB BF e JSON.parse engasga (lição de
  // coletar-execucao-fgv.mts). Remover aqui é mais barato que cada coletor lembrar.
  return JSON.parse(r.texto.replace(/^\uFEFF/, "")) as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkpoint de retomada.
//
// Contrato mínimo: um JSON por coletor, `lerCheckpoint` devolve `null` se não
// existe/está corrompido (checkpoint ilegível nunca derruba uma coleta — volta
// do zero com aviso), `gravarCheckpoint` escreve atômico (`.tmp` + rename) para
// uma queda no meio do write não deixar JSON truncado que a próxima leitura
// descartaria.

export function caminhoCheckpoint(nome: string, pasta: string = PASTA_CHECKPOINTS): string {
  // Colapsa sequencias de pontos (o filtro abaixo preserva ".", e
  // "../../etc/passwd" virava "..-..-etc-passwd" com ".." dentro).
  const seguro = nome
    .replace(/[^a-z0-9._-]/gi, "-")
    .replace(/\.{2,}/g, ".")
    .toLowerCase();
  if (!seguro) throw new Error("nome de checkpoint vazio");
  return path.join(pasta, `${seguro}.json`);
}

export function lerCheckpoint<T = Record<string, unknown>>(
  nome: string,
  pasta: string = PASTA_CHECKPOINTS,
): T | null {
  const p = caminhoCheckpoint(nome, pasta);
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function gravarCheckpoint(
  nome: string,
  dados: unknown,
  pasta: string = PASTA_CHECKPOINTS,
): void {
  const p = caminhoCheckpoint(nome, pasta);
  mkdirSync(path.dirname(p), { recursive: true });
  const tmp = `${p}.tmp`;
  writeFileSync(tmp, JSON.stringify(dados, null, 1), "utf-8");
  // No POSIX, rename por cima é atômico. No Windows, renameSync sobre arquivo
  // existente lança EPERM — por isso o unlink antes, só no Windows. A janela
  // entre unlink e rename existe, mas uma queda ali deixa `.tmp` intacto e a
  // próxima leitura cai no `null` de "não tem checkpoint" — nunca em JSON
  // truncado, que é o modo de falha que isto previne.
  if (process.platform === "win32" && existsSync(p)) unlinkSync(p);
  renameSync(tmp, p);
}

export function apagarCheckpoint(nome: string, pasta: string = PASTA_CHECKPOINTS): void {
  try {
    unlinkSync(caminhoCheckpoint(nome, pasta));
  } catch {
    /* não existia — tudo bem */
  }
}
