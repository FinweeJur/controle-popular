import { describe, expect, it } from "vitest";
import {
  MARCOS_RIO_DOCE,
  contarPorPeriodo,
  formatarDataMarco,
  intervaloDeAnos,
  periodoDoMarco,
} from "./linha-do-tempo";

describe("linha do tempo do Rio Doce", () => {
  it("não inventa o dia quando a fonte só tem mês ou ano", () => {
    expect(formatarDataMarco("2015-11-05")).toBe("05/11/2015");
    expect(formatarDataMarco("2016-03")).toBe("março de 2016");
    expect(formatarDataMarco("2016")).toBe("2016");
    expect(formatarDataMarco("")).toBe("—");
  });

  it("classifica o período pelo ano do marco", () => {
    expect(periodoDoMarco("2015-11-05")).toBe("2015-2019");
    expect(periodoDoMarco("2023-12-15")).toBe("2020-2023");
    expect(periodoDoMarco("2024-01-01")).toBe("2024-2026");
  });

  it("conta os marcos por período sem perder nenhum", () => {
    const contagem = contarPorPeriodo();
    // 2015-2019: rompimento, TTAC e Renova; 2020-2023: NOVEL e PNAB.
    expect(contagem).toEqual({ "2015-2019": 3, "2020-2023": 2, "2024-2026": 9 });
    const soma = Object.values(contagem).reduce((a, b) => a + b, 0);
    expect(soma).toBe(MARCOS_RIO_DOCE.length);
  });

  it("mantém a ordem editorial: o TTAC (03/2016) antes da Renova (2016)", () => {
    const ttac = MARCOS_RIO_DOCE.findIndex((m) => m.data === "2016-03-02");
    const renova = MARCOS_RIO_DOCE.findIndex((m) => m.data === "2016");
    expect(ttac).toBeGreaterThanOrEqual(0);
    expect(renova).toBeGreaterThan(ttac);
  });

  it("dá a cada marco pelo menos uma fonte oficial em https", () => {
    for (const marco of MARCOS_RIO_DOCE) {
      expect(marco.fontes.length).toBeGreaterThan(0);
      for (const fonte of marco.fontes) {
        expect(fonte.url.startsWith("https://")).toBe(true);
        expect(fonte.rotulo.trim()).not.toBe("");
      }
    }
    expect(intervaloDeAnos()).toEqual({ primeiro: "2015", ultimo: "2026" });
  });
});
