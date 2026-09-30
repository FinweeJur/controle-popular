/**
 * Testes do acervo de rádios (`estacoes.ts`).
 *
 * A regra que estes testes protegem: "o número vem do dado" e "linkável à
 * fonte oficial" (AGENTS § 8). Um stream em HTTP quebraria o áudio na página
 * HTTPS sem erro visível (conteúdo misto); um id repetido quebraria o player,
 * que casa estação por id. Comentário errado continua convincente — teste não
 * (AGENTS § 9).
 */

import { describe, expect, it } from "vitest";
import {
  bandeiraDe,
  ESTACOES,
  ORDEM_REGIOES,
  ORDEM_TIPOS,
  RADIO_VERIFICADO_EM,
  resumirEstacoes,
} from "./estacoes";

describe("acervo de estações de rádio", () => {
  it("tem acervo não vazio", () => {
    expect(ESTACOES.length).toBeGreaterThan(10);
  });

  it("não repete id", () => {
    const ids = ESTACOES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todo stream é HTTPS (evita conteúdo misto na página HTTPS)", () => {
    for (const e of ESTACOES) {
      expect(e.stream.startsWith("https://"), `${e.id}: ${e.stream}`).toBe(true);
    }
  });

  it("todo site oficial é HTTPS", () => {
    for (const e of ESTACOES) {
      expect(e.site.startsWith("https://"), `${e.id}: ${e.site}`).toBe(true);
    }
  });

  it("código de país é ISO alfa-2 e o nome não é vazio", () => {
    for (const e of ESTACOES) {
      expect(e.pais, e.id).toMatch(/^[A-Z]{2}$/);
      expect(e.paisNome.length, e.id).toBeGreaterThan(0);
    }
  });

  it("tipo e região são valores conhecidos", () => {
    for (const e of ESTACOES) {
      expect(ORDEM_TIPOS).toContain(e.tipo);
      expect(ORDEM_REGIOES).toContain(e.regiao);
    }
  });

  it("descrição e programação sempre preenchidas", () => {
    for (const e of ESTACOES) {
      expect(e.descricao.trim().length, e.id).toBeGreaterThan(10);
      expect(e.programacao.trim().length, e.id).toBeGreaterThan(3);
    }
  });

  it("a data de verificação não é futura em relação ao acervo", () => {
    for (const e of ESTACOES) {
      expect(e.verificadoEm <= RADIO_VERIFICADO_EM, e.id).toBe(true);
    }
  });

  it("transcrição só é oferecida em estação federal (CORS medido)", () => {
    for (const e of ESTACOES) {
      if (e.transcrevivel) expect(e.tipo, e.id).toBe("federal");
    }
  });

  it("toda estação transcrevível usa HLS (federais EBC/Câmara/Senado)", () => {
    for (const e of ESTACOES) {
      if (e.transcrevivel) expect(e.formato, e.id).toBe("hls");
    }
  });
});

describe("bandeiraDe", () => {
  it("monta a bandeira do Brasil e de Cuba", () => {
    expect(bandeiraDe("BR")).toBe("🇧🇷");
    expect(bandeiraDe("CU")).toBe("🇨🇺");
  });

  it("usa bandeira neutra quando o código é inválido", () => {
    expect(bandeiraDe("")).toBe("🏳️");
    expect(bandeiraDe("XYZ")).toBe("🏳️");
  });
});

describe("resumirEstacoes", () => {
  const r = resumirEstacoes();

  it("soma total, países e categorias", () => {
    expect(r.total).toBe(ESTACOES.length);
    const somaTipos =
      r.federais + r.universitarias + r.comunitarias + r.popularres;
    expect(somaTipos).toBe(r.total);
    expect(r.paises).toBe(new Set(ESTACOES.map((e) => e.pais)).size);
  });

  it("a contagem por região fecha com o total", () => {
    const somaRegioes = r.porRegiao.reduce((acc, x) => acc + x.total, 0);
    expect(somaRegioes).toBe(r.total);
  });

  it("a contagem por país fecha com o total", () => {
    const somaPaises = r.porPais.reduce((acc, x) => acc + x.total, 0);
    expect(somaPaises).toBe(r.total);
  });
});
