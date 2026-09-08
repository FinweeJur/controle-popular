/**
 * LinkMender v2 — Verificação de link: HTTP real + validação de CONTEÚDO.
 *
 * Regra do AGENTS.md: "API responde 200 e mente". Então nunca confiamos só no
 * status: amostramos o corpo (GET com Range=bytes=0-1024) e conferimos — PDF
 * tem que começar com %PDF, página HTML não pode trazer "página não
 * encontrada" com 200. O juiz do conteúdo vive em criterios.ts (corpoConfere),
 * puro e testado.
 *
 * `sondar` recebe `fetchFn` por parâmetro: todo o pipeline roda com fetch
 * mockado nesta máquina (rede bloqueada, WinError 10013). Primeira rodada
 * real: home-pc.
 */

import { corpoConfere } from "./criterios";
import { USER_AGENT_LINKMENDER } from "./busca";
import type { FetchFn } from "./busca";

const TIMEOUT_SONDAGEM_MS = 10000;

export type ClasseLink =
  | "OK"
  | "REDIRECT"
  | "QUEBRADO"
  | "MENTIROSO"
  | "INCONSISTENTE";

export interface Sondagem {
  statusHttp: number | null;
  contentType: string | null;
  finalUrl: string | null;
  corpoInicial: string | null;
  metodo: "HEAD" | "GET";
  erro?: string;
}

async function requisitar(
  url: string,
  metodo: "HEAD" | "GET",
  fetchFn: FetchFn
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_SONDAGEM_MS);
  try {
    const headers: Record<string, string> = { "User-Agent": USER_AGENT_LINKMENDER };
    if (metodo === "GET") headers["Range"] = "bytes=0-1024";
    return await fetchFn(url, {
      method: metodo,
      headers,
      signal: controller.signal,
      redirect: "follow",
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Sonda um link: HEAD com fallback GET-range; captura corpo e Content-Type. */
export async function sondar(
  url: string,
  fetchFn: FetchFn = fetch
): Promise<Sondagem> {
  try {
    const res = await requisitar(url, "HEAD", fetchFn);
    if (res.status !== 405) {
      const base = {
        statusHttp: res.status,
        contentType: res.headers.get("content-type"),
        finalUrl: res.url || url,
      };
      // HEAD não traz corpo. Para validar conteúdo ("200 e mente") amostramos
      // os primeiros bytes com GET-range — melhor esforço, sem quebrar a
      // sondagem se o GET falhar.
      let corpoInicial: string | null = null;
      if (res.status >= 200 && res.status < 300) {
        try {
          const resGet = await requisitar(url, "GET", fetchFn);
          corpoInicial = await resGet.text().catch(() => null);
        } catch {
          corpoInicial = null;
        }
      }
      return { ...base, corpoInicial, metodo: "HEAD" };
    }
  } catch {
    // cai no GET abaixo
  }
  try {
    const res = await requisitar(url, "GET", fetchFn);
    return {
      statusHttp: res.status,
      contentType: res.headers.get("content-type"),
      finalUrl: res.url || url,
      corpoInicial: await res.text().catch(() => null),
      metodo: "GET",
    };
  } catch (err) {
    return {
      statusHttp: null,
      contentType: null,
      finalUrl: null,
      corpoInicial: null,
      metodo: "GET",
      erro: (err as Error).message,
    };
  }
}

function mesmasUrls(a: string, b: string): boolean {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    const pa = ua.pathname.replace(/\/+$/, "");
    const pb = ub.pathname.replace(/\/+$/, "");
    return (
      ua.hostname === ub.hostname &&
      ua.port === ub.port &&
      pa === pb &&
      ua.search === ub.search
    );
  } catch {
    return a === b;
  }
}

export interface Verificacao {
  classe: ClasseLink;
  statusHttp: number | null;
  finalUrl: string | null;
  contentType: string | null;
  motivo?: string;
}

/**
 * Verifica HTTP + conteúdo. REDIRECT é 2xx que aterrissou em outra URL
 * (a servidora disse onde o documento foi — proposta de alta confiança).
 * MENTIROSO é 2xx cujo corpo não confere (soft 404, PDF como HTML).
 */
export function classificarVerificacao(
  url: string,
  s: Sondagem
): Verificacao {
  const base = {
    statusHttp: s.statusHttp,
    finalUrl: s.finalUrl,
    contentType: s.contentType,
  };
  if (s.statusHttp === null) {
    return { ...base, classe: "INCONSISTENTE", motivo: `erro de rede: ${s.erro ?? "sem resposta"}` };
  }
  if (s.statusHttp === 404 || s.statusHttp === 410) {
    return { ...base, classe: "QUEBRADO" };
  }
  if (s.statusHttp >= 200 && s.statusHttp < 300) {
    const redirecionou = s.finalUrl !== null && !mesmasUrls(url, s.finalUrl);
    if (redirecionou) return { ...base, classe: "REDIRECT", finalUrl: s.finalUrl };
    const corpo = corpoConfere(url, s.corpoInicial);
    if (!corpo.confere) {
      return { ...base, classe: "MENTIROSO", motivo: `200 mas ${corpo.motivo}` };
    }
    return { ...base, classe: "OK" };
  }
  if (s.statusHttp === 401 || s.statusHttp === 403) {
    return { ...base, classe: "OK", motivo: "requer autenticacao (vivo)" };
  }
  return {
    ...base,
    classe: "INCONSISTENTE",
    motivo: `status HTTP ${s.statusHttp} (nem ok, nem quebrado, nem redirect)`,
  };
}

export async function verificarLink(
  url: string,
  fetchFn: FetchFn = fetch
): Promise<Verificacao> {
  const s = await sondar(url, fetchFn);
  return classificarVerificacao(url, s);
}
