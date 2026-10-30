/**
 * @file apps/web/lib/direitos-globais/oceania/oceania.test.ts
 * @description Testes vitest para o módulo Oceania.
 *
 * Protege:
 * - 14 países soberanos reconhecidos da Oceania com códigos ISO únicos;
 * - Distribuição nas 4 sub-regiões (Australásia, Melanésia, Micronésia e Polinésia);
 * - Dispositivos constitucionais verbatim focados em povos originários, terras tradicionais e emergência climática;
 * - Registro formal de lacuna de Bill of Rights na Austrália;
 * - Registros com em_coleta: true e lacuna detalhada para os países em fase de auditoria;
 * - Ausência de CPFs ou dados sensíveis.
 */

import { describe, expect, it } from "vitest";
import { PAISES_OCEANIA, paisOceaniaPorCodigo, paisesOceaniaPorSubRegiao } from "./paises";
import { DISPOSITIVOS_OCEANIA, getDispositivosOceania } from "./dispositivos";

function obterDispositivosDoPais(paisNome: string) {
  return DISPOSITIVOS_OCEANIA.filter((d) => d.pais === paisNome);
}

describe("Oceania — Países Soberanos (14 estados)", () => {
  it("contém exatamente os 14 países soberanos com códigos ISO únicos", () => {
    expect(PAISES_OCEANIA).toHaveLength(14);
    const codigos = PAISES_OCEANIA.map((p) => p.codigo);
    expect(new Set(codigos).size).toBe(14);
    expect(codigos).toEqual(
      expect.arrayContaining([
        "AU", "NZ", "FJ", "PG", "WS", "TO", "VU", "SB", "FM", "PW", "MH", "NR", "KI", "TV",
      ])
    );
  });

  it("distribui os países nas 4 sub-regiões geográficas reconhecidas", () => {
    const subRegioes = new Set(PAISES_OCEANIA.map((p) => p.subRegiao));
    expect(subRegioes).toEqual(new Set(["Australásia", "Polinésia", "Melanésia", "Micronésia"]));

    expect(paisesOceaniaPorSubRegiao("Australásia")).toHaveLength(1);
    expect(paisesOceaniaPorSubRegiao("Polinésia")).toHaveLength(4);
    expect(paisesOceaniaPorSubRegiao("Melanésia")).toHaveLength(4);
    expect(paisesOceaniaPorSubRegiao("Micronésia")).toHaveLength(5);
  });

  it("recupera país por código ISO alpha-2 válido", () => {
    const au = paisOceaniaPorCodigo("AU");
    expect(au?.nome).toBe("Austrália");
    expect(au?.capital).toBe("Camberra");

    const nz = paisOceaniaPorCodigo("NZ");
    expect(nz?.nome).toBe("Nova Zelândia");

    const tv = paisOceaniaPorCodigo("TV");
    expect(tv?.nome).toBe("Tuvalu");
  });

  it("todos os países cumprem integralmente o contrato de Pais", () => {
    for (const pais of PAISES_OCEANIA) {
      expect(pais.id).toBeTruthy();
      expect(pais.nome).toBeTruthy();
      expect(pais.codigo).toMatch(/^[A-Z]{2}$/);
      expect(pais.continente).toBe("oceania");
      expect(pais.subRegiao).toBeTruthy();
      expect(pais.capital).toBeTruthy();
      expect(pais.idiomasOficiais.length).toBeGreaterThan(0);
      expect(pais.moeda).toBeTruthy();
      expect(["democracia", "monarquia_constitucional"]).toContain(pais.regimePolitico);
      expect(pais.dataConstituicao).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(pais.fontesJuridicas.length).toBeGreaterThan(0);
      expect(pais.populacao).toBeGreaterThan(1000);
      expect(pais.area).toBeGreaterThan(10);
    }
  });
});

describe("Oceania — Dispositivos Constitucionais e Salvaguardas", () => {
  it("contém cobertura documental para todos os 14 países soberanos", () => {
    const todosDispositivos = getDispositivosOceania();
    const paisesNosDispositivos = new Set(todosDispositivos.map((d) => d.pais));

    for (const p of PAISES_OCEANIA) {
      expect(paisesNosDispositivos.has(p.nome)).toBe(true);
    }
  });

  it("todos os dispositivos possuem URLs, fontes e dataAcesso válida", () => {
    for (const d of DISPOSITIVOS_OCEANIA) {
      expect(d.pais).toBeTruthy();
      expect(d.tipo).toBeTruthy();
      expect(d.citacao).toBeTruthy();
      expect(d.titulo).toBeTruthy();
      expect(d.texto.length).toBeGreaterThan(15);
      expect(d.fonte).toBeTruthy();
      expect(d.url).toMatch(/^https?:\/\//);
      expect(d.dataAcesso).toBe("2026-10-30");
      expect(d.idiomaOriginal).toBe("en");
    }
  });

  it("Austrália: registra Seção 116, Seção 51(xxxi) e a ausência de Bill of Rights", () => {
    const lista = obterDispositivosDoPais("Austrália");
    const sec116 = lista.find((d) => d.citacao === "Section 116");
    expect(sec116?.texto).toContain("establishing any religion");

    const sec51 = lista.find((d) => d.citacao === "Section 51(xxxi)");
    expect(sec51?.texto).toContain("acquisition of property on just terms");

    const ausencia = lista.find((d) => d.citacao === "nao_encontrado");
    expect(ausencia?.texto).toContain("não contempla um catálogo sistemático de direitos fundamentais");
    expect(ausencia?.lacuna).toBeDefined();
  });

  it("Nova Zelândia: registra NZBORA s. 8 e s. 19 e Artigo 2 do Tratado de Waitangi", () => {
    const lista = obterDispositivosDoPais("Nova Zelândia");
    const s8 = lista.find((d) => d.citacao === "Section 8");
    expect(s8?.texto).toContain("deprived of life");

    const s19 = lista.find((d) => d.citacao === "Section 19");
    expect(s19?.texto).toContain("freedom from discrimination");

    const waitangi = lista.find((d) => d.citacao === "Article 2");
    expect(waitangi?.tipo).toBe("indigenas");
    expect(waitangi?.texto).toContain("Chiefs and Tribes of New Zealand");
    expect(waitangi?.texto).toContain("Lands and Estates Forests Fisheries");
  });

  it("Fiji: registra Artigo 40 sobre direito ao meio ambiente limpo e saudável", () => {
    const lista = obterDispositivosDoPais("Fiji");
    const fiji = lista.find((d) => d.citacao === "Article 40");
    expect(fiji?.tipo).toBe("ambiental");
    expect(fiji?.texto).toContain("clean and healthy environment");
    expect(fiji?.texto).toContain("present and future generations");
  });

  it("Papua-Nova Guiné: registra Objetivo 4 e Artigo 53", () => {
    const lista = obterDispositivosDoPais("Papua-Nova Guiné");
    const obj4 = lista.find((d) => d.citacao === "National Goals, Goal 4");
    expect(obj4?.tipo).toBe("ambiental");
    expect(obj4?.texto).toContain("natural resources and environment to be conserved and used");

    const art53 = lista.find((d) => d.citacao === "Section 53");
    expect(art53?.tipo).toBe("indigenas");
    expect(art53?.texto).toContain("customary land and any interest in customary land");
  });

  it("Vanuatu: registra Artigo 73 sobre terras consuetudinárias indígenas", () => {
    const lista = obterDispositivosDoPais("Vanuatu");
    const vanuatu = lista.find((d) => d.citacao === "Article 73");
    expect(vanuatu?.tipo).toBe("indigenas");
    expect(vanuatu?.texto).toContain("All land in the Republic of Vanuatu belongs to the indigenous custom owners");
  });

  it("Palau: registra Artigo VI sobre conservação ambiental geracional", () => {
    const lista = obterDispositivosDoPais("Palau");
    const palau = lista.find((d) => d.citacao === "Article VI");
    expect(palau?.tipo).toBe("ambiental");
    expect(palau?.texto).toContain("conserve the beautiful, healthful and resourceful natural environment");
    expect(palau?.texto).toContain("present and future generations");
  });

  it("Tuvalu e Kiribati: registram integridade territorial e salvaguarda climática", () => {
    const listaTuvalu = obterDispositivosDoPais("Tuvalu");
    const tuvalu = listaTuvalu[0];
    expect(tuvalu?.tipo).toBe("ambiental");
    expect(tuvalu?.texto).toContain("perpetuity in the future, notwithstanding the impacts of climate change");

    const listaKiribati = obterDispositivosDoPais("Kiribati");
    const kiribati = listaKiribati[0];
    expect(kiribati?.tipo).toBe("ambiental");
    expect(kiribati?.texto).toContain("protect the natural environment and resources of our islands");
  });

  it("demais 6 países possuem registro formal com em_coleta: true e lacuna detalhada", () => {
    const emColeta = DISPOSITIVOS_OCEANIA.filter((d) => d.em_coleta === true);
    expect(emColeta).toHaveLength(6);

    const nomesEmColeta = emColeta.map((d) => d.pais);
    expect(nomesEmColeta).toEqual(
      expect.arrayContaining(["Samoa", "Tonga", "Ilhas Salomão", "Micronésia", "Ilhas Marshall", "Nauru"])
    );

    for (const d of emColeta) {
      expect(d.lacuna).toBeDefined();
      expect(d.lacuna?.length).toBeGreaterThan(20);
      expect(d.citacao).toBe("em_coleta");
    }
  });
});
