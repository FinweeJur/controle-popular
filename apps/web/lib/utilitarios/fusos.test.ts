import { describe, expect, test } from "vitest";
import { FUSOS, formatarDataFuso, formatarHoraFuso } from "./fusos";

describe("FUSOS", () => {
  test("começa pelo Brasil e tem fusos únicos", () => {
    expect(FUSOS[0].pais).toBe("Brasil");
    expect(FUSOS.some((f) => f.fuso === "America/Sao_Paulo")).toBe(true);
    const distintos = new Set(FUSOS.map((f) => f.fuso));
    expect(distintos.size).toBe(FUSOS.length);
  });

  test("todo fuso é aceito pelo Intl (identificador IANA válido)", () => {
    for (const { fuso } of FUSOS) {
      expect(() => formatarHoraFuso(fuso, new Date())).not.toThrow();
    }
  });
});

describe("formatarHoraFuso", () => {
  test("converte UTC para o horário de Brasília (UTC-3)", () => {
    const data = new Date("2026-01-01T12:00:00Z");
    expect(formatarHoraFuso("America/Sao_Paulo", data)).toBe("09:00:00");
    expect(formatarHoraFuso("UTC", data)).toBe("12:00:00");
  });

  test("a meia-noite sai como 00:00, nunca 24:00", () => {
    const data = new Date("2026-01-01T03:00:00Z"); // 00:00 em Brasília
    expect(formatarHoraFuso("America/Sao_Paulo", data)).toBe("00:00:00");
  });
});

describe("formatarDataFuso", () => {
  test("devolve uma data legível no fuso pedido", () => {
    const data = new Date("2026-01-01T12:00:00Z");
    expect(formatarDataFuso("America/Sao_Paulo", data).length).toBeGreaterThan(0);
  });
});
