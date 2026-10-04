/**
 * auditar-seo.mts — auditoria de SEO on-page das 100 páginas nobres.
 *
 * Papel no portal: é a execução do "audit técnico" do Sprint 1 do
 * PLANO-seo-visibilidade-buscadores.md (meta tags, canonical, robots,
 * structured data). Roda contra o site publicado — o mesmo HTML que o
 * buscador vê — e grava relatório datado em docs/relatorios-automacao/.
 *
 * O que mede por página (extraído do HTML, sem navegador):
 *   status HTTP · title (comprimento) · meta description · canonical
 *   (presente, host www, path bate com o acessado) · og:image ·
 *   meta robots (noindex em página nobre e erro) · contagem de h1 ·
 *   lang · JSON-LD · tempo de resposta.
 *
 * Decisões não triviais:
 *   - User-Agent honesto com o endereço do portal (AGENTS 11): o buscador
 *     precisa saber quem pediu;
 *   - pausa entre requisições: padrão 2500 ms, medido em 04/10/2026 — a
 *     1200 ms, 27 das 100 páginas devolveram 502/503 e a 2500 ms passaram
 *     todas (throttling do container, mesma armadilha do `npm run aquecer`);
 *   - retry de 1x em 502/503/timeout antes de registrar erro: falha que
 *     some no retry não é defeito da página, é rajada de tráfego;
 *   - fetch em vez de crawl: só as top-100 do catálogo, não o site inteiro;
 *   - regex e não parser DOM: o Next entrega o HTML final na resposta, e
 *     instalar dependência nova para ler 6 tags não paga o peso.
 *
 * Uso:
 *   npx tsx scripts/auditar-seo.mts                    # produção (www)
 *   npx tsx scripts/auditar-seo.mts --base=http://localhost:3000
 *   npx tsx scripts/auditar-seo.mts --limite=10 --pausa=500
 *   npx tsx scripts/auditar-seo.mts --sem-relatorio    # só imprime
 *
 * Códigos de saída: 0 = todas responderam 200; 1 = alguma página caiu
 * (404/5xx/timeout). Defeito on-page (title longo, canonical ausente) é
 * AVISO no relatório, não falha — a correção é humana e a rotina é semanal.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));

const BASE_PADRAO = "https://www.controlepopular.com.br";
const UA = "ControlePopular-SEO/1.0 (+https://www.controlepopular.com.br)";

/** Um achado de uma página. `gravidade`: erro trava a saída, aviso não. */
type Achado = { pagina: string; gravidade: "erro" | "aviso"; texto: string };

type Resultado = {
  href: string;
  status: number;
  ms: number;
  title?: string;
  description?: string;
  canonical?: string;
  achados: Achado[];
};

function lerArgs(): { base: string; limite: number; pausa: number; relatorio: boolean } {
  const args = process.argv.slice(2);
  const pegar = (chave: string): string | undefined => {
    const item = args.find((a) => a.startsWith(`--${chave}=`));
    return item ? item.slice(chave.length + 3) : undefined;
  };
  return {
    base: (pegar("base") ?? BASE_PADRAO).replace(/\/$/, ""),
    limite: Number(pegar("limite") ?? 0),
    pausa: Number(pegar("pausa") ?? 2500),
    relatorio: !args.includes("--sem-relatorio"),
  };
}

/** Extrai o conteúdo de uma meta tag pelo atributo name/property. */
function meta(html: string, atributo: string, valor: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+${atributo}=["']${valor}["'][^>]*content=["']([^"']*)["']`,
    "i"
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+${atributo}=["']${valor}["']`,
    "i"
  );
  return (html.match(re) ?? html.match(alt))?.[1];
}

/** Avalia uma página e devolve os achados + dados para o relatório. */
async function auditar(base: string, href: string): Promise<Resultado> {
  const url = `${base}${href}`;
  const inicio = Date.now();
  const achados: Achado[] = [];
  let status = 0;
  let html = "";

  // Retry único em falha transitória (502/503/timeout): medido em
  // 04/10/2026, 27 páginas "caíram" na primeira passada por throttling e
  // passaram na segunda. Só o segundo erro é defeito da página.
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const resp = await fetch(url, {
        headers: { "user-agent": UA, "accept-language": "pt-BR" },
        redirect: "follow",
        signal: AbortSignal.timeout(30_000),
      });
      status = resp.status;
      html = await resp.text();
      if (status !== 502 && status !== 503) break;
    } catch {
      // Exceção de rede/timeout: tenta de novo; se falhar nas duas, o
      // bloco abaixo registra um único erro em vez de ruído duplicado.
      status = 0;
      html = "";
    }
    if (tentativa === 0) await new Promise((s) => setTimeout(s, 3000));
  }

  const ms = Date.now() - inicio;
  if (status === 0 && html === "") {
    achados.push({ pagina: href, gravidade: "erro", texto: "sem resposta" });
    return { href, status: 0, ms, achados };
  }

  if (status !== 200) {
    achados.push({ pagina: href, gravidade: "erro", texto: `HTTP ${status}` });
  }

  // ── title ────────────────────────────────────────────────────────────
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
  if (!title) {
    achados.push({ pagina: href, gravidade: "erro", texto: "sem <title>" });
  } else if (title.length > 65) {
    achados.push({
      pagina: href,
      gravidade: "aviso",
      texto: `title com ${title.length} chars (o buscador corta por volta de 60)`,
    });
  }

  // ── meta description ─────────────────────────────────────────────────
  const description = meta(html, "name", "description");
  if (!description) {
    achados.push({ pagina: href, gravidade: "erro", texto: "sem meta description" });
  } else if (description.length > 165) {
    achados.push({
      pagina: href,
      gravidade: "aviso",
      texto: `description com ${description.length} chars (corta em ~155)`,
    });
  } else if (description.length < 50) {
    achados.push({
      pagina: href,
      gravidade: "aviso",
      texto: `description curta (${description.length} chars)`,
    });
  }

  // ── canonical ────────────────────────────────────────────────────────
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
  if (!canonical) {
    // A regra do dono (29/09/2026): canonical ausente não é erro — o
    // buscador escolhe sozinho. Canonical ERRADO é que engana.
    achados.push({ pagina: href, gravidade: "aviso", texto: "sem canonical" });
  } else {
    const alvo = new URL(canonical);
    if (alvo.host !== "www.controlepopular.com.br") {
      achados.push({
        pagina: href,
        gravidade: "erro",
        texto: `canonical fora do www: ${canonical}`,
      });
    }
    const pathEsperado = href.replace(/\/$/, "") || "/";
    const pathReal = alvo.pathname.replace(/\/$/, "") || "/";
    if (pathReal !== pathEsperado) {
      achados.push({
        pagina: href,
        gravidade: "erro",
        texto: `canonical aponta para ${pathReal}, não para a página acessada`,
      });
    }
  }

  // ── og:image (compartilhamento em rede social é clique, não só indexação) ──
  if (!meta(html, "property", "og:image")) {
    achados.push({ pagina: href, gravidade: "aviso", texto: "sem og:image" });
  }

  // ── meta robots: página nobre não pode estar fora do índice ──────────
  const robots = meta(html, "name", "robots");
  if (robots && /noindex/i.test(robots)) {
    achados.push({ pagina: href, gravidade: "erro", texto: `meta robots com noindex: ${robots}` });
  }

  // ── h1: um por página ────────────────────────────────────────────────
  const h1s = html.match(/<h1[\s>]/gi)?.length ?? 0;
  if (h1s === 0) achados.push({ pagina: href, gravidade: "aviso", texto: "sem <h1>" });
  if (h1s > 1) achados.push({ pagina: href, gravidade: "aviso", texto: `${h1s} h1 na página` });

  // ── idioma e structured data ─────────────────────────────────────────
  if (!/<html[^>]+lang=/i.test(html)) {
    achados.push({ pagina: href, gravidade: "aviso", texto: "html sem lang" });
  }
  if (!/application\/ld\+json/i.test(html)) {
    achados.push({ pagina: href, gravidade: "aviso", texto: "sem JSON-LD (structured data)" });
  }

  return { href, status, ms, title, description, canonical, achados };
}

function dataHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Escreve o relatório no padrão da documentação (Tipo/Domínio/Última medição). */
function gravarRelatorio(base: string, resultados: Resultado[], achados: Achado[]): string {
  const dir = join(RAIZ, "docs", "relatorios-automacao");
  mkdirSync(dir, { recursive: true });
  const arquivo = join(dir, `auditoria-seo-${dataHoje()}.md`);

  const erros = achados.filter((a) => a.gravidade === "erro");
  const avisos = achados.filter((a) => a.gravidade === "aviso");
  const porTipo = new Map<string, number>();
  for (const a of achados) {
    const rotulo = a.texto.split(":")[0].replace(/\(.*\)/, "").trim();
    porTipo.set(rotulo, (porTipo.get(rotulo) ?? 0) + 1);
  }
  const ranking = [...porTipo.entries()].sort((a, b) => b[1] - a[1]);

  const linhas: string[] = [
    `# Auditoria de SEO on-page — top 100 páginas`,
    ``,
    `> **Tipo:** RELATORIO`,
    `> **Domínio:** global`,
    `> **Última medição:** ${dataHoje()}`,
    `> **Leitura estimada:** curta (< 5 min)`,
    `> **Relacionados:** [PLANO-seo-visibilidade-buscadores.md](../planos/PLANO-seo-visibilidade-buscadores.md), [AUDITORIA-LINKS-EIXOS-TOP100.md](AUDITORIA-LINKS-EIXOS-TOP100.md)`,
    `> **Palavras-chave:** SEO, canonical, meta description, structured data, auditoria, top 100`,
    ``,
    `## Sumário`,
    ``,
    `- [1. Metodologia](#1-metodologia)`,
    `- [2. Resultado](#2-resultado)`,
    `- [3. Achados por tipo](#3-achados-por-tipo)`,
    `- [4. Páginas com erro](#4-páginas-com-erro)`,
    `- [5. Próximos passos](#5-próximos-passos)`,
    ``,
    `## 1. Metodologia`,
    ``,
    `Rodado por \`npx tsx scripts/auditar-seo.mts\`, com User-Agent honesto do`,
    `projeto e pausa de 2,5 s entre requisições (medido: a 1,2 s o container`,
    `devolve 502/503 em rajada). Base consultada: \`${base}\`.`,
    `Cada HTML foi lido por regex (sem navegador): title, description,`,
    `canonical, og:image, meta robots, h1, lang e JSON-LD.`,
    ``,
    `## 2. Resultado`,
    ``,
    `| Métrica | Valor |`,
    `|---|---|`,
    `| Páginas auditadas | ${resultados.length} |`,
    `| Responderam 200 | ${resultados.filter((r) => r.status === 200).length} |`,
    `| Erros | ${erros.length} |`,
    `| Avisos | ${avisos.length} |`,
    `| Tempo médio de resposta | ${Math.round(resultados.reduce((s, r) => s + r.ms, 0) / Math.max(1, resultados.length))} ms |`,
    ``,
    `## 3. Achados por tipo`,
    ``,
    `| Achado | Ocorrências |`,
    `|---|---|`,
    ...ranking.map(([k, v]) => `| ${k} | ${v} |`),
    ``,
    `## 4. Páginas com erro`,
    ``,
    ...(erros.length
      ? ["| Página | Erro |", "|---|---|", ...erros.map((a) => `| \`${a.pagina}\` | ${a.texto} |`)]
      : ["Nenhum erro. ✅"]),
    ``,
    `## 5. Próximos passos`,
    ``,
    `1. Corrigir cada erro da seção 4 antes do próximo deploy.`,
    `2. Reavaliar os avisos de title/description por página nobre.`,
    `3. Rerodar semanalmente: \`npx tsx scripts/auditar-seo.mts\`.`,
    ``,
  ];

  writeFileSync(arquivo, linhas.join("\n"), "utf-8");
  return arquivo;
}

async function main(): Promise<void> {
  const { base, limite, pausa, relatorio } = lerArgs();
  const catalogo = JSON.parse(
    readFileSync(join(RAIZ, "apps/web/data/top-100-paginas.json"), "utf-8")
  ) as Array<{ href: string }>;

  const alvos = catalogo
    .filter((p) => p.href.startsWith("/"))
    .slice(0, limite || undefined);

  console.log(`[auditar-seo] base=${base} paginas=${alvos.length} pausa=${pausa}ms`);

  const resultados: Resultado[] = [];
  for (const [i, pagina] of alvos.entries()) {
    const r = await auditar(base, pagina.href);
    resultados.push(r);
    const marca = r.status === 200 ? "ok" : `FALHA ${r.status}`;
    console.log(
      `[${String(i + 1).padStart(3, "0")}/${alvos.length}] ${marca} ${r.ms}ms ${pagina.href}` +
        (r.achados.length ? ` (+${r.achados.length})` : "")
    );
    if (i < alvos.length - 1) await new Promise((s) => setTimeout(s, pausa));
  }

  const achados = resultados.flatMap((r) => r.achados);
  const erros = achados.filter((a) => a.gravidade === "erro");

  console.log("");
  console.log(`[auditar-seo] 200: ${resultados.filter((r) => r.status === 200).length}/${resultados.length}`);
  console.log(`[auditar-seo] erros: ${erros.length} | avisos: ${achados.length - erros.length}`);
  for (const e of erros.slice(0, 20)) {
    console.log(`  ERRO ${e.pagina} -> ${e.texto}`);
  }

  if (relatorio) {
    const arquivo = gravarRelatorio(base, resultados, achados);
    console.log(`[auditar-seo] relatorio: ${arquivo}`);
  }

  // Erro de acesso (página caiu) falha a rotina; defeito on-page não —
  // a correção é humana e não deve travar o agente que só quis medir.
  process.exit(erros.some((e) => e.texto.startsWith("HTTP") || e.texto.startsWith("sem resposta")) ? 1 : 0);
}

void main();
