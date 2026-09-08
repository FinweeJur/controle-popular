/**
 * LinkMender v2 — Buscas web para achar o substituto do link quebrado.
 *
 * Três consultas com palavras-chave DIFERENTES (plano Fase 3):
 *   (a) título do documento + órgão + filetype:pdf
 *   (b) "título exato" entre aspas
 *   (c) site:domínio-original termo
 *
 * Tudo que depende de rede recebe `fetchFn` por parâmetro — o pipeline inteiro
 * é testável com fetch mockado (esta máquina tem rede bloqueada, WinError
 * 10013). A primeira rodada REAL é no home-pc (ver cabeçalho do script
 * scripts/agent-tools/linkmender-v2.mts).
 */

import type { TipoConteudo } from "./criterios";

export const USER_AGENT_LINKMENDER =
  "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular; verificador de links - LinkMender v2)";

export const TIMEOUT_BUSCA_MS = 12000;

export interface ContextoBusca {
  url: string;
  /** Título do documento/item, quando conhecido. */
  titulo?: string | null;
  /** Nome do órgão emissor, quando conhecido. */
  orgao?: string | null;
}

/** Extrai palavras do path da URL, para quando não há título conhecido. */
export function termosDaUrl(url: string): string {
  try {
    const u = new URL(url);
    const segs = u.pathname
      .split("/")
      .map((s) => s.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim())
      .filter((s) => s.length > 1)
      .slice(-4);
    return segs.join(" ");
  } catch {
    return url;
  }
}

export interface ConsultaBusca {
  /** Estratégia: "titulo-orgao-filetype" | "titulo-exato" | "site-dominio". */
  estrategia: string;
  query: string;
}

/**
 * Monta as 3 consultas, na ordem de precisão decrescente. Sem título, as
 * estratégias (a) e (b) degradam para termos extraídos do path — e a (c) segue
 * valendo, que é a mais confiável (mesmo domínio).
 */
export function montarConsultasBusca(ctx: ContextoBusca): ConsultaBusca[] {
  let hostname = "";
  try {
    hostname = new URL(ctx.url).hostname;
  } catch {
    hostname = "";
  }
  const tipo: TipoConteudo = (() => {
    const p = (() => {
      try {
        return new URL(ctx.url).pathname.toLowerCase();
      } catch {
        return "";
      }
    })();
    if (p.endsWith(".pdf")) return "pdf";
    return "desconhecido";
  })();

  const titulo = (ctx.titulo ?? "").trim();
  const orgao = (ctx.orgao ?? "").trim();
  const termos = titulo || termosDaUrl(ctx.url);

  const consultas: ConsultaBusca[] = [];

  // (a) título + órgão + filetype:pdf
  const partesA = [titulo || termos, orgao || hostname].filter(Boolean);
  const filetype = tipo === "pdf" ? " filetype:pdf" : "";
  consultas.push({
    estrategia: "titulo-orgao-filetype",
    query: `${partesA.join(" ")}${filetype}`.trim(),
  });

  // (b) "título exato" entre aspas
  const alvoExato = titulo || termos;
  consultas.push({
    estrategia: "titulo-exato",
    query: `"${alvoExato}"`,
  });

  // (c) site:domínio-original termo
  const partesC = hostname ? [`site:${hostname}`, titulo || termos] : [termos];
  consultas.push({
    estrategia: "site-dominio",
    query: partesC.filter(Boolean).join(" ").trim(),
  });

  return consultas;
}

/** Extrai a URL alvo de um <a class="result__a" href="..."> do HTML do DDG. */
export function extrairUrlDoLinkDdg(href: string): string | null {
  try {
    const u = new URL(href, "https://duckduckgo.com");
    const uddg = u.searchParams.get("uddg");
    if (uddg) {
      const alvo = decodeURIComponent(uddg);
      if (alvo.startsWith("http")) return alvo;
    }
    if (href.startsWith("http")) return href;
    return null;
  } catch {
    return null;
  }
}

export function parsearResultadosDdg(html: string): string[] {
  const links: string[] = [];
  const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && links.length < 10) {
    const alvo = extrairUrlDoLinkDdg(m[1]);
    if (alvo) links.push(alvo);
  }
  return links;
}

export type FetchFn = typeof fetch;

export interface ResultadoBusca {
  ok: boolean;
  links: string[];
  erro?: string;
}

/** Uma busca no DuckDuckGo (HTML), com UA honesto e timeout. */
export async function buscarNoDuckDuckGo(
  termos: string,
  fetchFn: FetchFn = fetch
): Promise<ResultadoBusca> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_BUSCA_MS);
  try {
    const res = await fetchFn(
      `https://duckduckgo.com/html/?q=${encodeURIComponent(termos)}`,
      { headers: { "User-Agent": USER_AGENT_LINKMENDER }, signal: controller.signal }
    );
    if (!res.ok) return { ok: false, links: [], erro: `HTTP ${res.status}` };
    const html = await res.text();
    const links = parsearResultadosDdg(html);
    return { ok: true, links };
  } catch (err) {
    return { ok: false, links: [], erro: (err as Error).message };
  } finally {
    clearTimeout(timer);
  }
}
