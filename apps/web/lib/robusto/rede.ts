/**
 * rede.ts — retry com backoff exponencial randomizado (full jitter), teto e
 * orçamento por processo.
 *
 * Fonte: Google SRE Book cap. 22 ("Addressing Cascading Failures") e AWS
 * Builders' Library ("Exponential Backoff and Jitter"). As três regras que
 * importam, copiadas de lá:
 *
 * 1. JITTER SEMPRE. Backoff fixo faz todos os bots tentarem no mesmo instante
 *    depois de uma oscilação de rede — e a martelada sincronizada multiplica
 *    a falha em vez de curá-la. Full jitter = espera aleatória em [0, min(teto, base * 2^n)].
 * 2. SEPARAR RETENTÁVEL DE PERMANENTE. 5xx, 429 (respeitando Retry-After) e
 *    erro de rede/timeout retentam. 400/401/403/404 e erro de validação
 *    retentam NUNCA — retry não conserta referência errada.
 * 3. ORÇAMENTO DE RETRY. Um processo que perdeu o banco martelando retry
 *    vira parte do incidente. Este utilitário rastreia as tentativas extras
 *    do processo inteiro; estourou o orçamento da janela, falha direto.
 */

/** Erros que valem retry: 5xx, 429, e qualquer falha de rede/timeout (fetch
 * lança TypeError; AbortError de deadline). */
export function erroRetentavel(erro: unknown): boolean {
  if (erro instanceof RespostaHttp) {
    if (erro.status === 429) return true;
    return erro.status >= 500 && erro.status < 600;
  }
  if (erro instanceof Error) {
    // fetch: "fetch failed" (rede/DNS), AbortError (deadline), ETIMEDOUT etc.
    const msg = `${erro.name} ${erro.message}`.toLowerCase();
    if (msg.includes("abort") || msg.includes("timeout") || msg.includes("timed out")) return true;
    if (
      msg.includes("fetch failed") ||
      msg.includes("econnrefused") ||
      msg.includes("econnreset") ||
      msg.includes("enotfound") ||
      msg.includes("eai_again") ||
      msg.includes("socket")
    ) {
      return true;
    }
  }
  return false;
}

/** Erro HTTP com status — usado por `erroRetentavel` e pelas chamadas. */
export class RespostaHttp extends Error {
  readonly status: number;
  readonly retryAfterSegundos: number | null;

  constructor(status: number, retryAfterSegundos: number | null = null) {
    super(`HTTP ${status}`);
    this.name = "RespostaHttp";
    this.status = status;
    this.retryAfterSegundos = retryAfterSegundos;
  }
}

export interface OpcoesRetry {
  /** Tentativas TOTAIS (a primeira conta). Padrão: 4. */
  tentativas?: number;
  /** Base do backoff, ms. Padrão: 1.000. */
  baseMs?: number;
  /** Teto da espera, ms. Padrão: 60.000 — backoff nunca passa daqui. */
  tetoMs?: number;
  /** Orçamento de tentativas EXTRA do processo nesta janela. Padrão: 60. */
  orcamentoExtra?: number;
  /** Janela do orçamento, ms. Padrão: 300.000 (5 min). */
  orcamentoJanelaMs?: number;
  /** Função de espera, para o teste injetar fake. Padrão: setTimeout. */
  esperar?: (ms: number) => Promise<void>;
  /** Um pouco de azar determinístico nos testes (default Math.random). */
  aleatorio?: () => number;
  /** Debug: chamada a cada espera com a espera calculada. */
  aoEsperar?: (ms: number, tentativa: number) => void;
}

/** Contagem de tentativas EXTRA do PROCESSO inteiro (não por chamada).
 * Módulo compartilhado de propósito — é o "server-wide retry budget" do SRE. */
const orcamentoProcesso: { tentativasExtras: number[] } = { tentativasExtras: [] };

function gastoExtraNaJanela(janelaMs: number, agora: number): number {
  // Podas os carimbos vencidos; o que sobra é o gasto atual.
  orcamentoProcesso.tentativasExtras = orcamentoProcesso.tentativasExtras.filter(
    (t) => agora - t < janelaMs
  );
  return orcamentoProcesso.tentativasExtras.length;
}

export function zerarOrcamentoRetry(): void {
  orcamentoProcesso.tentativasExtras = [];
}

/** Espera com full jitter: aleatório em [0, min(teto, base * 2^tentativa)]. */
export function esperarComJitter(
  baseMs: number,
  tetoMs: number,
  tentativa: number,
  aleatorio: () => number = Math.random
): number {
  const cru = Math.min(tetoMs, baseMs * 2 ** (tentativa - 1));
  return Math.floor(aleatorio() * cru);
}

/**
 * Roda `fn` com retry. `fn` deve lançar em falha; `erroRetentavel` decide se
 * vale tentar de novo. Lança o ÚLTIMO erro quando as tentativas acabam (ou o
 * erro permanente imediatamente — sem esperar).
 */
export async function comRetry<T>(
  fn: () => Promise<T>,
  opcoes: OpcoesRetry = {}
): Promise<T> {
  const {
    tentativas = 4,
    baseMs = 1_000,
    tetoMs = 60_000,
    orcamentoExtra = 60,
    orcamentoJanelaMs = 300_000,
    esperar = (ms) => new Promise((r) => setTimeout(r, ms)),
    aleatorio = Math.random,
    aoEsperar,
  } = opcoes;

  let ultimoErro: unknown;
  for (let n = 1; n <= tentativas; n++) {
    try {
      return await fn();
    } catch (erro) {
      ultimoErro = erro;
      if (n === tentativas || !erroRetentavel(erro)) throw erro;

      // Orçamento: esta tentativa EXTRA gasta do processo inteiro.
      const agora = Date.now();
      if (gastoExtraNaJanela(orcamentoJanelaMs, agora) >= orcamentoExtra) {
        throw new Error(
          `orçamento de retry do processo estourado (${orcamentoExtra} em ${orcamentoJanelaMs} ms) — falhando sem retry (SRE cap. 22)`
        );
      }
      orcamentoProcesso.tentativasExtras.push(agora);

      // 429 manda esperar o que o servidor pediu (Retry-After), com jitter por cima.
      let espera = esperarComJitter(baseMs, tetoMs, n, aleatorio);
      if (erro instanceof RespostaHttp && erro.retryAfterSegundos) {
        espera = Math.min(espera + erro.retryAfterSegundos * 1_000, tetoMs);
      }
      aoEsperar?.(espera, n);
      await esperar(espera);
    }
  }
  throw ultimoErro;
}
