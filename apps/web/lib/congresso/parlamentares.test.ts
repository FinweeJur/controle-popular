import { describe, expect, it } from "vitest";

import { PESO_TIPO_CONGRESSO, pesoDeIdentificacao } from "./parlamentares";

// Distribuição medida na API da Câmara em 2026-09-16 (`X-Total-Count`,
// `?siglaTipo=X&ano=2026`). Se um tipo deixar de existir aqui, re-medir
// antes de ajustar o mapa.
it("tipos esperados têm peso calibrado", () => {
  for (const tipo of ["PL", "PEC", "PLP", "MPV", "PDL", "PDC", "REQ"]) {
    expect(PESO_TIPO_CONGRESSO[tipo]).toBeGreaterThan(0);
  }
});

// Escassez importa: PEC é ordens de grandeza mais rara e mais forte.
it("força institucional: PEC > MPV > PLP > PL > REQ", () => {
  expect(PESO_TIPO_CONGRESSO.PEC).toBeGreaterThan(PESO_TIPO_CONGRESSO.MPV);
  expect(PESO_TIPO_CONGRESSO.MPV).toBeGreaterThan(PESO_TIPO_CONGRESSO.PLP);
  expect(PESO_TIPO_CONGRESSO.PLP).toBeGreaterThan(PESO_TIPO_CONGRESSO.PL);
  expect(PESO_TIPO_CONGRESSO.PL).toBeGreaterThan(PESO_TIPO_CONGRESSO.REQ);
});

describe("pesoDeIdentificacao", () => {
  it("parseia a sigla no início da identificação", () => {
    expect(pesoDeIdentificacao("PL 3631/2026")).toBe(1.0);
    expect(pesoDeIdentificacao("PEC 6/2026")).toBe(5.0);
    expect(pesoDeIdentificacao("REQ 123/2026")).toBe(0.5);
  });

  it("caixa alta e espaços extra não derrubam o parse", () => {
    expect(pesoDeIdentificacao(" pec  6/2026")).toBe(5.0);
  });

  it("nulo/vazio/sigla desconhecida valem norma ordinária (1,0)", () => {
    expect(pesoDeIdentificacao(null)).toBe(1.0);
    expect(pesoDeIdentificacao("")).toBe(1.0);
    expect(pesoDeIdentificacao("XYZ 1/2026")).toBe(1.0);
  });
});
