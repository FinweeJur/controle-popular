/**
 * @file apps/web/lib/europa-litigios/legislacao.test.ts
 * @description Guarda do quadro de legislação transnacional.
 */

import { describe, expect, it } from "vitest";
import {
  LEGISLACAO,
  ROTULO_STATUS,
  ROTULO_TIPO,
  type StatusLegal,
  type TipoInstrumento,
} from "./legislacao";

const TIPOS: TipoInstrumento[] = [
  "jurisdicao",
  "responsabilidade_civil",
  "diligencia_devida",
  "relatorio",
  "penal",
];
const STATUS: StatusLegal[] = [
  "em_vigor",
  "vigencia_futura",
  "em_revisao",
  "revogado",
  "desconhecido",
];

describe("legislação transnacional", () => {
  it("tem ids únicos e pelo menos 20 instrumentos", () => {
    const ids = LEGISLACAO.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(LEGISLACAO.length).toBeGreaterThanOrEqual(20);
  });

  it("usa tipo e status do vocabulário fechado", () => {
    for (const item of LEGISLACAO) {
      expect(TIPOS).toContain(item.tipo);
      expect(STATUS).toContain(item.status);
      expect(item.pais.length).toBeGreaterThan(2);
      expect(item.instrumento.length).toBeGreaterThan(8);
      expect(item.oQuePermite.length).toBeGreaterThan(40);
      expect(item.fonteOficial).toMatch(/^https:\/\//);
      expect(ROTULO_TIPO[item.tipo].length).toBeGreaterThan(3);
      expect(ROTULO_STATUS[item.status].length).toBeGreaterThan(3);
    }
  });

  it("traz os instrumentos centrais para os três países dos casos", () => {
    const ids = new Set(LEGISLACAO.map((i) => i.id));
    for (const id of [
      "uk-vedanta",
      "uk-mariana",
      "nl-braskem",
      "de-lksg",
      "de-tuv",
      "eu-csddd",
      "ca-nevsun",
      "us-kiobel",
    ]) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it("não inventa status: desconhecido tem observação", () => {
    for (const item of LEGISLACAO) {
      if (item.status === "desconhecido") {
        expect(item.observacao.length).toBeGreaterThan(20);
      }
    }
  });
});
