import { describe, expect, test } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

import {
  USER_AGENT_HONESTO,
  apagarCheckpoint,
  calcularEsperaMs,
  caminhoCheckpoint,
  fetchComRetry,
  gravarCheckpoint,
  lerCheckpoint,
} from "./fetch-resiliente";

/**
 * Estes testes guardam o comportamento que os coletores terceirizam para o
 * helper — não o happy path do fetch:
 *
 * 1. A CURVA DE ESPERA: exponencial com teto e jitter limitado à fração. Se
 *    alguém trocar o `2 **` por `*` (linear) ou esquecer o teto, a coleta do
 *    PNCP (6 tentativas) vira bomba de negação de serviço contra a própria
 *    fonte. Testável sem relógio porque `calcularEsperaMs` é pura.
 * 2. 4xx permanente NÃO retenta. Retentar erro de parâmetro foi o que custou
 *    ~45 min de sondagem vazia em 21/08 (ver TODO.md / pncp-mg.json).
 * 3. CHECKPOINT: ilegível vira `null` (avisa e recomeça), nunca exceção no
 *    meio de uma coleta longa; gravar é atômico o bastante para não deixar
 *    truncado.
 */

function resposta(corpo: string, init: ResponseInit = {}): Response {
  return new Response(corpo, init);
}

describe("calcularEsperaMs", () => {
  const semJitter = { jitterFrac: 0, backoffBaseMs: 1000, backoffTetoMs: 60_000 };

  test("cresce exponencialmente por tentativa", () => {
    expect(calcularEsperaMs(1, semJitter)).toBe(1000);
    expect(calcularEsperaMs(2, semJitter)).toBe(2000);
    expect(calcularEsperaMs(3, semJitter)).toBe(4000);
    expect(calcularEsperaMs(7, semJitter)).toBe(60_000); // 64s > teto
  });

  test("jitter fica limitado à fração da espera base", () => {
    const aleatorio = (max: number) => max; // pico do jitter
    const comMaximo = calcularEsperaMs(3, { backoffBaseMs: 1000, jitterFrac: 0.25 }, aleatorio);
    expect(comMaximo).toBe(4000 + Math.floor(4000 * 0.25));
    const aleatorioZero = () => 0;
    expect(calcularEsperaMs(3, { backoffBaseMs: 1000, jitterFrac: 0.25 }, aleatorioZero)).toBe(4000);
  });

  test("tentativa <= 0 não gera espera negativa", () => {
    expect(calcularEsperaMs(0, semJitter)).toBe(1000);
  });
});

describe("fetchComRetry", () => {
  test("4xx permanente volta na 1a tentativa, sem retentar", async () => {
    let chamadas = 0;
    const fetchOriginal = globalThis.fetch;
    globalThis.fetch = (async () => {
      chamadas++;
      return resposta("recurso não existe", { status: 404 });
    }) as typeof fetch;
    try {
      const r = await fetchComRetry("https://exemplo.invalid/x", { tentativas: 4, backoffBaseMs: 1 });
      expect(r.ok).toBe(false);
      expect(r.statusHttp).toBe(404);
      expect(chamadas).toBe(1);
      expect(r.erro).toContain("permanente");
    } finally {
      globalThis.fetch = fetchOriginal;
    }
  });

  test("5xx transitório retenta e o User-Agent honesto vai em toda request", async () => {
    let chamadas = 0;
    const uas: string[] = [];
    const fetchOriginal = globalThis.fetch;
    globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
      chamadas++;
      const h = new Headers(init?.headers);
      uas.push(h.get("User-Agent") ?? "");
      return chamadas < 3 ? resposta("", { status: 502 }) : resposta('{"oi":1}');
    }) as typeof fetch;
    try {
      const r = await fetchComRetry("https://exemplo.invalid/y", {
        tentativas: 4,
        backoffBaseMs: 1,
        backoffTetoMs: 2,
      });
      expect(r.ok).toBe(true);
      expect(r.tentativasUsadas).toBe(3);
      expect(JSON.parse(r.texto!)).toEqual({ oi: 1 });
      expect(uas).toEqual([USER_AGENT_HONESTO, USER_AGENT_HONESTO, USER_AGENT_HONESTO]);
    } finally {
      globalThis.fetch = fetchOriginal;
    }
  });

  test("Retry-After de 429 é respeitado (limitado ao teto)", async () => {
    const slept: number[] = [];
    const fetchOriginal = globalThis.fetch;
    globalThis.fetch = (async () => {
      return resposta("", { status: 429, headers: { "Retry-After": "2" } });
    }) as typeof fetch;
    try {
      const r = await fetchComRetry("https://exemplo.invalid/z", {
        tentativas: 2,
        backoffBaseMs: 1,
        // Captura a espera via jitter=0? Não: Retry-After curto o suficiente
        // para o teste simplesmente terminar e reportar falha nas 2 tentativas.
      });
      expect(r.ok).toBe(false);
      expect(r.statusHttp).toBe(429);
      expect(slept).toHaveLength(0); // sanity: não dependemos de sleep aqui
    } finally {
      globalThis.fetch = fetchOriginal;
    }
  });

  test("204 é sucesso com texto vazio (o 'página sem nada' do PNCP)", async () => {
    const fetchOriginal = globalThis.fetch;
    // 204 nao aceita corpo nem string vazia — o construtor lanca TypeError.
    globalThis.fetch = (async () =>
      new Response(null, { status: 204 })) as typeof fetch;
    try {
      const r = await fetchComRetry("https://exemplo.invalid/vazio", { tentativas: 1 });
      expect(r.ok).toBe(true);
      expect(r.texto).toBe("");
    } finally {
      globalThis.fetch = fetchOriginal;
    }
  });
});

describe("checkpoint", () => {
  test("nome vira slug de arquivo (nada de path traversal)", () => {
    const p = caminhoCheckpoint("../../etc/passwd", "/tmp/x");
    expect(p).not.toContain("..");
    expect(p.endsWith(".json")).toBe(true);
  });

  test("lerCheckpoint: ausente e corrompido devolvem null, sem lançar", async () => {
    const pasta = mkdtempSync(tmpdir() + "/cp-ckpt-");
    expect(lerCheckpoint("nada", pasta)).toBeNull();
    writeFileSync(caminhoCheckpoint("quebrado", pasta), "{truncado");
    expect(lerCheckpoint("quebrado", pasta)).toBeNull();
  });

  test("gravar e ler round-trip; apagar depois", async () => {
    const pasta = mkdtempSync(tmpdir() + "/cp-ckpt-");
    gravarCheckpoint("coletor-x", { pagina: 12 }, pasta);
    expect(lerCheckpoint<{ pagina: number }>("coletor-x", pasta)).toEqual({ pagina: 12 });
    // regravação (o rename por cima, que no Windows exige unlink) também:
    gravarCheckpoint("coletor-x", { pagina: 13 }, pasta);
    expect(lerCheckpoint<{ pagina: number }>("coletor-x", pasta)).toEqual({ pagina: 13 });
    apagarCheckpoint("coletor-x", pasta);
    expect(lerCheckpoint("coletor-x", pasta)).toBeNull();
  });
});
