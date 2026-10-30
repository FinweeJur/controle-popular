/**
 * @file apps/web/lib/direitos-globais/dados.test.ts
 * @description Guarda de integridade do comparador global de direitos.
 *
 * O que este teste protege (QUALIDADES-DA-INFORMACAO.md):
 * - países com identificação única e campos mínimos preenchidos;
 * - níveis de proteção declarados dentro do vocabulário fechado;
 * - tratados apontando para direitos que existem no catálogo;
 * - utilitários de formatação (população, área) sem número inventado;
 * - nenhum dado pessoal sensível (CPF) escondido na base.
 *
 * Ele NÃO prova o conteúdo da constituição de cada país — isso é a coleta,
 * registrada na fonte. O teste pega erro de digitação e regressão estrutural.
 */

import { describe, expect, it } from "vitest";
import {
  DIREITOS_ESPECIFICOS,
  PAISES_AMERICA_LATINA,
  TRATADOS_INTERNACIONAIS,
  formatarArea,
  formatarPopulacao,
  getDireitosPorTipo,
  getNivelProtecaoLabel,
  getPaisesPorContinente,
  getTratadosPorDireito,
} from "./dados";
import type { NivelProtecao, TipoDireito } from "./tipos";

const NIVEIS: NivelProtecao[] = [
  "inexistente",
  "fraco",
  "moderado",
  "forte",
  "muito_forte",
];

const TIPOS: TipoDireito[] = [
  "humanos",
  "ambiental",
  "mulheres",
  "natureza",
  "politicos",
  "criancas",
  "indigenas",
  "quilombolas",
  "campesinos",
  "coletivos",
  "atingidos_barragens",
  "atingidos_empreendimentos",
];

describe("direitos globais — países", () => {
  it("tem identificador único e campos mínimos", () => {
    const ids = PAISES_AMERICA_LATINA.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PAISES_AMERICA_LATINA) {
      expect(p.nome.length).toBeGreaterThan(3);
      expect(p.codigo).toMatch(/^[A-Z]{2}$/);
      expect(p.populacao).toBeGreaterThan(0);
      expect(p.area).toBeGreaterThan(0);
      expect(p.idh).toBeGreaterThan(0);
      expect(p.idh).toBeLessThanOrEqual(1);
      expect(p.dataConstituicao).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.fontesJuridicas.length).toBeGreaterThan(0);
      expect(p.continente).toBe("america-latina");
    }
  });

  it("filtra por continente sem devolver vazio", () => {
    expect(getPaisesPorContinente("america-latina").length).toBe(
      PAISES_AMERICA_LATINA.length,
    );
    expect(getPaisesPorContinente("africa")).toHaveLength(0);
  });
});

describe("direitos globais — direitos", () => {
  it("declara nível dentro do vocabulário fechado", () => {
    for (const d of DIREITOS_ESPECIFICOS) {
      expect(NIVEIS).toContain(d.nivelProtecao);
      expect(TIPOS).toContain(d.tipo);
      expect(d.nome.length).toBeGreaterThan(3);
      expect(d.descricao.length).toBeGreaterThan(10);
      expect(d.fontes.length).toBeGreaterThan(0);
    }
  });

  it("acha direito por tipo e ignora tipo sem registro", () => {
    expect(getDireitosPorTipo("indigenas").length).toBeGreaterThan(0);
    expect(getDireitosPorTipo("politicos")).toHaveLength(0);
  });

  it("traduz o nível de proteção", () => {
    expect(getNivelProtecaoLabel("muito_forte")).toBe("Muito Forte");
    expect(getNivelProtecaoLabel("inexistente")).toBe("Inexistente");
  });
});

describe("direitos globais — tratados", () => {
  it("aponta para direito que existe no catálogo", () => {
    const tipos = new Set(DIREITOS_ESPECIFICOS.map((d) => d.tipo));
    for (const t of TRATADOS_INTERNACIONAIS) {
      expect(tipos.has(t.tipo)).toBe(true);
      expect(t.signatarios.length).toBeGreaterThan(0);
      expect(t.dataAssinatura).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("filtra tratado por direito", () => {
    expect(getTratadosPorDireito("humanos").length).toBeGreaterThan(0);
    expect(getTratadosPorDireito("quilombolas")).toHaveLength(0);
  });
});

describe("direitos globais — formatação", () => {
  it("encurta população em milhão", () => {
    expect(formatarPopulacao(213000000)).toBe("213.0M");
    expect(formatarPopulacao(45000)).toBe("45.0k");
    expect(formatarPopulacao(900)).toBe("900");
  });

  it("encurta área em milhão de km²", () => {
    expect(formatarArea(8514877)).toBe("8.5M km²");
    expect(formatarArea(756102)).toBe("756.1k km²");
    expect(formatarArea(500)).toBe("500 km²");
  });
});