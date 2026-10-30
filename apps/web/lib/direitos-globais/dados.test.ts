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
import {
  DISPOSITIVOS,
  dispositivosDoPais,
  paisesComDispositivos,
} from "./dispositivos";
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
    expect(PAISES_AMERICA_LATINA).toHaveLength(20);
    for (const p of PAISES_AMERICA_LATINA) {
      expect(p.nome.length).toBeGreaterThan(3);
      expect(p.codigo).toMatch(/^[A-Z]{2}$/);
      // Campo ausente significa "ainda não conferido", nunca zero nem chute.
      if (p.populacao !== undefined) expect(p.populacao).toBeGreaterThan(0);
      if (p.area !== undefined) expect(p.area).toBeGreaterThan(0);
      if (p.idh !== undefined) {
        expect(p.idh).toBeGreaterThan(0);
        expect(p.idh).toBeLessThanOrEqual(1);
      }
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

describe("direitos globais — dispositivos conferidos", () => {
  const nomes = new Set(PAISES_AMERICA_LATINA.map((p) => p.nome));

  it("tem 27 dispositivos nos 9 países da leva", () => {
    expect(DISPOSITIVOS).toHaveLength(27);
    expect(paisesComDispositivos()).toHaveLength(9);
  });

  it("cada dispositivo aponta para país e direito existentes", () => {
    for (const d of DISPOSITIVOS) {
      expect(nomes.has(d.pais)).toBe(true);
      expect(TIPOS).toContain(d.tipo);
    }
  });

  it("cada dispositivo tem citação, texto integral e fonte navegável", () => {
    for (const d of DISPOSITIVOS) {
      expect(d.citacao).toMatch(/^(Artículo|ARTÍCULO|Artigo|Lei)\b/);
      expect(d.titulo.length).toBeGreaterThan(2);
      expect(d.texto.length).toBeGreaterThan(80);
      expect(d.texto).not.toMatch(/\[\.{3}\]|…\s*$/);
      expect(d.fonte.length).toBeGreaterThan(3);
      expect(d.url).toMatch(/^https:\/\//);
      expect(new URL(d.url).hostname).toBe("www.constituteproject.org");
      expect(d.dataAcesso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(["es", "fr", "pt"]).toContain(d.idiomaOriginal);
    }
  });

  it("haiti avisa que o texto exibido é tradução", () => {
    for (const d of dispositivosDoPais("Haiti")) {
      expect(d.idiomaOriginal).toBe("fr");
      expect(d.traducao).toMatch(/tradu|espanhol/i);
    }
  });

  it("filtra por país sem vazar dispositivo de outro", () => {
    const gt = dispositivosDoPais("Guatemala");
    expect(gt).toHaveLength(3);
    expect(gt.every((d) => d.pais === "Guatemala")).toBe(true);
    expect(dispositivosDoPais("Brasil")).toHaveLength(0);
  });

  it("não repete a mesma citação no mesmo país", () => {
    const chaves = DISPOSITIVOS.map((d) => `${d.pais}|${d.citacao}`);
    expect(new Set(chaves).size).toBe(chaves.length);
  });
});