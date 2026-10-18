import { describe, expect, test } from "vitest";

import {
  ESCADA_PAGINA,
  comandoD3,
  comandoD4,
  cotaDoDegrau,
  parsearSaidaSidecar,
  podeExecutarDegrau,
  restoDoTeto,
} from "./escada-adaptadores";

/**
 * Contrato dos adaptadores D3/D4: comando bem formado, leitura tolerante da
 * saída e cota de visão respeitada. Se alguém tirar o teto do D4, fica
 * vermelho.
 */

describe("comandos dos degraus", () => {
  test("D3 sem busca so passa a URL", () => {
    const c = comandoD3({ url: "https://x.gov.br/transparencia" });
    expect(c.args).toEqual([ESCADA_PAGINA, "--url", "https://x.gov.br/transparencia"]);
  });

  test("D3 com busca acrescenta o termo", () => {
    const c = comandoD3({ url: "https://x.gov.br", busca: "processo 12345" });
    expect(c.args).toContain("--busca");
    expect(c.args[c.args.length - 1]).toBe("processo 12345");
  });

  test("D4 pede o print", () => {
    const c = comandoD4({ url: "https://x.gov.br", png: "saida.png" });
    expect(c.args).toContain("--print");
    expect(c.args[c.args.length - 1]).toBe("saida.png");
  });
});

describe("parsearSaidaSidecar", () => {
  test("JSON valido vira ok com links", () => {
    const r = parsearSaidaSidecar('{"ok":true,"titulo":"X","links":["https://a.gov.br/1"]}');
    expect(r.ok).toBe(true);
    expect(r.titulo).toBe("X");
    expect(r.links).toEqual(["https://a.gov.br/1"]);
  });

  test("saida torta ou nao-JSON nao lanca", () => {
    expect(parsearSaidaSidecar("nao-e-json")).toEqual({ ok: false, links: [], erro: "saida do sidecar nao e JSON" });
    const r = parsearSaidaSidecar('{"ok":false,"erro":"TimeoutError"}');
    expect(r.ok).toBe(false);
    expect(r.erro).toBe("TimeoutError");
  });

  test("links nao-string sao descartados", () => {
    const r = parsearSaidaSidecar('{"ok":true,"links":["https://a.gov.br",42,null]}');
    expect(r.links).toEqual(["https://a.gov.br"]);
  });
});

describe("cotas por degrau", () => {
  test("D3 nao consome LLM; D4 consome visao", () => {
    expect(cotaDoDegrau("D3")).toBeNull();
    expect(cotaDoDegrau("D4")).toBe("visao");
    expect(podeExecutarDegrau("D3", {})).toBe(true);
  });

  test("D4 respeita o teto de visao (5)", () => {
    expect(restoDoTeto("D4", {})).toBe(5);
    expect(podeExecutarDegrau("D4", { visao: 4 })).toBe(true);
    expect(podeExecutarDegrau("D4", { visao: 5 })).toBe(false);
    expect(restoDoTeto("D4", { visao: 5 })).toBe(0);
  });
});
