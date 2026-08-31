/**
 * LinkMender — Verificador de Links Externos e Gerador de Propostas
 *
 * Varre URLs externas referenciadas em apps/web/app (arquivos .tsx) e
 * apps/web/lib (arquivos .ts), mais os urlOficial do registry de fontes,
 * sonda cada uma (HEAD com fallback GET range), classifica como OK,
 * REDIRECT, QUEBRADO ou INCONSISTENTE, e gera propostas de correcao em
 * docs/relatorios-automacao/linkmender-propostas.md.
 *
 * Regras do projeto respeitadas:
 *  - User-Agent honesto (identifica o projeto), nunca UA de navegador falso.
 *  - Pausa de 400ms entre requisicoes (configuravel via LINKMENDER_PAUSA_MS).
 *  - Proposta de correcao SOMENTE para links de dominios governamentais
 *    (.gov.br, .mp.br, .jus.br, .trf.jus.br); os demais entram em lista
 *    de correcao manual.
 *  - Correcao NUNCA e aplicada nem commitada: o relatorio .md e a proposta
 *    para revisao humana.
 *  - Busca de URL correta so usa DuckDuckGo HTML e aceita resultado do
 *    MESMO dominio governamental.
 */

import { Dirent, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listarTodasFontes } from "../../apps/web/lib/fontes/registry.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const APPS_WEB = path.join(RAIZ, "apps", "web");
const RELATORIO_DESTINO = path.join(
  RAIZ,
  "docs",
  "relatorios-automacao",
  "linkmender-propostas.md"
);

const USER_AGENT =
  "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular; verificador de links - LinkMender)";

const TIMEOUT_MS = 10000;
const TIMEOUT_BUSCA_MS = 12000;
const PAUSA_PADRAO_MS = 400;

const SUFIXOS_GOV = [".gov.br", ".mp.br", ".jus.br", ".trf.jus.br"];

const RE_HREF = /href="(https:\/\/[^"]+)"/g;
const RE_URL_STRING = /url:\s*"(https:\/\/[^"]+)"/g;

type ClasseLink = "OK" | "REDIRECT" | "QUEBRADO" | "INCONSISTENTE";

interface UrlColetada {
  url: string;
  origem: string;
}

interface ResultadoSondagemRaw {
  statusHttp: number | null;
  finalUrl: string | null;
  tempoMs: number;
  metodo: "HEAD" | "GET";
  erro?: string;
}

interface ResultadoLink {
  url: string;
  origem: string;
  classe: ClasseLink;
  statusHttp: number | null;
  finalUrl: string | null;
  tempoMs: number;
  observacao?: string;
  motivo?: string;
}

interface Proposta {
  urlAntiga: string;
  urlNova: string;
  confianca: "alta" | "media";
  justificativa: string;
  origem: string;
  classe: ClasseLink;
  statusHttp: number | null;
}

interface SemProposta {
  url: string;
  classe: ClasseLink;
  statusHttp: number | null;
  motivo: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Pausa entre requisicoes, com override via LINKMENDER_PAUSA_MS. */
function obterPausaMs(): number {
  const raw = process.env.LINKMENDER_PAUSA_MS;
  if (raw && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return PAUSA_PADRAO_MS;
}

function hostGovernamental(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return SUFIXOS_GOV.some((s) => h.endsWith(s));
}

function normalizarUrl(raw: string): string {
  let s = raw.trim();
  s = s.replace(/[),;.]+$/, "");
  return s;
}

/** Compara duas URLs ignorando barra final, fragmento e normalizacao WHATWG. */
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

function coletarArquivos(dir: string, ext: string, alvo: string[]): void {
  let entradas: Dirent[] = [];
  try {
    entradas = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entrada of entradas) {
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === "node_modules" || entrada.name === ".next" || entrada.name === "public") {
        continue;
      }
      coletarArquivos(caminho, ext, alvo);
    } else if (entrada.isFile() && entrada.name.endsWith(ext)) {
      alvo.push(caminho);
    }
  }
}

function extrairUrlsDeCodigo(): UrlColetada[] {
  const arquivos: string[] = [];
  coletarArquivos(path.join(APPS_WEB, "app"), ".tsx", arquivos);
  coletarArquivos(path.join(APPS_WEB, "lib"), ".ts", arquivos);

  const coletadas: UrlColetada[] = [];
  for (const arquivo of arquivos) {
    const relativo = path.relative(RAIZ, arquivo).replace(/\\/g, "/");
    let conteudo: string;
    try {
      conteudo = readFileSync(arquivo, "utf-8");
    } catch {
      continue;
    }
    for (const re of [RE_HREF, RE_URL_STRING]) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(conteudo)) !== null) {
        const url = normalizarUrl(m[1]);
        if (url.startsWith("https://")) {
          coletadas.push({ url, origem: relativo });
        }
      }
    }
  }

  for (const fonte of listarTodasFontes()) {
    coletadas.push({ url: normalizarUrl(fonte.urlOficial), origem: "registry" });
  }
  return coletadas;
}

function dedupePorUrl(coletadas: UrlColetada[]): UrlColetada[] {
  const vistos = new Map<string, UrlColetada>();
  for (const c of coletadas) {
    if (!vistos.has(c.url)) {
      vistos.set(c.url, c);
    }
  }
  return Array.from(vistos.values());
}

async function buscar(url: string, metodo: "HEAD" | "GET"): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { "User-Agent": USER_AGENT };
    if (metodo === "GET") {
      headers["Range"] = "bytes=0-1024";
    }
    return await fetch(url, {
      method: metodo,
      headers,
      signal: controller.signal,
      redirect: "follow",
    });
  } finally {
    clearTimeout(timer);
  }
}

async function sondar(url: string): Promise<ResultadoSondagemRaw> {
  const inicio = Date.now();
  try {
    const res = await buscar(url, "HEAD");
    if (res.status === 405) {
      // HEAD recusado (metodo nao permitido): cai no fallback GET range
      throw new Error("HEAD recusado com 405");
    }
    return {
      statusHttp: res.status,
      finalUrl: res.url || url,
      tempoMs: Date.now() - inicio,
      metodo: "HEAD",
    };
  } catch (err) {
    try {
      const res = await buscar(url, "GET");
      return {
        statusHttp: res.status,
        finalUrl: res.url || url,
        tempoMs: Date.now() - inicio,
        metodo: "GET",
      };
    } catch (err2) {
      return {
        statusHttp: null,
        finalUrl: null,
        tempoMs: Date.now() - inicio,
        metodo: "GET",
        erro: (err2 as Error).message,
      };
    }
  }
}

async function sondarComPausa(url: string, pausaMs: number): Promise<ResultadoSondagemRaw> {
  const r = await sondar(url);
  await sleep(pausaMs);
  return r;
}

function classificar(
  coletada: UrlColetada,
  raw: ResultadoSondagemRaw
): ResultadoLink {
  const base = {
    url: coletada.url,
    origem: coletada.origem,
    statusHttp: raw.statusHttp,
    finalUrl: raw.finalUrl,
    tempoMs: raw.tempoMs,
  };

  if (raw.statusHttp === null) {
    return {
      ...base,
      classe: "INCONSISTENTE",
      motivo: `erro de rede: ${raw.erro ?? "sem resposta"}`,
    };
  }

  const redirecionou =
    raw.finalUrl !== null && !mesmasUrls(coletada.url, raw.finalUrl);

  if (raw.statusHttp === 404 || raw.statusHttp === 410) {
    return { ...base, classe: "QUEBRADO" };
  }
  if (raw.statusHttp === 401 || raw.statusHttp === 403) {
    if (redirecionou) {
      return { ...base, classe: "REDIRECT", observacao: "requer autenticacao" };
    }
    return { ...base, classe: "OK", observacao: "requer autenticacao" };
  }
  if (raw.statusHttp >= 200 && raw.statusHttp < 300) {
    if (redirecionou) {
      return { ...base, classe: "REDIRECT" };
    }
    return { ...base, classe: "OK" };
  }
  return {
    ...base,
    classe: "INCONSISTENTE",
    motivo: `status HTTP ${raw.statusHttp} (nem ok, nem quebrado, nem redirect)`,
  };
}

/** Monta termos de busca a partir do hostname e dos segmentos do path. */
function montarTermosBusca(urlOriginal: string): string {
  try {
    const u = new URL(urlOriginal);
    const segmentos = u.pathname
      .split("/")
      .map((s) => s.trim())
      .filter((s) => s !== "")
      .slice(0, 4);
    return [u.hostname, ...segmentos].join(" ");
  } catch {
    return urlOriginal;
  }
}

function extrairUrlDoLinkDdg(href: string): string | null {
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

async function buscarNoDuckDuckGo(
  termos: string
): Promise<{ ok: boolean; links: string[]; erro?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_BUSCA_MS);
  try {
    const res = await fetch(
      `https://duckduckgo.com/html/?q=${encodeURIComponent(termos)}`,
      {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      return { ok: false, links: [], erro: `HTTP ${res.status}` };
    }
    const html = await res.text();
    const links: string[] = [];
    const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null && links.length < 10) {
      const alvo = extrairUrlDoLinkDdg(m[1]);
      if (alvo) links.push(alvo);
    }
    return { ok: links.length > 0, links };
  } catch (err) {
    return { ok: false, links: [], erro: (err as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

interface ResultadoBuscaSubstituto {
  proposta: { urlNova: string; status: number | null; justificativa: string } | null;
  buscaOk: boolean;
  buscaErro?: string;
}

/** Tenta achar substituto vivo no MESMO dominio governamental via DuckDuckGo. */
async function encontrarSubstitutoGov(
  urlQuebrada: string,
  pausaMs: number
): Promise<ResultadoBuscaSubstituto> {
  const termos = montarTermosBusca(urlQuebrada);
  const busca = await buscarNoDuckDuckGo(termos);
  await sleep(pausaMs);
  if (!busca.ok) {
    return { proposta: null, buscaOk: false, buscaErro: busca.erro };
  }
  if (busca.links.length === 0) {
    return { proposta: null, buscaOk: true };
  }
  for (const candidata of busca.links) {
    if (candidata === urlQuebrada) continue;
    let hostname: string;
    try {
      hostname = new URL(candidata).hostname;
    } catch {
      continue;
    }
    if (!hostGovernamental(hostname)) continue;
    const sonda = await sondarComPausa(candidata, pausaMs);
    const viva =
      sonda.statusHttp !== null &&
      ((sonda.statusHttp >= 200 && sonda.statusHttp < 300) ||
        sonda.statusHttp === 401 ||
        sonda.statusHttp === 403);
    if (viva) {
      return {
        proposta: {
          urlNova: candidata,
          status: sonda.statusHttp,
          justificativa: `URL atualizada encontrada em busca no DuckDuckGo no mesmo dominio governamental; verificada HTTP ${sonda.statusHttp}`,
        },
        buscaOk: true,
      };
    }
  }
  return { proposta: null, buscaOk: true };
}

async function gerarPropostas(
  resultados: ResultadoLink[],
  pausaMs: number
): Promise<{ propostas: Proposta[]; semProposta: SemProposta[] }> {
  const propostas: Proposta[] = [];
  const semProposta: SemProposta[] = [];

  for (const r of resultados) {
    if (r.classe !== "QUEBRADO" && r.classe !== "REDIRECT") continue;

    let hostname: string;
    try {
      hostname = new URL(r.url).hostname;
    } catch {
      semProposta.push({
        url: r.url,
        classe: r.classe,
        statusHttp: r.statusHttp,
        motivo: "URL invalida — nao parseia",
      });
      continue;
    }

    if (!hostGovernamental(hostname)) {
      semProposta.push({
        url: r.url,
        classe: r.classe,
        statusHttp: r.statusHttp,
        motivo: "dominio nao governamental — correcao manual",
      });
      continue;
    }

    if (r.classe === "REDIRECT" && r.finalUrl) {
      propostas.push({
        urlAntiga: r.url,
        urlNova: r.finalUrl,
        confianca: "alta",
        justificativa: `Servidor respondeu redirect para este endereco, que respondeu HTTP ${r.statusHttp} na sondagem`,
        origem: r.origem,
        classe: r.classe,
        statusHttp: r.statusHttp,
      });
      continue;
    }

    // QUEBRADO em dominio governamental: busca por substituto
    const substituto = await encontrarSubstitutoGov(r.url, pausaMs);
    if (substituto.proposta) {
      propostas.push({
        urlAntiga: r.url,
        urlNova: substituto.proposta.urlNova,
        confianca: "media",
        justificativa: substituto.proposta.justificativa,
        origem: r.origem,
        classe: r.classe,
        statusHttp: r.statusHttp,
      });
    } else {
      semProposta.push({
        url: r.url,
        classe: r.classe,
        statusHttp: r.statusHttp,
        motivo: substituto.buscaOk
          ? "correcao nao encontrada"
          : `busca falhou: ${substituto.buscaErro ?? "sem resposta"}`,
      });
    }
  }

  return { propostas, semProposta };
}

function escreverRelatorio(
  resultados: ResultadoLink[],
  propostas: Proposta[],
  semProposta: SemProposta[],
  pausaMs: number,
  duracaoMs: number
): void {
  const total = resultados.length;
  const ok = resultados.filter((r) => r.classe === "OK").length;
  const quebrados = resultados.filter((r) => r.classe === "QUEBRADO").length;
  const redirects = resultados.filter((r) => r.classe === "REDIRECT").length;
  const inconsistentes = resultados.filter((r) => r.classe === "INCONSISTENTE").length;

  const afetados = resultados
    .filter((r) => r.classe === "QUEBRADO" || r.classe === "REDIRECT")
    .sort((a, b) => a.url.localeCompare(b.url));

  const linhas: string[] = [];
  linhas.push("# LinkMender — Propostas de Correcao de Links");
  linhas.push("");
  linhas.push(`- Gerado em: ${new Date().toISOString()}`);
  linhas.push(`- Duracao total: ${(duracaoMs / 60000).toFixed(1)} min`);
  linhas.push(`- Pausa entre requisicoes: ${pausaMs}ms`);
  linhas.push("");
  linhas.push("## Resumo");
  linhas.push("");
  linhas.push(`- Total de URLs unicas testadas: ${total}`);
  linhas.push(`- OK: ${ok}`);
  linhas.push(`- QUEBRADOS: ${quebrados}`);
  linhas.push(`- REDIRECTS: ${redirects}`);
  linhas.push(`- INCONSISTENTES: ${inconsistentes}`);
  linhas.push(`- Propostas geradas: ${propostas.length}`);
  linhas.push(`- Links sem proposta: ${semProposta.length}`);
  linhas.push("");
  linhas.push("## Links quebrados e redirecionados");
  linhas.push("");
  linhas.push("| URL | classe | status | finalUrl |");
  linhas.push("|---|---|---|---|");
  for (const r of afetados) {
    const finalUrl = r.finalUrl ? r.finalUrl : "-";
    linhas.push(
      `| ${r.url.replace(/\|/g, "\\|")} | ${r.classe} | ${r.statusHttp ?? "-"} | ${finalUrl.replace(/\|/g, "\\|")} |`
    );
  }
  linhas.push("");
  linhas.push("## Propostas com diff");
  linhas.push("");
  if (propostas.length === 0) {
    linhas.push("Nenhuma proposta gerada nesta execucao.");
    linhas.push("");
  } else {
    propostas.forEach((p, i) => {
      linhas.push(`### ${i + 1}. ${p.urlAntiga}`);
      linhas.push("");
      linhas.push("```diff");
      linhas.push(`- href="${p.urlAntiga}"`);
      linhas.push(`+ href="${p.urlNova}"`);
      linhas.push("```");
      linhas.push("");
      linhas.push(`Confianca: ${p.confianca}`);
      linhas.push(`Justificativa: ${p.justificativa}`);
      linhas.push(`Origem: ${p.origem}`);
      linhas.push("");
    });
  }
  linhas.push("## Quebrados e redirecionados sem proposta");
  linhas.push("");
  if (semProposta.length === 0) {
    linhas.push("Nenhum link sem proposta nesta execucao.");
    linhas.push("");
  } else {
    for (const s of semProposta) {
      linhas.push(`- ${s.url} (${s.statusHttp ?? "rede"}) — ${s.motivo}`);
    }
    linhas.push("");
  }
  const inconsistentesDetalhados = resultados
    .filter((r) => r.classe === "INCONSISTENTE")
    .sort((a, b) => a.url.localeCompare(b.url));
  linhas.push("## Inconsistentes (nao verificados, sem proposta)");
  linhas.push("");
  if (inconsistentesDetalhados.length === 0) {
    linhas.push("Nenhum link inconsistente nesta execucao.");
    linhas.push("");
  } else {
    for (const r of inconsistentesDetalhados) {
      const detalhe = r.motivo ?? `HTTP ${r.statusHttp ?? "sem resposta"}`;
      linhas.push(`- ${r.url} (${r.statusHttp ?? "rede"}) — ${detalhe}`);
    }
    linhas.push("");
  }
  linhas.push("---");
  linhas.push("");
  linhas.push(
    "Relatorio gerado por LinkMender (scripts/agent-tools/linkmender-checker.mts). Correcoes NAO sao commitadas automaticamente — este arquivo e a proposta para revisao humana."
  );

  mkdirSync(path.dirname(RELATORIO_DESTINO), { recursive: true });
  writeFileSync(RELATORIO_DESTINO, linhas.join("\n") + "\n", "utf-8");
}

export async function executarLinkMender(): Promise<void> {
  const inicioTotal = Date.now();
  const pausaMs = obterPausaMs();
  console.log("🔗 [LinkMender] Iniciando varredura de links externos...");

  const coletadas = dedupePorUrl(extrairUrlsDeCodigo());
  console.log(`  ${coletadas.length} URLs unicas (codigo + registry)`);

  const resultados: ResultadoLink[] = [];
  for (let i = 0; i < coletadas.length; i++) {
    const c = coletadas[i];
    const raw = await sondarComPausa(c.url, pausaMs);
    const r = classificar(c, raw);
    resultados.push(r);

    const icone =
      r.classe === "OK" ? "✓" : r.classe === "REDIRECT" ? "↪" : r.classe === "QUEBRADO" ? "✗" : "?";
    const detalhe =
      r.statusHttp !== null
        ? `HTTP ${r.statusHttp}`
        : `ERRO: ${r.motivo ?? "sem resposta"}`;
    console.log(
      `  [${i + 1}/${coletadas.length}] ${icone} ${r.url} -> ${detalhe} (${r.tempoMs}ms)${r.observacao ? ` ${r.observacao}` : ""}`
    );
  }

  console.log("\n  Gerando propostas de correcao (somente dominios governamentais)...");
  const { propostas, semProposta } = await gerarPropostas(resultados, pausaMs);

  const duracaoMs = Date.now() - inicioTotal;
  escreverRelatorio(resultados, propostas, semProposta, pausaMs, duracaoMs);

  console.log("\n✓ [LinkMender] Relatorio salvo em: " + RELATORIO_DESTINO);
  console.log(
    `  Resumo: ${resultados.length} URLs | OK ${resultados.filter((r) => r.classe === "OK").length} | QUEBRADOS ${resultados.filter((r) => r.classe === "QUEBRADO").length} | REDIRECTS ${resultados.filter((r) => r.classe === "REDIRECT").length} | INCONSISTENTES ${resultados.filter((r) => r.classe === "INCONSISTENTE").length} | propostas ${propostas.length}`
  );

  if (duracaoMs > 15 * 60 * 1000) {
    console.log(
      "  AVISO: varredura excedeu 15 minutos. Para acelerar, rode com LINKMENDER_PAUSA_MS=300."
    );
  }
  console.log("");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  executarLinkMender().catch(console.error);
}
