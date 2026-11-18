import { describe, expect, it } from "vitest";

import {
  chaveUrl,
  dataBr,
  dataIso,
  normalizar,
  textoLimpo,
  tokensDeBusca,
  urlOficial,
} from "../texto.js";

describe("normalizar", () => {
  it("ignora acento, caixa e espaço repetido", () => {
    expect(normalizar("  São   Gonçalo  ")).toBe("sao goncalo");
    expect(normalizar("EMERGÊNCIA NÍVEL 3")).toBe("emergencia nivel 3");
  });

  it("não altera o texto de exibição original", () => {
    const original = "Inabilitação de Credenciamento";
    expect(normalizar(original)).toBe("inabilitacao de credenciamento");
    expect(original).toBe("Inabilitação de Credenciamento");
  });
});

describe("textoLimpo", () => {
  it("remove caractere de controle", () => {
    expect(textoLimpo("linha\u0000com\u0007controle")).toBe("linha com controle");
  });

  it("colapsa espaço e corta com reticências", () => {
    const cortado = textoLimpo("a".repeat(50), 10);
    expect(cortado).toHaveLength(10);
    expect(cortado.endsWith("…")).toBe(true);
  });

  it("devolve vazio para tipo errado em vez de lançar", () => {
    expect(textoLimpo(null)).toBe("");
    expect(textoLimpo(42)).toBe("");
    expect(textoLimpo({ texto: "x" })).toBe("");
  });
});

describe("urlOficial", () => {
  it("aceita http e https absolutos", () => {
    expect(urlOficial("https://www.mg.gov.br")).toBe("https://www.mg.gov.br/");
    expect(urlOficial("http://exemplo.mg.gov.br/a")).toBe("http://exemplo.mg.gov.br/a");
  });

  it("recusa esquema perigoso, relativo e tipo errado", () => {
    expect(urlOficial("javascript:alert(1)")).toBeNull();
    expect(urlOficial("data:text/html,<h1>oi</h1>")).toBeNull();
    expect(urlOficial("/api/v1/municipios")).toBeNull();
    expect(urlOficial("www.mg.gov.br")).toBeNull();
    expect(urlOficial(null)).toBeNull();
  });
});

describe("chaveUrl", () => {
  it("ignora caixa, barra final e fragmento", () => {
    const a = chaveUrl("https://www.jornalminasgerais.mg.gov.br/edicao-do-dia");
    const b = chaveUrl("HTTPS://WWW.JORNALMINASGERAIS.MG.GOV.BR/edicao-do-dia/#topo");
    expect(a).toBe(b);
  });
});

describe("dataIso", () => {
  it("aceita data e data-hora ISO e recusa o resto", () => {
    expect(dataIso("2026-09-15")).toBe("2026-09-15");
    expect(dataIso("2026-09-15T12:31:29.310Z")).toBe("2026-09-15");
    expect(dataIso("15/09/2026")).toBe("");
    expect(dataIso(20260915)).toBe("");
  });
});

describe("dataBr", () => {
  it("formata ISO em dd/mm/aaaa e avisa quando falta", () => {
    expect(dataBr("2026-09-15")).toBe("15/09/2026");
    expect(dataBr(null)).toBe("data não informada");
  });
});

describe("tokensDeBusca", () => {
  it("quebra, normaliza e descarta vazio", () => {
    expect(tokensDeBusca("  CreDEnciamento   Saúde ")).toEqual(["credenciamento", "saude"]);
    expect(tokensDeBusca("   ")).toEqual([]);
  });
});
