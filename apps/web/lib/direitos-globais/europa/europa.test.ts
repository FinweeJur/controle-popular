/**
 * @file apps/web/lib/direitos-globais/europa/europa.test.ts
 * @description Testes vitest para o módulo Europa (Países e Dispositivos Constitucionais).
 *
 * Verificações obrigatórias:
 * - 44 países europeus soberanos com ISOs únicos e metadados completos;
 * - Leva 1 com exatamente 12 países (UK, FR, DE, NL, ES, PT, IT, CH, NO, SE, PL, IE);
 * - 32 países com metadados estruturados e em_coleta: true / lacuna;
 * - Todos os 12 países da Leva 1 possuem entre 2 e 4 dispositivos constitucionais reais verbatim;
 * - Transcrições sem resumo, fontes primárias legítimas (Constitute Project / Legislation.gov.uk);
 * - Sem CPFs nem dados de pessoas reais.
 */

import { describe, expect, it } from "vitest";
import {
  PAISES_EUROPA,
  paisEuropeuPorCodigo,
  paisEuropeuPorNome,
  paisesEuropeusPorLeva,
  paisesEuropeusPorSubRegiao,
} from "./paises";
import {
  DISPOSITIVOS_EUROPA,
  dispositivosEuropaPorPais,
  dispositivosEuropaPorTipo,
} from "./dispositivos";

describe("Europa — Matriz de Países (44 Estados Soberanos)", () => {
  it("contém exatamente 44 países europeus catalogados", () => {
    expect(PAISES_EUROPA).toHaveLength(44);
  });

  it("garante unicidade estrita de códigos ISO 3166-1 alpha-2 e IDs", () => {
    const codigos = PAISES_EUROPA.map((p) => p.codigo);
    const ids = PAISES_EUROPA.map((p) => p.id);
    const nomes = PAISES_EUROPA.map((p) => p.nome);

    expect(new Set(codigos).size).toBe(44);
    expect(new Set(ids).size).toBe(44);
    expect(new Set(nomes).size).toBe(44);

    for (const codigo of codigos) {
      expect(codigo).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("classifica todos os países no continente Europa e em 4 sub-regiões válidas", () => {
    const subRegioesValidas = new Set([
      "Europa Setentrional",
      "Europa Ocidental",
      "Europa Meridional",
      "Europa Oriental",
    ]);

    for (const pais of PAISES_EUROPA) {
      expect(pais.continente).toBe("europa");
      expect(subRegioesValidas.has(pais.subRegiao)).toBe(true);
      expect(pais.capital.length).toBeGreaterThan(0);
      expect(pais.idiomasOficiais.length).toBeGreaterThan(0);
      expect(pais.moeda.length).toBeGreaterThan(0);
      expect(pais.dataConstituicao).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect([
        "democracia",
        "autoritario",
        "hibrido",
        "monarquia_constitucional",
      ]).toContain(pais.regimePolitico);
      expect(pais.fontesJuridicas.length).toBeGreaterThan(0);
    }
  });

  it("isola exatamente 12 países na Leva 1 prioritária com dados socioeconômicos completos", () => {
    const leva1 = PAISES_EUROPA.filter((p) => p.leva === 1);
    expect(leva1).toHaveLength(12);

    const codigosLeva1 = new Set(leva1.map((p) => p.codigo));
    const codigosEsperados = new Set([
      "GB", // Reino Unido
      "FR", // França
      "DE", // Alemanha
      "NL", // Países Baixos
      "ES", // Espanha
      "PT", // Portugal
      "IT", // Itália
      "CH", // Suíça
      "NO", // Noruega
      "SE", // Suécia
      "PL", // Polônia
      "IE", // Irlanda
    ]);

    expect(codigosLeva1).toEqual(codigosEsperados);

    for (const pais of leva1) {
      expect(pais.populacao).toBeDefined();
      expect(pais.populacao!).toBeGreaterThan(1_000_000);
      expect(pais.area).toBeDefined();
      expect(pais.area!).toBeGreaterThan(10_000);
      expect(pais.idh).toBeDefined();
      expect(pais.idh!).toBeGreaterThan(0.85);
      expect(pais.pibPerCapita).toBeDefined();
      expect(pais.pibPerCapita!).toBeGreaterThan(15_000);
    }
  });

  it("marca os demais 32 países europeus com em_coleta: true e nota explicativa de lacuna", () => {
    const demais = PAISES_EUROPA.filter((p) => p.leva !== 1);
    expect(demais).toHaveLength(32);

    for (const pais of demais) {
      expect(pais.em_coleta).toBe(true);
      expect(typeof pais.lacuna).toBe("string");
      expect(pais.lacuna!.length).toBeGreaterThan(15);
    }
  });

  it("permite busca por código, nome, leva e sub-região via funções auxiliares", () => {
    const alemanha = paisEuropeuPorCodigo("DE");
    expect(alemanha).toBeDefined();
    expect(alemanha?.nome).toBe("Alemanha");
    expect(alemanha?.capital).toBe("Berlim");

    const franca = paisEuropeuPorNome("frança");
    expect(franca).toBeDefined();
    expect(franca?.codigo).toBe("FR");

    const paisesLeva1 = paisesEuropeusPorLeva(1);
    expect(paisesLeva1).toHaveLength(12);

    const meridionais = paisesEuropeusPorSubRegiao("Europa Meridional");
    expect(meridionais.length).toBeGreaterThanOrEqual(10);
  });
});

describe("Europa — Dispositivos Constitucionais da Leva 1", () => {
  const PAISES_LEVA_1 = [
    "Reino Unido",
    "França",
    "Alemanha",
    "Países Baixos",
    "Espanha",
    "Portugal",
    "Itália",
    "Suíça",
    "Noruega",
    "Suécia",
    "Polônia",
    "Irlanda",
  ];

  it("contém dispositivos catalogados para cada um dos 12 países da Leva 1", () => {
    for (const nomePais of PAISES_LEVA_1) {
      const dispositivos = dispositivosEuropaPorPais(nomePais);
      expect(dispositivos.length).toBeGreaterThanOrEqual(2);
      expect(dispositivos.length).toBeLessThanOrEqual(4);
    }
  });

  it("cumpre integralmente o contrato de dados de cada dispositivo legal", () => {
    for (const disp of DISPOSITIVOS_EUROPA) {
      expect(PAISES_LEVA_1).toContain(disp.pais);
      expect([
        "humanos",
        "ambiental",
        "politicos",
        "coletivos",
      ]).toContain(disp.tipo);
      expect(disp.citacao.length).toBeGreaterThan(2);
      expect(disp.titulo.length).toBeGreaterThan(4);
      expect(disp.texto.length).toBeGreaterThan(30);
      expect(["Constitute Project", "Legislation.gov.uk"]).toContain(disp.fonte);
      expect(disp.url).toMatch(/^https:\/\/(www\.)?(constituteproject\.org|legislation\.gov\.uk)\//);
      expect(disp.dataAcesso).toBe("2026-10-30");
      expect(disp.idiomaOriginal).toBeDefined();
      expect(disp.idiomaOriginal!.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("valida preceitos normativos específicos do Reino Unido (Human Rights Act, Magna Carta e Climate Change Act)", () => {
    const uk = dispositivosEuropaPorPais("Reino Unido");
    expect(uk).toHaveLength(3);

    const hra = uk.find((d) => d.citacao.includes("Section 6"));
    expect(hra).toBeDefined();
    expect(hra?.texto).toContain("public authority");
    expect(hra?.texto).toContain("Convention right");

    const magnaCarta = uk.find((d) => d.citacao.includes("Clauses 39"));
    expect(magnaCarta).toBeDefined();
    expect(magnaCarta?.texto).toContain("No free man shall be seized or imprisoned");

    const cca = uk.find((d) => d.citacao.includes("Section 1"));
    expect(cca).toBeDefined();
    expect(cca?.tipo).toBe("ambiental");
    expect(cca?.texto).toContain("100% lower than the 1990 baseline");
  });

  it("valida preceitos constitucionais da França (Art. 1º e Charte de l'environnement Arts. 1 e 2)", () => {
    const fr = dispositivosEuropaPorPais("França");
    expect(fr).toHaveLength(3);

    const art1 = fr.find((d) => d.citacao === "Article 1er");
    expect(art1).toBeDefined();
    expect(art1?.texto).toContain("République indivisible, laïque, démocratique et sociale");

    const charteArt1 = fr.find((d) => d.citacao === "Charte de l'environnement, Article 1er");
    expect(charteArt1).toBeDefined();
    expect(charteArt1?.tipo).toBe("ambiental");
    expect(charteArt1?.texto).toContain("environnement équilibré et respectueux de la santé");

    const charteArt2 = fr.find((d) => d.citacao === "Charte de l'environnement, Article 2");
    expect(charteArt2).toBeDefined();
    expect(charteArt2?.tipo).toBe("ambiental");
    expect(charteArt2?.texto).toContain("préservation et à l'amélioration de l'environnement");
  });

  it("valida preceitos constitucionais da Alemanha (Grundgesetz Arts. 1 e 20a)", () => {
    const de = dispositivosEuropaPorPais("Alemanha");
    expect(de).toHaveLength(2);

    const art1 = de.find((d) => d.citacao === "Artikel 1");
    expect(art1).toBeDefined();
    expect(art1?.texto).toContain("Die Würde des Menschen ist unantastbar");

    const art20a = de.find((d) => d.citacao === "Artikel 20a");
    expect(art20a).toBeDefined();
    expect(art20a?.tipo).toBe("ambiental");
    expect(art20a?.texto).toContain("Verantwortung für die künftigen Generationen die natürlichen Lebensgrundlagen");
  });

  it("valida preceitos constitucionais dos Países Baixos (Grondwet Arts. 1 e 21)", () => {
    const nl = dispositivosEuropaPorPais("Países Baixos");
    expect(nl).toHaveLength(2);

    const art1 = nl.find((d) => d.citacao === "Artikel 1");
    expect(art1).toBeDefined();
    expect(art1?.titulo).toContain("Gelijke behandeling");
    expect(art1?.texto).toContain("gelijk behandeld");

    const art21 = nl.find((d) => d.citacao === "Artikel 21");
    expect(art21).toBeDefined();
    expect(art21?.tipo).toBe("ambiental");
    expect(art21?.texto).toContain("bescherming en verbetering van het leefmilieu");
  });

  it("valida preceitos constitucionais da Espanha (Constitución Arts. 14 e 45)", () => {
    const es = dispositivosEuropaPorPais("Espanha");
    expect(es).toHaveLength(2);

    const art14 = es.find((d) => d.citacao === "Artículo 14");
    expect(art14).toBeDefined();
    expect(art14?.texto).toContain("Los españoles son iguales ante la ley");

    const art45 = es.find((d) => d.citacao === "Artículo 45");
    expect(art45).toBeDefined();
    expect(art45?.tipo).toBe("ambiental");
    expect(art45?.texto).toContain("medio ambiente adecuado para el desarrollo de la persona");
  });

  it("valida preceitos constitucionais de Portugal (CRP Arts. 9º, 13º e 66º)", () => {
    const pt = dispositivosEuropaPorPais("Portugal");
    expect(pt).toHaveLength(3);

    const art9 = pt.find((d) => d.citacao === "Artigo 9.º");
    expect(art9).toBeDefined();
    expect(art9?.titulo).toContain("Tarefas fundamentais do Estado");
    expect(art9?.texto).toContain("tarefas fundamentais do Estado");

    const art13 = pt.find((d) => d.citacao === "Artigo 13.º");
    expect(art13).toBeDefined();
    expect(art13?.texto).toContain("mesma dignidade social e são iguais perante a lei");

    const art66 = pt.find((d) => d.citacao === "Artigo 66.º");
    expect(art66).toBeDefined();
    expect(art66?.tipo).toBe("ambiental");
    expect(art66?.texto).toContain("ambiente de vida humano, sadio e ecologicamente equilibrado");
  });

  it("valida preceitos constitucionais da Itália (Costituzione Arts. 3 e 9)", () => {
    const itPais = dispositivosEuropaPorPais("Itália");
    expect(itPais).toHaveLength(2);

    const art3 = itPais.find((d) => d.citacao === "Articolo 3");
    expect(art3).toBeDefined();
    expect(art3?.texto).toContain("Tutti i cittadini hanno pari dignità sociale");

    const art9 = itPais.find((d) => d.citacao === "Articolo 9");
    expect(art9).toBeDefined();
    expect(art9?.tipo).toBe("ambiental");
    expect(art9?.texto).toContain("Tutela l'ambiente, la biodiversità e gli ecosistemi");
  });

  it("valida preceitos constitucionais da Suíça (Constituição Arts. 8, 73 e 74)", () => {
    const ch = dispositivosEuropaPorPais("Suíça");
    expect(ch).toHaveLength(3);

    const art8 = ch.find((d) => d.citacao === "Artikel 8");
    expect(art8).toBeDefined();
    expect(art8?.texto).toContain("Alle Menschen sind vor dem Gesetz gleich");

    const art73 = ch.find((d) => d.citacao === "Artikel 73");
    expect(art73).toBeDefined();
    expect(art73?.tipo).toBe("ambiental");
    expect(art73?.titulo).toContain("Nachhaltigkeit");
    expect(art73?.texto).toContain("Verhältnis zwischen der Natur und ihrer Erneuerungsfähigkeit");

    const art74 = ch.find((d) => d.citacao === "Artikel 74");
    expect(art74).toBeDefined();
    expect(art74?.tipo).toBe("ambiental");
    expect(art74?.titulo).toContain("Umweltschutz");
    expect(art74?.texto).toContain("Schutz des Menschen und seiner natürlichen Umwelt");
  });

  it("valida preceitos constitucionais da Noruega (Grunnlov Arts. 92 e 112)", () => {
    const no = dispositivosEuropaPorPais("Noruega");
    expect(no).toHaveLength(2);

    const art92 = no.find((d) => d.citacao === "Paragraf 92");
    expect(art92).toBeDefined();
    expect(art92?.titulo).toContain("Menneskerettighetenes stilling");
    expect(art92?.texto).toContain("respektere og sikre menneskerettighetene");

    const art112 = no.find((d) => d.citacao === "Paragraf 112");
    expect(art112).toBeDefined();
    expect(art112?.tipo).toBe("ambiental");
    expect(art112?.titulo).toContain("Rett til et helsefremmende miljø");
    expect(art112?.texto).toContain("Enhver har rett til et miljø som sikrer helsen");
  });

  it("valida preceitos constitucionais da Suécia (Regeringsformen Cap. 1 Art. 2 e Cap. 2 Art. 1)", () => {
    const se = dispositivosEuropaPorPais("Suécia");
    expect(se).toHaveLength(2);

    const c1a2 = se.find((d) => d.citacao === "1 kap. 2 §");
    expect(c1a2).toBeDefined();
    expect(c1a2?.texto).toContain("respekt för alla människors lika värde");

    const c2a1 = se.find((d) => d.citacao === "2 kap. 1 §");
    expect(c2a1).toBeDefined();
    expect(c2a1?.titulo).toContain("Opinionsfriheter");
    expect(c2a1?.texto).toContain("yttrandefrihet");
  });

  it("valida preceitos constitucionais da Polônia (Konstytucja Arts. 5 e 74)", () => {
    const pl = dispositivosEuropaPorPais("Polônia");
    expect(pl).toHaveLength(2);

    const art5 = pl.find((d) => d.citacao === "Artykuł 5");
    expect(art5).toBeDefined();
    expect(art5?.texto).toContain("zasadą zrównoważonego rozwoju");

    const art74 = pl.find((d) => d.citacao === "Artykuł 74");
    expect(art74).toBeDefined();
    expect(art74?.tipo).toBe("ambiental");
    expect(art74?.texto).toContain("bezpieczeństwo ekologiczne współczesnemu i przyszłym pokoleniom");
  });

  it("valida preceitos constitucionais da Irlanda (Bunreacht na hÉireann Arts. 40.1 e 45)", () => {
    const ie = dispositivosEuropaPorPais("Irlanda");
    expect(ie).toHaveLength(2);

    const art40 = ie.find((d) => d.citacao === "Article 40.1");
    expect(art40).toBeDefined();
    expect(art40?.texto).toContain("All citizens shall, as human persons, be held equal before the law");

    const art45 = ie.find((d) => d.citacao === "Article 45");
    expect(art45).toBeDefined();
    expect(art45?.tipo).toBe("coletivos");
    expect(art45?.titulo).toContain("Directive Principles of Social Policy");
    expect(art45?.texto).toContain("principles of social policy set forth in this Article");
  });

  it("permite filtrar dispositivos por tipo de direito", () => {
    const ambientais = dispositivosEuropaPorTipo("ambiental");
    expect(ambientais.length).toBeGreaterThanOrEqual(10);

    const humanos = dispositivosEuropaPorTipo("humanos");
    expect(humanos.length).toBeGreaterThanOrEqual(10);
  });

  it("assegura que nenhum CPF ou dado privado sensível está presente no acervo", () => {
    const jsonStr = JSON.stringify({ PAISES_EUROPA, DISPOSITIVOS_EUROPA });
    expect(jsonStr).not.toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
  });
});
