import { describe, expect, test } from "vitest";
import {
  type ContatoGuia,
  filtrarGuia,
  montarGuia,
  normalizarCanais,
  normalizarUnidades,
  ufsDisponiveis,
} from "./contatos";

const canais = [
  {
    id: "pref-cacoal-ro",
    nome: "Prefeitura Municipal de Cacoal",
    categoria: "Prefeitura",
    esfera: "Municipal",
    cidade: "Cacoal",
    uf: "ro",
    telefone: "(69) 3000-0156",
    email: "ouvidoria@cacoal.ro.gov.br",
    linkPortal: "https://www.cacoal.ro.gov.br",
    tipoAtendimento: "Presencial e Online",
  },
];

const unidades = [
  {
    id: "tjmg-abaete-vara",
    nome: "Vara Única da Comarca de Abaeté",
    tipo: "Vara",
    ramo: "Estadual",
    comarcaOuSubsecao: "Abaeté",
    uf: "MG",
    telefone: "(31) 3300-2204",
    email: "varaunica.abaete@tjmg.jus.br",
    linkBalcaoVirtual: "https://balcaovirtual.tjmg.jus.br/unidade/abaete",
    horarioAtendimento: "12:00 às 18:00",
  },
];

describe("normalização", () => {
  test("normalizarCanais vira a forma do guia e sobe a UF", () => {
    const [c] = normalizarCanais(canais);
    expect(c.grupo).toBe("Transparência (LAI)");
    expect(c.uf).toBe("RO");
    expect(c.tipo).toBe("Prefeitura");
    expect(c.nivel).toBe("Municipal");
  });

  test("normalizarUnidades usa comarca, ramo e balcão virtual", () => {
    const [u] = normalizarUnidades(unidades);
    expect(u.grupo).toBe("Judiciário");
    expect(u.cidade).toBe("Abaeté");
    expect(u.site).toContain("balcaovirtual");
  });

  test("item sem nome é descartado", () => {
    expect(normalizarCanais([{ id: "x", nome: "  " }])).toHaveLength(0);
  });
});

describe("montarGuia", () => {
  test("junta as duas fontes e ordena por nome", () => {
    const guia = montarGuia(canais, unidades);
    expect(guia).toHaveLength(2);
    expect(guia[0].nome).toBe("Prefeitura Municipal de Cacoal");
    expect(guia[1].nome).toBe("Vara Única da Comarca de Abaeté");
  });
});

describe("filtrarGuia", () => {
  const guia = montarGuia(canais, unidades);

  test("filtra por grupo, sem fundir as origens", () => {
    const so = filtrarGuia(guia, { grupo: "Judiciário" });
    expect(so).toHaveLength(1);
    expect(so[0].grupo).toBe("Judiciário");
  });

  test("termo ignora acento e caixa", () => {
    expect(filtrarGuia(guia, { termo: "abaete" })).toHaveLength(1);
    expect(filtrarGuia(guia, { termo: "VARA" })).toHaveLength(1);
  });

  test("filtra por UF", () => {
    expect(filtrarGuia(guia, { uf: "MG" })).toHaveLength(1);
    expect(filtrarGuia(guia, { uf: "SP" })).toHaveLength(0);
  });
});

describe("ufsDisponiveis", () => {
  test("devolve UFs únicas e ordenadas", () => {
    const guia: ContatoGuia[] = montarGuia(canais, unidades);
    expect(ufsDisponiveis(guia)).toEqual(["MG", "RO"]);
  });
});
