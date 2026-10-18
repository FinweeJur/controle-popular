import { describe, expect, test } from "vitest";

import {
  ORDEM_DEGRAUS,
  TETOS_LLM,
  consultarMemoria,
  lembrar,
  podeChamar,
  proximoDegrau,
  provedoresDeTexto,
  reparosPorDegrau,
  tetoDe,
  urlWayback,
  variacoesUrl,
  type MemoriaReparos,
} from "./escada";

/**
 * Contrato da escada D0–D5: ordem barata-primeiro, tetos pequenos por
 * provedor e memória de reparos. Se alguém subir um teto sem querer, ou
 * inverter a ordem, um destes testes fica vermelho.
 */

describe("ordem da escada", () => {
  test("degraus na ordem barato->caro", () => {
    expect(ORDEM_DEGRAUS).toEqual(["D0", "D1", "D2", "D3", "D4", "D5"]);
  });

  test("proximoDegrau avanca e termina em null", () => {
    expect(proximoDegrau("D0")).toBe("D1");
    expect(proximoDegrau("D4")).toBe("D5");
    expect(proximoDegrau("D5")).toBeNull();
  });
});

describe("tetos de LLM", () => {
  test("cada provedor tem teto pequeno e positivo", () => {
    for (const t of TETOS_LLM) {
      expect(t.tetoPorRodada).toBeGreaterThan(0);
      expect(t.tetoPorRodada).toBeLessThanOrEqual(20);
    }
  });

  test("podeChamar respeita o teto", () => {
    expect(tetoDe("ollama")).toBe(20);
    expect(podeChamar("ollama", 19)).toBe(true);
    expect(podeChamar("ollama", 20)).toBe(false);
  });

  test("roteiro de texto e barato-primeiro (ollama antes de API)", () => {
    expect(provedoresDeTexto()).toEqual(["ollama", "maritaca", "ling"]);
  });
});

describe("D1 — variacoes deterministas de URL", () => {
  test("http vira https e www sai", () => {
    const v = variacoesUrl("http://www.x.gov.br/a");
    expect(v).toContain("https://www.x.gov.br/a");
    expect(v).toContain("http://x.gov.br/a");
  });

  test("barra final e query entram nas variacoes", () => {
    const v = variacoesUrl("https://x.gov.br/a?utm=1");
    expect(v).toContain("https://x.gov.br/a/?utm=1");
    expect(v).toContain("https://x.gov.br/a");
  });

  test("nao repete a url de entrada e nao quebra com entrada invalida", () => {
    expect(variacoesUrl("https://x.gov.br/a")).not.toContain("https://x.gov.br/a");
    expect(variacoesUrl("nao-e-url")).toEqual([]);
  });

  test("urlWayback aponta para a copia historica", () => {
    expect(urlWayback("https://x.gov.br/a")).toContain("web.archive.org/web/2/https://x.gov.br/a");
  });
});

describe("D0 — memoria de reparos", () => {
  test("lembrar e consultar", () => {
    const m = lembrar({} as MemoriaReparos, "https://a.gov.br/x", {
      urlNova: "https://a.gov.br/y", degrau: "D1", data: "2026-10-18T00:00:00Z",
    });
    expect(consultarMemoria(m, "https://a.gov.br/x")?.urlNova).toBe("https://a.gov.br/y");
    expect(consultarMemoria(m, "https://a.gov.br/z")).toBeNull();
  });

  test("lembrar nao muta a memoria anterior", () => {
    const m0: MemoriaReparos = {};
    lembrar(m0, "https://a.gov.br/x", {
      urlNova: "https://a.gov.br/y", degrau: "D2", data: "2026-10-18T00:00:00Z",
    });
    expect(Object.keys(m0)).toHaveLength(0);
  });

  test("reparosPorDegrau filtra e ordena", () => {
    let m: MemoriaReparos = {};
    const data = "2026-10-18T00:00:00Z";
    m = lembrar(m, "https://b.gov.br/2", { urlNova: "https://b.gov.br/9", degrau: "D1", data });
    m = lembrar(m, "https://b.gov.br/1", { urlNova: "https://b.gov.br/8", degrau: "D1", data });
    m = lembrar(m, "https://b.gov.br/3", { urlNova: "https://b.gov.br/7", degrau: "D3", data });
    expect(reparosPorDegrau(m, "D1")).toEqual(["https://b.gov.br/1", "https://b.gov.br/2"]);
  });
});
