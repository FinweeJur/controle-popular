/**
 * Detector de mudança no acervo RAG — passo 1 da CI de ingestão automática
 * (PLANO-CI-RAG-INGESTAO-UNIDADES.md, Pilar 1, item 1.1).
 *
 * ═══ O QUE FAZ ═══
 *
 * Roda na CI (ou local), compara o acervo montado HOJE
 * (`montarAcervo()`, determinístico, sem fs/rede/banco) contra a baseline
 * versionada em `data/acervo-baseline.json` e emite o delta em
 * `data/acervo-delta.json` (novos / modificados / removidos). Os dois JSONs
 * são versionados — `gerar-respostas-curadas.mts` lê o delta para sugerir
 * curadoria e a baseline é a referência da última rodada conhecida. A
 * injeção do delta em runtime (item 1.3 do plano, `auto-ingestao.ts`) foi
 * CORTADA de propósito: o delta é sempre subconjunto do acervo montado em
 * código, então injetá-lo seria código morto no caminho quente do RAG.
 *
 * ═══ COMO RODAR ═══
 *
 *     cd apps/web
 *     npx tsx scripts/ingestao-rag.mts
 *
 * ═══ DECISÕES ═══
 *
 * - sha256 por peça = `sha256(JSON.stringify(peca))` truncado em 16 hex —
 *   `montarAcervo()` é determinístico (mesma ordem, mesmos campos), então o
 *   hash é estável entre execuções; `JSON.stringify` inteiro (sem
 *   serialização seletiva) pega qualquer campo novo ou trocado.
 * - Baseline ausente = primeira rodada: tudo conta como "novos" e o delta
 *   sai com `rebuild: true`.
 * - Regra de risco do plano: mudança acima de 50 peças vira rebuild
 *   completo (ver `calcularDelta`). As listas continuam sendo emitidas — o
 *   consumidor que decide.
 * - Sem dependência nova: só `node:crypto`, `node:fs`, `node:path` e o
 *   próprio `montarAcervo()`.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { montarAcervo, type AcervoFonte } from "../lib/assistente/acervo.js";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DIR_DADOS = path.resolve(AQUI, "../data");
const CAMINHO_BASELINE = path.join(DIR_DADOS, "acervo-baseline.json");
const CAMINHO_DELTA = path.join(DIR_DADOS, "acervo-delta.json");

/** Baseline versionada: mapa id → sha curto da peça. Inexistente = 1ª rodada. */
type Baseline = { sha: Record<string, string> };

/** Lê a baseline; devolve `null` quando o arquivo não existe (primeira vez). */
function carregarBaseline(): Baseline | null {
  if (!existsSync(CAMINHO_BASELINE)) return null;
  const bruto = JSON.parse(readFileSync(CAMINHO_BASELINE, "utf8")) as Baseline;
  return { sha: bruto.sha ?? {} };
}

/** Assinatura curta (16 hex) de uma peça: sha256 do JSON serializado. */
function assinarPeca(peca: AcervoFonte): string {
  return createHash("sha256").update(JSON.stringify(peca)).digest("hex").slice(0, 16);
}

/** Assinatura do mapa inteiro (baselineSha do delta). */
function assinarMapa(sha: Record<string, string>): string {
  return createHash("sha256").update(JSON.stringify(sha)).digest("hex").slice(0, 16);
}

/**
 * Compara o acervo atual contra a baseline e produz o delta.
 * `rebuild` também liga quando a mudança passa de 50 peças — regra de risco
 * do PLANO-CI-RAG-INGESTAO-UNIDADES.md: delta grande demais vira rebuild
 * completo. As listas saem do mesmo jeito; quem decide é o consumidor.
 * `rebuild` também liga na primeira rodada (sem baseline).
 *
 * ponytail: limite fixo de 50, sem configurar — calibrar quando a cadência
 * real de mudança do acervo mudar de patamar.
 */
function calcularDelta(baseline: Baseline | null, pecas: AcervoFonte[]) {
  const shasAtuais: Record<string, string> = {};
  for (const peca of pecas) shasAtuais[peca.id] = assinarPeca(peca);

  const shasAnteriores = baseline?.sha ?? {};
  const novos: AcervoFonte[] = [];
  const modificados: AcervoFonte[] = [];
  const removidos: string[] = [];

  for (const peca of pecas) {
    const shaAnterior = shasAnteriores[peca.id];
    if (shaAnterior === undefined) novos.push(peca);
    else if (shaAnterior !== shasAtuais[peca.id]) modificados.push(peca);
  }
  for (const id of Object.keys(shasAnteriores)) {
    if (!(id in shasAtuais)) removidos.push(id);
  }

  const totalMudancas = novos.length + modificados.length + removidos.length;
  const rebuild = baseline === null || totalMudancas > 50;

  return { shasAtuais, novos, modificados, removidos, rebuild };
}

/** Grava JSON indentado (2 espaços) com newline final — diff legível no git. */
function gravarJson(caminho: string, valor: unknown): void {
  writeFileSync(caminho, `${JSON.stringify(valor, null, 2)}\n`, "utf8");
}

function main(): void {
  const geradoEm = new Date().toISOString();
  const pecas = montarAcervo();
  const baseline = carregarBaseline();
  const { shasAtuais, novos, modificados, removidos, rebuild } = calcularDelta(baseline, pecas);
  const mudou = novos.length > 0 || modificados.length > 0 || removidos.length > 0;
  // Idempotência: sem mudança e com a baseline já igual, NÃO reescreve nada.
  // Reescrever só para carimbar hora sujaria a árvore a cada rodada local e
  // geraria commit de fachada na CI (o guard `git diff --cached --quiet` lá
  // já cobre, mas aqui o custo seria sujar o `git status` de quem testa).
  const baselineIgual =
    baseline !== null && JSON.stringify(baseline.sha) === JSON.stringify(shasAtuais);
  const escrever = !mudou && baselineIgual ? !existsSync(CAMINHO_DELTA) : true;

  if (escrever) {
    // Delta: formato consumido por gerar-respostas-curadas.mts.
    gravarJson(CAMINHO_DELTA, {
      geradoEm,
      totalPecas: pecas.length,
      baselineSha: assinarMapa(shasAtuais),
      rebuild,
      novos,
      modificados,
      removidos,
    });
    gravarJson(CAMINHO_BASELINE, { geradoEm, totalPecas: pecas.length, sha: shasAtuais });
  }

  console.log(`[ingestao-rag] acervo: ${pecas.length} pecas`);
  console.log(
    `[ingestao-rag] novos: ${novos.length}, modificados: ${modificados.length}, removidos: ${removidos.length}`
  );
  console.log(`[ingestao-rag] rebuild: ${rebuild}`);
  if (!mudou) console.log("[ingestao-rag] sem mudancas");
  console.log(
    escrever
      ? `[ingestao-rag] baseline gravada em ${CAMINHO_BASELINE}\n[ingestao-rag] delta gravado em ${CAMINHO_DELTA}`
      : "[ingestao-rag] arquivos intactos (rodada identica a baseline)"
  );
}

try {
  main();
} catch (e) {
  console.error("[ingestao-rag] falhou:", e);
  process.exit(1);
}
