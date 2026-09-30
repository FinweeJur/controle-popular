import { describe, expect, test } from "vitest";
import {
  adicionarDias,
  diasEntre,
  formatarDataBR,
  idadeEmAnos,
  normalizarData,
  prazoRespostaLAI,
} from "./datas";

describe("normalizarData", () => {
  test("interpreta AAAA-MM-DD no horário local, sem rolar o dia", () => {
    const d = normalizarData("2026-01-31");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(0); // janeiro
    expect(d!.getDate()).toBe(31);
  });

  test("devolve null para entrada inválida", () => {
    expect(normalizarData("nao e data")).toBeNull();
    expect(normalizarData(new Date("invalido"))).toBeNull();
  });
});

describe("diasEntre", () => {
  test("conta dias inteiros e respeita a ordem", () => {
    expect(diasEntre(new Date(2026, 0, 1), new Date(2026, 0, 31))).toBe(30);
    expect(diasEntre(new Date(2026, 0, 31), new Date(2026, 0, 1))).toBe(-30);
    expect(diasEntre(new Date(2026, 0, 1), new Date(2026, 0, 1))).toBe(0);
  });

  test("atravessa mês e ano", () => {
    expect(diasEntre(new Date(2025, 11, 31), new Date(2026, 0, 1))).toBe(1);
  });
});

describe("adicionarDias", () => {
  test("soma e subtrai dias", () => {
    expect(formatarDataBR(adicionarDias(new Date(2026, 0, 20), 20))).toBe("09/02/2026");
    expect(formatarDataBR(adicionarDias(new Date(2026, 2, 1), -1))).toBe("28/02/2026");
  });
});

describe("idadeEmAnos", () => {
  test("conta ano completo, não ano de calendário", () => {
    const nasc = new Date(2000, 5, 15); // 15/06/2000
    expect(idadeEmAnos(nasc, new Date(2026, 5, 15))).toBe(26); // no aniversário
    expect(idadeEmAnos(nasc, new Date(2026, 5, 14))).toBe(25); // véspera
  });
});

describe("prazoRespostaLAI", () => {
  test("20 dias, prorrogável até 30 (Lei 12.527/2011)", () => {
    const p = prazoRespostaLAI(new Date(2026, 0, 1));
    expect(p.dias).toBe(20);
    expect(formatarDataBR(p.limite)).toBe("21/01/2026");
    expect(formatarDataBR(p.prorrogavelAte)).toBe("31/01/2026");
  });
});
