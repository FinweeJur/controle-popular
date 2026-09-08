/**
 * LinkMender v2 — Verifica TODOS os links de TODAS as páginas: HTTP real +
 * validação de CONTEÚDO (a regra do AGENTS.md: API responde 200 e mente).
 * Link falho → 3 websearch com palavras-chave diferentes → candidato
 * confirmado só pelos critérios de lib/linkmender/criterios.ts → proposta
 * aceita gravada em apps/web/data/link-correcoes.json (camada lida no
 * prebuild; o dado versionado NUNCA é reescrito).
 *
 * ⚠️ PRIMEIRA RODADA REAL NO HOME-PC. A rede desta máquina bloqueia
 * requisições de saída (WinError 10013) — aqui só roda o pipeline mockado
 * (apps/web/lib/linkmender/*.test.ts). No home-pc:
 *
 *   npx tsx scripts/agent-tools/linkmender-v2.mts
 *   LINKMENDER_PAUSA_MS=600 npx tsx scripts/agent-tools/linkmender-v2.mts
 *
 * Regras respeitadas: pausa entre requisições (LINKMENDER_PAUSA_MS, padrão
 * 400ms), User-Agent honesto, for a da CI, e correção SEMPRE como camada
 * com trilha (urlVelha → urlNova → critérios → data).
 */

import { Dirent, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { listarTodasFontes } from "../../apps/web/lib/fontes/registry.js";
import { processarLink } from "../../apps/web/lib/linkmender/pipeline.js";
import type { PropostaCorrecao, ContextoLink } from "../../apps/web/lib/linkmender/pipeline.js";
import type { Verificacao } from "../../apps/web/lib/linkmender/verificar.js";
import {
  validarCorrecoes,
  juntarCorrecoes,
} from "../../apps/web/lib/linkmender/correcoes.js";
import type { CorrecaoLink } from "../../apps/web/lib/linkmender/correcoes.js";
import { USER_AGENT_LINKMENDER } from "../../apps/web/lib/linkmender/busca.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const APPS_WEB = path.join(RAIZ, "apps", "web");
const ARQUIVO_CORRECOES = path.join(APPS_WEB, "data", "link-correcoes.json");
const RELATORIO_DESTINO = path.join(
  RAIZ,
  "docs",
  "relatorios-automacao",
  "linkmender-v2-propostas.md"
);

const PAUSA_PADRAO_MS = 400;

function obterPausaMs(): number {
  const raw = process.env.LINKMENDER_PAUSA_MS;
  if (raw && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return PAUSA_PADRAO_MS;
}

function normalizarUrl(raw: string): string {
  return raw.trim().replace(/[),;.]+$/, "");
}

const RE_HREF = /href="(https:\/\/[^"]+)"/g;
const RE_URL_STRING = /url:\s*"(https:\/\/[^"]+)"/g;

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
      if (["node_modules", ".next", "public"].includes(entrada.name)) continue;
      coletarArquivos(caminho, ext, alvo);
    } else if (entrada.isFile() && entrada.name.endsWith(ext)) {
      alvo.push(caminho);
    }
  }
}

/** Contexto do link: o que se sabe dele ANTES de consultar a rede. */
interface UrlColetada {
  url: string;
  origem: string;
  titulo: string | null;
}

function tituloVizinho(conteudo: string, indice: number): string | null {
  // Janela ao redor do href: procura um rótulo entre aspas ou textContent
  // (mais de 12 caracteres) que pareça título do documento.
  const janela = conteudo.slice(Math.max(0, indice - 300), indice + 300);
  const m = janela.match(/(?:title|titulo|label|nome)\s*[:=]\s*"([^"]{12,180})"/);
  if (m) return m[1];
  return null;
}

function coletarUrls(): UrlColetada[] {
  const arquivos: string[] = [];
  coletarArquivos(path.join(APPS_WEB, "app"), ".tsx", arquivos);
  coletarArquivos(path.join(APPS_WEB, "lib"), ".ts", arquivos);

  const mapa = new Map<string, UrlColetada>();
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
        if (!url.startsWith("https://")) continue;
        if (!mapa.has(url)) {
          mapa.set(url, {
            url,
            origem: relativo,
            titulo: tituloVizinho(conteudo, m.index),
          });
        }
      }
    }
  }

  for (const fonte of listarTodasFontes()) {
    const url = normalizarUrl(fonte.urlOficial);
    if (mapa.has(url)) continue;
    mapa.set(url, { url, origem: "registry", titulo: fonte.nome ?? null });
  }
  return Array.from(mapa.values());
}

function lerCorrecoesExistentes(): CorrecaoLink[] {
  if (!existsSync(ARQUIVO_CORRECOES)) return [];
  try {
    return validarCorrecoes(JSON.parse(readFileSync(ARQUIVO_CORRECOES, "utf-8")));
  } catch (e) {
    console.error(`⛔ [LinkMender v2] link-correcoes.json invalido: ${(e as Error).message}`);
    process.exit(1);
  }
}

function relatorio(
  resultados: { ctx: ContextoLink; verificacao: Verificacao; proposta: PropostaCorrecao | null; semPropostaMotivo?: string }[],
  aplicadas: CorrecaoLink[],
  pausaMs: number,
  duracaoMs: number
): void {
  const porClasse = (c: string) => resultados.filter((r) => r.verificacao.classe === c).length;
  const linhas: string[] = [];
  linhas.push("# LinkMender v2 — Verificacao com conteudo e propostas com criterios");
  linhas.push("");
  linhas.push(`- Gerado em: ${new Date().toISOString()}`);
  linhas.push(`- Duracao: ${(duracaoMs / 60000).toFixed(1)} min`);
  linhas.push(`- Pausa entre requisicoes: ${pausaMs}ms`);
  linhas.push("");
  linhas.push("## Resumo");
  linhas.push("");
  linhas.push(`- URLs verificadas (HTTP + conteudo): ${resultados.length}`);
  linhas.push(`- OK: ${porClasse("OK")}`);
  linhas.push(`- REDIRECT: ${porClasse("REDIRECT")}`);
  linhas.push(`- QUEBRADO: ${porClasse("QUEBRADO")}`);
  linhas.push(`- MENTIROSO (200 que mente): ${porClasse("MENTIROSO")}`);
  linhas.push(`- INCONSISTENTE: ${porClasse("INCONSISTENTE")}`);
  linhas.push(`- Propostas aceitas pelos criterios: ${resultados.filter((r) => r.proposta).length}`);
  linhas.push("");
  linhas.push("## Propostas com trilha");
  linhas.push("");
  const comProposta = resultados.filter((r) => r.proposta);
  if (comProposta.length === 0) {
    linhas.push("Nenhuma proposta aceita nesta execucao.");
    linhas.push("");
  } else {
    for (const r of comProposta) {
      linhas.push(`- ${r.proposta!.urlVelha}`);
      linhas.push(`  → ${r.proposta!.urlNova}`);
      linhas.push(`  criterios: ${r.proposta!.criterios.join(", ")}`);
      linhas.push(`  estrategia de busca: ${r.proposta!.estrategia}`);
    }
    linhas.push("");
  }
  linhas.push("## Falhos sem proposta");
  linhas.push("");
  const semProposta = resultados.filter(
    (r) => ["QUEBRADO", "MENTIROSO", "REDIRECT"].includes(r.verificacao.classe) && !r.proposta
  );
  if (semProposta.length === 0) {
    linhas.push("Nenhum link falho sem proposta nesta execucao.");
    linhas.push("");
  } else {
    for (const r of semProposta) {
      linhas.push(`- ${r.ctx.url} (${r.verificacao.classe}) — ${r.semPropostaMotivo ?? "sem motivo"}`);
    }
    linhas.push("");
  }
  linhas.push("## Camada aplicada no proximo build");
  linhas.push("");
  linhas.push(`apps/web/data/link-correcoes.json agora tem ${aplicadas.length} correcao(oes).`);
  linhas.push("O dado versionado nao e reescrito: a camada entra no prebuild");
  linhas.push("(scripts/validar-link-correcoes.mjs) e na renderizacao");
  linhas.push("(lib/linkmender/correcoes.ts — aplicarCorrecoesEmDado / urlCorrigida).");
  linhas.push("");
  linhas.push("---");
  linhas.push("");
  linhas.push(`User-Agent: ${USER_AGENT_LINKMENDER}`);
  linhas.push("Primeira rodada REAL no home-pc (esta maquina tem rede de saida bloqueada).");

  writeFileSync(RELATORIO_DESTINO, linhas.join("\n") + "\n", "utf-8");
}

export async function executarLinkMenderV2(): Promise<void> {
  const inicio = Date.now();
  const pausaMs = obterPausaMs();
  console.log("🔗 [LinkMender v2] Verificando links (HTTP + conteudo)...");

  const coletadas = coletarUrls();
  console.log(`  ${coletadas.length} URLs unicas (codigo + registry)`);

  const existentes = lerCorrecoesExistentes();
  const jaCorrigidas = new Set(existentes.map((c) => c.urlVelha));

  const resultados: { ctx: ContextoLink; verificacao: Verificacao; proposta: PropostaCorrecao | null; semPropostaMotivo?: string }[] = [];
  const novasPropostas: CorrecaoLink[] = [];
  const sleepFn = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  for (let i = 0; i < coletadas.length; i++) {
    const c = coletadas[i];
    if (jaCorrigidas.has(c.url)) {
      console.log(`  [${i + 1}/${coletadas.length}] ↷ ${c.url} (ja tem correcao na camada)`);
      continue;
    }
    const r = await processarLink(
      { url: c.url, titulo: c.titulo, orgao: null },
      { sleepFn, pausaMs }
    );
    resultados.push({ ctx: { url: c.url, titulo: c.titulo }, verificacao: r.verificacao, proposta: r.proposta, semPropostaMotivo: r.semPropostaMotivo });
    if (r.proposta) {
      novasPropostas.push({
        urlVelha: r.proposta.urlVelha,
        urlNova: r.proposta.urlNova,
        criterios: [...r.proposta.criterios, `estrategia:${r.proposta.estrategia}`],
        data: new Date().toISOString(),
      });
    }
    const icone =
      r.verificacao.classe === "OK" ? "✓"
      : r.verificacao.classe === "REDIRECT" ? "↪"
      : r.verificacao.classe === "QUEBRADO" ? "✗"
      : r.verificacao.classe === "MENTIROSO" ? "!? "
      : "?";
    console.log(
      `  [${i + 1}/${coletadas.length}] ${icone} ${c.url} -> ${r.verificacao.classe}${r.proposta ? ` | proposta: ${r.proposta.urlNova}` : ""}`
    );
  }

  const aplicadas = juntarCorrecoes(existentes, novasPropostas);
  writeFileSync(ARQUIVO_CORRECOES, JSON.stringify(aplicadas, null, 2) + "\n", "utf-8");

  const duracaoMs = Date.now() - inicio;
  relatorio(resultados, aplicadas, pausaMs, duracaoMs);

  console.log(`\n✓ [LinkMender v2] Correcoes em: ${ARQUIVO_CORRECOES}`);
  console.log(`  Relatorio em: ${RELATORIO_DESTINO}`);
  console.log(
    `  Resumo: ${resultados.length} URLs | novas propostas ${novasPropostas.length} | camada com ${aplicadas.length} correcoes`
  );
  console.log("");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  executarLinkMenderV2().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
