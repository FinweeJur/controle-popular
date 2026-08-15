import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  medirAssets,
  explicar,
  LIMITE_AVISO_MIB,
  TETO_CLOUDFLARE_MIB,
} from "./tamanho-assets";

/**
 * Os tamanhos de teste são pequenos e os limites entram por parâmetro — assim a
 * suíte não precisa escrever 25 MiB em disco para exercitar o teto de 25 MiB.
 * A função é a mesma; só a régua muda.
 */

let dir: string;

function arquivo(rel: string, bytes: number): void {
  const completo = path.join(dir, rel);
  mkdirSync(path.dirname(completo), { recursive: true });
  writeFileSync(completo, Buffer.alloc(bytes));
}

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "assets-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("medirAssets", () => {
  test("diretório inexistente não estoura — devolve vazio", () => {
    const r = medirAssets(path.join(dir, "nao-existe"));
    expect(r.maior).toBeNull();
    expect(r.maiores).toEqual([]);
    expect(r.ok).toBe(true);
  });

  test("encontra o maior arquivo, inclusive em subpasta", () => {
    arquivo("a.cache", 100);
    arquivo("sub/pasta/b.cache", 900);
    const r = medirAssets(dir);
    expect(r.maior?.caminho).toBe("sub/pasta/b.cache");
    expect(r.maior?.bytes).toBe(900);
  });

  test("caminho sai com barra normal, não com a do Windows", () => {
    arquivo("sub/pasta/b.cache", 10);
    expect(medirAssets(dir).maior?.caminho).toBe("sub/pasta/b.cache");
  });

  test("acima do teto entra em `estoura` e derruba o `ok`", () => {
    arquivo("grande.cache", 3000);
    const r = medirAssets(dir, 1000 / (1024 * 1024), 2000 / (1024 * 1024));
    expect(r.estoura.map((a) => a.caminho)).toEqual(["grande.cache"]);
    expect(r.ok).toBe(false);
  });

  /**
   * O caso que motivou a trava: `sp/educacao` estava em 21 MiB, abaixo do teto
   * de 25 e portanto publicando — e era o próximo a estourar sozinho. Passar
   * calado aqui seria repetir o incidente.
   */
  test("entre o aviso e o teto entra em `emRisco` — ainda publica, mas avisa", () => {
    arquivo("quase.cache", 1500);
    const r = medirAssets(dir, 1000 / (1024 * 1024), 2000 / (1024 * 1024));
    expect(r.estoura).toEqual([]);
    expect(r.emRisco.map((a) => a.caminho)).toEqual(["quase.cache"]);
    expect(r.ok).toBe(false);
  });

  test("abaixo dos dois limites é ok", () => {
    arquivo("pequeno.cache", 10);
    const r = medirAssets(dir, 1000 / (1024 * 1024), 2000 / (1024 * 1024));
    expect(r.ok).toBe(true);
    expect(r.emRisco).toEqual([]);
  });

  test("os maiores vêm ordenados e limitados a 10", () => {
    for (let i = 0; i < 15; i++) arquivo(`f${i}.cache`, (i + 1) * 100);
    const r = medirAssets(dir);
    expect(r.maiores).toHaveLength(10);
    expect(r.maiores[0].bytes).toBeGreaterThan(r.maiores[1].bytes);
    expect(r.maiores[0].caminho).toBe("f14.cache");
  });

  test("o limite é exclusivo: exatamente no teto ainda passa", () => {
    arquivo("no-limite.cache", 2000);
    const r = medirAssets(dir, 1000 / (1024 * 1024), 2000 / (1024 * 1024));
    expect(r.estoura).toEqual([]);
  });

  test("os limites padrão são 20 e 25 MiB", () => {
    expect(LIMITE_AVISO_MIB).toBe(20);
    expect(TETO_CLOUDFLARE_MIB).toBe(25);
    expect(LIMITE_AVISO_MIB).toBeLessThan(TETO_CLOUDFLARE_MIB);
  });
});

describe("explicar", () => {
  test("quando estoura, diz a causa provável e aponta o handoff", () => {
    arquivo("grande.cache", 3000);
    const texto = explicar(medirAssets(dir, 1000 / (1024 * 1024), 2000 / (1024 * 1024)));
    expect(texto).toMatch(/VAI falhar/);
    expect(texto).toMatch(/componente de cliente/);
    expect(texto).toMatch(/HANDOFF-PAYLOAD-LEGISLACAO/);
  });

  test("quando está em risco, diz que ainda publica — não assusta à toa", () => {
    arquivo("quase.cache", 1500);
    const texto = explicar(medirAssets(dir, 1000 / (1024 * 1024), 2000 / (1024 * 1024)));
    expect(texto).toMatch(/Ainda publica/);
    expect(texto).toMatch(/próximo a estourar/);
  });

  test("quando está ok, informa a folga em vez de só dizer ok", () => {
    arquivo("pequeno.cache", 10);
    expect(explicar(medirAssets(dir))).toMatch(/folga de/);
  });

  test("sem asset nenhum, diz isso em palavras", () => {
    expect(explicar(medirAssets(path.join(dir, "vazio")))).toMatch(/nenhum asset/);
  });
});
