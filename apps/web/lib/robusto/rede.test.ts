import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  comRetry,
  erroRetentavel,
  esperarComJitter,
  zerarOrcamentoRetry,
  RespostaHttp,
} from "./rede";

/** Espera fake: registra as esperas e resolve na hora (testes não dormem). */
function esperaFake() {
  const esperas: number[] = [];
  return { esperas, fn: (ms: number) => { esperas.push(ms); return Promise.resolve(); } };
}

beforeEach(() => zerarOrcamentoRetry());

describe("erroRetentavel", () => {
  it("5xx retenta, 429 retenta, 4xx de negócio NUNCA", () => {
    expect(erroRetentavel(new RespostaHttp(502))).toBe(true);
    expect(erroRetentavel(new RespostaHttp(429))).toBe(true);
    expect(erroRetentavel(new RespostaHttp(400))).toBe(false);
    expect(erroRetentavel(new RespostaHttp(403))).toBe(false);
    expect(erroRetentavel(new RespostaHttp(404))).toBe(false);
  });

  it("falha de rede e timeout retentam; validação de conteúdo não", () => {
    const rede = new Error("fetch failed");
    expect(erroRetentavel(rede)).toBe(true);
    const abort = new Error("The operation was aborted");
    abort.name = "AbortError";
    expect(erroRetentavel(abort)).toBe(true);
    expect(erroRetentavel(new Error("campo obrigatório ausente no JSON"))).toBe(false);
  });
});

describe("esperarComJitter (full jitter, AWS)", () => {
  it("espera fica em [0, min(teto, base * 2^n)] — nunca negativa, nunca acima do teto", () => {
    for (const n of [1, 2, 3, 10]) {
      for (let i = 0; i < 200; i++) {
        const e = esperarComJitter(1_000, 60_000, n);
        expect(e).toBeGreaterThanOrEqual(0);
        expect(e).toBeLessThanOrEqual(Math.min(60_000, 1_000 * 2 ** (n - 1)));
      }
    }
  });

  it("backoff cresce até o teto e para de crescer lá", () => {
    const maximo = (n: number) => Math.min(60_000, 1_000 * 2 ** (n - 1));
    expect(maximo(1)).toBe(1_000);
    expect(maximo(5)).toBe(16_000);
    expect(maximo(7)).toBe(60_000);
    expect(maximo(8)).toBe(60_000);
  });
});

describe("comRetry", () => {
  it("falha permanente lança na PRIMEIRA tentativa, sem esperar", async () => {
    const { esperas, fn: esperar } = esperaFake();
    let chamadas = 0;
    await expect(
      comRetry(
        async () => {
          chamadas++;
          throw new RespostaHttp(404);
        },
        { tentativas: 5, esperar }
      )
    ).rejects.toThrow("HTTP 404");
    expect(chamadas).toBe(1);
    expect(esperas).toEqual([]);
  });

  it("falha retentável conserta na 2ª tentativa", async () => {
    const { esperas, fn: esperar } = esperaFake();
    let chamadas = 0;
    const resultado = await comRetry(
      async () => {
        chamadas++;
        if (chamadas === 1) throw new Error("fetch failed");
        return "ok";
      },
      { baseMs: 100, esperar, aleatorio: () => 0.5 }
    );
    expect(resultado).toBe("ok");
    expect(chamadas).toBe(2);
    expect(esperas.length).toBe(1);
  });

  it("esgota as tentativas e lança o último erro", async () => {
    const { esperas, fn: esperar } = esperaFake();
    let chamadas = 0;
    await expect(
      comRetry(
        async () => {
          chamadas++;
          throw new RespostaHttp(503);
        },
        { tentativas: 3, baseMs: 10, esperar, aleatorio: () => 0.5 }
      )
    ).rejects.toThrow("HTTP 503");
    expect(chamadas).toBe(3);
    expect(esperas.length).toBe(2);
  });

  it("Retry-After do 429 entra na espera (com teto)", async () => {
    const { esperas, fn: esperar } = esperaFake();
    await expect(
      comRetry(
        async () => {
          throw new RespostaHttp(429, 120); // pediu 120 s; teto é 10 s
        },
        { tentativas: 2, tetoMs: 10_000, baseMs: 100, esperar, aleatorio: () => 0.5 }
      )
    ).rejects.toThrow("HTTP 429");
    expect(esperas[0]).toBe(10_000); // teto, não 120.000
  });

  it("orçamento do PROCESSO: estourou a janela, a próxima chamada falha sem retry", async () => {
    const { esperas, fn: esperar } = esperaFake();
    const opcoes = { tentativas: 2, baseMs: 10, orcamentoExtra: 2, orcamentoJanelaMs: 60_000, esperar, aleatorio: () => 0.5 };
    // Duas chamadas que falham na 1ª e consertam na 2ª = 2 tentativas extras gastas.
    for (let i = 0; i < 2; i++) {
      let c = 0;
      await comRetry(
        async () => { c++; if (c === 1) throw new Error("fetch failed"); return "ok"; },
        opcoes
      );
    }
    expect(esperas.length).toBe(2);
    // A terceira falha não tem orçamento: lança já no 1º erro.
    let chamadas = 0;
    await expect(
      comRetry(
        async () => { chamadas++; throw new Error("fetch failed"); },
        opcoes
      )
    ).rejects.toThrow("orçamento de retry do processo estourado");
    expect(chamadas).toBe(1);
  });
});
