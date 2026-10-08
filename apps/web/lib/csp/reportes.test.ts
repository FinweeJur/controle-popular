/**
 * @file reportes.test.ts
 * @description Testes do interpretador de relatórios de violação de CSP.
 *
 * Cada caso cobre uma forma real de corpo de navegador: o formato legado
 * `application/csp-report`, o Reporting API (array), corpo inválido e as
 * normalizações que viram chave de contador. Regressão aqui significa
 * violação de produção virando contador errado — ou contagem perdida.
 */
import { describe, expect, it } from "vitest";
import {
  interpretarRelatorioCsp,
  normalizarDiretiva,
  normalizarOrigem,
} from "./reportes";

describe("interpretarRelatorioCsp — formato legado application/csp-report", () => {
  it("extrai diretiva e origem do corpo legado", () => {
    const corpo = {
      "csp-report": {
        "document-uri": "https://www.controlepopular.com.br/busca?q=termo",
        "violated-directive": "script-src",
        "effective-directive": "script-src",
        "blocked-uri": "https://exemplo-externo.test/arquivo.js",
        disposition: "report",
        "status-code": 0,
      },
    };
    expect(interpretarRelatorioCsp(corpo)).toEqual([
      {
        diretiva: "script-src",
        origem: "exemplo-externo.test",
        disposicao: "report",
      },
    ]);
  });

  it("cai em effective-directive quando violated-directive falta", () => {
    const corpo = {
      "csp-report": { "effective-directive": "style-src", "blocked-uri": "inline" },
    };
    expect(interpretarRelatorioCsp(corpo)).toEqual([
      { diretiva: "style-src", origem: "inline", disposicao: "desconhecida" },
    ]);
  });

  it("descarta corpo sem diretiva nenhuma", () => {
    expect(interpretarRelatorioCsp({ "csp-report": { "blocked-uri": "x" } })).toEqual([]);
  });
});

describe("interpretarRelatorioCsp — Reporting API (array)", () => {
  it("extrai de uma entrada csp-violation", () => {
    const corpo = [
      {
        type: "csp-violation",
        url: "https://www.controlepopular.com.br/indice",
        body: {
          documentURL: "https://www.controlepopular.com.br/indice",
          effectiveDirective: "script-src-elem",
          blockedURL: "https://cdn.terceiro.test/app.js",
          disposition: "report",
        },
      },
    ];
    expect(interpretarRelatorioCsp(corpo)).toEqual([
      { diretiva: "script-src", origem: "cdn.terceiro.test", disposicao: "report" },
    ]);
  });

  it("ignora tipos que não são violação de CSP", () => {
    const corpo = [{ type: "deprecation", body: { id: "x" } }];
    expect(interpretarRelatorioCsp(corpo)).toEqual([]);
  });

  it("processa várias entradas de uma vez", () => {
    const corpo = [
      { type: "csp-violation", body: { effectiveDirective: "img-src", blockedURL: "https://a.test/i.png" } },
      { type: "csp-violation", body: { effectiveDirective: "media-src", blockedURL: "https://b.test/a.mp3" } },
    ];
    const violacoes = interpretarRelatorioCsp(corpo);
    expect(violacoes).toHaveLength(2);
    expect(violacoes[0]?.origem).toBe("a.test");
    expect(violacoes[1]?.origem).toBe("b.test");
  });
});

describe("interpretarRelatorioCsp — corpo inválido", () => {
  it.each([[null], [undefined], ["texto solto"], [42], [{}], [{ "csp-report": "quebrado" }]])(
    "devolve lista vazia para %j",
    (corpo) => {
      expect(interpretarRelatorioCsp(corpo)).toEqual([]);
    }
  );
});

describe("normalizarDiretiva", () => {
  it("reduz sufixo -elem à diretiva base", () => {
    expect(normalizarDiretiva("script-src-elem")).toBe("script-src");
    expect(normalizarDiretiva("style-src-attr")).toBe("style-src");
  });

  it("mantém diretivas com hífen interno", () => {
    expect(normalizarDiretiva("frame-ancestors")).toBe("frame-ancestors");
    expect(normalizarDiretiva("default-src")).toBe("default-src");
  });

  it("vazio vira desconhecida", () => {
    expect(normalizarDiretiva("   ")).toBe("desconhecida");
  });

  it("corta diretiva suspeita de tamanho absurdo", () => {
    expect(normalizarDiretiva("a".repeat(500))).toHaveLength(64);
  });
});

describe("normalizarOrigem", () => {
  it("reduz URL absoluta ao host", () => {
    expect(normalizarOrigem("https://Exemplo.Test:8443/caminho?x=1")).toBe("exemplo.test");
    expect(normalizarOrigem("http://outra.test")).toBe("outra.test");
  });

  it("tokens fixos viram rótulos legíveis", () => {
    expect(normalizarOrigem("inline")).toBe("inline");
    expect(normalizarOrigem("eval")).toBe("eval");
    expect(normalizarOrigem("data:image/png;base64,xxxx")).toBe("data:");
    expect(normalizarOrigem("blob:https://www.controlepopular.com.br/uuid")).toBe("blob:");
    expect(normalizarOrigem("'self'")).toBe("mesmo-site");
    expect(normalizarOrigem("")).toBe("vazia");
  });

  it("caminho relativo é do próprio site", () => {
    expect(normalizarOrigem("/assets/arquivo.js")).toBe("mesmo-site");
  });

  it("curinga de esquema é preservado", () => {
    expect(normalizarOrigem("https:")).toBe("https:");
  });

  it("corta origem gigante", () => {
    expect(normalizarOrigem("https://x.test/" + "a".repeat(1000))).toBe("x.test");
  });
});
