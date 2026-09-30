/**
 * Testes das guardas editoriais e das camadas de memória.
 *
 * Papel: travar em código as regras do plano
 * `docs/planos/PLANO-MEMORIA-RESISTENCIAS.md` e do AGENTS.md §7 — verbete
 * sem fonte não publica, fonte terciária não decide, a escada cai para a
 * UF quando não há município, e toda fonte abre com `http`.
 *
 * Roda no vitest, no mesmo padrão de `lib/**\/*.test.ts`.
 */

import { describe, it, expect } from "vitest";
import { verbeteValido, fontesPrimarias, resolverMemoria } from "./guardas";
import {
  VERBETES_PAIS,
  VERBETES_REGIAO,
  VERBETES_UF,
  CAMADAS_MEMORIA,
} from "./camadas";
import type { VerbeteMemoria } from "./tipos";

/** Um verbete mínimo e válido, para os testes mutarem um campo por vez. */
function verbeteBase(): VerbeteMemoria {
  return {
    nivel: "uf",
    chave: "mg",
    titulo: "Inconfidência Mineira",
    periodo: "1789",
    resumo: "Conspiração contra a Coroa portuguesa em Minas Gerais.",
    tipo: ["revolta"],
    fonte: [
      {
        autor: "Instituição Exemplo",
        titulo: "Documento de referência",
        ano: "2020",
        url: "https://exemplo.org.br/documento",
        orgao: "Instituição Exemplo",
      },
    ],
  };
}

/** Todos os verbetes das camadas curadas, em uma lista só. */
function todosOsVerbetes(): VerbeteMemoria[] {
  return [
    ...VERBETES_PAIS,
    ...Object.values(VERBETES_REGIAO).flat(),
    ...Object.values(VERBETES_UF).flat(),
    ...Object.values(CAMADAS_MEMORIA.municipio).flat(),
  ];
}

describe("verbeteValido — a guarda editorial", () => {
  it("aceita um verbete com fonte completa, resumo, chave e tipo", () => {
    expect(verbeteValido(verbeteBase())).toBe(true);
  });

  it("rejeita verbete sem URL de fonte", () => {
    const v = verbeteBase();
    v.fonte[0].url = "";
    expect(verbeteValido(v)).toBe(false);
  });

  it("rejeita verbete com URL que não é http/https", () => {
    const v = verbeteBase();
    v.fonte[0].url = "ftp://exemplo.org.br/arquivo";
    expect(verbeteValido(v)).toBe(false);
  });

  it("rejeita verbete sem órgão na fonte", () => {
    const v = verbeteBase();
    v.fonte[0].orgao = "   ";
    expect(verbeteValido(v)).toBe(false);
  });

  it("rejeita verbete sem ano na fonte", () => {
    const v = verbeteBase();
    v.fonte[0].ano = "";
    expect(verbeteValido(v)).toBe(false);
  });

  it("rejeita verbete sem tipo", () => {
    const v = verbeteBase();
    v.tipo = [];
    expect(verbeteValido(v)).toBe(false);
  });

  it("rejeita verbete sem chave", () => {
    const v = verbeteBase();
    v.chave = "";
    expect(verbeteValido(v)).toBe(false);
  });

  it("rejeita verbete com resumo vazio", () => {
    const v = verbeteBase();
    v.resumo = "   ";
    expect(verbeteValido(v)).toBe(false);
  });

  it("rejeita `null` e `undefined`", () => {
    expect(verbeteValido(null)).toBe(false);
    expect(verbeteValido(undefined)).toBe(false);
  });
});

describe("fontesPrimarias — a fonte terciária não decide", () => {
  it("descarta Wikipédia e Wikidata, mantém a fonte oficial", () => {
    const v = verbeteBase();
    v.fonte.push(
      {
        autor: "Wikipédia",
        titulo: "Verbetes de enciclopédia",
        ano: "2024",
        url: "https://pt.wikipedia.org/wiki/Inconfid%C3%AAncia_Mineira",
        orgao: "Wikimedia",
      },
      {
        autor: "Wikidata",
        titulo: "Item estruturado",
        ano: "2024",
        url: "https://www.wikidata.org/wiki/Q123",
        orgao: "Wikidata",
      }
    );

    const primarias = fontesPrimarias(v);
    expect(primarias).toHaveLength(1);
    expect(primarias[0].url).toBe("https://exemplo.org.br/documento");
  });

  it("não muta a lista original de fontes", () => {
    const v = verbeteBase();
    v.fonte.push({
      autor: "Wikipédia",
      titulo: "Verbetes de enciclopédia",
      ano: "2024",
      url: "https://pt.wikipedia.org/wiki/Teste",
      orgao: "Wikimedia",
    });
    const antes = v.fonte.length;
    fontesPrimarias(v);
    expect(v.fonte).toHaveLength(antes);
  });
});

describe("resolverMemoria — a escada da memória", () => {
  it("cai para a UF quando não há verbete do município", () => {
    // São Paulo (3550308) tem rota no portal, mas ainda não tem verbete
    // próprio na camada município; a escada sobe para o degrau de SP.
    const r = resolverMemoria("3550308", CAMADAS_MEMORIA);
    expect(r).not.toBeNull();
    expect(r?.nivel).toBe("uf");
    expect(r?.verbete.chave).toBe("sp");
  });

  it("acha o verbete do município antes de subir para a UF", () => {
    // Ipatinga (3131307) tem verbete municipal com fonte fechada.
    const r = resolverMemoria("3131307", CAMADAS_MEMORIA);
    expect(r).not.toBeNull();
    expect(r?.nivel).toBe("municipio");
    expect(r?.verbete.chave).toBe("3131307");
  });

  it("encontra a UF pela própria chave", () => {
    const r = resolverMemoria("ba", CAMADAS_MEMORIA);
    expect(r?.nivel).toBe("uf");
    expect(r?.verbete.chave).toBe("ba");
  });

  it("encontra a região pela própria chave", () => {
    const r = resolverMemoria("sudeste", CAMADAS_MEMORIA);
    expect(r?.nivel).toBe("regiao");
    expect(r?.verbete.chave).toBe("sudeste");
  });

  it("chega ao país pela chave 'br'", () => {
    const r = resolverMemoria("br", CAMADAS_MEMORIA);
    expect(r?.nivel).toBe("pais");
  });

  it("devolve o país como último degrau de um código IBGE desconhecido", () => {
    const r = resolverMemoria("9999999", CAMADAS_MEMORIA);
    expect(r?.nivel).toBe("pais");
  });

  it("devolve `null` para chave vazia", () => {
    expect(resolverMemoria("", CAMADAS_MEMORIA)).toBeNull();
  });
});

describe("camadas curadas", () => {
  it("tem a camada país com a chave 'br'", () => {
    expect(CAMADAS_MEMORIA.pais.br).toBeDefined();
    expect(CAMADAS_MEMORIA.pais.br.length).toBeGreaterThanOrEqual(4);
  });

  it("tem as 5 macrorregiões", () => {
    const chaves = Object.keys(VERBETES_REGIAO).sort();
    expect(chaves).toEqual(
      ["centro-oeste", "nordeste", "norte", "sudeste", "sul"].sort()
    );
  });

  it("tem as 27 UFs em minúsculas, todas com pelo menos um verbete", () => {
    const ufs = [
      "ac", "al", "am", "ap", "ba", "ce", "df", "es", "go", "ma", "mg",
      "ms", "mt", "pa", "pb", "pe", "pi", "pr", "rj", "rn", "ro", "rr",
      "rs", "sc", "se", "sp", "to",
    ];
    expect(Object.keys(VERBETES_UF).sort()).toEqual([...ufs].sort());
    for (const uf of ufs) {
      expect(VERBETES_UF[uf].length).toBeGreaterThanOrEqual(1);
    }
  });

  it("toda fonte de todo verbete começa com http", () => {
    for (const v of todosOsVerbetes()) {
      for (const f of v.fonte) {
        expect(f.url).toMatch(/^https?:\/\//);
      }
    }
  });

  it("todo verbete das camadas passa na guarda editorial", () => {
    for (const v of todosOsVerbetes()) {
      expect(verbeteValido(v), `verbete inválido: ${v.titulo}`).toBe(true);
    }
  });

  it("nenhuma fonte das camadas é Wikipédia ou Wikidata", () => {
    for (const v of todosOsVerbetes()) {
      for (const f of fontesPrimarias(v)) {
        expect(f.url).not.toMatch(/wikipedia\.org|wikidata\.org/);
      }
      // Se houvesse só fonte terciária, `fontesPrimarias` ficaria vazio.
      expect(fontesPrimarias(v).length).toBeGreaterThan(0);
    }
  });

  it("tem a camada município com fonte fechada (F3)", () => {
    const chaves = Object.keys(CAMADAS_MEMORIA.municipio);
    expect(chaves.length).toBeGreaterThanOrEqual(3);
    // As cidades com verbete local desta rodada do F3.
    expect(chaves).toEqual(
      expect.arrayContaining([
        "3106705", "3131307", "3103405", "3109006",
        "3121605", "3134004", "3127701", "3125705", "3140001",
      ])
    );
  });

  it("todo verbete municipal casa por código IBGE de 7 dígitos e tem UF mapeada", () => {
    for (const [chave, lista] of Object.entries(CAMADAS_MEMORIA.municipio)) {
      expect(chave).toMatch(/^\d{7}$/);
      expect(CAMADAS_MEMORIA.ufPorMunicipio?.[chave]).toBeDefined();
      expect(lista.length).toBeGreaterThanOrEqual(1);
      for (const v of lista) {
        expect(v.nivel).toBe("municipio");
        expect(v.chave).toBe(chave);
      }
    }
  });
});
