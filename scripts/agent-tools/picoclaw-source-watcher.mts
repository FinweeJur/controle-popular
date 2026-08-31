/**
 * PicoClaw — Monitor Rápido e Health-Check de Fontes de Dados
 *
 * Executa sondagens leves (HEAD/GET range) nas fontes públicas mapeadas
 * no `registry.ts`, detectando alterações, indisponibilidade ou mudanças de cabeçalho.
 *
 * Melhorias integradas (2026-08-31):
 *  - M2: Histórico JSONL acumulativo (picoclaw-historico.jsonl) — nunca sobrescreve.
 *  - M3: Hash SHA-256 dos primeiros 8KB — detecta quando o conteúdo de uma fonte muda.
 *  - M6: Retry 1× com 5s de backoff antes de registrar FALHA de rede.
 */

import { createHash } from "node:crypto";
import { writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  listarTodasFontes,
  type FonteDef,
} from "../../apps/web/lib/fontes/registry.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RELATORIO_DESTINO = path.join(
  RAIZ,
  "docs",
  "relatorios-automacao",
  "picoclaw-fontes-status.json"
);
// M2: arquivo de histórico acumulativo (JSON Lines)
const HISTORICO_DESTINO = path.join(
  RAIZ,
  "docs",
  "relatorios-automacao",
  "picoclaw-historico.jsonl"
);

const USER_AGENT =
  "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular; monitor de fontes publicas)";


export interface ResultadoSondagem {
  slug: string;
  nome: string;
  frente: string;
  url: string;
  statusHttp: number | null;
  ok: boolean;
  tempoRespostaMs: number;
  lastModified: string | null;
  contentLengthBytes: number | null;
  /** M3: SHA-256 dos primeiros 8KB do corpo — detecta mudança de conteúdo entre execuções */
  hashConteudo: string | null;
  erro?: string;
  observacao?: string;
}

/** M6: Aguarda `ms` milissegundos */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sondarFonte(fonte: FonteDef): Promise<ResultadoSondagem> {
  const inicio = Date.now();

  async function tentativa(): Promise<ResultadoSondagem> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    let res: Response;
    let corpoBytes: Uint8Array | null = null;
    try {
      try {
        res = await fetch(fonte.urlOficial, {
          method: "HEAD",
          headers: { "User-Agent": USER_AGENT },
          signal: controller.signal,
        });
      } catch {
        // Se HEAD falhar (alguns servidores gov bloqueiam HEAD), tenta GET parcial
        res = await fetch(fonte.urlOficial, {
          method: "GET",
          headers: {
            "User-Agent": USER_AGENT,
            Range: "bytes=0-8192", // M3: pega primeiros 8KB para hash
          },
          signal: controller.signal,
        });
        // M3: lê bytes para hash
        try {
          corpoBytes = new Uint8Array(await res.clone().arrayBuffer());
          if (corpoBytes.length > 8192) corpoBytes = corpoBytes.slice(0, 8192);
        } catch {
          corpoBytes = null;
        }
      }
    } finally {
      clearTimeout(timer);
    }

    const duracao = Date.now() - inicio;
    const cl = res.headers.get("content-length");
    const lm = res.headers.get("last-modified");
    const etag = res.headers.get("etag");

    // M3: hash de conteúdo — usa ETag se disponível (mais barato), senão hash do corpo
    let hashConteudo: string | null = null;
    if (etag) {
      hashConteudo = createHash("sha256").update(etag).digest("hex").slice(0, 16);
    } else if (corpoBytes && corpoBytes.length > 0) {
      hashConteudo = createHash("sha256").update(corpoBytes).digest("hex").slice(0, 16);
    }

    return {
      slug: fonte.slug,
      nome: fonte.nome,
      frente: fonte.frente,
      url: fonte.urlOficial,
      statusHttp: res.status,
      ok: res.ok || res.status === 403 || res.status === 401,
      tempoRespostaMs: duracao,
      lastModified: lm,
      contentLengthBytes: cl ? Number(cl) : null,
      hashConteudo,
      observacao: res.status === 403 ? "Requer autenticacao ou UA especifico" : undefined,
    };
  }

  try {
    return await tentativa();
  } catch (err) {
    // M6: retry 1× com 5s de backoff para erros de rede (não HTTP 4xx/5xx)
    await sleep(5000);
    try {
      return await tentativa();
    } catch (err2) {
      return {
        slug: fonte.slug,
        nome: fonte.nome,
        frente: fonte.frente,
        url: fonte.urlOficial,
        statusHttp: null,
        ok: false,
        tempoRespostaMs: Date.now() - inicio,
        lastModified: null,
        contentLengthBytes: null,
        hashConteudo: null,
        erro: (err2 as Error).message,
      };
    }
  }
}

export async function executarMonitoramentoPicoClaw(
  frenteFiltro?: string
): Promise<{
  total: number;
  online: number;
  comFalha: number;
  resultados: ResultadoSondagem[];
}> {
  console.log("🦅 [PicoClaw] Iniciando sondagem de integridade das fontes públicas...");

  let fontes = listarTodasFontes();
  if (frenteFiltro) {
    fontes = fontes.filter((f) => f.frente === frenteFiltro);
  }

  const resultados: ResultadoSondagem[] = [];

  for (const fonte of fontes) {
    process.stdout.write(`  • Sondando [${fonte.frente}] ${fonte.slug}... `);
    const r = await sondarFonte(fonte);
    resultados.push(r);

    if (r.ok) {
      const hashInfo = r.hashConteudo ? ` hash:${r.hashConteudo}` : "";
      console.log(`✓ HTTP ${r.statusHttp ?? "OK"} (${r.tempoRespostaMs}ms${hashInfo})`);
    } else {
      console.log(`❌ FALHA: ${r.erro ?? `HTTP ${r.statusHttp}`}`);
    }
  }

  const online = resultados.filter((r) => r.ok).length;
  const comFalha = resultados.length - online;

  const relatorio = {
    geradoEm: new Date().toISOString(),
    agente: "PicoClaw Source Watcher",
    versao: "2.0.0", // M2/M3/M6
    total: resultados.length,
    online,
    comFalha,
    taxaDisponibilidade: `${((online / resultados.length) * 100).toFixed(1)}%`,
    resultados,
  };

  mkdirSync(path.dirname(RELATORIO_DESTINO), { recursive: true });

  // Relatório atual (sobrescreve — para leitura rápida)
  writeFileSync(RELATORIO_DESTINO, JSON.stringify(relatorio, null, 2), "utf-8");

  // M2: Histórico acumulativo (JSON Lines — nunca sobrescreve)
  appendFileSync(HISTORICO_DESTINO, JSON.stringify(relatorio) + "\n", "utf-8");

  console.log(`\n✓ [PicoClaw] Relatório salvo em: ${RELATORIO_DESTINO}`);
  console.log(`  Histórico acumulado em: ${HISTORICO_DESTINO}`);
  console.log(`  Disponibilidade: ${relatorio.taxaDisponibilidade} (${online}/${resultados.length} fontes ativas)\n`);

  return relatorio;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  executarMonitoramentoPicoClaw().catch(console.error);
}

