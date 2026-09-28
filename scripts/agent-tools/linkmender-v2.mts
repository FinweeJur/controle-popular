/**
 * @file linkmender-v2.mts
 * @description Bot e rotina de auditoria de links do portal Controle Popular:
 * - Verifica status HTTP e integridade de conteúdo dos links oficiais.
 * - Inspeciona páginas (.tsx), lógica (.ts), catálogo de fontes (registry) e acervos de dados (.json).
 * - Cobre especificamente páginas e dados de empresas (empresas-documentos.json, entidades-completas.json)
 *   e botões de ação ("Acessar Documento", "Portal CVM / RI", "Espelho", "Fonte Oficial").
 * - Reprova e rejeita URLs sintéticas fictícias (arquivos.controlepopular.com.br) ou buscas genéricas (google.com/search).
 *
 * @fonte
 * - Diretrizes de verificação: AGENTS.md § 8 (Regra das Seis Qualidades).
 * - Acervos oficiais indexados em apps/web/data/ e páginas em apps/web/app/.
 *
 * @decisoes
 * - Não reescreve arquivos versionados em caso de correção pontual; registra propostas aceitas
 *   em apps/web/data/link-correcoes.json ou gera relatório detalhado em docs/relatorios-automacao/.
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
const RELATORIO_EMPRESAS = path.join(
  RAIZ,
  "docs",
  "relatorios-automacao",
  "linkmender-empresas-report.md"
);

const PAUSA_PADRAO_MS = 300;

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

const RE_HREF = /href="(https?:\/\/[^"]+)"/g;
const RE_URL_STRING = /url:\s*"(https?:\/\/[^"]+)"/g;

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
  categoria?: "codigo" | "empresa_doc" | "empresa_ri" | "registry" | "botao";
  sintetico?: boolean;
}

function tituloVizinho(conteudo: string, indice: number): string | null {
  const janela = conteudo.slice(Math.max(0, indice - 300), indice + 300);
  const m = janela.match(/(?:title|titulo|label|nome)\s*[:=]\s*"([^"]{12,180})"/);
  if (m) return m[1];
  return null;
}

function coletarUrls(apenasEmpresas = false): UrlColetada[] {
  const arquivosCodigo: string[] = [];
  const arquivosJson: string[] = [];

  coletarArquivos(path.join(APPS_WEB, "app"), ".tsx", arquivosCodigo);
  coletarArquivos(path.join(APPS_WEB, "lib"), ".ts", arquivosCodigo);
  coletarArquivos(path.join(APPS_WEB, "data"), ".json", arquivosJson);

  const mapa = new Map<string, UrlColetada>();

  // 1. Varrer código TSX e TS
  for (const arquivo of arquivosCodigo) {
    const relativo = path.relative(RAIZ, arquivo).replace(/\\/g, "/");
    if (apenasEmpresas && !relativo.includes("empresas")) continue;

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
        if (!url.startsWith("http://") && !url.startsWith("https://")) continue;
        const sintetico = url.includes("arquivos.controlepopular.com.br") || url.includes("google.com/search");
        if (!mapa.has(url)) {
          mapa.set(url, {
            url,
            origem: relativo,
            titulo: tituloVizinho(conteudo, m.index),
            categoria: relativo.includes("empresas") ? "botao" : "codigo",
            sintetico,
          });
        }
      }
    }
  }

  // 2. Varrer acervos JSON em apps/web/data
  for (const arquivo of arquivosJson) {
    const relativo = path.relative(RAIZ, arquivo).replace(/\\/g, "/");
    if (apenasEmpresas && !relativo.includes("empresas")) continue;

    try {
      const conteudo = JSON.parse(readFileSync(arquivo, "utf-8"));
      extrairUrlsDeObjeto(conteudo, relativo, null, mapa);
    } catch {
      // JSON com erro ou vazio
    }
  }

  // 3. Fontes do registry oficial (se não for restrito a empresas)
  if (!apenasEmpresas) {
    for (const fonte of listarTodasFontes()) {
      const url = normalizarUrl(fonte.urlOficial);
      if (mapa.has(url)) continue;
      mapa.set(url, {
        url,
        origem: "registry",
        titulo: fonte.nome ?? null,
        categoria: "registry",
        sintetico: false,
      });
    }
  }

  return Array.from(mapa.values());
}

function extrairUrlsDeObjeto(
  obj: unknown,
  origem: string,
  tituloContexto: string | null,
  mapa: Map<string, UrlColetada>
): void {
  if (!obj || typeof obj !== "object") return;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      extrairUrlsDeObjeto(item, origem, tituloContexto, mapa);
    }
    return;
  }

  const record = obj as Record<string, unknown>;
  const tituloItem =
    (typeof record.titulo === "string" ? record.titulo : null) ??
    (typeof record.nome === "string" ? record.nome : null) ??
    (typeof record.empresaNome === "string" ? record.empresaNome : null) ??
    tituloContexto;

  for (const [chave, valor] of Object.entries(record)) {
    if (typeof valor === "string") {
      if (valor.startsWith("https://") || valor.startsWith("http://")) {
        const url = normalizarUrl(valor);
        const sintetico =
          url.includes("arquivos.controlepopular.com.br") || url.includes("google.com/search");
        let categoria: UrlColetada["categoria"] = "codigo";
        if (chave === "urlOficial" || chave === "urlR2") categoria = "empresa_doc";
        else if (chave === "site" || chave === "ri") categoria = "empresa_ri";

        if (!mapa.has(url)) {
          mapa.set(url, {
            url,
            origem: `${origem}#${chave}`,
            titulo: tituloItem,
            categoria,
            sintetico,
          });
        }
      }
    } else if (typeof valor === "object" && valor !== null) {
      extrairUrlsDeObjeto(valor, origem, tituloItem, mapa);
    }
  }
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
  resultados: {
    ctx: ContextoLink;
    verificacao: Verificacao;
    proposta: PropostaCorrecao | null;
    semPropostaMotivo?: string;
  }[],
  aplicadas: CorrecaoLink[],
  pausaMs: number,
  duracaoMs: number,
  destino: string
): void {
  const porClasse = (c: string) => resultados.filter((r) => r.verificacao.classe === c).length;
  const linhas: string[] = [];
  linhas.push("# LinkMender v2 — Auditoria de Links e Validação de Conteúdo");
  linhas.push("");
  linhas.push(`- Data da auditoria: ${new Date().toISOString()}`);
  linhas.push(`- Duração da rodada: ${(duracaoMs / 1000).toFixed(1)} s`);
  linhas.push(`- Pausa configurada entre requisições: ${pausaMs}ms`);
  linhas.push("");
  linhas.push("## Resumo Consolidado");
  linhas.push("");
  linhas.push(`- Total de URLs verificadas (HTTP + validação de conteúdo): ${resultados.length}`);
  linhas.push(`- ✅ Links Íntegros (OK): ${porClasse("OK")}`);
  linhas.push(`- ↪️ Redirecionamentos Válidos (REDIRECT): ${porClasse("REDIRECT")}`);
  linhas.push(`- ❌ Links Quebrados (QUEBRADO): ${porClasse("QUEBRADO")}`);
  linhas.push(`- ⚠️ Respostas Falsas (MENTIROSO / 200 que mente): ${porClasse("MENTIROSO")}`);
  linhas.push(`- ❓ Inconsistências de Rede (INCONSISTENTE): ${porClasse("INCONSISTENTE")}`);
  linhas.push(`- 📝 Propostas automáticas de correção aceitas: ${resultados.filter((r) => r.proposta).length}`);
  linhas.push("");

  linhas.push("## Detalhamento das Verificações por URL");
  linhas.push("");
  linhas.push("| Status | URL Auditada | Título / Origem | Classe |");
  linhas.push("|---|---|---|---|");
  for (const r of resultados) {
    const icone =
      r.verificacao.classe === "OK" ? "✅ OK"
      : r.verificacao.classe === "REDIRECT" ? "↪️ REDIRECT"
      : r.verificacao.classe === "QUEBRADO" ? "❌ QUEBRADO"
      : r.verificacao.classe === "MENTIROSO" ? "⚠️ MENTIROSO"
      : "❓ INCONSISTENTE";
    linhas.push(`| ${icone} | \`${r.ctx.url}\` | ${r.ctx.titulo || "Geral"} | ${r.verificacao.classe} |`);
  }
  linhas.push("");

  const comProposta = resultados.filter((r) => r.proposta);
  linhas.push("## Propostas de Correção com Trilha de Auditoria");
  linhas.push("");
  if (comProposta.length === 0) {
    linhas.push("Nenhuma proposta automática de substituição necessária nesta execução.");
    linhas.push("");
  } else {
    for (const r of comProposta) {
      linhas.push(`- **URL Original:** ${r.proposta!.urlVelha}`);
      linhas.push(`  → **URL Proposta:** ${r.proposta!.urlNova}`);
      linhas.push(`  - Critérios validados: ${r.proposta!.criterios.join(", ")}`);
      linhas.push(`  - Estratégia de busca: ${r.proposta!.estrategia}`);
    }
    linhas.push("");
  }

  linhas.push("---");
  linhas.push(`*User-Agent utilizado: \`${USER_AGENT_LINKMENDER}\`*`);

  writeFileSync(destino, linhas.join("\n") + "\n", "utf-8");
}

export async function executarLinkMenderV2(apenasEmpresas = false): Promise<void> {
  const inicio = Date.now();
  const pausaMs = obterPausaMs();
  console.log(`🔗 [LinkMender v2] Verificando links (Modo: ${apenasEmpresas ? "Empresas & Documentos" : "Geral monorepo"})...`);

  const coletadas = coletarUrls(apenasEmpresas);
  console.log(`  ${coletadas.length} URLs coletadas (código TSX + acervos JSON + botões)`);

  const sinteticoDetectados = coletadas.filter((c) => c.sintetico);
  if (sinteticoDetectados.length > 0) {
    console.warn(`  ⚠️ Detectadas ${sinteticoDetectados.length} URLs sintéticas/falsas que violam a Regra Editorial!`);
    for (const s of sinteticoDetectados) {
      console.warn(`    - ${s.url} em ${s.origem}`);
    }
  }

  const existentes = lerCorrecoesExistentes();
  const jaCorrigidas = new Set(existentes.map((c) => c.urlVelha));

  const resultados: {
    ctx: ContextoLink;
    verificacao: Verificacao;
    proposta: PropostaCorrecao | null;
    semPropostaMotivo?: string;
  }[] = [];
  const novasPropostas: CorrecaoLink[] = [];
  const sleepFn = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  for (let i = 0; i < coletadas.length; i++) {
    const c = coletadas[i];
    if (jaCorrigidas.has(c.url)) {
      console.log(`  [${i + 1}/${coletadas.length}] ↷ ${c.url} (já tem correção na camada)`);
      continue;
    }

    // Se for URL sintética explícita, marca como QUEBRADO sem consultar rede
    if (c.sintetico) {
      resultados.push({
        ctx: { url: c.url, titulo: c.titulo },
        verificacao: {
          url: c.url,
          classe: "QUEBRADO",
          status: 404,
          urlFinal: c.url,
          motivo: "URL sintética/fictícia rejeitada pela Regra das Seis Qualidades",
        },
        proposta: null,
        semPropostaMotivo: "URL sintética rejeitada",
      });
      console.log(`  [${i + 1}/${coletadas.length}] ✗ ${c.url} -> REPROVADO (SINTÉTICO)`);
      continue;
    }

    const r = await processarLink(
      { url: c.url, titulo: c.titulo, orgao: null },
      { sleepFn, pausaMs }
    );

    resultados.push({
      ctx: { url: c.url, titulo: c.titulo },
      verificacao: r.verificacao,
      proposta: r.proposta,
      semPropostaMotivo: r.semPropostaMotivo,
    });

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
  const relatorioAlvo = apenasEmpresas ? RELATORIO_EMPRESAS : RELATORIO_DESTINO;
  relatorio(resultados, aplicadas, pausaMs, duracaoMs, relatorioAlvo);

  console.log(`\n✓ [LinkMender v2] Concluído! Relatório gravado em: ${relatorioAlvo}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const apenasEmpresas =
    process.argv.includes("--empresas-only") || process.env.LINKMENDER_EMPRESAS_ONLY === "1";
  executarLinkMenderV2(apenasEmpresas).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
