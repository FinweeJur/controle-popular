/**
 * Testes do núcleo puro da coleta de legislação municipal. Sem rede: o JSON
 * da fonte é injetado, o parser e o dedup são exercitados isolados.
 */

import { describe, expect, it } from "vitest";
import type { CidadeFonte, MateriaSapl } from "@/lib/legislacao-municipal/nucleo";
import {
  anoDaMateria,
  chaveDedupMunicipal,
  montarMapaTipos,
  normalizar,
  normalizarMateriaSapl,
  numeroDaMateria,
  parseRobots,
  robotsPermite,
  urlOficialMateria,
} from "@/lib/legislacao-municipal/nucleo";

const CIDADE: CidadeFonte = {
  slug: "contagem",
  nome: "Contagem",
  idIbge: "3118601",
  uf: "MG",
  sistema: "sapl",
  base: "https://sapl.contagem.mg.leg.br",
};

const TIPOS = montarMapaTipos([
  { id: 8, descricao: "INDICAÇÃO", sigla: "IND" },
  { id: 5, descricao: "PROJETO DE LEI COMPLEMENTAR DO PODER LEGISLATIVO", sigla: "PLCL" },
]);

describe("normalizar", () => {
  it("tira acento, caixa e espaço repetido", () => {
    expect(normalizar("  Projeto de LEI  Complementar  ")).toBe("projeto de lei complementar");
    expect(normalizar("Indicação")).toBe("indicacao");
  });
});

describe("anoDaMateria / numeroDaMateria", () => {
  it("aceita número e string de 4 dígitos", () => {
    expect(anoDaMateria({ ano: 2026 })).toBe(2026);
    expect(anoDaMateria({ ano: "2026" })).toBe(2026);
    expect(anoDaMateria({ ano: "abc" })).toBeNull();
    expect(anoDaMateria({})).toBeNull();
  });

  it("número vira texto; vazio vira null", () => {
    expect(numeroDaMateria({ numero: 1 })).toBe("1");
    expect(numeroDaMateria({ numero: " 42 " })).toBe("42");
    expect(numeroDaMateria({ numero: "" })).toBeNull();
    expect(numeroDaMateria({})).toBeNull();
  });
});

describe("chaveDedupMunicipal", () => {
  it("carrega IBGE, tipo, número e ano, normalizados", () => {
    expect(chaveDedupMunicipal("3118601", "Projeto de Lei", "1", 2026)).toBe(
      "municipal:3118601:projeto de lei:1:2026"
    );
  });

  it("ausência de número/ano vira '-' — nunca some da chave", () => {
    expect(chaveDedupMunicipal("3118601", "Indicação", null, null)).toBe(
      "municipal:3118601:indicacao:-:-"
    );
  });
});

describe("montarMapaTipos / normalizarMateriaSapl", () => {
  it("resolve o rótulo do tipo pela FK — nunca grava o número cru", () => {
    const m: MateriaSapl = {
      id: 56501,
      numero: 1,
      ano: 2026,
      tipo: 8,
      ementa: "INDICA AO PODER EXECUTIVO MEDIDAS EDUCATIVAS",
      data_apresentacao: "2026-02-03",
      indexacao: "",
    };
    const linha = normalizarMateriaSapl(m, CIDADE, TIPOS);
    expect(linha).not.toBeNull();
    expect(linha!.tipo).toBe("INDICAÇÃO");
    expect(linha!.esfera).toBe("municipal");
    expect(linha!.id_ibge_municipio).toBe("3118601");
    expect(linha!.fonte).toBe("camara-sapl");
    expect(linha!.id_fonte).toBe("contagem-56501");
    expect(linha!.link_oficial).toBe("https://sapl.contagem.mg.leg.br/materia/56501");
    expect(linha!.temas).toEqual([]);
    expect(linha!.resumo).toBeNull();
  });

  it("ementa vazia NÃO derruba a linha — a lacuna fica dita", () => {
    const linha = normalizarMateriaSapl({ id: 1, tipo: 8, ementa: "   " }, CIDADE, TIPOS);
    expect(linha).not.toBeNull();
    expect(linha!.ementa).toBeNull();
  });

  it("sem id, devolve null (não há chave estável)", () => {
    expect(normalizarMateriaSapl({ tipo: 8 }, CIDADE, TIPOS)).toBeNull();
  });

  it("tipo não resolvido devolve null — melhor faltar que publicar 'tipo 8'", () => {
    expect(normalizarMateriaSapl({ id: 2, tipo: 999 }, CIDADE, TIPOS)).toBeNull();
    expect(normalizarMateriaSapl({ id: 3, tipo: null }, CIDADE, TIPOS)).toBeNull();
  });
});

describe("urlOficialMateria", () => {
  it("remove barra final da base", () => {
    expect(urlOficialMateria("https://sapl.contagem.mg.leg.br/", 10)).toBe(
      "https://sapl.contagem.mg.leg.br/materia/10"
    );
  });
});

describe("parseRobots", () => {
  const ROBOTS = [
    "User-agent: SemrushBot",
    "Disallow: /",
    "",
    "User-agent: AhrefsBot",
    "Disallow: /",
    "",
    "# Outros crawlers",
    "User-agent: *",
    "Crawl-delay: 60",
    "Disallow: /materia/docacessorio/pdf/*",
    "Disallow: /materia/docacessorio/zip/*",
  ].join("\n");

  it("lê o Crawl-delay do grupo '*' e ignora os agentes de bloqueio", () => {
    const r = parseRobots(ROBOTS);
    expect(r.crawlDelay).toBe(60);
    expect(r.disallow).toEqual(["/materia/docacessorio/pdf/*", "/materia/docacessorio/zip/*"]);
  });

  it("sem grupo '*' devolve vazio", () => {
    expect(parseRobots("User-agent: Bot\nDisallow: /")).toEqual({ crawlDelay: null, disallow: [] });
  });
});

describe("robotsPermite", () => {
  const regras = parseRobots("User-agent: *\nDisallow: /materia/docacessorio/pdf/*");

  it("bloqueia o caminho sob Disallow", () => {
    expect(robotsPermite("/materia/docacessorio/pdf/abc", regras)).toBe(false);
  });

  it("libera o caminho fora do Disallow", () => {
    expect(robotsPermite("/api/materia/materialegislativa/?ano=2026", regras)).toBe(true);
  });

  it("Disallow: / bloqueia tudo", () => {
    expect(robotsPermite("/qualquer", parseRobots("User-agent: *\nDisallow: /"))).toBe(false);
  });

  it("robots ausente libera (o bot decide a pausa)", () => {
    expect(robotsPermite("/qualquer", null)).toBe(true);
  });
});
