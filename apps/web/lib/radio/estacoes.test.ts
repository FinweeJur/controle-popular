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
  BANDEIRA_ESTADO_ARQUIVO,
  compararEstacoes,
  ESTACOES,
  ESTACOES_ORDENADAS,
  NOME_ESTADO,
  ORDEM_REGIOES,
  ORDEM_TIPOS,
  RADIO_VERIFICADO_EM,
  REGIOES_BRASIL,
  resumirEstacoes,
  urlBandeiraEstado,
  type RegiaoRadio,
} from "./estacoes";

/**
 * Régua UF → região, escrita à mão no teste de propósito: é a cópia
 * independente que pega estação brasileira cadastrada na região errada
 * (inclusive as duas sem `uf`, que só passam pela régua do país).
 */
const REGIAO_DA_UF: Record<string, RegiaoRadio> = {
  AC: "Norte", AM: "Norte", AP: "Norte", PA: "Norte", RO: "Norte",
  RR: "Norte", TO: "Norte",
  AL: "Nordeste", BA: "Nordeste", CE: "Nordeste", MA: "Nordeste",
  PB: "Nordeste", PE: "Nordeste", PI: "Nordeste", RN: "Nordeste",
  SE: "Nordeste",
  DF: "Centro-Oeste", GO: "Centro-Oeste", MT: "Centro-Oeste",
  MS: "Centro-Oeste",
  ES: "Sudeste", MG: "Sudeste", RJ: "Sudeste", SP: "Sudeste",
  PR: "Sul", RS: "Sul", SC: "Sul",
};

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

  it("estação brasileira fica na região do país da sua UF", () => {
    for (const e of ESTACOES) {
      if (e.pais !== "BR") continue;
      expect(REGIOES_BRASIL.includes(e.regiao), e.id).toBe(true);
      if (!e.uf) continue;
      expect(e.regiao, `${e.id} (${e.uf})`).toBe(REGIAO_DA_UF[e.uf]);
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

describe("bandeira do estado brasileiro", () => {
  it("cobre exatamente as 27 UFs, com nome e arquivo SVG do Commons", () => {
    expect(Object.keys(BANDEIRA_ESTADO_ARQUIVO).sort()).toEqual(
      Object.keys(REGIAO_DA_UF).sort(),
    );
    for (const [uf, arquivo] of Object.entries(BANDEIRA_ESTADO_ARQUIVO)) {
      expect(arquivo.endsWith(".svg"), uf).toBe(true);
      expect(NOME_ESTADO[uf], uf).toBeTruthy();
      expect(urlBandeiraEstado(uf), uf).toMatch(
        /^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//,
      );
    }
  });

  it("toda estação brasileira com UF tem bandeira estadual", () => {
    for (const e of ESTACOES) {
      if (e.pais !== "BR" || !e.uf) continue;
      expect(urlBandeiraEstado(e.uf), e.id).not.toBeNull();
    }
  });

  it("UF desconhecida ou ausente devolve null (sem link quebrado)", () => {
    expect(urlBandeiraEstado("XX")).toBeNull();
    expect(urlBandeiraEstado(undefined)).toBeNull();
    expect(urlBandeiraEstado("")).toBeNull();
  });
});

describe("ordem de exibição das regiões", () => {
  it("segue a ordem do dono: Brasil (Norte, Nordeste, Centro-Oeste, Sudeste, Sul) e depois o mundo", () => {
    // ⟲ 07/10/2026: o dono inverteu os dois últimos (Sudeste antes de Sul).
    expect(ORDEM_REGIOES).toEqual([
      "Norte",
      "Nordeste",
      "Centro-Oeste",
      "Sudeste",
      "Sul",
      "America Latina",
      "Africa",
      "Asia e Caribe",
    ]);
  });
});

describe("compararEstacoes (régua do índice do player)", () => {
  it("Brasil antes do mundo", () => {
    const primeiroMundo = ESTACOES_ORDENADAS.findIndex((e) => e.pais !== "BR");
    const ultimoBrasil = ESTACOES_ORDENADAS.reduce(
      (acc, e, i) => (e.pais === "BR" ? i : acc),
      -1,
    );
    expect(primeiroMundo).toBeGreaterThanOrEqual(0);
    expect(ultimoBrasil).toBeLessThan(primeiroMundo);
  });

  it("as regiões do Brasil não decrescem na ordem canônica", () => {
    const posicoes = ESTACOES_ORDENADAS.filter((e) => e.pais === "BR").map((e) =>
      ORDEM_REGIOES.indexOf(e.regiao),
    );
    expect(posicoes).toEqual([...posicoes].sort((a, b) => a - b));
  });

  it("dentro de cada eixo, o MESMO estado fica em bloco contínuo", () => {
    for (const tipo of ORDEM_TIPOS) {
      const doTipo = ESTACOES_ORDENADAS.filter(
        (e) => e.tipo === tipo && e.pais === "BR" && e.uf,
      );
      const vistos = new Set<string>();
      let anterior: string | undefined;
      for (const e of doTipo) {
        const uf = e.uf as string;
        if (uf !== anterior) {
          expect(vistos.has(uf), `${tipo}: ${uf} aparece fora do bloco`).toBe(false);
          vistos.add(uf);
          anterior = uf;
        }
      }
    }
  });

  it("a régua é estável: partir do acervo invertido dá o mesmo índice", () => {
    const invertido = [...ESTACOES].reverse().sort(compararEstacoes);
    expect(invertido.map((e) => e.id)).toEqual(ESTACOES_ORDENADAS.map((e) => e.id));
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
