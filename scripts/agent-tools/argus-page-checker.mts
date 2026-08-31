/**
 * Argus — Verificador de Páginas do Portal
 *
 * Descobre todas as rotas do portal (page.tsx sob apps/web/app), faz um GET
 * leve (Range bytes=0-4096) em https://controlepopular.com.br + rota e
 * registra status, tempo, título e sinais de conteúdo vazio.
 *
 * Contexto: o banco Neon está em HTTP 402 — páginas que leem do banco
 * respondem 200 mas vazias ("Nenhuma licença coletada", "nenhum registro").
 * Isso é lacuna esperada (OK_COM_LACUNA), não falha.
 *
 * Gerado pelo módulo Argus do plano (2026-08-31). Sem dependências novas:
 * apenas node:fs, node:path, node:url + fetch nativo.
 */

import { readdirSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const APP_DIR = path.join(RAIZ, "apps", "web", "app");
const RELATORIO_DESTINO = path.join(
  RAIZ,
  "docs",
  "relatorios-automacao",
  "argus-paginas-status.json"
);

const BASE_URL = "https://controlepopular.com.br";
const TIMEOUT_MS = 15000;
const USER_AGENT =
  "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular; verificador de paginas)";

export type Veredito = "OK" | "OK_COM_LACUNA" | "FALHA";

export interface ResultadoPagina {
  rota: string;
  url: string;
  status: number | null;
  tempoMs: number;
  titulo: string | null;
  indicioErroHidratacao: boolean;
  semConteudo: boolean;
  erroDeRede: string | null;
  veredito: Veredito;
}

export interface RelatorioArgus {
  geradoEm: string;
  agente: string;
  total: number;
  ok: number;
  okComLacuna: number;
  falhas: number;
  resultados: ResultadoPagina[];
}

/**
 * Valor real mais plausível para cada segmento dinâmico, com a origem de cada
 * escolha (extraído do repositório ou do site em produção em 2026-08-31):
 *
 *  - [municipio]  → "betim" — cidade principal do portal (regra da tarefa).
 *  - [idIbge]     → "3106200" — Belo Horizonte (valor definido pela tarefa).
 *  - [codigo]     → "3106705" — Betim 7 dígitos, confirmado em etl/betim.
 *  - [idFonte]    → "2008" — id real de reunião do COPAM, extraído do link
 *                  /ambiental/copam em produção.
 *  - [sigla]      → "CCJC" em congresso/comissoes (link real em produção) e
 *                  "stf" em judiciario/tribunais (régua em lib/judiciario/regras).
 *  - [id]         → "204560" (parlamentares), "601921" (bancadas) e "2661827"
 *                  (proposicoes) — ids reais extraídos dos links em produção.
 *  - [slug]       → "sigma-lithium" (empresas — lib/empresas/dados.ts),
 *                  "mineradoras-acionam-stf-contra-pnab-auxilio-emergencial"
 *                  (noticias — link real em produção),
 *                  "alexandre-da-paz" (vereadores — link real em /betim/camara).
 *
 * Rota desconhecida cai no default "1" (plausível para qualquer id numérico).
 */
function valorDoSegmento(segmento: string, prefixoDaRota: string): string {
  switch (segmento) {
    case "[municipio]":
      return "betim";
    case "[idIbge]":
      return "3106200";
    case "[codigo]":
      return "3106705";
    case "[idFonte]":
      return "2008";
    case "[sigla]":
      return prefixoDaRota.includes("comissoes") ? "CCJC" : "stf";
    case "[id]":
      if (prefixoDaRota.includes("parlamentares")) return "204560";
      if (prefixoDaRota.includes("bancadas")) return "601921";
      return "2661827";
    case "[slug]":
      if (prefixoDaRota.includes("empresas")) return "sigma-lithium";
      if (prefixoDaRota.includes("noticias"))
        return "mineradoras-acionam-stf-contra-pnab-auxilio-emergencial";
      return "alexandre-da-paz";
    default:
      return "1";
  }
}

/**
 * Percorre apps/web/app recursivamente (readdirSync) atrás de page.tsx.
 * Segmentos entre parênteses (grupos de rota) e com @ são ignorados.
 * Cada segmento [param] vira o valor real documentado em `valorDoSegmento`.
 */
export function descobrirRotas(): string[] {
  const rotas: string[] = [];

  function percorrer(dir: string, segmentos: string[]): void {
    const entradas = readdirSync(dir, { withFileTypes: true });
    for (const entrada of entradas) {
      const caminho = path.join(dir, entrada.name);
      if (entrada.isDirectory()) {
        if (entrada.name.startsWith("(") || entrada.name.startsWith("@")) continue;
        percorrer(caminho, [...segmentos, entrada.name]);
      } else if (entrada.name === "page.tsx") {
        rotas.push("/" + segmentos.join("/"));
      }
    }
  }

  percorrer(APP_DIR, []);
  return rotas;
}

/** Resolve uma rota do repositório para a URL pública de produção. */
export function rotaParaUrl(rota: string): string {
  const segmentos = rota.split("/").filter(Boolean);
  const concretos = segmentos.map((s) =>
    s.startsWith("[") && s.endsWith("]") ? valorDoSegmento(s, segmentos.join("/")) : s
  );
  return BASE_URL + "/" + concretos.join("/");
}

/** Extrai o <title> do HTML (pode vir incompleto num GET parcial de 4KB). */
function extrairTitulo(html: string): string | null {
  const m = html.match(/<title>(.*?)<\/title>/i);
  return m ? m[1].trim() : null;
}

/** GET leve na rota pública: Range 0-4096, timeout 15s, UA honesto. */
export async function checarPagina(rota: string): Promise<ResultadoPagina> {
  const url = rotaParaUrl(rota);
  const inicio = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Range: "bytes=0-4096",
      },
      signal: controller.signal,
    });
    const html = await res.text();
    const tempoMs = Date.now() - inicio;

    const titulo = extrairTitulo(html);
    // "hydration" sozinho casa com "suppressHydrationWarning" do RSC flight em
    // TODA pagina — falso positivo. Só mensagens reais de erro contam.
    const indicioErroHidratacao =
      /A hydration error occurred|Application error: a client-side exception/i.test(html);
    const semConteudo =
      html.length < 200 || /Nenhuma licen[çc]a coletada|nenhum registro/i.test(html);

    const veredito: Veredito =
      res.status === 200 ? (semConteudo ? "OK_COM_LACUNA" : "OK") : "FALHA";

    return {
      rota,
      url,
      status: res.status,
      tempoMs,
      titulo,
      indicioErroHidratacao,
      semConteudo,
      erroDeRede: null,
      veredito,
    };
  } catch (err) {
    return {
      rota,
      url,
      status: null,
      tempoMs: Date.now() - inicio,
      titulo: null,
      indicioErroHidratacao: false,
      semConteudo: false,
      erroDeRede: (err as Error).name === "AbortError" ? "Timeout 15s" : (err as Error).message,
      veredito: "FALHA",
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Função principal — exportada para testes futuros. */
export async function executarArgus(): Promise<RelatorioArgus> {
  console.log("👁 [Argus] Verificando páginas do portal...");

  const rotas = descobrirRotas().sort();
  const resultados: ResultadoPagina[] = [];

  for (const rota of rotas) {
    const r = await checarPagina(rota);
    resultados.push(r);

    if (r.veredito === "OK") {
      console.log(`  ✓ ${rota} HTTP ${r.status} (${r.tempoMs}ms)`);
    } else if (r.veredito === "OK_COM_LACUNA") {
      console.log(`  ◐ ${rota} HTTP ${r.status} — lacuna (banco 402) (${r.tempoMs}ms)`);
    } else {
      console.log(`  ✗ ${rota} FALHA: ${r.erroDeRede ?? `HTTP ${r.status}`} (${r.tempoMs}ms)`);
    }
  }

  const ok = resultados.filter((r) => r.veredito === "OK").length;
  const okComLacuna = resultados.filter((r) => r.veredito === "OK_COM_LACUNA").length;
  const falhas = resultados.filter((r) => r.veredito === "FALHA").length;

  const relatorio: RelatorioArgus = {
    geradoEm: new Date().toISOString(),
    agente: "Argus Page Checker",
    total: resultados.length,
    ok,
    okComLacuna,
    falhas,
    resultados,
  };

  mkdirSync(path.dirname(RELATORIO_DESTINO), { recursive: true });
  writeFileSync(RELATORIO_DESTINO, JSON.stringify(relatorio, null, 2), "utf-8");

  console.log(`\n✓ [Argus] Relatório salvo em: ${RELATORIO_DESTINO}`);
  console.log(`  Total: ${resultados.length} | OK: ${ok} | OK_COM_LACUNA: ${okComLacuna} | FALHA: ${falhas}\n`);

  return relatorio;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  executarArgus().catch(console.error);
}
