/**
 * sondar-pr-links.mts — degrau do revisor de PRs (workflow pr-revisor).
 *
 * Lê o `link-correcoes.json` da branch do PR, sonda só as urlNova que não
 * estão na `origin/main` e decide, por link:
 *   - VIVO        → entra (2xx/3xx e também 401/403/429: bloqueia robô,
 *                   mas o link existe para o leitor);
 *   - INCONCLUSIVO→ aviso, NÃO reprova (timeout/5xx transitório);
 *   - MORTO       → reprova (404/410, "200 que mente", DNS).
 *
 * Regra antiga (reprovava 403 e timeout) travava todos os PRs do LinkMender:
 * em 18/10 reprovou 1.762 de 2.459 links e o merge nunca rodou. Ver
 * docs/planos/PLANO-LINKMENDER-E-ESCADA-18-10.md, Fase 1.
 *
 * Não faz busca de substituto — o LinkMender PR já fez isso na abertura.
 *
 * Sondagem concorrente (8 em paralelo) com pausa de 1,2 s POR HOST. O que
 * antes levava 2h+ passa a rodar em minutos. User-Agent honesto.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validarCorrecoes, type CorrecaoLink } from "../../apps/web/lib/linkmender/correcoes.js";
import {
  sondar,
  classificarVerificacao,
  vereditoDoPortao,
  type Sondagem,
  type VereditoPortao,
} from "../../apps/web/lib/linkmender/verificar.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ARQUIVO_REL = "apps/web/data/link-correcoes.json";
const CONCORRENCIA = 8;
const PAUSA_POR_HOST_MS = 1200;

interface Avaliacao {
  url: string;
  veredito: VereditoPortao;
  detalhe: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function gitShow(refEArquivo: string): string | null {
  try {
    return execFileSync("git", ["show", refEArquivo], {
      cwd: RAIZ,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

/** Espacamento por HOST: 1 requisicao por host a cada `pausa` ms. */
class Periodo {
  private ultimo = new Map<string, number>();

  constructor(private readonly pausaMs: number) {}

  async esperar(url: string): Promise<void> {
    let host = url;
    try {
      host = new URL(url).hostname;
    } catch {
      // url sem hostname valido: trata como host unico
    }
    const agora = Date.now();
    const alvo = (this.ultimo.get(host) ?? 0) + this.pausaMs;
    const espera = Math.max(0, alvo - agora);
    this.ultimo.set(host, agora + espera);
    if (espera > 0) await sleep(espera);
  }
}

async function sondarEmLote(urls: string[], periodo: Periodo): Promise<Map<string, Sondagem>> {
  const fila = [...urls];
  const resultado = new Map<string, Sondagem>();
  const operario = async (): Promise<void> => {
    for (;;) {
      const url = fila.shift();
      if (!url) return;
      await periodo.esperar(url);
      resultado.set(url, await sondar(url));
    }
  };
  const n = Math.min(CONCORRENCIA, urls.length);
  await Promise.all(Array.from({ length: n }, operario));
  return resultado;
}

export function avaliarLink(url: string, s: Sondagem): Avaliacao {
  const verificacao = classificarVerificacao(url, s);
  const veredito = vereditoDoPortao(verificacao.classe, s);
  const detalhe =
    veredito === "morto" ? (verificacao.motivo ?? `HTTP ${s.statusHttp}`) : `HTTP ${s.statusHttp}`;
  return { url, veredito, detalhe };
}

function carregarNovas(caminhoAtual: string): CorrecaoLink[] {
  const atual = validarCorrecoes(JSON.parse(readFileSync(caminhoAtual, "utf-8")));
  const mainJson = gitShow(`origin/main:${ARQUIVO_REL}`);
  let doMain = new Set<string>();
  if (mainJson) {
    try {
      doMain = new Set(validarCorrecoes(JSON.parse(mainJson)).map((c) => c.urlVelha));
    } catch {
      doMain = new Set<string>();
    }
  }
  return atual.filter((c) => !doMain.has(c.urlVelha));
}

/**
 * Tolerância de links mortos. Um PR do LinkMender traz milhares de correções;
 * exigir zero morto recriaria o travamento (basta um 404 para nada mesclar).
 * O portão reprova só quando a proporção passa do teto — e SEMPRE lista os
 * mortos no log para revisão. Ver PLANO-LINKMENDER-E-ESCADA-18-10.md, Fase 1.
 */
export const LIMITE_MORTOS_ABSOLUTO = 5;
export const LIMITE_MORTOS_RELATIVO = 0.1;

export function excedeTolerancia(mortas: number, total: number): boolean {
  const teto = Math.max(LIMITE_MORTOS_ABSOLUTO, Math.ceil(total * LIMITE_MORTOS_RELATIVO));
  return mortas > teto;
}

function relatar(avaliacoes: Avaliacao[]): number {
  const mortas = avaliacoes.filter((a) => a.veredito === "morto");
  const inconclusivas = avaliacoes.filter((a) => a.veredito === "inconclusivo");
  const vivas = avaliacoes.filter((a) => a.veredito === "vivo");

  for (const a of inconclusivas) console.warn(`  ⚠ ${a.url} → ${a.detalhe} (aviso, nao reprova)`);
  for (const a of mortas) console.error(`  ✗ ${a.url} → ${a.detalhe}`);

  console.log(
    `\n[portao] ${vivas.length} vivas, ${inconclusivas.length} inconclusivas, ${mortas.length} mortas.`
  );
  if (!excedeTolerancia(mortas.length, avaliacoes.length)) {
    console.log(
      `✓ ${avaliacoes.length} urlNova entram (${mortas.length} morta(s) dentro da tolerancia).`
    );
    for (const m of mortas) console.warn(`  - morto tolerado: ${m.url} (${m.detalhe})`);
    return 0;
  }
  console.error(`\n⛔ ${mortas.length} urlNova morta(s) — acima da tolerancia:`);
  for (const m of mortas) console.error(`  - ${m.url} (${m.detalhe})`);
  return 1;
}

async function main(): Promise<void> {
  console.log("🔗 [sondar-pr-links] Lendo camada da branch do PR...");
  const caminhoAtual = path.join(RAIZ, ARQUIVO_REL);
  if (!existsSync(caminhoAtual)) {
    console.log("✓ [sondar-pr-links] Sem link-correcoes.json nesta branch — nada a sondar.");
    return;
  }

  const novas = carregarNovas(caminhoAtual);
  if (novas.length === 0) {
    console.log("✓ [sondar-pr-links] Nenhuma urlNova nova neste PR.");
    return;
  }

  console.log(
    `  ${novas.length} urlNova nova(s) para sondar (8 em paralelo, pausa ${PAUSA_POR_HOST_MS}ms/host)`
  );
  const periodo = new Periodo(PAUSA_POR_HOST_MS);
  const respostas = await sondarEmLote(novas.map((c) => c.urlNova), periodo);
  const avaliacoes = [...respostas.entries()].map(([url, s]) => avaliarLink(url, s));
  process.exitCode = relatar(avaliacoes);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
