/**
 * Testes do acervo de transporte das Eleições 2026.
 *
 * Garantem que a página cobre as 27 UFs, que os dois turnos e a data de
 * corte continuam explícitos e que nenhuma linha publicada perde fonte,
 * URL https ou data. Também verificam que o JSON não carrega CPF.
 */

import { describe, expect, it } from "vitest";

import {
  acervoTransporte,
  ROTULOS_STATUS,
  ROTULOS_TIPO,
} from "./transporte-2026";

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
];

describe("acervo de transporte das Eleições 2026", () => {
  it("cobre as 27 unidades da federação uma única vez", () => {
    const ufs = acervoTransporte.tres.map((tre) => tre.uf);

    expect(acervoTransporte.tres).toHaveLength(27);
    expect(new Set(ufs).size).toBe(27);
    expect([...ufs].sort()).toEqual([...UFS].sort());
  });

  it("mantém os dois turnos e a data de geração", () => {
    expect(acervoTransporte.turnos.map((turno) => turno.data)).toEqual([
      "2026-10-04",
      "2026-10-25",
    ]);
    expect(acervoTransporte.geradoEm).toBe("2026-10-21");
  });

  it("tem políticas confirmadas e ids únicos", () => {
    const ids = acervoTransporte.politicas.map((politica) => politica.id);

    expect(acervoTransporte.politicas.length).toBeGreaterThanOrEqual(17);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("usa apenas tipos e status conhecidos", () => {
    for (const politica of acervoTransporte.politicas) {
      expect(ROTULOS_TIPO[politica.tipo]).toBeTruthy();
    }

    for (const tre of acervoTransporte.tres) {
      expect(ROTULOS_STATUS[tre.status]).toBeTruthy();
    }
  });

  it("exige fonte, URL https e data em todas as linhas", () => {
    for (const registro of [...acervoTransporte.politicas, ...acervoTransporte.tres]) {
      expect(registro.fonteNome.length).toBeGreaterThan(0);
      expect(registro.fonteUrl.startsWith("https://")).toBe(true);
      expect(registro.fonteData).toMatch(/^\d{4}-\d{2}(-\d{2})?$/);
    }
  });

  it("não carrega CPF no dado publicado", () => {
    const cpf = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;

    expect(JSON.stringify(acervoTransporte)).not.toMatch(cpf);
  });
});
