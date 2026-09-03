/**
 * scripts/automacao/fetch-resiliente.mts
 *
 * Cliente HTTP resiliente para portais governamentais:
 * - Retry com exponential backoff (3 tentativas com pausa progressiva)
 * - Timeout configurável
 * - Fallback em snapshot local em caso de instabilidade da fonte pública
 * - Registro de saúde da fonte
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface OpcoesFetchResiliente {
  tentativas?: number;
  timeoutMs?: number;
  caminhoSnapshot?: string;
  identificadorFonte?: string;
  headers?: Record<string, string>;
}

export interface ResultadoFetchResiliente<T = any> {
  sucesso: boolean;
  dado: T | null;
  usouSnapshot: boolean;
  tentativasRealizadas: number;
  erro?: string;
  statusHttp?: number;
}

export async function fetchComRetryESnapshot<T = any>(
  url: string,
  opcoes: OpcoesFetchResiliente = {}
): Promise<ResultadoFetchResiliente<T>> {
  const tentativasMax = opcoes.tentativas ?? 3;
  const timeoutMs = opcoes.timeoutMs ?? 10000;
  const userAgent = "ControlePopularBot/2.0 (Transparencia Publica; +https://controlepopular.com.br)";

  let ultimoErro: string | undefined;
  let statusHttp: number | undefined;

  for (let tentativa = 1; tentativa <= tentativasMax; tentativa++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json, text/plain, */*",
          ...opcoes.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timer);
      statusHttp = res.status;

      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        let dado: T;
        if (contentType.includes("application/json")) {
          dado = (await res.json()) as T;
        } else {
          dado = (await res.text()) as unknown as T;
        }

        // Salva snapshot se caminho foi fornecido
        if (opcoes.caminhoSnapshot) {
          try {
            const dir = path.dirname(opcoes.caminhoSnapshot);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(
              opcoes.caminhoSnapshot,
              typeof dado === "string" ? dado : JSON.stringify(dado, null, 2),
              "utf-8"
            );
          } catch {
            // Ignora falha de gravação de snapshot
          }
        }

        return {
          sucesso: true,
          dado,
          usouSnapshot: false,
          tentativasRealizadas: tentativa,
          statusHttp,
        };
      } else {
        ultimoErro = `HTTP ${res.status}: ${res.statusText}`;
      }
    } catch (err: any) {
      ultimoErro = err.name === "AbortError" ? `Timeout de ${timeoutMs}ms excedido` : err.message;
    }

    // Pausa progressiva entre tentativas: 1s, 2s, 4s...
    if (tentativa < tentativasMax) {
      const espera = Math.pow(2, tentativa - 1) * 1000;
      await new Promise((r) => setTimeout(r, espera));
    }
  }

  // Se todas as tentativas falharem, tenta recuperar snapshot
  if (opcoes.caminhoSnapshot && fs.existsSync(opcoes.caminhoSnapshot)) {
    try {
      const raw = fs.readFileSync(opcoes.caminhoSnapshot, "utf-8");
      let dadoSnapshot: T;
      try {
        dadoSnapshot = JSON.parse(raw) as T;
      } catch {
        dadoSnapshot = raw as unknown as T;
      }

      return {
        sucesso: true,
        dado: dadoSnapshot,
        usouSnapshot: true,
        tentativasRealizadas: tentativasMax,
        erro: `Fonte instável (${ultimoErro}). Usando snapshot de segurança.`,
        statusHttp,
      };
    } catch (snapshotErr: any) {
      ultimoErro = `${ultimoErro} | Falha ao ler snapshot: ${snapshotErr.message}`;
    }
  }

  return {
    sucesso: false,
    dado: null,
    usouSnapshot: false,
    tentativasRealizadas: tentativasMax,
    erro: ultimoErro,
    statusHttp,
  };
}
