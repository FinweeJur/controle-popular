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

export const USER_AGENT_LINKMENDER =
  "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular; verificador de links - LinkMender v2)";

/** Órgão conhecido por fragmento de domínio — qualifica a busca (plano 2.4). */
const ORGAO_POR_DOMINIO: [RegExp, string][] = [
  [/meioambiente\.mg\.gov\.br/, "Semad MG"],
  [/igam\.mg\.gov\.br/, "Igam MG"],
  [/feam\.br/, "Feam"],
  [/ibama\.gov\.br/, "Ibama"],
  [/icmbio\.gov\.br/, "ICMBio"],
  [/ibge\.gov\.br/, "IBGE"],
  [/anm\.gov\.br/, "ANM"],
  [/anp\.gov\.br/, "ANP"],
  [/mpmg\.mp\.br/, "MPMG"],
  [/mppr\.mp\.br/, "MPPR"],
  [/tce\.mg\.gov\.br/, "TCE-MG"],
  [/almg\.gov\.br/, "ALMG"],
  [/camara\.leg\.br/, "Camara dos Deputados"],
  [/senado\.leg\.br/, "Senado Federal"],
  [/tse\.jus\.br/, "TSE"],
  [/cnj\.jus\.br/, "CNJ"],
  [/gov\.br/, "Governo Federal"],
];

/**
 * Nome do órgão a partir do domínio, para reforçar a consulta (a) da busca.
 * Sem correspondência: devolve null e a busca usa o próprio hostname.
 */
export function orgaoDeUrl(url: string): string | null {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const [padrao, nome] of ORGAO_POR_DOMINIO) {
    if (padrao.test(host)) return nome;
  }
  return null;
}

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

/**
 * Chaves únicas fortes da URL: número de processo/protocolo, CNPJ e nome do
 * arquivo. Buscar por elas acha o documento específico — muito melhor que
 * buscar pelo título genérico (plano Fase 2, item 3). Devolve no máximo 3,
 * sem repetição.
 */
export function chavesDeUrl(url: string): string[] {
  const chaves: string[] = [];
  try {
    const u = new URL(url);
    const alvo = decodeURIComponent(`${u.pathname} ${u.search}`);
    const numeros = alvo.match(/\d{4,}/g) ?? [];
    chaves.push(...numeros);
    const cnpj = alvo.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
    if (cnpj) chaves.push(cnpj[0].replace(/\D/g, ""));
    // Nome de arquivo só é chave se tiver dígito (id/ano/versão): sem isso,
    // "index", "relatorio" e slug de título poluiriam a busca com ruído.
    const arquivo = (u.pathname.split("/").pop() ?? "").replace(/\.[a-z0-9]+$/i, "");
    if (/\d/.test(arquivo) && arquivo.length > 3) {
      chaves.push(arquivo.replace(/[-_]+/g, " ").trim());
    }
  } catch {
    // url invalida: sem chaves
  }
  return [...new Set(chaves)].filter((c) => c.length >= 4).slice(0, 3);
}

export interface ConsultaBusca {
  /** Estratégia: "titulo-orgao-filetype" | "titulo-exato" | "site-dominio". */
  estrategia: string;
  query: string;
}

/** Consulta por chave única (processo/CNPJ/arquivo), ou null se não há chave. */
function consultaChaveUnica(ctx: { url: string; hostname: string }): ConsultaBusca | null {
  const chave = chavesDeUrl(ctx.url)[0];
  if (!chave) return null;
  return {
    estrategia: "chave-unica",
    query: [chave, ctx.hostname ? `site:${ctx.hostname}` : ""].filter(Boolean).join(" ").trim(),
  };
}

function hostnameDe(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function ehPdf(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

interface TextoBusca {
  termos: string;
  orgao: string;
  hostname: string;
}

function consultaTituloOrgao(ctx: TextoBusca, pdf: boolean): ConsultaBusca {
  const filetype = pdf ? " filetype:pdf" : "";
  const partes = [ctx.termos, ctx.orgao || ctx.hostname].filter(Boolean);
  return {
    estrategia: "titulo-orgao-filetype",
    query: `${partes.join(" ")}${filetype}`.trim(),
  };
}

function consultaSite(ctx: TextoBusca): ConsultaBusca {
  return {
    estrategia: "site-dominio",
    query: [ctx.hostname ? `site:${ctx.hostname}` : "", ctx.termos].filter(Boolean).join(" ").trim(),
  };
}

/**
 * Monta as consultas, na ordem de precisão decrescente. Sem título, as
 * estratégias degradam para termos extraídos do path — e a de mesmo domínio
 * segue valendo, que é a mais confiável.
 */
export function montarConsultasBusca(ctx: ContextoBusca): ConsultaBusca[] {
  const hostname = hostnameDe(ctx.url);
  const titulo = (ctx.titulo ?? "").trim();
  const orgao = (ctx.orgao ?? "").trim();
  const termos = titulo || termosDaUrl(ctx.url);
  const texto: TextoBusca = { termos, orgao, hostname };

  const consultas: ConsultaBusca[] = [];

  // (0) chave única primeiro: processo/protocolo/CNPJ/arquivo acham o
  // documento específico — o que mais importa no portal (processos,
  // contratos, convênios), não a home do órgão.
  const porChave = consultaChaveUnica({ url: ctx.url, hostname });
  if (porChave) consultas.push(porChave);

  consultas.push(consultaTituloOrgao(texto, ehPdf(ctx.url)));
  consultas.push({ estrategia: "titulo-exato", query: `"${termos}"` });
  consultas.push(consultaSite(texto));

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
